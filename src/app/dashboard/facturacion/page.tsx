"use client";

// ============================================================
// MÓDULO FACTURACIÓN
// Lista de facturas con desglose paciente/ARS, pagos y anulación.
// Cada operación genera sus asientos contables automáticamente.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Receipt, RefreshCw, Banknote, Landmark, Ban } from "lucide-react";
import styles from "../his.module.css";

const RD = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });

interface FacturaRow {
  id: string;
  numero_factura: string;
  ncf?: string;
  descripcion: string;
  total: number;
  monto_paciente: number;
  monto_ars: number;
  pagado_paciente: number;
  pagado_ars: number;
  estado: string;
  fecha_emision: string;
  paciente?: { nombre_completo: string; cedula: string };
  aseguradora?: { nombre: string };
  medico?: { nombre_completo: string };
}

export default function FacturacionPage() {
  const { usuario, token, loading: authLoading } = useAuth();
  const [facturas, setFacturas] = useState<FacturaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = filtroEstado ? `?estado=${filtroEstado}` : "";
      const res = await fetch(`/api/facturas${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFacturas((await res.json()).data || []);
    } finally {
      setLoading(false);
    }
  }, [token, filtroEstado]);

  useEffect(() => {
    if (authLoading || !token) return;
    cargar();
  }, [authLoading, token, cargar]);

  const registrarPago = async (f: FacturaRow, accion: "pago_paciente" | "pago_ars") => {
    const pendiente =
      accion === "pago_paciente"
        ? Number(f.monto_paciente) - Number(f.pagado_paciente)
        : Number(f.monto_ars) - Number(f.pagado_ars);
    const montoStr = prompt(
      accion === "pago_paciente" ? "Monto pagado por el paciente:" : "Monto pagado por la ARS:",
      String(Math.max(0, pendiente))
    );
    if (montoStr === null) return;
    const monto = Number(montoStr);
    if (isNaN(monto) || monto <= 0) return alert("Monto inválido");

    let metodo = "efectivo";
    if (accion === "pago_paciente") {
      metodo = prompt("Método (efectivo/tarjeta/transferencia/cheque):", "efectivo") || "efectivo";
    }

    const res = await fetch(`/api/facturas/${f.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accion, monto, metodo }),
    });
    const d = await res.json();
    if (res.ok) {
      alert(d.message);
      cargar();
    } else alert(`Error: ${d.error}`);
  };

  const anular = async (f: FacturaRow) => {
    if (!confirm(`¿Anular la factura ${f.numero_factura}? Se generará el asiento de reversa.`)) return;
    const res = await fetch(`/api/facturas/${f.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accion: "anular" }),
    });
    if (res.ok) cargar();
    else alert(`Error: ${(await res.json()).error}`);
  };

  const badgeEstado = (estado: string) => {
    const map: Record<string, string> = {
      pagada: styles.badgeVerde,
      parcial: styles.badgeAmbar,
      emitida: styles.badgeAzul,
      anulada: styles.badgeRojo,
    };
    return <span className={`${styles.badge} ${map[estado] || styles.badgeGris}`}>{estado}</span>;
  };

  const activas = facturas.filter((f) => f.estado !== "anulada");
  const totalFacturado = activas.reduce((s, f) => s + Number(f.total), 0);
  const pendientePaciente = activas.reduce((s, f) => s + Math.max(0, Number(f.monto_paciente) - Number(f.pagado_paciente)), 0);
  const pendienteArs = activas.reduce((s, f) => s + Math.max(0, Number(f.monto_ars) - Number(f.pagado_ars)), 0);

  if (authLoading || !usuario) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><Receipt size={24} color="#0284c7" /> Facturación</h1>
          <p className={styles.subtitle}>
            Trazabilidad completa: cita → factura → asientos contables → cobros
          </p>
        </div>
        <div className={styles.headerActions}>
          <select className={styles.select} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todas</option>
            <option value="emitida">Emitidas</option>
            <option value="parcial">Parciales</option>
            <option value="pagada">Pagadas</option>
            <option value="anulada">Anuladas</option>
          </select>
          <button className={styles.btnGhost} onClick={cargar}><RefreshCw size={14} /> Actualizar</button>
        </div>
      </div>

      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.cardAzul}`}>
          <span className={styles.cardLabel}>Total facturado</span>
          <span className={styles.cardValue}>{RD.format(totalFacturado)}</span>
          <span className={styles.cardSub}>{activas.length} facturas</span>
        </div>
        <div className={`${styles.card} ${styles.cardAmbar}`}>
          <span className={styles.cardLabel}>Pendiente pacientes</span>
          <span className={styles.cardValue}>{RD.format(pendientePaciente)}</span>
        </div>
        <div className={`${styles.card} ${styles.cardRojo}`}>
          <span className={styles.cardLabel}>Pendiente ARS</span>
          <span className={styles.cardValue}>{RD.format(pendienteArs)}</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.vacio}>Cargando facturas...</p>
        ) : facturas.length === 0 ? (
          <p className={styles.vacio}>No hay facturas. Se emiten desde el módulo CITAS al finalizar la consulta.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No. Factura</th>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>ARS</th>
                <th>Total</th>
                <th>Paciente RD$</th>
                <th>ARS RD$</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => {
                const pendPac = Math.max(0, Number(f.monto_paciente) - Number(f.pagado_paciente));
                const pendArs = Math.max(0, Number(f.monto_ars) - Number(f.pagado_ars));
                return (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.numero_factura}</strong>
                      {f.ncf && <div style={{ fontSize: 11, color: "#94a3b8" }}>NCF: {f.ncf}</div>}
                    </td>
                    <td>{f.fecha_emision}</td>
                    <td>{f.paciente?.nombre_completo || "—"}</td>
                    <td>{f.medico?.nombre_completo || "—"}</td>
                    <td>{f.aseguradora?.nombre || "—"}</td>
                    <td className={styles.monto}>{RD.format(Number(f.total))}</td>
                    <td>
                      {RD.format(Number(f.pagado_paciente))} / {RD.format(Number(f.monto_paciente))}
                    </td>
                    <td>
                      {RD.format(Number(f.pagado_ars))} / {RD.format(Number(f.monto_ars))}
                    </td>
                    <td>{badgeEstado(f.estado)}</td>
                    <td className={styles.acciones}>
                      {f.estado !== "anulada" && pendPac > 0 && (
                        <button className={`${styles.btnMini} ${styles.btnMiniVerde}`} onClick={() => registrarPago(f, "pago_paciente")}>
                          <Banknote size={12} /> Cobrar paciente
                        </button>
                      )}
                      {f.estado !== "anulada" && pendArs > 0 && (
                        <button className={`${styles.btnMini} ${styles.btnMiniAzul}`} onClick={() => registrarPago(f, "pago_ars")}>
                          <Landmark size={12} /> Pago ARS
                        </button>
                      )}
                      {f.estado !== "anulada" && (
                        <button className={`${styles.btnMini} ${styles.btnMiniRojo}`} onClick={() => anular(f)}>
                          <Ban size={12} /> Anular
                        </button>
                      )}
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
