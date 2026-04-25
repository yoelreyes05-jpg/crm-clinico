import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const verified = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      rol: string;
    };
    return verified;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let query = supabase.from("citas").select("*");

    // Si es médico, mostrar solo sus citas
    if (auth.rol === "medico") {
      query = query.eq("medico_id", auth.userId);
    }

    const { data, error } = await query.order("fecha_cita", {
      ascending: true,
    });

    if (error) {
      console.error("Error obteniendo citas:", error);
      return NextResponse.json(
        { error: "Error al obtener citas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "medico") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      paciente_id,
      especialidad,
      fecha_cita,
      duracion_minutos,
      motivo_cita,
      notas,
    } = body;

    if (!paciente_id || !fecha_cita) {
      return NextResponse.json(
        { error: "Paciente y fecha son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el paciente pertenece al médico
    const { data: paciente } = await supabase
      .from("pacientes")
      .select("id")
      .eq("id", paciente_id)
      .eq("medico_id", auth.userId)
      .single();

    if (!paciente) {
      return NextResponse.json(
        { error: "No tienes permiso para crear cita a este paciente" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("citas")
      .insert([
        {
          medico_id: auth.userId,
          paciente_id,
          especialidad,
          fecha_cita,
          duracion_minutos: duracion_minutos || 30,
          motivo_cita,
          notas,
          estado: "programada",
          visto_paciente: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error creando cita:", error);
      return NextResponse.json(
        { error: "Error al crear cita" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data, message: "Cita creada exitosamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}