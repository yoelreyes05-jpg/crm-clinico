export const dynamic = "force-dynamic";

// ============================================================
// API SECRETARIAS [id]
// PUT: actualizar datos / contraseña / activar-desactivar
//   - Médico: solo SU secretaria (nombre, teléfono, contraseña, estado)
//   - Admin: todo, incluida la reasignación a otro médico
// DELETE: desactivar (médico la suya; admin cualquiera)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";

async function obtenerSecretaria(id: string) {
  const { data } = await supabase
    .from("usuarios_clinica")
    .select("id, rol, asignado_a")
    .eq("id", id)
    .eq("rol", "secretaria")
    .single();
  return data;
}

function puedeGestionar(auth: { id: string; rol: string }, secretaria: any) {
  if (auth.rol === "admin") return true;
  return auth.rol === "medico" && secretaria.asignado_a === auth.id;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const secretaria = await obtenerSecretaria(params.id);
    if (!secretaria) return NextResponse.json({ error: "Secretaria no encontrada" }, { status: 404 });
    if (!puedeGestionar(auth, secretaria)) {
      return NextResponse.json({ error: "Solo puedes gestionar tu propia secretaria" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    // Campos que puede tocar el médico dueño
    if (body.nombre_completo !== undefined) updates.nombre_completo = body.nombre_completo;
    if (body.telefono !== undefined) updates.telefono = body.telefono;
    if (body.estado !== undefined) updates.estado = body.estado;

    // Cambio de contraseña
    if (body.password) {
      if (String(body.password).length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
      }
      updates.password_hash = await bcrypt.hash(body.password, 10);
    }

    // Solo el ADMIN puede cambiar email o reasignar a otro médico
    if (auth.rol === "admin") {
      if (body.email !== undefined) updates.email = body.email;
      if (body.asignado_a !== undefined) updates.asignado_a = body.asignado_a || null;
    }

    const { data, error } = await supabase
      .from("usuarios_clinica")
      .update(updates)
      .eq("id", params.id)
      .select("id, nombre_completo, email, telefono, estado, asignado_a")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await registrarAuditoria(supabase, {
      usuario_id: auth.id,
      usuario_email: auth.email,
      accion: "actualizar",
      entidad: "secretaria",
      entidad_id: params.id,
      detalles: { campos: Object.keys(updates), por_rol: auth.rol },
    });

    return NextResponse.json({ data, message: "Secretaria actualizada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const secretaria = await obtenerSecretaria(params.id);
    if (!secretaria) return NextResponse.json({ error: "Secretaria no encontrada" }, { status: 404 });
    if (!puedeGestionar(auth, secretaria)) {
      return NextResponse.json({ error: "Solo puedes gestionar tu propia secretaria" }, { status: 403 });
    }

    const { error } = await supabase
      .from("usuarios_clinica")
      .update({ estado: false, updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await registrarAuditoria(supabase, {
      usuario_id: auth.id,
      usuario_email: auth.email,
      accion: "desactivar",
      entidad: "secretaria",
      entidad_id: params.id,
    });

    return NextResponse.json({ message: "Secretaria desactivada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
