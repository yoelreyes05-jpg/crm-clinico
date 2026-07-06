"use client";

// ============================================================
// PESTAÑA DE CONTABILIDAD
// Médico: control del dinero de su especialidad (ingresos,
// copagos, gastos) y lo que le deben las aseguradoras (ARS).
// Admin: vista consolidada con filtro por médico.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Wallet, Plus, TrendingUp, TrendingDown, Landmark, X, Trash2, CheckCircle,
} from "lucide-react";
import {
  MovimientoFinanciero, ReclamacionARS, ResumenFinanciero, Aseguradora,
  TIPOS_MOVIMIENTO_ETIQUETAS, TipoMovimiento, ESPECIALIDADES_ETIQUETAS,
} from "@/types";
import styles from "./contabilidad.module.css";

const RD = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });

interface MedicoOption { id: string; nombre_completo: string; especialidad?: string; }

export default function ContabilidadPage() {
  const { usuario, token, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"movimientos" | "reclamaciones">("movimientos");
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);
  const [reclamaciones, setReclamaciones] = useState<ReclamacionARS[]>([]);
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [medicos, setMedicos] = useState<MedicoOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const hoy = new Date();
  const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  const [desde, setDesde] = useState(inicioMes);
  const [hasta, setHasta] = useState(hoy.toISOString().slice(0, 10));
  const [filtroMedico, setFiltroMedico] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "consulta",
    concepto: "",
    monto: "",
    metodo_pago: "efectivo",
    fuente: "paciente",
    fecha_movimiento: hoy.toISOString().slice(0, 10),
    estado: "cobrado",
    aseguradora_id: "",
    comprobante: "",
    notas: "",
  });

  const esAdmin = usuario?.rol === "admin";

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ desde, hasta });
      if (esAdmin && filtroMedico) params.set("medico_id", filtroMedico);

      const paramsRec = new URLSearchParams();
      if (esAdmin && filtroMedico) paramsRec.set("medico_id", filtroMedico);

      const headers = { Authorization: `Bearer ${token}` };
      const [resMov, resRec, resAse] = await Promise.all([
        fetch(`/api/contabilidad?${params}`, { headers }),
        fetch(`/api/reclamaciones?${paramsRec}`, { headers }),
        fetch(`/api/aseguradoras`, { headers }),
      ]);

      if (resMov.ok) {
        const d = await resMov.json();
        setMovimientos(d.data || []);
        setResumen(d.resumen || null);
      }
      if (resRec.ok) setReclamaciones((await resRec.json()).data || []);
      if (resAse.ok) setAseguradoras((await resAse.json()).data || []);
    } catch (e) {
      console.error("Error cargando contabilidad:", e);
    } finally {
      setLoading(false);
    }
  }, [token, desde, hasta, filtroMedico, esAdmin]);

  useEffect(() => {
    if (authLoading || !token) return;
    cargarDatos();
  }, [authLoading, token, cargarDatos]);

  // Admin: lista de médicos para el filtro
  useEffect(() => {
    if (!esAdmin || !token) return;
    fetch("/api/medicos", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setMedicos(d.data || []))
      .catch(() => {});
  }, [esAdmin, token]);

  const guardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contabilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          monto: Number(formData.monto),
          aseguradora_id: formData.aseguradora_id || null,
          medico_id: esAdmin && filtroMedico ? filtroMedico : undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ ...formData, concepto: "", monto: "", comprobante: "", notas: "" });
        cargarDatos();
      } else {
        alert(`Error: ${(await res.json()).error}`);
      }
    } catch {
      alert("Error al guardar el movimiento");
    }
  };

  const anularMovimiento = async (id: string) => {
    if (!confirm("¿Anular este movimiento?")) return;
    const res = await fetch(`/api/contabilidad/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) cargarDatos();
  };

  const marcarReclamacionPagada = async (rec: ReclamacionARS) => {
    const montoStr = prompt("Monto pagado por la ARS:", String(rec.monto_reclamado));
    if (montoStr === null) return;
    const monto = Number(montoStr);
    if (isNaN(monto) || monto < 0) return alert("Monto inválido");
    const res = await fetch(`/api/reclamaciones/${rec.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        estado: monto >= rec.monto_reclamado ? "pagada" : "parcial",
        monto_pagado: monto,
      }),
    });
    if (res.ok) {
      alert("Pago registrado. Se creó el ingreso en tu contabilidad automáticamente.");
      cargarDatos();
    }
  };

  const especialidadLabel = usuario?.especialidad
    ? ESPECIALIDADES_ETIQUETAS[usuario.especialidad]?.label || usuario.especialidad
    : "";

  const badgeReclamacion = (estado: string) => {
    if (estado === "pagada") return styles.badgeVerde;
    if (estado === "parcial" || estado === "enviada") return styles.badgeAmbar;
    if (estado === "rechazada" || estado === "glosada") return styles.badgeRojo;
    return styles.badgeGris;
  };

  if (authLoading || !usuario) return null;

  return (
    <div className={styles.page}>
      {/* ===== Header ===== */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Wallet size={24} color="#0284c7" />
            Contabilidad {especialidadLabel && `· ${especialidadLabel}`}
          </h1>
          <p className={styles.subtitle}>
            {esAdmin
              ? "Vista consolidada de todos los médicos"
              : "Control de tu dinero y de lo que te deben las aseguradoras"}
          </p>
        </div>
        <div className={styles.filters}>
          {esAdmin && (
            <select className={styles.select} value={filtroMedico} onChange={(e) => setFiltroMedico(e.target.value)}>
              <option value="">Todos los médicos</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre_completo}</option>
              ))}
            </select>
          )}
          <input type="date" className={styles.input} value={desde} onChange={(e) => setDesde(e.target.value)} />
          <input type="date" className={styles.input} value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
            <Plus size={16} /> Registrar movimiento
          </button>
        </div>
      </div>

      {/* ===== Tarjetas de resumen ===== */}
      {resumen && (
        <div className={styles.cards}>
          <div className={`${styles.card} ${styles.cardVerde}`}>
            <span className={styles.cardLabel}><TrendingUp size={14} /> Ingresos del período</span>
            <span className={styles.cardValue}>{RD.format(resumen.total_ingresos)}</span>
          </div>
          <div className={`${styles.card} ${styles.cardRojo}`}>
            <span className={styles.cardLabel}><TrendingDown size={14} /> Gastos</span>
            <span className={styles.cardValue}>{RD.format(resumen.total_gastos)}</span>
          </div>
          <div className={`${styles.card} ${styles.cardAzul}`}>
            <span className={styles.cardLabel}><Wallet size={14} /> Balance</span>
            <span className={styles.cardValue}>{RD.format(resumen.balance)}</span>
          </div>
          <div className={`${styles.card} ${styles.cardAmbar}`}>
            <span className={styles.cardLabel}><Landmark size={14} /> Por cobrar a ARS</span>
            <span className={styles.cardValue}>{RD.format(resumen.pendiente_cobrar_ars)}</span>
          </div>
        </div>
      )}

      {/* ===== Tabs ===== */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "movimientos" ? styles.tabActive : ""}`}
          onClick={() => setTab("movimientos")}
        >
          Movimientos
        </button>
        <button
          className={`${styles.tab} ${tab === "reclamaciones" ? styles.tabActive : ""}`}
          onClick={() => setTab("reclamaciones")}
        >
          Por cobrar ARS ({reclamaciones.filter((r) => r.estado !== "pagada" && r.estado !== "rechazada").length})
        </button>
      </div>

      {/* ===== Tabla de movimientos ===== */}
      {tab === "movimientos" && (
        <div className={styles.tableWrap}>
          {loading ? (
            <p className={styles.vacio}>Cargando...</p>
          ) : movimientos.length === 0 ? (
            <p className={styles.vacio}>No hay movimientos en este período. Registra tu primer movimiento.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Concepto</th>
                  <th>Paciente</th>
                  <th>Fuente</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => {
                  const info = TIPOS_MOVIMIENTO_ETIQUETAS[m.tipo as TipoMovimiento];
                  const esGasto = m.tipo === "gasto";
                  return (
                    <tr key={m.id}>
                      <td>{m.fecha_movimiento}</td>
                      <td><span className={`${styles.badge} ${esGasto ? styles.badgeRojo : styles.badgeAzul}`}>{info?.label || m.tipo}</span></td>
                      <td>{m.concepto}</td>
                      <td>{m.paciente?.nombre_completo || "—"}</td>
                      <td>{m.fuente === "aseguradora" ? (m.aseguradora?.nombre || "ARS") : "Paciente"}</td>
                      <td>{m.metodo_pago}</td>
                      <td>
                        <span className={`${styles.badge} ${m.estado === "cobrado" ? styles.badgeVerde : styles.badgeAmbar}`}>
                          {m.estado}
                        </span>
                      </td>
                      <td className={esGasto ? styles.montoGasto : styles.montoIngreso}>
                        {esGasto ? "−" : "+"}{RD.format(Number(m.monto))}
                      </td>
                      <td className={styles.acciones}>
                        <button className={styles.iconBtn} title="Anular" onClick={() => anularMovimiento(m.id)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== Tabla de reclamaciones (lo que debe la ARS) ===== */}
      {tab === "reclamaciones" && (
        <div className={styles.tableWrap}>
          {reclamaciones.length === 0 ? (
            <p className={styles.vacio}>
              No hay reclamaciones registradas. Las reclamaciones se crean desde el módulo de Seguros.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ARS</th>
                  <th>Descripción</th>
                  <th>Paciente</th>
                  <th>Fecha servicio</th>
                  <th>Reclamado</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reclamaciones.map((r) => {
                  const pendiente = Math.max(0, Number(r.monto_reclamado) - Number(r.monto_pagado || 0) - Number(r.monto_glosado || 0));
                  return (
                    <tr key={r.id}>
                      <td>{r.aseguradora?.nombre || "—"}</td>
                      <td>{r.descripcion}</td>
                      <td>{r.paciente?.nombre_completo || "—"}</td>
                      <td>{r.fecha_servicio || "—"}</td>
                      <td className={styles.montoIngreso}>{RD.format(Number(r.monto_reclamado))}</td>
                      <td>{RD.format(Number(r.monto_pagado || 0))}</td>
                      <td className={pendiente > 0 ? styles.montoGasto : undefined}>{RD.format(pendiente)}</td>
                      <td><span className={`${styles.badge} ${badgeReclamacion(r.estado)}`}>{r.estado}</span></td>
                      <td className={styles.acciones}>
                        {r.estado !== "pagada" && r.estado !== "rechazada" && (
                          <button className={styles.iconBtn} title="Registrar pago de la ARS" onClick={() => marcarReclamacionPagada(r)}>
                            <CheckCircle size={16} />
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
      )}

      {/* ===== Modal registrar movimiento ===== */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Registrar movimiento</span>
              <button className={styles.iconBtn} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={guardarMovimiento}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo *</label>
                  <select
                    className={styles.select}
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value, fuente: e.target.value === "pago_ars" ? "aseguradora" : formData.fuente })}
                    required
                  >
                    {Object.entries(TIPOS_MOVIMIENTO_ETIQUETAS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Monto (RD$) *</label>
                  <input
                    type="number" min="0" step="0.01" className={styles.input}
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    required
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Concepto *</label>
                  <input
                    type="text" className={styles.input} placeholder="Ej: Consulta control prenatal"
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fecha</label>
                  <input
                    type="date" className={styles.input}
                    value={formData.fecha_movimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_movimiento: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Método de pago</label>
                  <select className={styles.select} value={formData.metodo_pago} onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="seguro">Seguro</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fuente</label>
                  <select className={styles.select} value={formData.fuente} onChange={(e) => setFormData({ ...formData, fuente: e.target.value })}>
                    <option value="paciente">Paciente</option>
                    <option value="aseguradora">Aseguradora (ARS)</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                {formData.fuente === "aseguradora" && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Aseguradora</label>
                    <select className={styles.select} value={formData.aseguradora_id} onChange={(e) => setFormData({ ...formData, aseguradora_id: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {aseguradoras.map((a) => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Estado</label>
                  <select className={styles.select} value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}>
                    <option value="cobrado">Cobrado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Comprobante / NCF</label>
                  <input type="text" className={styles.input} value={formData.comprobante} onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })} />
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Notas</label>
                  <input type="text" className={styles.input} value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
