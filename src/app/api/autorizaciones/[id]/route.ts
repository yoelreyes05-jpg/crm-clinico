export const dynamic = "force-dynamic";

// ============================================================
// API AUTORIZACIONES — PUT (actualizar estado/datos) / DELETE
// Al aprobar, puede generar movimiento de copago automáticamente
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

async function puedeModificar(auth: { id: string; rol: string }, id: string) {
  if (auth.rol === "admin") return true;
  const { data } = await supabase
    .from("autorizaciones_seguro")
    .select("medico_id")
    .eq("id", id)
    .single();
  return data?.medico_id === auth.id;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await puedeModificar(auth, params.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const permitidos = [
      "numero_autorizacion", "fecha_respuesta", "fecha_vencimiento", "via_solicitud",
      "monto_solicitado", "monto_autorizado", "monto_diferencia", "copago_paciente",
      "estado", "motivo_rechazo", "notas", "tipo_servicio", "descripcion_servicio",
      "codigo_procedimiento", "diagnostico_cie10", "aseguradora_id",
    ];
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const campo of permitidos) {
      if (body[campo] !== undefined) updates[campo] = body[campo];
    }

    // Si se aprueba y no tiene fecha de respuesta, ponerla hoy
    if (updates.estado === "aprobada" && !updates.fecha_respuesta) {
      updates.fecha_respuesta = new Date().toISOString().slice(0, 10);
    }

    const { data, error } = await supabase
      .from("autorizaciones_seguro")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Autorización actualizada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await puedeModificar(auth, params.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { error } = await supabase
      .from("autorizaciones_seguro")
      .delete()
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Autorización eliminada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
