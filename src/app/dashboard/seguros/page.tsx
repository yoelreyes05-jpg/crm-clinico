"use client";

// ============================================================
// MÓDULO DE SEGUROS Y AUTORIZACIONES (ARS)
// Flujo RD: indicación médica → solicitud a la ARS →
// No. de autorización → aprobada/rechazada → servicio →
// reclamación a la ARS (pasa a "Por cobrar" en Contabilidad).
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck, Plus, X, CheckCircle, XCircle, ExternalLink, FileText, Landmark,
} from "lucide-react";
import {
  AutorizacionSeguro, Aseguradora, SeguroPaciente, TIPOS_SERVICIO_AUTORIZACION,
} from "@/types";
import styles from "./seguros.module.css";

const RD = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });

interface PacienteOption { id: string; nombre_completo: string; cedula: string; }

export default function SegurosPage() {
  const { usuario, token, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"autorizaciones" | "seguros" | "aseguradoras">("autorizaciones");
  const [autorizaciones, setAutorizaciones] = useState<AutorizacionSeguro[]>([]);
  const [segurosPacientes, setSegurosPacientes] = useState<SeguroPaciente[]>([]);
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormAut, setShowFormAut] = useState(false);
  const [showFormSeg, setShowFormSeg] = useState(false);

  const hoyStr = new Date().toISOString().slice(0, 10);

  const [formAut, setFormAut] = useState({
    paciente_id: "",
    aseguradora_id: "",
    tipo_servicio: "consulta",
    descripcion_servicio: "",
    diagnostico_cie10: "",
    numero_autorizacion: "",
    via_solicitud: "portal",
    fecha_solicitud: hoyStr,
    monto_solicitado: "",
    copago_paciente: "",
    notas: "",
  });

  const [formSeg, setFormSeg] = useState({
    paciente_id: "",
    aseguradora_id: "",
    numero_afiliado: "",
    plan: "",
    regimen: "contributivo",
    titular: true,
    nombre_titular: "",
    notas: "",
  });

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resAut, resSeg, resAse, resPac] = await Promise.all([
        fetch("/api/autorizaciones", { headers }),
        fetch("/api/seguros-pacientes", { headers }),
        fetch("/api/aseguradoras", { headers }),
        fetch("/api/pacientes", { headers }),
      ]);
      if (resAut.ok) setAutorizaciones((await resAut.json()).data || []);
      if (resSeg.ok) setSegurosPacientes((await resSeg.json()).data || []);
      if (resAse.ok) setAseguradoras((await resAse.json()).data || []);
      if (resPac.ok) setPacientes((await resPac.json()).data || []);
    } catch (e) {
      console.error("Error cargando seguros:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading || !token) return;
    cargarDatos();
  }, [authLoading, token, cargarDatos]);

  // ===== Acciones sobre autorizaciones =====
  const guardarAutorizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/autorizaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...formAut,
        monto_solicitado: Number(formAut.monto_solicitado || 0),
        copago_paciente: Number(formAut.copago_paciente || 0),
        estado: formAut.numero_autorizacion ? "aprobada" : "pendiente",
      }),
    });
    if (res.ok) {
      setShowFormAut(false);
      setFormAut({ ...formAut, descripcion_servicio: "", numero_autorizacion: "", monto_solicitado: "", copago_paciente: "", notas: "" });
      cargarDatos();
    } else {
      alert(`Error: ${(await res.json()).error}`);
    }
  };

  const aprobarAutorizacion = async (aut: AutorizacionSeguro) => {
    const numero = prompt("Número de autorización emitido por la ARS:", aut.numero_autorizacion || "");
    if (numero === null) return;
    const montoStr = prompt("Monto autorizado (RD$):", String(aut.monto_solicitado || 0));
    if (montoStr === null) return;
    const res = await fetch(`/api/autorizaciones/${aut.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        estado: "aprobada",
        numero_autorizacion: numero,
        monto_autorizado: Number(montoStr) || 0,
      }),
    });
    if (res.ok) cargarDatos();
  };

  const rechazarAutorizacion = async (aut: AutorizacionSeguro) => {
    const motivo = prompt("Motivo del rechazo:");
    if (motivo === null) return;
    const res = await fetch(`/api/autorizaciones/${aut.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: "rechazada", motivo_rechazo: motivo }),
    });
    if (res.ok) cargarDatos();
  };

  const crearReclamacion = async (aut: AutorizacionSeguro) => {
    const montoStr = prompt(
      "Monto a reclamar a la ARS (RD$):",
      String(aut.monto_autorizado || aut.monto_solicitado || 0)
    );
    if (montoStr === null) return;
    const res = await fetch("/api/reclamaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        aseguradora_id: aut.aseguradora_id,
        paciente_id: aut.paciente_id,
        autorizacion_id: aut.id,
        descripcion: `${aut.tipo_servicio}: ${aut.descripcion_servicio}`.slice(0, 250),
        fecha_servicio: hoyStr,
        monto_reclamado: Number(montoStr) || 0,
        estado: "enviada",
        fecha_envio: hoyStr,
      }),
    });
    if (res.ok) {
      await fetch(`/api/autorizaciones/${aut.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: "utilizada" }),
      });
      alert("Reclamación creada. La verás en Contabilidad → Por cobrar ARS.");
      cargarDatos();
    }
  };

  const guardarSeguroPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/seguros-pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formSeg),
    });
    if (res.ok) {
      setShowFormSeg(false);
      setFormSeg({ ...formSeg, numero_afiliado: "", plan: "", nombre_titular: "", notas: "" });
      cargarDatos();
    } else {
      alert(`Error: ${(await res.json()).error}`);
    }
  };

  const badgeEstado = (estado: string) => {
    if (estado === "aprobada" || estado === "utilizada") return styles.badgeVerde;
    if (estado === "pendiente") return styles.badgeAmbar;
    if (estado === "rechazada" || estado === "vencida") return styles.badgeRojo;
    return styles.badgeGris;
  };

  const pendientes = autorizaciones.filter((a) => a.estado === "pendiente").length;
  const aprobadas = autorizaciones.filter((a) => a.estado === "aprobada").length;

  if (authLoading || !usuario) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <ShieldCheck size={24} color="#0284c7" />
            Seguros y Autorizaciones
          </h1>
          <p className={styles.subtitle}>
            Gestiona las autorizaciones de las ARS y los seguros de tus pacientes
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className={styles.btnGhost} onClick={() => setShowFormSeg(true)}>
            <Plus size={14} /> Seguro de paciente
          </button>
          <button className={styles.btnPrimary} onClick={() => setShowFormAut(true)}>
            <Plus size={16} /> Nueva autorización
          </button>
        </div>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Pendientes</span>
          <span className={styles.cardValue}>{pendientes}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Aprobadas (sin usar)</span>
          <span className={styles.cardValue}>{aprobadas}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total registradas</span>
          <span className={styles.cardValue}>{autorizaciones.length}</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "autorizaciones" ? styles.tabActive : ""}`} onClick={() => setTab("autorizaciones")}>
          Autorizaciones
        </button>
        <button className={`${styles.tab} ${tab === "seguros" ? styles.tabActive : ""}`} onClick={() => setTab("seguros")}>
          Seguros de pacientes
        </button>
        <button className={`${styles.tab} ${tab === "aseguradoras" ? styles.tabActive : ""}`} onClick={() => setTab("aseguradoras")}>
          Directorio ARS
        </button>
      </div>

      {/* ===== AUTORIZACIONES ===== */}
      {tab === "autorizaciones" && (
        <div className={styles.tableWrap}>
          {loading ? (
            <p className={styles.vacio}>Cargando...</p>
          ) : autorizaciones.length === 0 ? (
            <p className={styles.vacio}>No hay autorizaciones. Registra la primera solicitud a la ARS.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>ARS</th>
                  <th>Servicio</th>
                  <th>No. Autorización</th>
                  <th>Monto Aut.</th>
                  <th>Copago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {autorizaciones.map((a) => (
                  <tr key={a.id}>
                    <td>{a.fecha_solicitud}</td>
                    <td>{a.paciente?.nombre_completo || "—"}</td>
                    <td>{a.aseguradora?.nombre || "—"}</td>
                    <td>{a.tipo_servicio}: {a.descripcion_servicio}</td>
                    <td>{a.numero_autorizacion || "—"}</td>
                    <td>{RD.format(Number(a.monto_autorizado || 0))}</td>
                    <td>{RD.format(Number(a.copago_paciente || 0))}</td>
                    <td><span className={`${styles.badge} ${badgeEstado(a.estado)}`}>{a.estado}</span></td>
                    <td className={styles.acciones}>
                      {a.estado === "pendiente" && (
                        <>
                          <button className={`${styles.iconBtn} ${styles.iconBtnVerde}`} title="Marcar aprobada" onClick={() => aprobarAutorizacion(a)}>
                            <CheckCircle size={16} />
                          </button>
                          <button className={`${styles.iconBtn} ${styles.iconBtnRojo}`} title="Marcar rechazada" onClick={() => rechazarAutorizacion(a)}>
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {a.estado === "aprobada" && (
                        <button className={styles.iconBtn} title="Crear reclamación a la ARS (cobrar)" onClick={() => crearReclamacion(a)}>
                          <Landmark size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== SEGUROS DE PACIENTES ===== */}
      {tab === "seguros" && (
        <div className={styles.tableWrap}>
          {segurosPacientes.length === 0 ? (
            <p className={styles.vacio}>No hay seguros registrados. Registra la afiliación de un paciente.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>ARS</th>
                  <th>No. Afiliado</th>
                  <th>Plan</th>
                  <th>Régimen</th>
                  <th>Titular</th>
                  <th>Verificado</th>
                </tr>
              </thead>
              <tbody>
                {segurosPacientes.map((s) => (
                  <tr key={s.id}>
                    <td>{s.paciente?.nombre_completo || "—"}</td>
                    <td>{s.aseguradora?.nombre || "—"}</td>
                    <td>{s.numero_afiliado}</td>
                    <td>{s.plan || "—"}</td>
                    <td>{s.regimen || "—"}</td>
                    <td>{s.titular ? "Sí" : `No (${s.nombre_titular || "dependiente"})`}</td>
                    <td>
                      <span className={`${styles.badge} ${s.verificado ? styles.badgeVerde : styles.badgeAmbar}`}>
                        {s.verificado ? "Verificado" : "Sin verificar"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== DIRECTORIO ARS ===== */}
      {tab === "aseguradoras" && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Aseguradora</th>
                <th>Teléfono</th>
                <th>Autorización previa</th>
                <th>Portal / Autorizaciones</th>
              </tr>
            </thead>
            <tbody>
              {aseguradoras.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{a.telefono || "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${a.requiere_autorizacion_previa ? styles.badgeAmbar : styles.badgeGris}`}>
                      {a.requiere_autorizacion_previa ? "Requerida" : "No requerida"}
                    </span>
                  </td>
                  <td>
                    {a.portal_web ? (
                      <a href={a.portal_web} target="_blank" rel="noopener noreferrer" className={styles.linkPortal}>
                        Ir al portal <ExternalLink size={13} />
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Modal nueva autorización ===== */}
      {showFormAut && (
        <div className={styles.modalOverlay} onClick={() => setShowFormAut(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}><FileText size={16} /> Solicitud de autorización</span>
              <button className={styles.iconBtn} onClick={() => setShowFormAut(false)}><X size={18} /></button>
            </div>
            <form onSubmit={guardarAutorizacion}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Paciente *</label>
                  <select className={styles.select} value={formAut.paciente_id} onChange={(e) => setFormAut({ ...formAut, paciente_id: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre_completo} ({p.cedula})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Aseguradora (ARS) *</label>
                  <select className={styles.select} value={formAut.aseguradora_id} onChange={(e) => setFormAut({ ...formAut, aseguradora_id: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {aseguradoras.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de servicio *</label>
                  <select className={styles.select} value={formAut.tipo_servicio} onChange={(e) => setFormAut({ ...formAut, tipo_servicio: e.target.value })} required>
                    {TIPOS_SERVICIO_AUTORIZACION.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Vía de solicitud</label>
                  <select className={styles.select} value={formAut.via_solicitud} onChange={(e) => setFormAut({ ...formAut, via_solicitud: e.target.value })}>
                    <option value="portal">Portal web de la ARS</option>
                    <option value="telefono">Teléfono</option>
                    <option value="presencial">Presencial</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Descripción del servicio *</label>
                  <input type="text" className={styles.input} placeholder="Ej: Sonografía transvaginal" value={formAut.descripcion_servicio} onChange={(e) => setFormAut({ ...formAut, descripcion_servicio: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Diagnóstico (CIE-10)</label>
                  <input type="text" className={styles.input} placeholder="Ej: N92.0" value={formAut.diagnostico_cie10} onChange={(e) => setFormAut({ ...formAut, diagnostico_cie10: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fecha de solicitud</label>
                  <input type="date" className={styles.input} value={formAut.fecha_solicitud} onChange={(e) => setFormAut({ ...formAut, fecha_solicitud: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Monto solicitado (RD$)</label>
                  <input type="number" min="0" step="0.01" className={styles.input} value={formAut.monto_solicitado} onChange={(e) => setFormAut({ ...formAut, monto_solicitado: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Copago del paciente (RD$)</label>
                  <input type="number" min="0" step="0.01" className={styles.input} value={formAut.copago_paciente} onChange={(e) => setFormAut({ ...formAut, copago_paciente: e.target.value })} />
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>No. de autorización (si ya lo tienes, quedará aprobada)</label>
                  <input type="text" className={styles.input} value={formAut.numero_autorizacion} onChange={(e) => setFormAut({ ...formAut, numero_autorizacion: e.target.value })} />
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Notas</label>
                  <input type="text" className={styles.input} value={formAut.notas} onChange={(e) => setFormAut({ ...formAut, notas: e.target.value })} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setShowFormAut(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal seguro de paciente ===== */}
      {showFormSeg && (
        <div className={styles.modalOverlay} onClick={() => setShowFormSeg(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Registrar seguro de paciente</span>
              <button className={styles.iconBtn} onClick={() => setShowFormSeg(false)}><X size={18} /></button>
            </div>
            <form onSubmit={guardarSeguroPaciente}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Paciente *</label>
                  <select className={styles.select} value={formSeg.paciente_id} onChange={(e) => setFormSeg({ ...formSeg, paciente_id: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre_completo} ({p.cedula})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Aseguradora (ARS) *</label>
                  <select className={styles.select} value={formSeg.aseguradora_id} onChange={(e) => setFormSeg({ ...formSeg, aseguradora_id: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {aseguradoras.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>No. de afiliado (NSS) *</label>
                  <input type="text" className={styles.input} value={formSeg.numero_afiliado} onChange={(e) => setFormSeg({ ...formSeg, numero_afiliado: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Plan</label>
                  <input type="text" className={styles.input} placeholder="Básico, Complementario..." value={formSeg.plan} onChange={(e) => setFormSeg({ ...formSeg, plan: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Régimen</label>
                  <select className={styles.select} value={formSeg.regimen} onChange={(e) => setFormSeg({ ...formSeg, regimen: e.target.value })}>
                    <option value="contributivo">Contributivo</option>
                    <option value="subsidiado">Subsidiado</option>
                    <option value="pensionado">Pensionado</option>
                    <option value="privado">Privado</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>¿Es titular?</label>
                  <select className={styles.select} value={formSeg.titular ? "si" : "no"} onChange={(e) => setFormSeg({ ...formSeg, titular: e.target.value === "si" })}>
                    <option value="si">Sí, titular</option>
                    <option value="no">No, dependiente</option>
                  </select>
                </div>
                {!formSeg.titular && (
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.label}>Nombre del titular</label>
                    <input type="text" className={styles.input} value={formSeg.nombre_titular} onChange={(e) => setFormSeg({ ...formSeg, nombre_titular: e.target.value })} />
                  </div>
                )}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Notas</label>
                  <input type="text" className={styles.input} value={formSeg.notas} onChange={(e) => setFormSeg({ ...formSeg, notas: e.target.value })} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setShowFormSeg(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
