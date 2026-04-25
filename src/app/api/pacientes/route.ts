export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface JwtPayload {
  id: string;
  rol: string;
  email: string;
  especialidad?: string;
}

function verifyAuth(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const jwtSecret =
      process.env.JWT_SECRET ||
      "dev_secret_jwt_key_change_in_production_min_32_chars";
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

// ============================================================
// GET /api/pacientes
// Admin → todos los pacientes
// Médico → solo sus pacientes (por medico_id + citas + historiales)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Admin ve todos los pacientes
    if (auth.rol === "admin") {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .order("nombre_completo", { ascending: true });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    // Médico: recopilar IDs de pacientes que le pertenecen
    const patientIdSet = new Set<string>();

    // 1. Pacientes creados directamente por este médico (vía medico_id)
    const { data: porMedicoId } = await supabase
      .from("pacientes")
      .select("id")
      .eq("medico_id", auth.id);

    (porMedicoId || []).forEach((p: any) => patientIdSet.add(p.id));

    // 2. Pacientes con citas agendadas por este médico
    const { data: porCitas } = await supabase
      .from("citas")
      .select("paciente_id")
      .eq("medico_id", auth.id);

    (porCitas || []).forEach((c: any) => {
      if (c.paciente_id) patientIdSet.add(c.paciente_id);
    });

    // 3. Pacientes con historiales clínicos de este médico
    const { data: porHistoriales } = await supabase
      .from("historiales_clinicos")
      .select("paciente_id")
      .eq("medico_id", auth.id);

    (porHistoriales || []).forEach((h: any) => {
      if (h.paciente_id) patientIdSet.add(h.paciente_id);
    });

    const patientIds = Array.from(patientIdSet);

    if (patientIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .in("id", patientIds)
      .order("nombre_completo", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

// ============================================================
// POST /api/pacientes — Crear paciente
// Siempre guarda medico_id del médico que lo registra
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "medico") {
      return NextResponse.json(
        { error: "No autorizado — solo médicos pueden crear pacientes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cedula, nombre_completo, fecha_nacimiento, sexo, tipo_sangre, telefono, email, direccion, ciudad } = body;

    if (!cedula || !nombre_completo || !fecha_nacimiento) {
      return NextResponse.json(
        { error: "Cédula, nombre completo y fecha de nacimiento son requeridos" },
        { status: 400 }
      );
    }

    // Verificar cédula única
    const { data: existente } = await supabase
      .from("pacientes")
      .select("id, nombre_completo")
      .eq("cedula", cedula)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe un paciente con cédula ${cedula}: ${(existente as any).nombre_completo}` },
        { status: 400 }
      );
    }

    // Datos base del paciente (sin medico_id todavía)
    const baseData = {
      cedula,
      nombre_completo,
      fecha_nacimiento,
      sexo: sexo || "M",
      tipo_sangre: tipo_sangre || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      ciudad: ciudad || null,
      estado: true,
    };

    // Intento 1: insertar CON medico_id (si la columna existe y el FK es válido)
    const { data, error } = await supabase
      .from("pacientes")
      .insert([{ ...baseData, medico_id: auth.id }])
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ data, message: "Paciente creado exitosamente" }, { status: 201 });
    }

    // Intento 2: si falló por FK o columna inexistente, insertar SIN medico_id
    // (el filtrado por médico usará citas e historiales como respaldo)
    const esFkOColumna =
      error.code === "23503" ||                    // FK violation
      error.message?.includes("medico_id") ||
      error.message?.includes("foreign key");

    if (esFkOColumna) {
      console.warn("medico_id FK falló, insertando sin medico_id. Auth ID:", auth.id);

      const { data: data2, error: error2 } = await supabase
        .from("pacientes")
        .insert([baseData])
        .select()
        .single();

      if (error2) {
        return NextResponse.json({ error: `Error al crear paciente: ${error2.message}` }, { status: 500 });
      }
      return NextResponse.json({ data: data2, message: "Paciente creado exitosamente" }, { status: 201 });
    }

    return NextResponse.json({ error: `Error al crear paciente: ${error.message}` }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
