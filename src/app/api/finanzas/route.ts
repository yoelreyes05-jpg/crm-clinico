export const dynamic = "force-dynamic";

// ============================================================
// API DASHBOARD FINANCIERO — métricas en tiempo real
// GET /api/finanzas
// Ingresos del día, cobros en caja, CxC pacientes, CxC ARS,
// facturación día/semana/mes, privado vs asegurado,
// pendientes por aseguradora.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

const esStaff = (rol: string) => rol === "admin" || rol === "secretaria";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const medicoIdParam = searchParams.get("medico_id");
    const medicoId = esStaff(auth.rol) ? medicoIdParam : auth.id;

    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const inicioSemanaStr = inicioSemana.toISOString().slice(0, 10);
    const inicioMesStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;

    // ---- Facturas del mes ----
    let factQuery = supabase
      .from("facturas_clinica")
      .select("total, monto_paciente, monto_ars, pagado_paciente, pagado_ars, fecha_emision, estado, aseguradora_id, metodo_pago_paciente")
      .neq("estado", "anulada")
      .gte("fecha_emision", inicioMesStr);
    if (medicoId) factQuery = factQuery.eq("medico_id", medicoId);
    const { data: facturas } = await factQuery;
    const f = facturas || [];

    const sum = (arr: any[], campo: string) => arr.reduce((s, x) => s + Number(x[campo] || 0), 0);
    const fDia = f.filter((x) => x.fecha_emision === hoyStr);
    const fSemana = f.filter((x) => x.fecha_emision >= inicioSemanaStr);

    // ---- Movimientos del día (cobros en caja) ----
    let movQuery = supabase
      .from("movimientos_financieros")
      .select("monto, tipo, metodo_pago, fuente, estado")
      .eq("fecha_movimiento", hoyStr)
      .eq("estado", "cobrado");
    if (medicoId) movQuery = movQuery.eq("medico_id", medicoId);
    const { data: movimientos } = await movQuery;
    const m = (movimientos || []).filter((x) => x.tipo !== "gasto");
    const cobrosCaja = m.filter((x) => x.metodo_pago === "efectivo").reduce((s, x) => s + Number(x.monto), 0);
    const ingresosDia = m.reduce((s, x) => s + Number(x.monto), 0);

    // ---- CxC pacientes y ARS (todas las facturas abiertas) ----
    let cxcQuery = supabase
      .from("facturas_clinica")
      .select("monto_paciente, pagado_paciente, monto_ars, pagado_ars, aseguradora_id, fecha_emision, numero_factura, estado")
      .in("estado", ["emitida", "parcial"]);
    if (medicoId) cxcQuery = cxcQuery.eq("medico_id", medicoId);
    const { data: abiertas } = await cxcQuery;
    const ab = abiertas || [];
    const cxcPacientes = ab.reduce((s, x) => s + Math.max(0, Number(x.monto_paciente) - Number(x.pagado_paciente)), 0);
    const cxcArs = ab.reduce((s, x) => s + Math.max(0, Number(x.monto_ars) - Number(x.pagado_ars)), 0);

    // ---- Pendiente por aseguradora ----
    const { data: aseguradoras } = await supabase.from("aseguradoras").select("id, nombre").eq("estado", true);
    const porAseguradora = (aseguradoras || [])
      .map((a: any) => ({
        aseguradora: a.nombre,
        pendiente: ab
          .filter((x) => x.aseguradora_id === a.id)
          .reduce((s, x) => s + Math.max(0, Number(x.monto_ars) - Number(x.pagado_ars)), 0),
        facturas: ab.filter((x) => x.aseguradora_id === a.id && Number(x.monto_ars) - Number(x.pagado_ars) > 0).length,
      }))
      .filter((x) => x.pendiente > 0)
      .sort((a, b) => b.pendiente - a.pendiente);

    // ---- Citas de hoy: privadas vs aseguradas ----
    let citasQuery = supabase
      .from("citas")
      .select("tipo_paciente, estado, fecha_cita")
      .gte("fecha_cita", `${hoyStr}T00:00:00`)
      .lte("fecha_cita", `${hoyStr}T23:59:59`);
    if (medicoId) citasQuery = citasQuery.eq("medico_id", medicoId);
    const { data: citasHoy } = await citasQuery;
    const ch = citasHoy || [];

    return NextResponse.json({
      data: {
        ingresos_dia: ingresosDia,
        cobros_caja: cobrosCaja,
        cxc_pacientes: cxcPacientes,
        cxc_ars: cxcArs,
        facturacion: {
          dia: sum(fDia, "total"),
          semana: sum(fSemana, "total"),
          mes: sum(f, "total"),
          cantidad_dia: fDia.length,
          cantidad_mes: f.length,
        },
        citas_hoy: {
          total: ch.length,
          privadas: ch.filter((c) => c.tipo_paciente !== "asegurado").length,
          aseguradas: ch.filter((c) => c.tipo_paciente === "asegurado").length,
        },
        por_aseguradora: porAseguradora,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
