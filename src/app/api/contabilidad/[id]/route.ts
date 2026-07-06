export const dynamic = "force-dynamic";

// ============================================================
// API CONTABILIDAD — PUT/DELETE de un movimiento
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

async function puedeModificar(auth: { id: string; rol: string }, id: string) {
  if (auth.rol === "admin") return true;
  const { data } = await supabase
    .from("movimientos_financieros")
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
      "tipo", "concepto", "monto", "metodo_pago", "fuente", "fecha_movimiento",
      "estado", "comprobante", "notas", "paciente_id", "aseguradora_id", "autorizacion_id",
    ];
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const campo of permitidos) {
      if (body[campo] !== undefined) updates[campo] = body[campo];
    }

    const { data, error } = await supabase
      .from("movimientos_financieros")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Movimiento actualizado" });
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

    // Anular en lugar de borrar (auditoría)
    const { error } = await supabase
      .from("movimientos_financieros")
      .update({ estado: "anulado", updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Movimiento anulado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
