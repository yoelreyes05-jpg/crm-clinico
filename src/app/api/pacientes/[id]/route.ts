
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper para verificar token
async function verificarToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "No autorizado", status: 401 };
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || "dev_secret_jwt_key_change_in_production_min_32_chars";
    const decoded = jwt.verify(token, jwtSecret) as any;
    return { decoded, error: null, status: 200 };
  } catch (error: any) {
    return { error: "Token inválido", status: 401 };
  }
}

// GET /api/pacientes/[id] - Obtener paciente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decoded, error: tokenError } = await verificarToken(request);
    if (tokenError) {
      return NextResponse.json({ error: tokenError }, { status: 401 });
    }

    const { data: paciente, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: paciente,
    });
  } catch (error: any) {
    console.error("Error en GET /api/pacientes/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/pacientes/[id] - Actualizar paciente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decoded, error: tokenError } = await verificarToken(request);
    if (tokenError) {
      return NextResponse.json({ error: tokenError }, { status: 401 });
    }

    const body = await request.json();
    const {
      nombre_completo,
      fecha_nacimiento,
      sexo,
      telefono,
      email,
      direccion,
      ciudad,
      estado_civil,
      ocupacion,
      alergias,
      antecedentes_medicos,
      tipo_sangre,
      estado,
    } = body;

    const { data: paciente, error } = await supabase
      .from("pacientes")
      .update({
        nombre_completo,
        fecha_nacimiento,
        sexo,
        telefono,
        email,
        direccion,
        ciudad,
        estado_civil,
        ocupacion,
        alergias,
        antecedentes_medicos,
        tipo_sangre,
        estado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error || !paciente) {
      return NextResponse.json(
        { error: "Error al actualizar paciente" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Paciente actualizado exitosamente",
      data: paciente,
    });
  } catch (error: any) {
    console.error("Error en PUT /api/pacientes/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/pacientes/[id] - Eliminar (desactivar) paciente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decoded, error: tokenError } = await verificarToken(request);
    if (tokenError) {
      return NextResponse.json({ error: tokenError }, { status: 401 });
    }

    const { data: paciente, error } = await supabase
      .from("pacientes")
      .update({
        estado: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error || !paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Paciente eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error en DELETE /api/pacientes/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
