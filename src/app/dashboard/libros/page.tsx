"use client";

// ============================================================
// LIBROS CONTABLES — generados automáticamente
// Libro Diario | Libro Mayor | Balance General | Estado de Resultados
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, RefreshCw } from "lucide-react";
import styles from "../his.module.css";

const RD = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });

export default function LibrosPage() {
  const { usuario, token, loading: authLoading } = useAuth();
  const [libro, setLibro] = useState<"diario" | "mayor" | "balance" | "resultados">("diario");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const hoy = new Date();
  const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  const [desde, setDesde] = useState(inicioMes);
  const [hasta, setHasta] = useState(hoy.toISOString().slice(0, 10));

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contabilidad/libros?libro=${libro}&desde=${desde}&hasta=${hasta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData((await res.json()).data);
    } finally {
      setLoading(false);
    }
  }, [token, libro, desde, hasta]);

  useEffect(() => {
    if (authLoading || !token) return;
    cargar();
  }, [authLoading, token, cargar]);

  if (authLoading || !usuario) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><BookOpen size={24} color="#0284c7" /> Libros Contables</h1>
          <p className={styles.subtitle}>Generados automáticamente desde los asientos — sin intervención manual</p>
        </div>
        <div className={styles.headerActions}>
          <input type="date" className={styles.input} value={desde} onChange={(e) => setDesde(e.target.value)} />
          <input type="date" className={styles.input} value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button className={styles.btnGhost} onClick={cargar}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className={styles.tabs}>
        {([
          ["diario", "Libro Diario"],
          ["mayor", "Libro Mayor"],
          ["balance", "Balance General"],
          ["resultados", "Estado de Resultados"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${libro === key ? styles.tabActive : ""}`}
            onClick={() => {
              // Limpiar datos del libro anterior para no renderizar
              // una forma de datos que no corresponde a la pestaña
              setData(null);
              setLoading(true);
              setLibro(key);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.vacio}>Generando libro...</p>
      ) : !data ? (
        <p className={styles.vacio}>Sin datos en el período.</p>
      ) : (libro === "diario" || libro === "mayor") && !Array.isArray(data) ? (
        <p className={styles.vacio}>Cargando...</p>
      ) : libro === "balance" && !data.activos ? (
        <p className={styles.vacio}>Cargando...</p>
      ) : libro === "resultados" && !data.ingresos ? (
        <p className={styles.vacio}>Cargando...</p>
      ) : libro === "diario" ? (
        // ================= LIBRO DIARIO =================
        <div className={styles.tableWrap}>
          {(data as any[]).length === 0 ? (
            <p className={styles.vacio}>No hay asientos en el período. Se generan al facturar y registrar pagos.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr><th>No.</th><th>Fecha</th><th>Descripción</th><th>Cuenta</th><th>Debe</th><th>Haber</th></tr>
              </thead>
              <tbody>
                {(data as any[]).map((a) =>
                  (a.partidas || []).map((p: any, i: number) => (
                    <tr key={`${a.id}-${i}`}>
                      <td>{i === 0 ? <strong>#{a.numero_asiento}</strong> : ""}</td>
                      <td>{i === 0 ? a.fecha : ""}</td>
                      <td>{i === 0 ? a.descripcion : ""}</td>
                      <td style={{ paddingLeft: Number(p.haber) > 0 ? 30 : 14 }}>
                        {p.cuenta?.codigo} — {p.cuenta?.nombre}
                      </td>
                      <td className={styles.monto}>{Number(p.debe) > 0 ? RD.format(Number(p.debe)) : ""}</td>
                      <td className={styles.monto}>{Number(p.haber) > 0 ? RD.format(Number(p.haber)) : ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : libro === "mayor" ? (
        // ================= LIBRO MAYOR =================
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(data as any[]).length === 0 ? (
            <p className={styles.vacio}>No hay movimientos en el período.</p>
          ) : (
            (data as any[]).map((c) => (
              <div key={c.cuenta.codigo} className={styles.libroSeccion}>
                <div className={styles.libroTituloCuenta}>
                  {c.cuenta.codigo} — {c.cuenta.nombre} · Saldo: {RD.format(c.saldo)}
                </div>
                <div className={styles.tableWrap} style={{ borderRadius: "0 0 12px 12px" }}>
                  <table className={styles.table}>
                    <thead><tr><th>Fecha</th><th>Asiento</th><th>Descripción</th><th>Debe</th><th>Haber</th></tr></thead>
                    <tbody>
                      {c.movimientos.map((mv: any, i: number) => (
                        <tr key={i}>
                          <td>{mv.fecha}</td>
                          <td>#{mv.numero_asiento}</td>
                          <td>{mv.descripcion}</td>
                          <td className={styles.monto}>{mv.debe > 0 ? RD.format(mv.debe) : ""}</td>
                          <td className={styles.monto}>{mv.haber > 0 ? RD.format(mv.haber) : ""}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc" }}>
                        <td colSpan={3}><strong>Totales</strong></td>
                        <td className={styles.monto}><strong>{RD.format(c.total_debe)}</strong></td>
                        <td className={styles.monto}><strong>{RD.format(c.total_haber)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      ) : libro === "balance" ? (
        // ================= BALANCE GENERAL =================
        <div className={styles.cards} style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th colSpan={2}>ACTIVOS</th></tr></thead>
              <tbody>
                {data.activos.map((c: any) => (
                  <tr key={c.codigo}><td>{c.codigo} — {c.nombre}</td><td className={styles.monto}>{RD.format(c.saldo)}</td></tr>
                ))}
                <tr style={{ background: "#f0fdf4" }}>
                  <td><strong>TOTAL ACTIVOS</strong></td>
                  <td className={styles.montoVerde}><strong>{RD.format(data.total_activos)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th colSpan={2}>PASIVOS Y CAPITAL</th></tr></thead>
              <tbody>
                {data.pasivos.map((c: any) => (
                  <tr key={c.codigo}><td>{c.codigo} — {c.nombre}</td><td className={styles.monto}>{RD.format(c.saldo)}</td></tr>
                ))}
                {data.capital.map((c: any) => (
                  <tr key={c.codigo}><td>{c.codigo} — {c.nombre}</td><td className={styles.monto}>{RD.format(c.saldo)}</td></tr>
                ))}
                <tr>
                  <td>Utilidad del período</td>
                  <td className={styles.monto}>{RD.format(data.utilidad_periodo)}</td>
                </tr>
                <tr style={{ background: "#f0f9ff" }}>
                  <td><strong>TOTAL PASIVO + CAPITAL</strong></td>
                  <td className={styles.monto}>
                    <strong>{RD.format(data.total_pasivos + data.total_capital)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ================= ESTADO DE RESULTADOS =================
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Cuenta</th><th>Monto</th></tr></thead>
            <tbody>
              <tr style={{ background: "#f8fafc" }}><td colSpan={2}><strong>INGRESOS</strong></td></tr>
              {data.ingresos.map((c: any) => (
                <tr key={c.codigo}><td>{c.codigo} — {c.nombre}</td><td className={styles.montoVerde}>{RD.format(c.saldo)}</td></tr>
              ))}
              <tr><td><strong>Total Ingresos</strong></td><td className={styles.montoVerde}><strong>{RD.format(data.total_ingresos)}</strong></td></tr>
              <tr style={{ background: "#f8fafc" }}><td colSpan={2}><strong>GASTOS</strong></td></tr>
              {data.gastos.map((c: any) => (
                <tr key={c.codigo}><td>{c.codigo} — {c.nombre}</td><td className={styles.montoRojo}>{RD.format(c.saldo)}</td></tr>
              ))}
              <tr><td><strong>Total Gastos</strong></td><td className={styles.montoRojo}><strong>{RD.format(data.total_gastos)}</strong></td></tr>
              <tr style={{ background: data.utilidad_neta >= 0 ? "#f0fdf4" : "#fef2f2" }}>
                <td><strong>UTILIDAD NETA</strong></td>
                <td className={data.utilidad_neta >= 0 ? styles.montoVerde : styles.montoRojo}>
                  <strong>{RD.format(data.utilidad_neta)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
