export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PacienteRow {
  id: string;
  cedula: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  tipo_sangre?: string;
  alergias?: string;
  antecedentes_medicos?: string;
  estado: boolean;
}

// ============================================================
// GET /api/paciente-portal?cedula=XXXXXXXX
// Endpoint público — el paciente ingresa su cédula y ve sus datos
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get("cedula")?.trim();

    if (!cedula || cedula.length < 4) {
      return NextResponse.json(
        { error: "Ingresa tu número de cédula" },
        { status: 400 }
      );
    }

    // 1. Buscar paciente por cédula
    const { data: pacienteData, error: pacienteError } = await supabase
      .from("pacientes")
      .select(
        "id, cedula, nombre_completo, fecha_nacimiento, sexo, " +
        "telefono, email, ciudad, tipo_sangre, alergias, antecedentes_medicos, estado"
      )
      .eq("cedula", cedula)
      .eq("estado", true)
      .maybeSingle();

    if (pacienteError) {
      console.error("Error buscando paciente:", pacienteError.message);
      return NextResponse.json({ error: "Error buscando paciente" }, { status: 500 });
    }
    if (!pacienteData) {
      return NextResponse.json(
        { error: "No se encontró ningún paciente con esa cédula en el sistema" },
        { status: 404 }
      );
    }

    const paciente = pacienteData as unknown as PacienteRow;
    const pacienteId: string = paciente.id;

    // 2. Citas del paciente
    const { data: citas, error: citasError } = await supabase
      .from("citas")
      .select(
        "id, especialidad, fecha_cita, duracion_minutos, motivo_cita, estado, notas, " +
        "usuarios_clinica!citas_medico_id_fkey(nombre_completo, especialidad)"
      )
      .eq("paciente_id", pacienteId)
      .order("fecha_cita", { ascending: false })
      .limit(30);

    if (citasError) console.error("Error citas:", citasError.message);

    // 3. Historiales generales (todos los que no son ginecología)
    const { data: historiales, error: histError } = await supabase
      .from("historiales_clinicos")
      .select(
        "id, especialidad, created_at, motivo_consulta, " +
        "diagnostico_principal, diagnosticos_secundarios, " +
        "plan_tratamiento, medicamentos, recomendaciones, estudios_solicitados, " +
        "peso, altura, presion_sistolica, presion_diastolica, " +
        "frecuencia_cardiaca, frecuencia_respiratoria, temperatura, saturacion_oxigeno, " +
        "examen_fisico_general, sintomas_principales, antecedentes_enfermedad_actual, " +
        "usuarios_clinica!historiales_clinicos_medico_id_fkey(nombre_completo, especialidad)"
      )
      .eq("paciente_id", pacienteId)
      .eq("estado", "activo")
      .neq("especialidad", "ginecologia")
      .order("created_at", { ascending: false })
      .limit(50);

    if (histError) console.error("Error historiales:", histError.message);

    // 4. Fichas ginecológicas
    const { data: fichasGine, error: gineError } = await supabase
      .from("historiales_clinicos")
      .select(
        "id, created_at, motivo_consulta, diagnostico_principal, plan_tratamiento, " +
        "medicamentos, recomendaciones, peso, presion_sistolica, presion_diastolica, " +
        "usuarios_clinica!historiales_clinicos_medico_id_fkey(nombre_completo, especialidad), " +
        "historiales_ginecologia(id, embarazo, tbc_pulmonar, hipertension, gemelares, " +
        "diabetes, hipertension_cronica, cirugia_pelvico_uterina, infertilidad, " +
        "antecedentes_familiares, ta_inicial, vdrl, hb, fum, fpp, " +
        "dudas, antitetanicas, controles_prenatales)"
      )
      .eq("paciente_id", pacienteId)
      .eq("especialidad", "ginecologia")
      .eq("estado", "activo")
      .order("created_at", { ascending: false })
      .limit(20);

    if (gineError) console.error("Error fichas ginecología:", gineError.message);

    return NextResponse.json({
      paciente,
      citas: citas || [],
      historiales: historiales || [],
      fichas_ginecologicas: fichasGine || [],
    });
  } catch (error: unknown) {
    console.error("Error en paciente-portal:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}