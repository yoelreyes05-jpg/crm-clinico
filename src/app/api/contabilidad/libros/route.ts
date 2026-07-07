export const dynamic = "force-dynamic";

// ============================================================
// API LIBROS CONTABLES
// GET /api/contabilidad/libros?libro=diario|mayor|balance|resultados
//     &desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Generados automáticamente desde asientos/partidas.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const libro = searchParams.get("libro") || "diario";
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    // Traer asientos + partidas del período
    let asientosQuery = supabase
      .from("asientos_contables")
      .select("id, numero_asiento, fecha, descripcion, referencia_tipo, referencia_id")
      .order("fecha", { ascending: true })
      .order("numero_asiento", { ascending: true });
    if (desde) asientosQuery = asientosQuery.gte("fecha", desde);
    if (hasta) asientosQuery = asientosQuery.lte("fecha", hasta);

    const { data: asientos, error } = await asientosQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const ids = (asientos || []).map((a: any) => a.id);
    let partidas: any[] = [];
    if (ids.length > 0) {
      const { data } = await supabase
        .from("partidas_contables")
        .select("asiento_id, cuenta_codigo, debe, haber")
        .in("asiento_id", ids);
      partidas = data || [];
    }

    const { data: cuentas } = await supabase
      .from("cuentas_contables")
      .select("codigo, nombre, tipo")
      .order("codigo");

    const nombreCuenta = (codigo: string) =>
      (cuentas || []).find((c: any) => c.codigo === codigo) || { codigo, nombre: codigo, tipo: "activo" };

    // ================= LIBRO DIARIO =================
    if (libro === "diario") {
      const diario = (asientos || []).map((a: any) => ({
        ...a,
        partidas: partidas
          .filter((p) => p.asiento_id === a.id)
          .map((p) => ({ ...p, cuenta: nombreCuenta(p.cuenta_codigo) })),
      }));
      return NextResponse.json({ data: diario });
    }

    // ================= LIBRO MAYOR =================
    if (libro === "mayor") {
      const porCuenta: Record<string, { cuenta: any; movimientos: any[]; total_debe: number; total_haber: number; saldo: number }> = {};
      for (const p of partidas) {
        if (!porCuenta[p.cuenta_codigo]) {
          porCuenta[p.cuenta_codigo] = {
            cuenta: nombreCuenta(p.cuenta_codigo),
            movimientos: [],
            total_debe: 0,
            total_haber: 0,
            saldo: 0,
          };
        }
        const asiento = (asientos || []).find((a: any) => a.id === p.asiento_id);
        porCuenta[p.cuenta_codigo].movimientos.push({
          fecha: asiento?.fecha,
          descripcion: asiento?.descripcion,
          numero_asiento: asiento?.numero_asiento,
          debe: Number(p.debe),
          haber: Number(p.haber),
        });
        porCuenta[p.cuenta_codigo].total_debe += Number(p.debe);
        porCuenta[p.cuenta_codigo].total_haber += Number(p.haber);
      }
      for (const codigo of Object.keys(porCuenta)) {
        const c = porCuenta[codigo];
        const naturalezaDeudora = ["activo", "gasto"].includes(c.cuenta.tipo);
        c.saldo = naturalezaDeudora
          ? c.total_debe - c.total_haber
          : c.total_haber - c.total_debe;
      }
      return NextResponse.json({ data: Object.values(porCuenta).sort((a: any, b: any) => a.cuenta.codigo.localeCompare(b.cuenta.codigo)) });
    }

    // ============ BALANCE GENERAL / ESTADO DE RESULTADOS ============
    const saldos: Record<string, { cuenta: any; saldo: number }> = {};
    for (const p of partidas) {
      if (!saldos[p.cuenta_codigo]) {
        saldos[p.cuenta_codigo] = { cuenta: nombreCuenta(p.cuenta_codigo), saldo: 0 };
      }
      saldos[p.cuenta_codigo].saldo += Number(p.debe) - Number(p.haber);
    }

    const porTipo = (tipo: string) =>
      Object.values(saldos)
        .filter((s) => s.cuenta.tipo === tipo)
        .map((s) => ({
          codigo: s.cuenta.codigo,
          nombre: s.cuenta.nombre,
          // activos/gastos: saldo deudor positivo; pasivo/capital/ingresos: acreedor positivo
          saldo: ["activo", "gasto"].includes(tipo) ? s.saldo : -s.saldo,
        }))
        .sort((a, b) => a.codigo.localeCompare(b.codigo));

    if (libro === "resultados") {
      const ingresos = porTipo("ingreso");
      const gastos = porTipo("gasto");
      const totalIngresos = ingresos.reduce((s, c) => s + c.saldo, 0);
      const totalGastos = gastos.reduce((s, c) => s + c.saldo, 0);
      return NextResponse.json({
        data: {
          ingresos,
          gastos,
          total_ingresos: totalIngresos,
          total_gastos: totalGastos,
          utilidad_neta: totalIngresos - totalGastos,
        },
      });
    }

    // balance (por defecto)
    const activos = porTipo("activo");
    const pasivos = porTipo("pasivo");
    const capital = porTipo("capital");
    const totalIngresos = porTipo("ingreso").reduce((s, c) => s + c.saldo, 0);
    const totalGastos = porTipo("gasto").reduce((s, c) => s + c.saldo, 0);
    const utilidadPeriodo = totalIngresos - totalGastos;

    return NextResponse.json({
      data: {
        activos,
        pasivos,
        capital,
        utilidad_periodo: utilidadPeriodo,
        total_activos: activos.reduce((s, c) => s + c.saldo, 0),
        total_pasivos: pasivos.reduce((s, c) => s + c.saldo, 0),
        total_capital: capital.reduce((s, c) => s + c.saldo, 0) + utilidadPeriodo,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
