export const dynamic = "force-dynamic";

// ============================================================
// API RECLAMACIONES — PUT (actualizar) / DELETE
// Al marcar como pagada, crea automáticamente el movimiento
// financiero 'pago_ars' en la contabilidad del médico.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

async function obtenerReclamacion(id: string) {
  const { data } = await supabase
    .from("reclamaciones_ars")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const reclamacion = await obtenerReclamacion(params.id);
    if (!reclamacion) return NextResponse.json({ error: "Reclamación no encontrada" }, { status: 404 });
    if (auth.rol !== "admin" && reclamacion.medico_id !== auth.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const permitidos = [
      "numero_reclamacion", "descripcion", "fecha_servicio", "fecha_envio", "fecha_pago",
      "monto_reclamado", "monto_glosado", "monto_pagado", "estado", "motivo_glosa", "notas",
      "aseguradora_id", "autorizacion_id", "paciente_id",
    ];
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const campo of permitidos) {
      if (body[campo] !== undefined) updates[campo] = body[campo];
    }

    const pasaAPagada =
      (updates.estado === "pagada" || updates.estado === "parcial") &&
      reclamacion.estado !== "pagada";

    if (updates.estado === "pagada" && !updates.fecha_pago) {
      updates.fecha_pago = new Date().toISOString().slice(0, 10);
    }

    const { data, error } = await supabase
      .from("reclamaciones_ars")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Registrar automáticamente el ingreso en contabilidad
    if (pasaAPagada) {
      const montoPagado = Number(updates.monto_pagado ?? reclamacion.monto_pagado ?? 0);
      if (montoPagado > 0) {
        await supabase.from("movimientos_financieros").insert([{
          medico_id: reclamacion.medico_id,
          especialidad: reclamacion.especialidad,
          paciente_id: reclamacion.paciente_id,
          autorizacion_id: reclamacion.autorizacion_id,
          aseguradora_id: reclamacion.aseguradora_id,
          tipo: "pago_ars",
          concepto: `Pago ARS — ${reclamacion.descripcion}`.slice(0, 250),
          monto: montoPagado,
          metodo_pago: "transferencia",
          fuente: "aseguradora",
          fecha_movimiento: updates.fecha_pago || new Date().toISOString().slice(0, 10),
          estado: "cobrado",
          comprobante: reclamacion.numero_reclamacion || null,
          notas: "Generado automáticamente al marcar la reclamación como pagada",
        }]);
      }
    }

    return NextResponse.json({ data, message: "Reclamación actualizada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const reclamacion = await obtenerReclamacion(params.id);
    if (!reclamacion) return NextResponse.json({ error: "Reclamación no encontrada" }, { status: 404 });
    if (auth.rol !== "admin" && reclamacion.medico_id !== auth.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { error } = await supabase.from("reclamaciones_ars").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Reclamación eliminada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
