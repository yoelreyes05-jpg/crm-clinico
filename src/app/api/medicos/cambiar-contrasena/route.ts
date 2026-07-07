export const dynamic = "force-dynamic";

// ============================================================
// API CAMBIAR CONTRASEÑA (usuarios_clinica)
// - Admin: puede cambiar la contraseña de cualquier usuario
// - Médico: la suya propia o la de SU secretaria asignada
// - Cualquier usuario: la suya (con contraseña actual)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { medico_id, contrasena_actual, contrasena_nueva } = body;

    if (!medico_id || !contrasena_nueva) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    if (String(contrasena_nueva).length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const esPropia = auth.id === medico_id;
    let autorizado = auth.rol === "admin" || esPropia;

    // Médico puede cambiar la contraseña de su secretaria asignada
    if (!autorizado && auth.rol === "medico") {
      const { data: objetivo } = await supabase
        .from("usuarios_clinica")
        .select("rol, asignado_a")
        .eq("id", medico_id)
        .single();
      autorizado = objetivo?.rol === "secretaria" && objetivo?.asignado_a === auth.id;
    }

    if (!autorizado) {
      return NextResponse.json(
        { error: "No tienes permiso para cambiar esta contraseña" },
        { status: 403 }
      );
    }

    // Si cambia la suya propia (sin ser admin), verificar la actual
    if (esPropia && auth.rol !== "admin") {
      if (!contrasena_actual) {
        return NextResponse.json({ error: "Debe proporcionar la contraseña actual" }, { status: 400 });
      }
      const { data: usuario } = await supabase
        .from("usuarios_clinica")
        .select("password_hash")
        .eq("id", medico_id)
        .single();
      if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      const esValida = await bcrypt.compare(contrasena_actual, usuario.password_hash);
      if (!esValida) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });
      }
    }

    const passwordHash = await bcrypt.hash(contrasena_nueva, 10);
    const { error } = await supabase
      .from("usuarios_clinica")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", medico_id);

    if (error) return NextResponse.json({ error: "Error al cambiar contraseña" }, { status: 500 });

    await registrarAuditoria(supabase, {
      usuario_id: auth.id,
      usuario_email: auth.email,
      accion: "cambiar_contrasena",
      entidad: "usuario",
      entidad_id: medico_id,
    });

    return NextResponse.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
