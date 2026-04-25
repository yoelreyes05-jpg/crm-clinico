export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
    const verified = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; rol: string };
    return verified;
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { medico_id, contrasena_actual, contrasena_nueva } = body;

    // Solo admin puede cambiar contraseña de otros, médico solo puede cambiar la suya
    if (auth.rol !== "admin" && auth.userId !== medico_id) {
      return NextResponse.json(
        { error: "No tienes permiso para cambiar esta contraseña" },
        { status: 403 }
      );
    }

    if (!medico_id || !contrasena_nueva) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Si no es admin, verificar contraseña actual
    if (auth.rol !== "admin") {
      if (!contrasena_actual) {
        return NextResponse.json(
          { error: "Debe proporcionar contraseña actual" },
          { status: 400 }
        );
      }

      const { data: medico } = await supabase
        .from("medicos")
        .select("contrasena")
        .eq("id", medico_id)
        .single();

      if (!medico) {
        return NextResponse.json(
          { error: "Médico no encontrado" },
          { status: 404 }
        );
      }

      const esValida = await bcrypt.compare(contrasena_actual, medico.contrasena);
      if (!esValida) {
        return NextResponse.json(
          { error: "Contraseña actual incorrecta" },
          { status: 401 }
        );
      }
    }

    // Hash de la nueva contraseña
    const contrasenaHash = await bcrypt.hash(contrasena_nueva, 10);

    const { error } = await supabase
      .from("medicos")
      .update({ contrasena: contrasenaHash })
      .eq("id", medico_id);

    if (error) {
      console.error("Error actualizando contraseña:", error);
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
