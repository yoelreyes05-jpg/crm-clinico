export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// GET /api/paciente-portal?cedula=XXXXXXXX
// Endpoint público — el paciente ingresa su cédula y ve sus datos
// No requiere JWT (acceso por cédula)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get("cedula")?.trim();

    if (!cedula || cedula.length < 6) {
      return NextResponse.json(
        { error: "Ingresa tu número de cédula (mínimo 6 dígitos)" },
        { status: 400 }
      );
    }

    // 1. Buscar paciente por cédula
    const { data: paciente, error: pacienteError } = await supabase
      .from("pacientes")
      .select(`
        id, cedula, nombre_completo, fecha_nacimiento, sexo,
        telefono, email, ciudad, tipo_sangre, alergias,
        antecedentes_medicos, estado
      `)
      .eq("cedula", cedula)
      .eq("estado", true)
      .single();

    if (pacienteError || !paciente) {
      return NextResponse.json(
        { error: "No se encontró ningún paciente con esa cédula en el sistema" },
        { status: 404 }
      );
    }

    // 2. Cargar citas del paciente (próximas y recientes)
    const { data: citas } = await supabase
      .from("citas")
      .select(`
        id, especialidad, fecha_cita, duracion_minutos,
        motivo_cita, estado, notas,
        usuarios_clinica (nombre_completo, especialidad)
      `)
      .eq("paciente_id", paciente.id)
      .order("fecha_cita", { ascending: false })
      .limit(20);

    // 3. Cargar historiales generales
    const { data: historiales } = await supabase
      .from("historiales_clinicos")
      .select(`
        id, especialidad, fecha_consulta, motivo_consulta,
        diagnostico_principal, diagnosticos_secundarios,
        plan_tratamiento, medicamentos, recomendaciones,
        peso, altura, presion_sistolica, presion_diastolica,
        frecuencia_cardiaca, temperatura, saturacion_oxigeno,
        estudios_solicitados, created_at,
        usuarios_clinica (nombre_completo, especialidad)
      `)
      .eq("paciente_id", paciente.id)
      .eq("estado", "activo")
      .order("created_at", { ascending: false })
      .limit(50);

    // 4. Cargar fichas ginecológicas si hay
    const { data: fichasGine } = await supabase
      .from("historiales_ginecologicos")
      .select(`
        id, fecha_consulta, motivo_consulta,
        diagnostico_principal, plan_tratamiento,
        medicamentos, recomendaciones,
        fum, fpp, semanas_gestacion, vdrl, vdrl_resultado,
        gestas, partos, cesareas, abortos,
        controles_prenatales, created_at,
        usuarios_clinica (nombre_completo, especialidad)
      `)
      .eq("paciente_id", paciente.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      paciente,
      citas: citas || [],
      historiales: historiales || [],
      fichas_ginecologicas: fichasGine || [],
    });
  } catch (error: any) {
    console.error("Error en paciente-portal:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}
