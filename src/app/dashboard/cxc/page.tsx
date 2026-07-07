"use client";

// ============================================================
// MÓDULO CUENTAS POR COBRAR — ARS
// Facturas pendientes, antigüedad de saldos, pagos parciales
// y estado de cobro por aseguradora.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Landmark, RefreshCw } from "lucide-react";
import styles from "../his.module.css";

const RD = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });

interface FacturaCxc {
  id: string;
  numero_factura: string;
  fecha_emision: string;
  monto_ars: number;
  pagado_ars: number;
  monto_paciente: number;
  pagado_paciente: number;
  estado: string;
  paciente?: { nombre_completo: string };
  aseguradora?: { nombre: string };
  medico?: { nombre_completo: string };
}

function diasDesde(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
}

function bucketAntiguedad(dias: number) {
  if (dias <= 30) return "0-30";
  if (dias <= 60) return "31-60";
  if (dias <= 90) return "61-90";
  return "+90";
}

export default function CxcPage() {
  const { usuario, token, loading: authLoading } = useAuth();
  const [facturas, setFacturas] = useState<FacturaCxc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroArs, setFiltroArs] = useState("");

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/facturas", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const todas: FacturaCxc[] = (await res.json()).data || [];
        setFacturas(
          todas.filter(
            (f) => f.estado !== "anulada" && Number(f.monto_ars) - Number(f.pagado_ars) > 0.009
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading || !token) return;
    cargar();
  }, [authLoading, token, cargar]);

  const pagoArs = async (f: FacturaCxc) => {
    const pendiente = Number(f.monto_ars) - Number(f.pagado_ars);
    const montoStr = prompt(`Pago de ${f.aseguradora?.nombre || "la ARS"} (pendiente ${RD.format(pendiente)}):`, String(pendiente));
    if (montoStr === null) return;
    const monto = Number(montoStr);
    if (isNaN(monto) || monto <= 0) return alert("Monto inválido");
    const res = await fetch(`/api/facturas/${f.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accion: "pago_ars", monto }),
    });
    const d = await res.json();
    if (res.ok) {
      alert(d.message);
      cargar();
    } else alert(`Error: ${d.error}`);
  };

  const pendienteDe = (f: FacturaCxc) => Number(f.monto_ars) - Number(f.pagado_ars);

  const listaArs = Array.from(new Set(facturas.map((f) => f.aseguradora?.nombre).filter(Boolean))) as string[];
  const visibles = filtroArs ? facturas.filter((f) => f.aseguradora?.nombre === filtroArs) : facturas;

  // Antigüedad de saldos
  const buckets: Record<string, number> = { "0-30": 0, "31-60": 0, "61-90": 0, "+90": 0 };
  for (const f of visibles) buckets[bucketAntiguedad(diasDesde(f.fecha_emision))] += pendienteDe(f);
  const totalPendiente = visibles.reduce((s, f) => s + pendienteDe(f), 0);

  // Consolidado por aseguradora
  const porArs = listaArs
    .map((nombre) => ({
      nombre,
      pendiente: facturas.filter((f) => f.aseguradora?.nombre === nombre).reduce((s, f) => s + pendienteDe(f), 0),
      cantidad: facturas.filter((f) => f.aseguradora?.nombre === nombre).length,
    }))
    .sort((a, b) => b.pendiente - a.pendiente);

  if (authLoading || !usuario) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><Landmark size={24} color="#0284c7" /> Cuentas por Cobrar — ARS</h1>
          <p className={styles.subtitle}>Facturas pendientes, antigüedad de saldos y conciliación de pagos</p>
        </div>
        <div className={styles.headerActions}>
          <select className={styles.select} value={filtroArs} onChange={(e) => setFiltroArs(e.target.value)}>
            <option value="">Todas las ARS</option>
            {listaArs.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className={styles.btnGhost} onClick={cargar}><RefreshCw size={14} /> Actualizar</button>
        </div>
      </div>

      {/* Antigüedad de saldos */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.cardAzul}`}>
          <span className={styles.cardLabel}>Total pendiente</span>
          <span className={styles.cardValue}>{RD.format(totalPendiente)}</span>
          <span className={styles.cardSub}>{visibles.length} facturas</span>
        </div>
        <div className={`${styles.card} ${styles.cardVerde}`}>
          <span className={styles.cardLabel}>0-30 días</span>
          <span className={styles.cardValue}>{RD.format(buckets["0-30"])}</span>
        </div>
        <div className={`${styles.card} ${styles.cardAmbar}`}>
          <span className={styles.cardLabel}>31-60 días</span>
          <span className={styles.cardValue}>{RD.format(buckets["31-60"])}</span>
        </div>
        <div className={`${styles.card} ${styles.cardAmbar}`}>
          <span className={styles.cardLabel}>61-90 días</span>
          <span className={styles.cardValue}>{RD.format(buckets["61-90"])}</span>
        </div>
        <div className={`${styles.card} ${styles.cardRojo}`}>
          <span className={styles.cardLabel}>+90 días</span>
          <span className={styles.cardValue}>{RD.format(buckets["+90"])}</span>
        </div>
      </div>

      {/* Consolidado por aseguradora */}
      {porArs.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Aseguradora</th><th>Facturas pendientes</th><th>Monto pendiente</th></tr></thead>
            <tbody>
              {porArs.map((a) => (
                <tr key={a.nombre}>
                  <td><strong>{a.nombre}</strong></td>
                  <td>{a.cantidad}</td>
                  <td className={styles.montoRojo}>{RD.format(a.pendiente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle */}
      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.vacio}>Cargando...</p>
        ) : visibles.length === 0 ? (
          <p className={styles.vacio}>No hay cuentas pendientes de cobro a las ARS. 🎉</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Factura</th>
                <th>Fecha</th>
                <th>Antigüedad</th>
                <th>ARS</th>
                <th>Paciente</th>
                <th>Reclamado</th>
                <th>Pagado</th>
                <th>Pendiente</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => {
                const dias = diasDesde(f.fecha_emision);
                return (
                  <tr key={f.id}>
                    <td><strong>{f.numero_factura}</strong></td>
                    <td>{f.fecha_emision}</td>
                    <td>
                      <span className={`${styles.badge} ${dias > 60 ? styles.badgeRojo : dias > 30 ? styles.badgeAmbar : styles.badgeVerde}`}>
                        {dias} días
                      </span>
                    </td>
                    <td>{f.aseguradora?.nombre || "—"}</td>
                    <td>{f.paciente?.nombre_completo || "—"}</td>
                    <td>{RD.format(Number(f.monto_ars))}</td>
                    <td>{RD.format(Number(f.pagado_ars))}</td>
                    <td className={styles.montoRojo}>{RD.format(pendienteDe(f))}</td>
                    <td>
                      <button className={`${styles.btnMini} ${styles.btnMiniVerde}`} onClick={() => pagoArs(f)}>
                        Registrar pago
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
