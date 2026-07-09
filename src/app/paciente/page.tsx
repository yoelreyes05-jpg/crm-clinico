"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, RefreshCw, Download, Phone, Mail, MapPin, Calendar, Heart, FileText } from "lucide-react";
import styles from "./paciente.module.css";

// ============================================================
// TIPOS
// ============================================================
interface PacienteData {
  id: string;
  cedula: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  tipo_sangre?: string;
  alergias?: string;
  antecedentes_medicos?: string;
  estado: boolean;
}

interface Cita {
  id: string;
  especialidad: string;
  fecha_cita: string;
  duracion_minutos: number;
  motivo_cita?: string;
  estado: string;
  notas?: string;
  usuarios_clinica?: { nombre_completo: string; especialidad: string } | null;
}

interface Historial {
  id: string;
  especialidad: string;
  created_at: string;
  motivo_consulta?: string;
  diagnostico_principal: string;
  diagnosticos_secundarios?: string;
  plan_tratamiento?: string;
  medicamentos?: string;
  recomendaciones?: string;
  estudios_solicitados?: string;
  // Signos vitales
  peso?: number;
  altura?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  frecuencia_respiratoria?: number;
  temperatura?: number;
  saturacion_oxigeno?: number;
  // Exploración
  examen_fisico_general?: string;
  sintomas_principales?: string;
  antecedentes_enfermedad_actual?: string;
  usuarios_clinica?: { nombre_completo: string; especialidad: string } | null;
}

interface FichaGine {
  id: string;
  created_at: string;
  motivo_consulta?: string;
  diagnostico_principal: string;
  plan_tratamiento?: string;
  medicamentos?: string;
  recomendaciones?: string;
  peso?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  usuarios_clinica?: { nombre_completo: string; especialidad: string } | null;
  historiales_ginecologia?: Array<{
    id?: string;
    fum?: string;
    fpp?: string;
    vdrl?: string;
    hb?: string;
    ta_inicial?: string;
    antitetanicas?: string;
    embarazo?: boolean;
    tbc_pulmonar?: boolean;
    hipertension?: boolean;
    gemelares?: boolean;
    diabetes?: boolean;
    hipertension_cronica?: boolean;
    cirugia_pelvico_uterina?: boolean;
    infertilidad?: boolean;
    antecedentes_familiares?: string;
    dudas?: string;
    controles_prenatales?: any[];
  }>;
}

interface PortalData {
  paciente: PacienteData;
  citas: Cita[];
  historiales: Historial[];
  fichas_ginecologicas: FichaGine[];
}

// ============================================================
// HELPERS
// ============================================================
const calcEdad = (fecha: string) => {
  const hoy = new Date();
  const nac = new Date(fecha);
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
  return e;
};

const initials = (nombre: string) =>
  nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

const fmtFecha = (iso: string) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
};

const fmtFechaCorta = (iso: string) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtFechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const BADGE: Record<string, string> = {
  programada: styles.badgeProgramada,
  completada: styles.badgeCompletada,
  cancelada: styles.badgeCancelada,
};

