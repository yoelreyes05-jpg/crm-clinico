"use client";

// ============================================================
// DASHBOARD FINANCIERO — métricas en tiempo real
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp, Wallet, Landmark, Users, RefreshCw, Receipt, PieChart,
} from "lucide-react";
import styles from "../his.module.css";

const RD = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });

interface Metricas {
  ingresos_dia: number;
  cobros_caja: number;
  cxc_pacientes: number;
  cxc_ars: number;
  facturacion: { dia: number; semana: number; mes: number; cantidad_dia: number; cantidad_mes: number };
  citas_hoy: { total: number; privadas: number; aseguradas: number };
  por_aseguradora: { aseguradora: string; pendiente: number; facturas: number }[];
}

export default function FinanzasPage() {
  const { usuario, token, loading: authLoading } = useAuth();
  const [m, setM] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualizado, setActualizado] = useState<string>("");

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/finanzas", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setM((await res.json()).data);
        setActualizado(new Date().toLocaleTimeString("es-DO"));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading || !token) return;
    cargar();
    const intervalo = setInterval(cargar, 60000); // refresco cada minuto
    return () => clearInterval(intervalo);
  }, [authLoading, token, cargar]);

  if (authLoading || !usuario) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><PieChart size={24} color="#0284c7" /> Dashboard Financiero</h1>
          <p className={styles.subtitle}>
            Métricas en tiempo real{actualizado && ` · actualizado ${actualizado} (auto cada minuto)`}
          </p>
        </div>
        <button className={styles.btnGhost} onClick={cargar}><RefreshCw size={14} /> Actualizar</button>
      </div>

      {loading && !m ? (
        <p className={styles.vacio}>Cargando métricas...</p>
      ) : m ? (
        <>
          <div className={styles.cards}>
            <div className={`${styles.card} ${styles.cardVerde}`}>
              <span className={styles.cardLabel}><TrendingUp size={13} /> Ingresos del día</span>
              <span className={styles.cardValue}>{RD.format(m.ingresos_dia)}</span>
            </div>
            <div className={`${styles.card} ${styles.cardAzul}`}>
              <span className={styles.cardLabel}><Wallet size={13} /> Cobros en caja (efectivo)</span>
              <span className={styles.cardValue}>{RD.format(m.cobros_caja)}</span>
            </div>
            <div className={`${styles.card} ${styles.cardAmbar}`}>
              <span className={styles.cardLabel}><Users size={13} /> CxC Pacientes</span>
              <span className={styles.cardValue}>{RD.format(m.cxc_pacientes)}</span>
            </div>
            <div className={`${styles.card} ${styles.cardRojo}`}>
              <span className={styles.cardLabel}><Landmark size={13} /> CxC ARS</span>
              <span className={styles.cardValue}>{RD.format(m.cxc_ars)}</span>
            </div>
          </div>

          <div className={styles.cards}>
            <div className={styles.card}>
              <span className={styles.cardLabel}><Receipt size={13} /> Facturación hoy</span>
              <span className={styles.cardValue}>{RD.format(m.facturacion.dia)}</span>
              <span className={styles.cardSub}>{m.facturacion.cantidad_dia} facturas</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}><Receipt size={13} /> Facturación semana</span>
              <span className={styles.cardValue}>{RD.format(m.facturacion.semana)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}><Receipt size={13} /> Facturación mes</span>
              <span className={styles.cardValue}>{RD.format(m.facturacion.mes)}</span>
              <span className={styles.cardSub}>{m.facturacion.cantidad_mes} facturas</span>
            </div>
            <div className={`${styles.card} ${styles.cardMorado}`}>
              <span className={styles.cardLabel}>Consultas hoy: Privadas vs ARS</span>
              <span className={styles.cardValue}>
                {m.citas_hoy.privadas} / {m.citas_hoy.aseguradas}
              </span>
              <span className={styles.cardSub}>{m.citas_hoy.total} citas en total</span>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cobros pendientes por aseguradora</th>
                  <th>Facturas</th>
                  <th>Monto pendiente</th>
                </tr>
              </thead>
              <tbody>
                {m.por_aseguradora.length === 0 ? (
                  <tr><td colSpan={3} className={styles.vacio}>No hay cobros pendientes con las ARS</td></tr>
                ) : (
                  m.por_aseguradora.map((a) => (
                    <tr key={a.aseguradora}>
                      <td><strong>{a.aseguradora}</strong></td>
                      <td>{a.facturas}</td>
                      <td className={styles.montoRojo}>{RD.format(a.pendiente)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className={styles.vacio}>No se pudieron cargar las métricas.</p>
      )}
    </div>
  );
}
