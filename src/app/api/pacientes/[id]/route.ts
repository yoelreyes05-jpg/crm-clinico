
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function verificarToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || "dev_secret_jwt_key_change_in_production_min_32_chars";
    return jwt.verify(token, jwtSecret) as any;
  } catch {
    return null;
  }
}

// GET /api/pacientes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verificarToken(request);
    if (!decoded) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
  }
}

// PUT /api/pacientes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verificarToken(request);
    if (!decoded) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();

    // Construir objeto de actualización solo con campos que vienen en el body
    const updateData: Record<string, any> = {};
    const campos = [
      "nombre_completo", "fecha_nacimiento", "sexo", "telefono", "email",
      "direccion", "ciudad", "estado_civil", "ocupacion",
      "alergias", "antecedentes_medicos", "tipo_sangre", "estado",
    ];
    for (const campo of campos) {
      if (body[campo] !== undefined) updateData[campo] = body[campo];
    }

    const { data, error } = await supabase
      .from("pacientes")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Paciente actualizado", data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
  }
}

// DELETE /api/pacientes/[id] — soft delete (estado = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verificarToken(request);
    if (!decoded) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Verificar que el paciente existe
    const { data: existe, error: checkError } = await supabase
      .from("pacientes")
      .select("id, nombre_completo")
      .eq("id", params.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error verificando paciente:", checkError.message);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    if (!existe) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // Desactivar paciente (soft delete — los datos se conservan)
    const { error: updateError } = await supabase
      .from("pacientes")
      .update({ estado: false })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error eliminando paciente:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Paciente eliminado exitosamente" });
  } catch (e: any) {
    console.error("Error en DELETE /api/pacientes/[id]:", e);
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
  }
}
