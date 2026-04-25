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
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const jwtSecret = process.env.JWT_SECRET || "dev_secret_jwt_key_change_in_production_min_32_chars";
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch { return null; }
}

// ============================================================
// GET /api/citas — Listar citas
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");

    let query = supabase
      .from("citas")
      .select(`
        id, especialidad, fecha_cita, duracion_minutos,
        motivo_cita, estado, notas, visto_paciente, created_at,
        pacientes (id, nombre_completo, cedula),
        usuarios_clinica (id, nombre_completo, especialidad)
      `)
      .order("fecha_cita", { ascending: false });

    // Filtros según rol
    if (auth.rol === "medico") {
      query = query.eq("medico_id", auth.id);
    }
    if (pacienteId) {
      query = query.eq("paciente_id", pacienteId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error obteniendo citas:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// ============================================================
// POST /api/citas — Crear cita
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "medico") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { paciente_id, medico_id, especialidad, fecha_cita, duracion_minutos, motivo_cita, notas } = body;

    if (!paciente_id || !fecha_cita) {
      return NextResponse.json({ error: "Paciente y fecha son requeridos" }, { status: 400 });
    }

    // Verificar que el paciente existe (sin filtrar por medico_id ya que no existe esa columna)
    const { data: paciente } = await supabase
      .from("pacientes")
      .select("id")
      .eq("id", paciente_id)
      .eq("estado", true)
      .single();

    if (!paciente) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // El médico asignado es el que crea la cita (o el seleccionado si es admin)
    const medicoAsignado = medico_id || auth.id;

    const { data, error } = await supabase
      .from("citas")
      .insert([{
        medico_id: medicoAsignado,
        paciente_id,
        especialidad: especialidad || auth.especialidad || "General",
        fecha_cita,
        duracion_minutos: duracion_minutos || 30,
        motivo_cita: motivo_cita || null,
        notas: notas || null,
        estado: "programada",
        visto_paciente: false,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creando cita:", error);
      return NextResponse.json({ error: `Error al crear cita: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ data, message: "Cita creada exitosamente" }, { status: 201 });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
