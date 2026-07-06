export const dynamic = "force-dynamic";

// ============================================================
// API CONTABILIDAD — Movimientos financieros por médico
// GET  /api/contabilidad → lista movimientos + resumen
//      Query: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&tipo=consulta&medico_id=(solo admin)
// POST /api/contabilidad → crear movimiento
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const tipo = searchParams.get("tipo");
    const medicoIdParam = searchParams.get("medico_id");

    // Médico solo ve lo suyo; admin puede ver todo o filtrar por médico
    const medicoId = auth.rol === "admin" ? medicoIdParam : auth.id;

    let query = supabase
      .from("movimientos_financieros")
      .select("*, paciente:pacientes(id, nombre_completo, cedula), aseguradora:aseguradoras(id, nombre)")
      .neq("estado", "anulado")
      .order("fecha_movimiento", { ascending: false })
      .order("created_at", { ascending: false });

    if (medicoId) query = query.eq("medico_id", medicoId);
    if (desde) query = query.gte("fecha_movimiento", desde);
    if (hasta) query = query.lte("fecha_movimiento", hasta);
    if (tipo) query = query.eq("tipo", tipo);

    const { data: movimientos, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ---- Resumen financiero ----
    const lista = movimientos || [];
    const ingresos = lista.filter((m: any) => m.tipo !== "gasto" && m.estado === "cobrado");
    const gastos = lista.filter((m: any) => m.tipo === "gasto");
    const total_ingresos = ingresos.reduce((s: number, m: any) => s + Number(m.monto), 0);
    const total_gastos = gastos.reduce((s: number, m: any) => s + Number(m.monto), 0);
    const ingresos_pacientes = ingresos
      .filter((m: any) => m.fuente === "paciente")
      .reduce((s: number, m: any) => s + Number(m.monto), 0);
    const ingresos_aseguradoras = ingresos
      .filter((m: any) => m.fuente === "aseguradora")
      .reduce((s: number, m: any) => s + Number(m.monto), 0);

    // Lo que deben las ARS: reclamaciones no pagadas
    let reclamacionesQuery = supabase
      .from("reclamaciones_ars")
      .select("monto_reclamado, monto_pagado, monto_glosado, estado")
      .in("estado", ["preparando", "enviada", "parcial", "glosada"]);
    if (medicoId) reclamacionesQuery = reclamacionesQuery.eq("medico_id", medicoId);

    const { data: reclamaciones } = await reclamacionesQuery;
    const pendiente_cobrar_ars = (reclamaciones || []).reduce(
      (s: number, r: any) =>
        s + Math.max(0, Number(r.monto_reclamado) - Number(r.monto_pagado || 0) - Number(r.monto_glosado || 0)),
      0
    );

    const resumen = {
      total_ingresos,
      total_gastos,
      balance: total_ingresos - total_gastos,
      ingresos_pacientes,
      ingresos_aseguradoras,
      pendiente_cobrar_ars,
      total_movimientos: lista.length,
    };

    return NextResponse.json({ data: movimientos, resumen });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { tipo, concepto, monto } = body;

    if (!tipo || !concepto || monto === undefined || monto === null) {
      return NextResponse.json(
        { error: "Tipo, concepto y monto son requeridos" },
        { status: 400 }
      );
    }
    if (Number(monto) < 0) {
      return NextResponse.json({ error: "El monto no puede ser negativo" }, { status: 400 });
    }

    // El médico registra a su nombre; el admin puede registrar para un médico
    const medico_id = auth.rol === "admin" && body.medico_id ? body.medico_id : auth.id;
    const especialidad = body.especialidad || auth.especialidad || "general";

    const { data, error } = await supabase
      .from("movimientos_financieros")
      .insert([{
        medico_id,
        especialidad,
        paciente_id: body.paciente_id || null,
        cita_id: body.cita_id || null,
        historial_id: body.historial_id || null,
        autorizacion_id: body.autorizacion_id || null,
        aseguradora_id: body.aseguradora_id || null,
        tipo,
        concepto,
        monto: Number(monto),
        metodo_pago: body.metodo_pago || "efectivo",
        fuente: body.fuente || "paciente",
        fecha_movimiento: body.fecha_movimiento || new Date().toISOString().slice(0, 10),
        estado: body.estado || "cobrado",
        comprobante: body.comprobante || null,
        notas: body.notas || null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Movimiento registrado" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
