"use client";

// ============================================================
// MÓDULO CITAS — flujo clínico completo
// Vistas: Hoy | Pendientes | En Espera | En Consulta |
//         Finalizadas | Canceladas | No Asistió
// Cada cita: Hora, Paciente, Médico, Tipo (Privado/ARS),
// Estado, Monto estimado y Validación del seguro.
// Acciones: recibir → consultar → finalizar → FACTURAR
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarClock, Plus, ShieldCheck, X, Receipt, RefreshCw,
} from "lucide-react";
import { ESTADOS_CITA_ETIQUETAS } from "@/types";
import styles from "../his.module.css";

const RD = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });

interface CitaRow {
  id: string;
  paciente_id: string;
  medico_id: string;
  especialidad: string;
  fecha_cita: string;
  tipo_paciente?: string;
  monto_estimado?: number;
  seguro_validado?: string;
  motivo_cita?: string;
  estado: string;
  pacientes?: { id: string; nombre_completo: string; cedula: string };
  usuarios_clinica?: { id: string; nombre_completo: string };
}

interface UltimaValidacion {
  copago: number;
  monto_autorizado: number;
  numero_autorizacion?: string;
  aseguradora_id?: string;
  aseguradora?: { id: string; nombre: string };
}

const VISTAS = [
  { key: "hoy", label: "Hoy" },
  { key: "programada", label: "Pendientes" },
  { key: "en_espera", label: "En Espera" },
  { key: "en_consulta", label: "En Consulta" },
  { key: "finalizada", label: "Finalizadas" },
  { key: "cancelada", label: "Canceladas" },
  { key: "no_asistio", label: "No Asistió" },
];

