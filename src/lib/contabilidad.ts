// ============================================================
// MOTOR CONTABLE — Asientos automáticos (partida doble)
// ============================================================
// Cuentas base (ver migracion_his_erp.sql):
//  1101 Caja | 1102 Banco | 1201 CxC Pacientes | 1202 CxC ARS
//  4101 Ingresos por Servicios Médicos | 5101 Gastos Generales
//
// Eventos automáticos:
//  - Factura con pago en caja:  Debe Caja/Banco   / Haber Ingresos
//  - Porción ARS de la factura: Debe CxC-ARS      / Haber Ingresos
//  - Pago de la ARS:            Debe Banco        / Haber CxC-ARS
// ============================================================
import { SupabaseClient } from "@supabase/supabase-js";

export const CUENTAS = {
  CAJA: "1101",
  BANCO: "1102",
  CXC_PACIENTES: "1201",
  CXC_ARS: "1202",
  INGRESOS_SERVICIOS: "4101",
  GASTOS_GENERALES: "5101",
} as const;

export interface Partida {
  cuenta_codigo: string;
  debe?: number;
  haber?: number;
}

export async function crearAsiento(
  supabase: SupabaseClient,
  datos: {
    descripcion: string;
    partidas: Partida[];
    fecha?: string;
    referencia_tipo?: string;
    referencia_id?: string;
    medico_id?: string;
    creado_por?: string;
  }
): Promise<{ ok: boolean; asiento_id?: string; error?: string }> {
  const partidasValidas = datos.partidas.filter(
    (p) => Number(p.debe || 0) > 0 || Number(p.haber || 0) > 0
  );
  if (partidasValidas.length === 0) return { ok: true }; // nada que registrar

  const totalDebe = partidasValidas.reduce((s, p) => s + Number(p.debe || 0), 0);
  const totalHaber = partidasValidas.reduce((s, p) => s + Number(p.haber || 0), 0);
  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    return { ok: false, error: `Asiento descuadrado: Debe ${totalDebe} ≠ Haber ${totalHaber}` };
  }

  const { data: asiento, error } = await supabase
    .from("asientos_contables")
    .insert([{
      fecha: datos.fecha || new Date().toISOString().slice(0, 10),
      descripcion: datos.descripcion,
      referencia_tipo: datos.referencia_tipo || null,
      referencia_id: datos.referencia_id || null,
      medico_id: datos.medico_id || null,
      creado_por: datos.creado_por || null,
    }])
    .select("id")
    .single();

  if (error || !asiento) return { ok: false, error: error?.message };

  const { error: errorPartidas } = await supabase.from("partidas_contables").insert(
    partidasValidas.map((p) => ({
      asiento_id: asiento.id,
      cuenta_codigo: p.cuenta_codigo,
      debe: Number(p.debe || 0),
      haber: Number(p.haber || 0),
    }))
  );

  if (errorPartidas) return { ok: false, error: errorPartidas.message };
  return { ok: true, asiento_id: asiento.id };
}

/** Cuenta de caja/banco según método de pago */
export function cuentaPorMetodo(metodo?: string): string {
  if (metodo === "transferencia" || metodo === "tarjeta" || metodo === "cheque") {
    return CUENTAS.BANCO;
  }
  return CUENTAS.CAJA;
}
