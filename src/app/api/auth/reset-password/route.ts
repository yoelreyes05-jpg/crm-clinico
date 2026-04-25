import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, contrasena_nueva } = body;

    if (!token || !contrasena_nueva) {
      return NextResponse.json(
        { error: "Token y contraseña requeridos" },
        { status: 400 }
      );
    }

    if (contrasena_nueva.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Hash del token para buscar
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Buscar médico con este token válido
    const { data: medico, error: searchError } = await supabase
      .from("medicos")
      .select("id")
      .eq("reset_token", hashedToken)
      .gt("reset_token_expires", new Date().toISOString())
      .single();

    if (searchError || !medico) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // Hash de la nueva contraseña
    const contrasenaHash = await bcrypt.hash(contrasena_nueva, 10);

    // Actualizar contraseña y limpiar token
    const { error: updateError } = await supabase
      .from("medicos")
      .update({
        contrasena: contrasenaHash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq("id", medico.id);

    if (updateError) {
      console.error("Error actualizando contraseña:", updateError);
      return NextResponse.json(
        { error: "Error al cambiar contraseña" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Contraseña actualizada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}
