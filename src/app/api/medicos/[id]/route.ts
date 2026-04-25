import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

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

// GET /api/medicos/[id] - Obtener médico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decoded, error: tokenError } = await verificarToken(request);
    if (tokenError) {
      return NextResponse.json({ error: tokenError }, { status: 401 });
    }

    const { data: medico, error } = await supabase
      .from("usuarios_clinica")
      .select("*")
      .eq("id", params.id)
      .eq("rol", "medico")
      .single();

    if (error || !medico) {
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: medico.id,
        nombre_completo: medico.nombre_completo,
        email: medico.email,
        especialidad: medico.especialidad,
        licencia_medica: medico.licencia_medica,
        telefono: medico.telefono,
        estado: medico.estado,
      },
    });
  } catch (error: any) {
    console.error("Error en GET /api/medicos/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/medicos/[id] - Actualizar médico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decoded, error: tokenError } = await verificarToken(request);
    if (tokenError) {
      return NextResponse.json({ error: tokenError }, { status: 401 });
    }

    // Solo admins pueden actualizar médicos
    if (decoded.rol !== "admin") {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar médicos" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nombre_completo,
      email,
      especialidad,
      licencia_medica,
      telefono,
      estado,
    } = body;

    const { data: medico, error } = await supabase
      .from("usuarios_clinica")
      .update({
        nombre_completo,
        email,
        especialidad,
        licencia_medica,
        telefono,
        estado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("rol", "medico")
      .select()
      .single();

    if (error || !medico) {
      return NextResponse.json(
        { error: "Error al actualizar médico" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Médico actualizado exitosamente",
      data: medico,
    });
  } catch (error: any) {
    console.error("Error en PUT /api/medicos/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/medicos/[id] - Eliminar (desactivar) médico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decoded, error: tokenError } = await verificarToken(request);
    if (tokenError) {
      return NextResponse.json({ error: tokenError }, { status: 401 });
    }

    // Solo admins pueden eliminar médicos
    if (decoded.rol !== "admin") {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar médicos" },
        { status: 403 }
      );
    }

    const { data: medico, error } = await supabase
      .from("usuarios_clinica")
      .update({
        estado: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("rol", "medico")
      .select()
      .single();

    if (error || !medico) {
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Médico eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error en DELETE /api/medicos/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
