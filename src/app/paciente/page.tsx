"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, RefreshCw, Download } from "lucide-react";
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
  motivo_consulta?: string;
  diagnostico_principal: string;
  diagnosticos_secundarios?: string;
  plan_tratamiento?: string;
  medicamentos?: string;
  recomendaciones?: string;
  peso?: number;
  altura?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  temperatura?: number;
  saturacion_oxigeno?: number;
  estudios_solicitados?: string;
  created_at: string;
  usuarios_clinica?: { nombre_completo: string } | null;
}

// Ficha ginecológica: viene de historiales_clinicos con join historiales_ginecologia
interface FichaGine {
  id: string;
  motivo_consulta?: string;
  diagnostico_principal: string;
  plan_tratamiento?: string;
  medicamentos?: string;
  recomendaciones?: string;
  peso?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  created_at: string;
  usuarios_clinica?: { nombre_completo: string; especialidad: string } | null;
  // Datos de historiales_ginecologia (join como array)
  historiales_ginecologia?: Array<{
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

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

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
function HistorialCard({ h }: { h: Historial }) {
  const [open, setOpen] = useState(false);
  const esGine = h.especialidad === "ginecologia";

  return (
    <div className={styles.historialCard}>
      <div className={styles.historialCardHeader} onClick={() => setOpen(v => !v)}>
        <div>
          <p className={styles.historialDiag}>{h.diagnostico_principal}</p>
          <div className={styles.historialMeta}>
            <span>{fmtFecha(h.created_at)}</span>
            <span className={`${styles.historialEsp} ${esGine ? styles.historialEspGine : ""}`}>
              {h.especialidad || "General"}
            </span>
            {h.usuarios_clinica && <span>Dr. {h.usuarios_clinica.nombre_completo}</span>}
          </div>
        </div>
        <span className={styles.chevron}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {open && (
        <div className={styles.historialDetalle}>
          {/* Signos vitales */}
          {(h.peso || h.presion_sistolica || h.temperatura || h.frecuencia_cardiaca) && (
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
          )}

          {h.motivo_consulta && (
            <div className={styles.detalleSeccion}>
              <h4>Motivo de Consulta</h4>
              <p>{h.motivo_consulta}</p>
            </div>
          )}
          {h.diagnosticos_secundarios && (
            <div className={styles.detalleSeccion}>
              <h4>Diagnósticos Secundarios</h4>
              <p>{h.diagnosticos_secundarios}</p>
            </div>
          )}
          {h.plan_tratamiento && (
            <div className={styles.detalleSeccion}>
              <h4>Plan de Tratamiento</h4>
              <p>{h.plan_tratamiento}</p>
            </div>
          )}
          {h.medicamentos && (
            <div className={styles.detalleSeccion}>
              <h4>Medicamentos</h4>
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
function GineCard({ g }: { g: FichaGine }) {
  const [open, setOpen] = useState(false);
  const gine = g.historiales_ginecologia?.[0];
  const controles = gine?.controles_prenatales || [];
  const contFiltrados = controles.filter((c: any) => c.fecha);

  return (
    <div className={styles.gineCard}>
      <div className={styles.gineCardHeader} onClick={() => setOpen(v => !v)}>
        <div>
          <p className={styles.historialDiag} style={{ color: "#6d28d9" }}>{g.diagnostico_principal}</p>
          <p className={styles.gineFecha}>
            Ficha Ginecológica · {fmtFecha(g.created_at)}
            {g.usuarios_clinica && ` · ${g.usuarios_clinica.nombre_completo}`}
          </p>
        </div>
        <span className={styles.chevron}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {open && (
        <div className={styles.gineDetalle}>
          {/* Datos obstétricos del join */}
          {gine && (gine.fum || gine.fpp || gine.vdrl || gine.hb || gine.ta_inicial) && (
            <div className={styles.gineGrid}>
              {gine.fum && (
                <div className={styles.gineItem}>
                  <p className={styles.detalleLabel}>Última Menstruación</p>
                  <p className={styles.detalleValor}>{fmtFecha(gine.fum)}</p>
                </div>
              )}
              {gine.fpp && (
                <div className={styles.gineItem}>
                  <p className={styles.detalleLabel}>Fecha Probable Parto</p>
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
                  <p className={styles.detalleLabel}>Hemoglobina</p>
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
                  <p className={styles.detalleLabel}>Antitetánicas</p>
                  <p className={styles.detalleValor}>{gine.antitetanicas}</p>
                </div>
              )}
            </div>
          )}

          {/* Antecedentes */}
          {gine && (gine.embarazo || gine.hipertension || gine.diabetes || gine.tbc_pulmonar) && (
            <div className={styles.detalleSeccion}>
              <h4>Antecedentes</h4>
              <p>
                {[
                  gine.embarazo && "Embarazo previo",
                  gine.hipertension && "Hipertensión",
                  gine.diabetes && "Diabetes",
                  gine.tbc_pulmonar && "TBC Pulmonar",
                  gine.gemelares && "Gemelares",
                  gine.hipertension_cronica && "HTA Crónica",
                  gine.cirugia_pelvico_uterina && "Cir. Pélvico-Uterina",
                  gine.infertilidad && "Infertilidad",
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
          )}

          {g.motivo_consulta && (
            <div className={styles.detalleSeccion}><h4>Motivo</h4><p>{g.motivo_consulta}</p></div>
          )}
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
            <div className={styles.detalleSeccion}><h4>Observaciones</h4><p>{gine.dudas}</p></div>
          )}
          {gine?.antecedentes_familiares && (
            <div className={styles.detalleSeccion}><h4>Antecedentes Familiares</h4><p>{gine.antecedentes_familiares}</p></div>
          )}

          {/* Controles prenatales */}
          {contFiltrados.length > 0 && (
            <div className={styles.detalleSeccion}>
              <h4>Controles Prenatales ({contFiltrados.length} registros)</h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginTop: 8 }}>
                  <thead>
                    <tr style={{ background: "#ede9fe" }}>
                      {["#","Fecha","Sem","Peso","PA","F.C.","Alt. Uterina","FCC","Presentación"].map(col => (
                        <th key={col} style={{ padding: "4px 6px", textAlign: "left", color: "#6d28d9", fontWeight: 700, borderBottom: "1px solid #ddd6fe", whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contFiltrados.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "4px 6px" }}>{i + 1}</td>
                        <td style={{ padding: "4px 6px" }}>{fmtFecha(c.fecha)}</td>
                        <td style={{ padding: "4px 6px" }}>{c.semanas || "-"}</td>
                        <td style={{ padding: "4px 6px" }}>{c.peso ? `${c.peso}kg` : "-"}</td>
                        <td style={{ padding: "4px 6px" }}>{c.presion_arterial || "-"}</td>
                        <td style={{ padding: "4px 6px" }}>{c.frecuencia_cardiaca || "-"}</td>
                        <td style={{ padding: "4px 6px" }}>{c.altura_uterina || "-"}</td>
                        <td style={{ padding: "4px 6px" }}>{c.fcf || "-"}</td>
                        <td style={{ padding: "4px 6px" }}>{c.presentacion || "-"}</td>
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

  // Registrar Service Worker y capturar evento de instalación PWA
  useEffect(() => {
    // Registrar SW
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
    if (!c || c.length < 6) { setError("Ingresa tu cédula (mínimo 6 dígitos)"); return; }
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

  const citasOrdenadas = data?.citas.sort(
    (a, b) => new Date(b.fecha_cita).getTime() - new Date(a.fecha_cita).getTime()
  ) || [];

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.headerIcon}>🏥</span>
        <div className={styles.headerText}>
          <h1>Mi Historial Clínico</h1>
          <p>Portal de Pacientes — CRM Clínico</p>
        </div>
        {/* Botón instalar PWA */}
        {installPrompt && !instalado && (
          <button className={styles.btnInstalar} onClick={handleInstall} title="Instalar app en tu dispositivo">
            <Download size={15} />
            <span>Instalar App</span>
          </button>
        )}
        {instalado && (
          <span className={styles.instaladoBadge}>✓ Instalada</span>
        )}
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
                {loading ? (
                  <><RefreshCw size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Buscando...</>
                ) : (
                  <><Search size={16} /> Ver mis registros</>
                )}
              </button>
            </form>
          </div>

          <div className={styles.disclaimer}>
            🔒 Tu información es privada. Solo tú puedes ver tus registros con tu cédula.
          </div>
        </div>
      )}

      {/* Portal con datos */}
      {data && (
        <div className={styles.portal}>
          {/* Tarjeta paciente */}
          <div className={styles.pacienteCard}>
            <div className={styles.pacienteCardTop}>
              <div className={styles.avatar}>{initials(data.paciente.nombre_completo)}</div>
              <div>
                <p className={styles.pacienteNombre}>{data.paciente.nombre_completo}</p>
                <p className={styles.pacienteCedula}>Cédula: {data.paciente.cedula}</p>
              </div>
              <button className={styles.btnNuevaBusqueda} onClick={() => { setData(null); setCedula(""); }}>
                <RefreshCw size={13} /> Nueva búsqueda
              </button>
            </div>
            <div className={styles.pacienteTags}>
              <span className={styles.tag}>
                {data.paciente.sexo === "M" ? "Masculino" : "Femenino"}
              </span>
              <span className={styles.tag}>
                {calcEdad(data.paciente.fecha_nacimiento)} años
              </span>
              {data.paciente.tipo_sangre && (
                <span className={`${styles.tag} ${styles.tagRed}`}>
                  {data.paciente.tipo_sangre}
                </span>
              )}
              {data.paciente.ciudad && (
                <span className={styles.tag}>{data.paciente.ciudad}</span>
              )}
            </div>
            {data.paciente.alergias && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#dc2626", border: "1px solid #fca5a5" }}>
                ⚠️ <strong>Alergias:</strong> {data.paciente.alergias}
              </div>
            )}
          </div>

          {/* Citas */}
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
                    {c.usuarios_clinica && <p>👨‍⚕️ Dr. {c.usuarios_clinica.nombre_completo}</p>}
                    {c.duracion_minutos && <p>⏱ {c.duracion_minutos} minutos</p>}
                    {c.notas && <p style={{ fontStyle: "italic", color: "#64748b" }}>"{c.notas}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Fichas ginecológicas */}
          {data.fichas_ginecologicas.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span>🌸</span> Fichas Ginecológicas
                <span className={styles.sectionCount}>{data.fichas_ginecologicas.length}</span>
              </h3>
              {data.fichas_ginecologicas.map(g => (
                <GineCard key={g.id} g={g} />
              ))}
            </div>
          )}

          {/* Historiales generales */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span>📋</span> Registros Clínicos
              <span className={styles.sectionCount}>{data.historiales.length}</span>
            </h3>
            {data.historiales.length === 0 ? (
              <div className={styles.emptySection}>No tienes registros clínicos aún</div>
            ) : (
              data.historiales.map(h => (
                <HistorialCard key={h.id} h={h} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