// ============================================================
// CARD HISTORIAL GENERAL (expandible)
// ============================================================
function HistorialCard({ h, defaultOpen }: { h: Historial; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const esGine = h.especialidad === "ginecologia";

  const tieneVitales = h.peso || h.presion_sistolica || h.temperatura ||
    h.frecuencia_cardiaca || h.frecuencia_respiratoria || h.saturacion_oxigeno || h.altura;

  return (
    <div className={styles.historialCard}>
      <div className={styles.historialCardHeader} onClick={() => setOpen(v => !v)}>
        <div style={{ flex: 1 }}>
          <p className={styles.historialDiag}>{h.diagnostico_principal || "Sin diagnóstico"}</p>
          <div className={styles.historialMeta}>
            <span>{fmtFechaCorta(h.created_at)}</span>
            <span className={`${styles.historialEsp} ${esGine ? styles.historialEspGine : ""}`}>
              {h.especialidad || "General"}
            </span>
            {h.usuarios_clinica && <span>Dr. {h.usuarios_clinica.nombre_completo?.toUpperCase()}</span>}
          </div>
        </div>
        <span className={styles.chevron}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {open && (
        <div className={styles.historialDetalle}>

          {/* Motivo de consulta / síntomas */}
          {h.motivo_consulta && (
            <div className={styles.detalleSeccion}>
              <h4>Motivo de Consulta</h4>
              <p>{h.motivo_consulta}</p>
            </div>
          )}
          {h.sintomas_principales && (
            <div className={styles.detalleSeccion}>
              <h4>Síntomas Principales</h4>
              <p>{h.sintomas_principales}</p>
            </div>
          )}
          {h.antecedentes_enfermedad_actual && (
            <div className={styles.detalleSeccion}>
              <h4>Antecedentes de Enfermedad Actual</h4>
              <p>{h.antecedentes_enfermedad_actual}</p>
            </div>
          )}

          {/* Signos vitales */}
          {tieneVitales && (
            <>
              <p className={styles.vitalesTitulo}>Signos Vitales</p>
              <div className={styles.detalleGrid}>
                {h.peso && (
                  <div className={styles.detalleItem}>
                    <p className={styles.detalleLabel}>Peso</p>
                    <p className={styles.detalleValor}>{h.peso} kg</p>
                  </div>
                )}
                {h.altura && (
                  <div className={styles.detalleItem}>
                    <p className={styles.detalleLabel}>Altura</p>
                    <p className={styles.detalleValor}>{h.altura} cm</p>
                  </div>
                )}
                {h.presion_sistolica && h.presion_diastolica && (
                  <div className={styles.detalleItem}>
                    <p className={styles.detalleLabel}>Presión Arterial</p>
                    <p className={styles.detalleValor}>{h.presion_sistolica}/{h.presion_diastolica} mmHg</p>
                  </div>
                )}
                {h.frecuencia_cardiaca && (
                  <div className={styles.detalleItem}>
                    <p className={styles.detalleLabel}>Frec. Cardíaca</p>
                    <p className={styles.detalleValor}>{h.frecuencia_cardiaca} lpm</p>
                  </div>
                )}
                {h.frecuencia_respiratoria && (
                  <div className={styles.detalleItem}>
                    <p className={styles.detalleLabel}>Frec. Respiratoria</p>
                    <p className={styles.detalleValor}>{h.frecuencia_respiratoria} rpm</p>
                  </div>
                )}
                {h.temperatura && (
                  <div className={styles.detalleItem}>
                    <p className={styles.detalleLabel}>Temperatura</p>
                    <p className={styles.detalleValor}>{h.temperatura} °C</p>
                  </div>
                )}
                {h.saturacion_oxigeno && (
                  <div className={styles.detalleItem}>
                    <p className={styles.detalleLabel}>Saturación O₂</p>
                    <p className={styles.detalleValor}>{h.saturacion_oxigeno}%</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Examen físico */}
          {h.examen_fisico_general && (
            <div className={styles.detalleSeccion}>
              <h4>Examen Físico General</h4>
              <p>{h.examen_fisico_general}</p>
            </div>
          )}

          {/* Diagnósticos */}
          {h.diagnosticos_secundarios && (
            <div className={styles.detalleSeccion}>
              <h4>Diagnósticos Secundarios</h4>
              <p>{h.diagnosticos_secundarios}</p>
            </div>
          )}

          {/* Tratamiento */}
          {h.plan_tratamiento && (
            <div className={styles.detalleSeccion}>
              <h4>Plan de Tratamiento</h4>
              <p>{h.plan_tratamiento}</p>
            </div>
          )}
          {h.medicamentos && (
            <div className={styles.detalleSeccion}>
              <h4>Medicamentos Recetados</h4>
              <p>{h.medicamentos}</p>
            </div>
          )}
          {h.recomendaciones && (
            <div className={styles.detalleSeccion}>
              <h4>Recomendaciones</h4>
              <p>{h.recomendaciones}</p>
            </div>
          )}
          {h.estudios_solicitados && (
            <div className={styles.detalleSeccion}>
              <h4>Estudios Solicitados</h4>
              <p>{h.estudios_solicitados}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CARD FICHA GINECOLÓGICA (expandible)
// ============================================================
function GineCard({ g, defaultOpen }: { g: FichaGine; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const gine = g.historiales_ginecologia?.[0];
  const controles = gine?.controles_prenatales || [];
  const contFiltrados = Array.isArray(controles)
    ? controles.filter((c: any) => c && c.fecha)
    : [];

  const antecedentes = gine ? [
    gine.embarazo && "Embarazo previo",
    gine.hipertension && "Hipertensión",
    gine.diabetes && "Diabetes",
    gine.tbc_pulmonar && "TBC Pulmonar",
    gine.gemelares && "Gemelares",
    gine.hipertension_cronica && "HTA Crónica",
    gine.cirugia_pelvico_uterina && "Cirugía Pélvico-Uterina",
    gine.infertilidad && "Infertilidad",
  ].filter(Boolean) as string[] : [];

  return (
    <div className={styles.gineCard}>
      <div className={styles.gineCardHeader} onClick={() => setOpen(v => !v)}>
        <div style={{ flex: 1 }}>
          <p className={styles.historialDiag} style={{ color: "#6d28d9" }}>
            {g.diagnostico_principal || "Ficha Ginecológica"}
          </p>
          <p className={styles.gineFecha}>
            Ginecología · {fmtFechaCorta(g.created_at)}
            {g.usuarios_clinica && ` · Dr. ${g.usuarios_clinica.nombre_completo?.toUpperCase()}`}
          </p>
        </div>
        <span className={styles.chevron}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {open && (
        <div className={styles.gineDetalle}>
          {g.motivo_consulta && (
            <div className={styles.detalleSeccion}>
              <h4>Motivo de Consulta</h4>
              <p>{g.motivo_consulta}</p>
            </div>
          )}

          {/* Datos obstétricos */}
          {gine && (gine.fum || gine.fpp || gine.vdrl || gine.hb || gine.ta_inicial || gine.antitetanicas) && (
            <>
              <p className={styles.vitalesTitulo}>Datos Obstétricos</p>
              <div className={styles.gineGrid}>
                {gine.fum && (
                  <div className={styles.gineItem}>
                    <p className={styles.detalleLabel}>Última Menstruación (FUM)</p>
                    <p className={styles.detalleValor}>{fmtFecha(gine.fum)}</p>
                  </div>
                )}
                {gine.fpp && (
                  <div className={styles.gineItem}>
                    <p className={styles.detalleLabel}>Fecha Probable de Parto</p>
                    <p className={styles.detalleValor}>{fmtFecha(gine.fpp)}</p>
                  </div>
                )}
                {gine.vdrl && (
                  <div className={styles.gineItem}>
                    <p className={styles.detalleLabel}>VDRL</p>
                    <p className={styles.detalleValor}>{gine.vdrl}</p>
                  </div>
                )}
                {gine.hb && (
                  <div className={styles.gineItem}>
                    <p className={styles.detalleLabel}>Hemoglobina (Hb)</p>
                    <p className={styles.detalleValor}>{gine.hb}</p>
                  </div>
                )}
                {gine.ta_inicial && (
                  <div className={styles.gineItem}>
                    <p className={styles.detalleLabel}>T.A. Inicial</p>
                    <p className={styles.detalleValor}>{gine.ta_inicial}</p>
                  </div>
                )}
                {gine.antitetanicas && (
                  <div className={styles.gineItem}>
                    <p className={styles.detalleLabel}>Dosis Antitetánicas</p>
                    <p className={styles.detalleValor}>{gine.antitetanicas}</p>
                  </div>
                )}
                {g.presion_sistolica && g.presion_diastolica && (
                  <div className={styles.gineItem}>
                    <p className={styles.detalleLabel}>Presión Arterial</p>
                    <p className={styles.detalleValor}>{g.presion_sistolica}/{g.presion_diastolica} mmHg</p>
                  </div>
                )}
                {g.peso && (
                  <div className={styles.gineItem}>
                    <p className={styles.detalleLabel}>Peso</p>
                    <p className={styles.detalleValor}>{g.peso} kg</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Antecedentes patológicos */}
          {antecedentes.length > 0 && (
            <div className={styles.detalleSeccion}>
              <h4>Antecedentes Patológicos</h4>
              <div className={styles.antecedentesGrid}>
                {antecedentes.map((a, i) => (
                  <span key={i} className={styles.antecedenteTag}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {gine?.antecedentes_familiares && (
            <div className={styles.detalleSeccion}>
              <h4>Antecedentes Familiares</h4>
              <p>{gine.antecedentes_familiares}</p>
            </div>
          )}

          {/* Tratamiento */}
          {g.plan_tratamiento && (
            <div className={styles.detalleSeccion}><h4>Plan de Tratamiento</h4><p>{g.plan_tratamiento}</p></div>
          )}
          {g.medicamentos && (
            <div className={styles.detalleSeccion}><h4>Medicamentos</h4><p>{g.medicamentos}</p></div>
          )}
          {g.recomendaciones && (
            <div className={styles.detalleSeccion}><h4>Recomendaciones</h4><p>{g.recomendaciones}</p></div>
          )}
          {gine?.dudas && (
            <div className={styles.detalleSeccion}><h4>Observaciones / Dudas</h4><p>{gine.dudas}</p></div>
          )}

          {/* Controles prenatales */}
          {contFiltrados.length > 0 && (
            <div className={styles.detalleSeccion}>
              <h4>Controles Prenatales — {contFiltrados.length} registros</h4>
              <div style={{ overflowX: "auto", marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#ede9fe" }}>
                      {["#", "Fecha", "Sem.", "Peso", "P.A.", "F.C.", "Alt. Uterina", "FCF", "Presentación"].map(col => (
                        <th key={col} style={{ padding: "5px 7px", textAlign: "left", color: "#6d28d9", fontWeight: 700, borderBottom: "2px solid #ddd6fe", whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contFiltrados.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#faf5ff" : "#fff" }}>
                        <td style={{ padding: "5px 7px", fontWeight: 600, color: "#7c3aed" }}>{i + 1}</td>
                        <td style={{ padding: "5px 7px" }}>{fmtFechaCorta(c.fecha)}</td>
                        <td style={{ padding: "5px 7px" }}>{c.semanas ?? "-"}</td>
                        <td style={{ padding: "5px 7px" }}>{c.peso ? `${c.peso} kg` : "-"}</td>
                        <td style={{ padding: "5px 7px" }}>{c.presion_arterial || "-"}</td>
                        <td style={{ padding: "5px 7px" }}>{c.frecuencia_cardiaca || "-"}</td>
                        <td style={{ padding: "5px 7px" }}>{c.altura_uterina || "-"}</td>
                        <td style={{ padding: "5px 7px" }}>{c.fcf || "-"}</td>
                        <td style={{ padding: "5px 7px" }}>{c.presentacion || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function PacientePortal() {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<PortalData | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstallPrompt(null);
      setInstalado(true);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = cedula.trim();
    if (!c || c.length < 4) { setError("Ingresa tu número de cédula"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/paciente-portal?cedula=${encodeURIComponent(c)}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || "No se encontró la cédula"); return; }
      setData(json);
    } catch {
      setError("Error de conexión. Verifica tu internet.");
    } finally {
      setLoading(false);
    }
  };

  const citasOrdenadas = [...(data?.citas || [])].sort(
    (a, b) => new Date(b.fecha_cita).getTime() - new Date(a.fecha_cita).getTime()
  );

  const p = data?.paciente;

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.headerIcon}>🏥</span>
        <div className={styles.headerText}>
          <h1>Mi Historial Clínico</h1>
          <p>Portal de Pacientes — MEDIKIT</p>
        </div>
        {installPrompt && !instalado && (
          <button className={styles.btnInstalar} onClick={handleInstall} title="Instalar app en tu dispositivo">
            <Download size={15} />
            <span>Instalar App</span>
          </button>
        )}
        {instalado && <span className={styles.instaladoBadge}>✓ Instalada</span>}
      </header>

      {/* Pantalla búsqueda */}
      {!data && (
        <div className={styles.searchScreen}>
          <div className={styles.heroIcon}>🩺</div>
          <h2>Consulta tu historial médico</h2>
          <p>Ingresa tu número de cédula para ver tus citas y registros clínicos</p>

          <div className={styles.searchBox}>
            <form onSubmit={buscar}>
              <label className={styles.searchLabel}>Número de Cédula</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles.searchInput}
                placeholder="Ej: 12345678"
                value={cedula}
                onChange={e => { setCedula(e.target.value.replace(/\D/g, "")); setError(""); }}
                maxLength={12}
                autoComplete="off"
              />
              {error && <div className={styles.errorMsg}>{error}</div>}
              <button type="submit" className={styles.btnBuscar} disabled={loading}>
                {loading
                  ? <><RefreshCw size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Buscando...</>
                  : <><Search size={16} /> Ver mis registros</>
                }
              </button>
            </form>
          </div>

          <div className={styles.disclaimer}>
            🔒 Tu información es privada. Solo tú puedes ver tus registros con tu cédula.
          </div>
        </div>
      )}

      {/* Portal con datos */}
      {data && p && (
        <div className={styles.portal}>

          {/* ── Tarjeta paciente ── */}
          <div className={styles.pacienteCard}>
            <div className={styles.pacienteCardTop}>
              <div className={styles.avatar}>{initials(p.nombre_completo)}</div>
              <div style={{ flex: 1 }}>
                <p className={styles.pacienteNombre}>{p.nombre_completo}</p>
                <p className={styles.pacienteCedula}>C.I. {p.cedula}</p>
              </div>
              <button className={styles.btnNuevaBusqueda} onClick={() => { setData(null); setCedula(""); }}>
                <RefreshCw size={13} /> Nueva búsqueda
              </button>
            </div>

            {/* Tags rápidos */}
            <div className={styles.pacienteTags}>
              <span className={styles.tag}>
                {p.sexo === "M" ? "♂ Masculino" : "♀ Femenino"}
              </span>
              <span className={styles.tag}>
                {calcEdad(p.fecha_nacimiento)} años
              </span>
              {p.tipo_sangre && (
                <span className={`${styles.tag} ${styles.tagRed}`}>
                  🩸 {p.tipo_sangre}
                </span>
              )}
            </div>

            {/* Info detallada */}
            <div className={styles.pacienteInfoGrid}>
              <div className={styles.pacienteInfoItem}>
                <Calendar size={13} style={{ flexShrink: 0 }} />
                <span><strong>Nacimiento:</strong> {fmtFecha(p.fecha_nacimiento)}</span>
              </div>
              {p.ciudad && (
                <div className={styles.pacienteInfoItem}>
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <span>{p.ciudad}</span>
                </div>
              )}
              {p.telefono && (
                <div className={styles.pacienteInfoItem}>
                  <Phone size={13} style={{ flexShrink: 0 }} />
                  <span>{p.telefono}</span>
                </div>
              )}
              {p.email && (
                <div className={styles.pacienteInfoItem}>
                  <Mail size={13} style={{ flexShrink: 0 }} />
                  <span>{p.email}</span>
                </div>
              )}
            </div>

            {/* Alergias */}
            {p.alergias && (
              <div className={styles.alertaAlergia}>
                ⚠️ <strong>Alergias conocidas:</strong> {p.alergias}
              </div>
            )}

            {/* Antecedentes médicos */}
            {p.antecedentes_medicos && (
              <div className={styles.antecedentesBox}>
                <div className={styles.antecedentesBoxHeader}>
                  <FileText size={13} /> Antecedentes Médicos
                </div>
                <p className={styles.antecedentesBoxText}>{p.antecedentes_medicos}</p>
              </div>
            )}
          </div>

          {/* ── Citas ── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span>📅</span> Mis Citas
              <span className={styles.sectionCount}>{citasOrdenadas.length}</span>
            </h3>
            {citasOrdenadas.length === 0 ? (
              <div className={styles.emptySection}>No tienes citas registradas</div>
            ) : (
              citasOrdenadas.map(c => (
                <div key={c.id} className={styles.citaCard}>
                  <div className={styles.citaHeader}>
                    <span className={styles.citaFecha}>{fmtFechaHora(c.fecha_cita)}</span>
                    <span className={`${styles.citaBadge} ${BADGE[c.estado] || ""}`}>
                      {c.estado}
                    </span>
                  </div>
                  <div className={styles.citaInfo}>
                    <p className={styles.citaEsp}>{c.especialidad}</p>
                    {c.motivo_cita && <p>📋 {c.motivo_cita}</p>}
                    {c.usuarios_clinica && <p>👨‍⚕️ Dr. {c.usuarios_clinica.nombre_completo?.toUpperCase()}</p>}
                    {c.duracion_minutos && <p>⏱ {c.duracion_minutos} minutos</p>}
                    {c.notas && <p style={{ fontStyle: "italic", color: "#64748b", marginTop: 4 }}>"{c.notas}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Fichas Ginecológicas ── */}
          {data.fichas_ginecologicas.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span>🌸</span> Fichas Ginecológicas
                <span className={styles.sectionCount}>{data.fichas_ginecologicas.length}</span>
              </h3>
              {data.fichas_ginecologicas.map((g, i) => (
                <GineCard key={g.id} g={g} defaultOpen={i === 0} />
              ))}
            </div>
          )}

          {/* ── Historiales Clínicos ── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span>📋</span> Registros Clínicos
              <span className={styles.sectionCount}>{data.historiales.length}</span>
            </h3>
            {data.historiales.length === 0 ? (
              <div className={styles.emptySection}>No tienes registros clínicos aún</div>
            ) : (
              data.historiales.map((h, i) => (
                <HistorialCard key={h.id} h={h} defaultOpen={i === 0} />
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}
