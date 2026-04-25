export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface JwtPayload { id: string; rol: string; email: string; especialidad?: string; }

function verifyAuth(request: NextRequest): JwtPayload | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const jwtSecret = process.env.JWT_SECRET || "dev_secret_jwt_key_change_in_production_min_32_chars";
    return jwt.verify(auth.slice(7), jwtSecret) as JwtPayload;
  } catch { return null; }
}

// ============================================================
// POST /api/historiales — Guardar historial clínico general
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "medico") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      paciente_id,
      motivo_consulta,
      duracion_sintomas,
      sintomas_principales,
      antecedentes_enfermedad_actual,
      peso,
      altura,
      presion_sistolica,
      presion_diastolica,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      temperatura,
      saturacion_oxigeno,
      examen_fisico_general,
      diagnostico_principal,
      diagnosticos_secundarios,
      plan_tratamiento,
      medicamentos,
      recomendaciones,
      estudios_solicitados,
    } = body;

    if (!paciente_id || !diagnostico_principal || !plan_tratamiento) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: paciente, diagnóstico y plan de tratamiento" },
        { status: 400 }
      );
    }

    // Obtener especialidad del médico desde usuarios_clinica
    const { data: medico } = await supabase
      .from("usuarios_clinica")
      .select("especialidad")
      .eq("id", auth.id)
      .single();

    const { data, error } = await supabase
      .from("historiales_clinicos")
      .insert([{
        medico_id: auth.id,
        paciente_id,
        especialidad: medico?.especialidad || auth.especialidad || "General",
        motivo_consulta: motivo_consulta || "",
        duracion_sintomas: duracion_sintomas || null,
        sintomas_principales: sintomas_principales || null,
        antecedentes_enfermedad_actual: antecedentes_enfermedad_actual || null,
        peso: peso ? parseFloat(peso) : null,
        altura: altura ? parseFloat(altura) : null,
        presion_sistolica: presion_sistolica ? parseInt(presion_sistolica) : null,
        presion_diastolica: presion_diastolica ? parseInt(presion_diastolica) : null,
        frecuencia_cardiaca: frecuencia_cardiaca ? parseInt(frecuencia_cardiaca) : null,
        frecuencia_respiratoria: frecuencia_respiratoria ? parseInt(frecuencia_respiratoria) : null,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        saturacion_oxigeno: saturacion_oxigeno ? parseInt(saturacion_oxigeno) : null,
        examen_fisico_general: examen_fisico_general || null,
        diagnostico_principal,
        diagnosticos_secundarios: diagnosticos_secundarios || null,
        plan_tratamiento,
        medicamentos: medicamentos || null,
        recomendaciones: recomendaciones || null,
        estudios_solicitados: estudios_solicitados || null,
        estado: "activo",
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creando historial:", error.message, error.details);
      return NextResponse.json(
        { error: `Error al crear historial: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data, message: "Historial clínico creado exitosamente" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

// ============================================================
// GET /api/historiales?paciente_id=xxx
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");

    let query = supabase
      .from("historiales_clinicos")
      .select(`
        id, especialidad, motivo_consulta, duracion_sintomas,
        sintomas_principales, antecedentes_enfermedad_actual,
        peso, altura, presion_sistolica, presion_diastolica,
        frecuencia_cardiaca, frecuencia_respiratoria,
        temperatura, saturacion_oxigeno, examen_fisico_general,
        diagnostico_principal, diagnosticos_secundarios,
        plan_tratamiento, medicamentos, recomendaciones,
        estudios_solicitados, estado, created_at,
        pacientes (id, nombre_completo, cedula),
        usuarios_clinica (nombre_completo, especialidad)
      `)
      .order("created_at", { ascending: false });

    if (pacienteId) query = query.eq("paciente_id", pacienteId);
    if (auth.rol === "medico") query = query.eq("medico_id", auth.id);

    const { data, error } = await query;
    if (error) {
      console.error("Error GET historiales:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