export default function CitasPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [citas, setCitas] = useState<CitaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("hoy");
  const [validando, setValidando] = useState<string | null>(null);

  // Modal de facturación
  const [citaFacturar, setCitaFacturar] = useState<CitaRow | null>(null);
  const [validacionFactura, setValidacionFactura] = useState<UltimaValidacion | null>(null);
  const [factForm, setFactForm] = useState({ total: "", monto_ars: "", metodo: "efectivo", descripcion: "" });
  const [facturando, setFacturando] = useState(false);

  const cargarCitas = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/citas", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCitas((await res.json()).data || []);
    } catch (e) {
      console.error("Error cargando citas:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    cargarCitas();
  }, [isAuthenticated, authLoading, router, cargarCitas]);

  const hoyStr = new Date().toISOString().slice(0, 10);
  const esFinalizada = (e: string) => e === "finalizada" || e === "completada";

  const citasVista = citas.filter((c) => {
    if (vista === "hoy") return c.fecha_cita?.slice(0, 10) === hoyStr && !["cancelada", "no_asistio"].includes(c.estado);
    if (vista === "finalizada") return esFinalizada(c.estado);
    return c.estado === vista;
  });

  const contar = (key: string) =>
    citas.filter((c) => {
      if (key === "hoy") return c.fecha_cita?.slice(0, 10) === hoyStr && !["cancelada", "no_asistio"].includes(c.estado);
      if (key === "finalizada") return esFinalizada(c.estado);
      return c.estado === key;
    }).length;

  const cambiarEstado = async (cita: CitaRow, estado: string) => {
    const res = await fetch(`/api/citas/${cita.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado, ...(esFinalizada(estado) ? { visto_paciente: true } : {}) }),
    });
    if (res.ok) cargarCitas();
    else alert("Error al actualizar la cita");
  };

  const validarSeguro = async (cita: CitaRow) => {
    setValidando(cita.id);
    try {
      const res = await fetch("/api/ars/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paciente_id: cita.paciente_id,
          cita_id: cita.id,
          tipo_servicio: "consulta",
          monto_servicio: Number(cita.monto_estimado || 0),
        }),
      });
      const d = await res.json();
      if (res.ok) {
        alert(
          `Cobertura: ${d.data.estado.toUpperCase()}\n` +
          `ARS: ${d.aseguradora?.nombre}\n` +
          `Monto autorizado: ${RD.format(Number(d.data.monto_autorizado))}\n` +
          `Copago: ${RD.format(Number(d.data.copago))}\n` +
          (d.mensaje ? `\n${d.mensaje}` : "")
        );
        cargarCitas();
      } else {
        alert(`Error: ${d.error}`);
      }
    } finally {
      setValidando(null);
    }
  };

  const abrirFacturar = async (cita: CitaRow) => {
    setCitaFacturar(cita);
    setValidacionFactura(null);
    const montoBase = Number(cita.monto_estimado || 0);
    let arsMonto = 0;
    if (cita.tipo_paciente === "asegurado") {
      try {
        const res = await fetch(`/api/ars/validar?cita_id=${cita.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const v = (await res.json()).data;
          if (v) {
            setValidacionFactura(v);
            arsMonto = Number(v.monto_autorizado || 0);
          }
        }
      } catch {}
    }
    setFactForm({
      total: montoBase ? String(montoBase) : "",
      monto_ars: arsMonto ? String(arsMonto) : "",
      metodo: "efectivo",
      descripcion: `Consulta ${cita.especialidad || ""} — ${cita.pacientes?.nombre_completo || ""}`.trim(),
    });
  };

  const emitirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaFacturar) return;
    const total = Number(factForm.total || 0);
    const montoArs = Math.min(Number(factForm.monto_ars || 0), total);
    if (total <= 0) return alert("El total debe ser mayor que 0");

    setFacturando(true);
    try {
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cita_id: citaFacturar.id,
          paciente_id: citaFacturar.paciente_id,
          medico_id: citaFacturar.medico_id,
          especialidad: citaFacturar.especialidad,
          aseguradora_id: validacionFactura?.aseguradora_id || validacionFactura?.aseguradora?.id || null,
          descripcion: factForm.descripcion || "Consulta médica",
          total,
          monto_ars: montoArs,
          metodo_pago_paciente: factForm.metodo,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        alert(`${d.message}\nPaciente: ${RD.format(total - montoArs)} · ARS: ${RD.format(montoArs)}`);
        setCitaFacturar(null);
        cargarCitas();
      } else {
        alert(`Error: ${d.error}`);
      }
    } finally {
      setFacturando(false);
    }
  };

  const badgeSeguro = (c: CitaRow) => {
    if (c.tipo_paciente !== "asegurado") return <span className={`${styles.badge} ${styles.badgeGris}`}>Privado</span>;
    const v = c.seguro_validado || "pendiente";
    const map: Record<string, string> = {
      validado: styles.badgeVerde,
      pendiente: styles.badgeAmbar,
      rechazado: styles.badgeRojo,
      no_aplica: styles.badgeGris,
    };
    return <span className={`${styles.badge} ${map[v] || styles.badgeGris}`}>Seguro: {v.replace("_", " ")}</span>;
  };

  if (authLoading || !usuario) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <CalendarClock size={24} color="#0284c7" /> CITAS
          </h1>
          <p className={styles.subtitle}>
            Flujo: Pendiente → En Espera → En Consulta → Finalizada → Facturar
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={cargarCitas}>
            <RefreshCw size={14} /> Actualizar
          </button>
          <button className={styles.btnPrimary} onClick={() => router.push("/dashboard/crear-cita")}>
            <Plus size={16} /> Agregar Consulta
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {VISTAS.map((v) => (
          <button
            key={v.key}
            className={`${styles.tab} ${vista === v.key ? styles.tabActive : ""}`}
            onClick={() => setVista(v.key)}
          >
            {v.label} <span className={styles.tabCount}>{contar(v.key)}</span>
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.vacio}>Cargando citas...</p>
        ) : citasVista.length === 0 ? (
          <p className={styles.vacio}>No hay citas en esta vista.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Tipo</th>
                <th>Monto Est.</th>
                <th>Seguro</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citasVista.map((c) => {
                const est = ESTADOS_CITA_ETIQUETAS[c.estado] || { label: c.estado, color: "#64748b" };
                const fecha = new Date(c.fecha_cita);
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{fecha.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}</strong>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{fecha.toLocaleDateString("es-DO")}</div>
                    </td>
                    <td>
                      {c.pacientes?.nombre_completo || "—"}
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.pacientes?.cedula}</div>
                    </td>
                    <td>{c.usuarios_clinica?.nombre_completo || "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${c.tipo_paciente === "asegurado" ? styles.badgeAzul : styles.badgeGris}`}>
                        {c.tipo_paciente === "asegurado" ? "ARS" : "Privado"}
                      </span>
                    </td>
                    <td className={styles.monto}>{RD.format(Number(c.monto_estimado || 0))}</td>
                    <td>{badgeSeguro(c)}</td>
                    <td>
                      <span className={styles.badge} style={{ background: `${est.color}22`, color: est.color }}>
                        {est.label}
                      </span>
                    </td>
                    <td className={styles.acciones}>
                      {c.estado === "programada" && (
                        <>
                          <button className={`${styles.btnMini} ${styles.btnMiniAzul}`} onClick={() => cambiarEstado(c, "en_espera")}>
                            Recibir
                          </button>
                          <button className={`${styles.btnMini} ${styles.btnMiniRojo}`} onClick={() => cambiarEstado(c, "cancelada")}>
                            Cancelar
                          </button>
                          <button className={styles.btnMini} onClick={() => cambiarEstado(c, "no_asistio")}>
                            No asistió
                          </button>
                        </>
                      )}
                      {c.estado === "en_espera" && (
                        <button className={`${styles.btnMini} ${styles.btnMiniMorado}`} onClick={() => cambiarEstado(c, "en_consulta")}>
                          Pasar a consulta
                        </button>
                      )}
                      {c.estado === "en_consulta" && (
                        <button className={`${styles.btnMini} ${styles.btnMiniVerde}`} onClick={() => cambiarEstado(c, "finalizada")}>
                          Finalizar
                        </button>
                      )}
                      {c.tipo_paciente === "asegurado" && !["cancelada", "no_asistio"].includes(c.estado) && !esFinalizada(c.estado) && (
                        <button
                          className={`${styles.btnMini} ${styles.btnMiniAzul}`}
                          onClick={() => validarSeguro(c)}
                          disabled={validando === c.id}
                        >
                          <ShieldCheck size={12} /> {validando === c.id ? "Validando..." : "Validar seguro"}
                        </button>
                      )}
                      {(esFinalizada(c.estado) || c.estado === "en_consulta") && (
                        <button className={`${styles.btnMini} ${styles.btnMiniVerde}`} onClick={() => abrirFacturar(c)}>
                          <Receipt size={12} /> Facturar
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

      {/* ===== Modal Facturar ===== */}
      {citaFacturar && (
        <div className={styles.modalOverlay} onClick={() => setCitaFacturar(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                <Receipt size={17} /> Facturar consulta — {citaFacturar.pacientes?.nombre_completo}
              </span>
              <button className={styles.iconBtn} onClick={() => setCitaFacturar(null)}><X size={18} /></button>
            </div>
            <form onSubmit={emitirFactura}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Descripción *</label>
                  <input className={styles.input} type="text" value={factForm.descripcion}
                    onChange={(e) => setFactForm({ ...factForm, descripcion: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Total (RD$) *</label>
                  <input className={styles.input} type="number" min="0" step="0.01" value={factForm.total}
                    onChange={(e) => setFactForm({ ...factForm, total: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cubre la ARS (RD$)</label>
                  <input className={styles.input} type="number" min="0" step="0.01" value={factForm.monto_ars}
                    onChange={(e) => setFactForm({ ...factForm, monto_ars: e.target.value })}
                    disabled={citaFacturar.tipo_paciente !== "asegurado"} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Método de pago del paciente</label>
                  <select className={styles.select} value={factForm.metodo}
                    onChange={(e) => setFactForm({ ...factForm, metodo: e.target.value })}>
                    <option value="efectivo">Efectivo (Caja)</option>
                    <option value="tarjeta">Tarjeta (Banco)</option>
                    <option value="transferencia">Transferencia (Banco)</option>
                    <option value="cheque">Cheque (Banco)</option>
                  </select>
                </div>
              </div>

              <div className={styles.desglose} style={{ marginTop: 16 }}>
                <div className={styles.desgloseFila}>
                  <span>Copago / paga el paciente ahora:</span>
                  <strong>{RD.format(Math.max(0, Number(factForm.total || 0) - Number(factForm.monto_ars || 0)))}</strong>
                </div>
                <div className={styles.desgloseFila}>
                  <span>Por cobrar a la ARS{validacionFactura?.aseguradora?.nombre ? ` (${validacionFactura.aseguradora.nombre})` : ""}:</span>
                  <strong>{RD.format(Number(factForm.monto_ars || 0))}</strong>
                </div>
                <div className={styles.desgloseTotal}>
                  <span>Total factura:</span>
                  <span>{RD.format(Number(factForm.total || 0))}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>
                  Al emitir: asientos contables automáticos (Caja/Banco + CxC-ARS contra Ingresos),
                  movimiento en contabilidad y reclamación a la ARS.
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setCitaFacturar(null)}>Cancelar</button>
                <button type="submit" className={styles.btnVerde} disabled={facturando}>
                  {facturando ? "Emitiendo..." : "Emitir factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
