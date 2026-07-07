
export const dynamic = "force-dynamic";

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

// GET /api/citas/[id] - Obtener cita por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decoded, error: tokenError } = await verificarToken(request);
    if (tokenError) {
      return NextResponse.json({ error: tokenError }, { status: 401 });
    }

    const { data: cita, error } = await supabase
      .from("citas")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !cita) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cita,
    });
  } catch (error: any) {
    console.error("Error en GET /api/citas/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/citas/[id] - Actualizar cita
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
    const permitidos = [
      "fecha_cita", "duracion_minutos", "motivo_cita", "notas", "estado",
      "visto_paciente", "tipo_paciente", "monto_estimado", "seguro_validado",
    ];
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const campo of permitidos) {
      if (body[campo] !== undefined) updates[campo] = body[campo];
    }

    const { data: cita, error } = await supabase
      .from("citas")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error || !cita) {
      return NextResponse.json(
        { error: "Error al actualizar cita" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cita actualizada exitosamente",
      data: cita,
    });
  } catch (error: any) {
    console.error("Error en PUT /api/citas/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/citas/[id] - Eliminar (cancelar) cita
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decoded, error: tokenError } = await verificarToken(request);
    if (tokenError) {
      return NextResponse.json({ error: tokenError }, { status: 401 });
    }

    const { data: cita, error } = await supabase
      .from("citas")
      .update({
        estado: "cancelada",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error || !cita) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cita cancelada exitosamente",
    });
  } catch (error: any) {
    console.error("Error en DELETE /api/citas/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
