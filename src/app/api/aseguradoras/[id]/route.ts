export const dynamic = "force-dynamic";

// ============================================================
// API ASEGURADORAS [id] — configurar integración (solo admin)
// PUT: datos generales + API/credenciales/adapter
// DELETE: desactivar
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "admin") {
      return NextResponse.json({ error: "Solo el administrador puede configurar aseguradoras" }, { status: 401 });
    }

    const body = await request.json();
    const permitidos = [
      "nombre", "codigo", "telefono", "telefono_autorizaciones", "email_autorizaciones",
      "portal_web", "requiere_autorizacion_previa", "dias_pago_promedio", "notas",
      "adapter", "api_base_url", "api_usuario", "api_key", "api_token", "config", "estado",
    ];
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const campo of permitidos) {
      if (body[campo] !== undefined) updates[campo] = body[campo];
    }

    const { data, error } = await supabase
      .from("aseguradoras")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await registrarAuditoria(supabase, {
      usuario_id: auth.id,
      usuario_email: auth.email,
      accion: "configurar",
      entidad: "aseguradora",
      entidad_id: params.id,
      detalles: { campos: Object.keys(updates) },
    });

    return NextResponse.json({ data, message: "Aseguradora actualizada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { error } = await supabase
      .from("aseguradoras")
      .update({ estado: false, updated_at: new Date().toISOString() })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Aseguradora desactivada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
