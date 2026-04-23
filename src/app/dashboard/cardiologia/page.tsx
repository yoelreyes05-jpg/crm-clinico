"use client";

import { useState, useEffect } from "react";
import { Activity, History, Edit2, Trash2, Printer, X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { PatientHeader } from "@/components/PatientHeader";
import { PrintButton } from "@/components/PrintButton";
import styles from "../form.module.css";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Paciente {
  id: string;
  identidad: string;
  nombre: string;
  telefono: string;
  sexo: string;
  fecha_nacimiento: string | null;
}

interface Historia {
  id: string;
  paciente_id: string;
  medico_id: string;
  motivo_consulta: string;
  observaciones: string;
  presion_arterial: string;
  frecuencia_cardiaca: number | null;
  created_at: string;
  paciente?: Paciente;
}

// ─── Modal de Edición ─────────────────────────────────────────────────────────
function EditModal({ historia, onClose, onSaved }: { historia: Historia; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    motivo_consulta: historia.motivo_consulta || "",
    presion_arterial: historia.presion_arterial || "",
    frecuencia_cardiaca: historia.frecuencia_cardiaca?.toString() || "",
    observaciones: historia.observaciones || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("clinico_historias_cardiologia")
        .update({
          motivo_consulta: form.motivo_consulta,
          presion_arterial: form.presion_arterial,
          frecuencia_cardiaca: parseFloat(form.frecuencia_cardiaca) || null,
          observaciones: form.observaciones,
        })
        .eq("id", historia.id);

      if (error) throw error;
      alert("Historia actualizada exitosamente.");
      onSaved();
      onClose();
    } catch (error: any) {
      alert("Error al actualizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
            Editar Historia Clínica
          </h2>
          <button onClick={onClose} style={iconBtnStyle}><X size={20} /></button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Motivo de Consulta</label>
            <input name="motivo_consulta" value={form.motivo_consulta} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Presión Arterial (mmHg)</label>
              <input name="presion_arterial" value={form.presion_arterial} onChange={handleChange} style={inputStyle} placeholder="120/80" />
            </div>
            <div>
              <label style={labelStyle}>Frecuencia Cardíaca (lpm)</label>
              <input name="frecuencia_cardiaca" type="number" value={form.frecuencia_cardiaca} onChange={handleChange} style={inputStyle} placeholder="75" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Observaciones / Plan de Tratamiento</label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button onClick={onClose} style={outlineBtnStyle}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} style={primaryBtnStyle}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de Historia expandible ──────────────────────────────────────────────
function HistoriaRow({ historia, onEdit, onDelete, onPrint }: {
  historia: Historia;
  onEdit: (h: Historia) => void;
  onDelete: (id: string) => void;
  onPrint: (h: Historia) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fecha = new Date(historia.created_at).toLocaleDateString("es-DO", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div style={rowContainerStyle}>
      {/* Header de la fila */}
      <div style={rowHeaderStyle} onClick={() => setExpanded(p => !p)}>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, color: "#111" }}>
            {historia.paciente?.nombre || "Paciente"}
          </span>
          <span style={{ color: "#6b7280", fontSize: "0.85rem", marginLeft: "0.75rem" }}>
            {historia.paciente?.identidad}
          </span>
        </div>
        <div style={{ color: "#6b7280", fontSize: "0.82rem", marginRight: "1rem" }}>{fecha}</div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(historia); }}
            style={actionBtnStyle("#2563eb")}
            title="Editar"
          ><Edit2 size={15} /></button>
          <button
            onClick={e => { e.stopPropagation(); onPrint(historia); }}
            style={actionBtnStyle("#059669")}
            title="Imprimir"
          ><Printer size={15} /></button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(historia.id); }}
            style={actionBtnStyle("#dc2626")}
            title="Eliminar"
          ><Trash2 size={15} /></button>
          {expanded ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div style={rowDetailStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "0.75rem" }}>
            <DetailItem label="Motivo de Consulta" value={historia.motivo_consulta} />
            <DetailItem label="Presión Arterial" value={historia.presion_arterial || "—"} />
            <DetailItem label="Frecuencia Cardíaca" value={historia.frecuencia_cardiaca ? `${historia.frecuencia_cardiaca} lpm` : "—"} />
            <DetailItem label="Teléfono" value={historia.paciente?.telefono || "—"} />
          </div>
          {historia.observaciones && (
            <div>
              <span style={{ ...labelStyle, display: "block", marginBottom: "0.3rem" }}>Observaciones</span>
              <p style={{ margin: 0, color: "#374151", fontSize: "0.9rem", whiteSpace: "pre-wrap", background: "#f9fafb", padding: "0.75rem", borderRadius: "6px" }}>
                {historia.observaciones}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ ...labelStyle, display: "block" }}>{label}</span>
      <span style={{ color: "#111827", fontSize: "0.9rem", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── Panel de Historial ────────────────────────────────────────────────────────
function HistorialPanel({ refreshKey }: { refreshKey: number }) {
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Historia | null>(null);

  const fetchHistorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clinico_historias_cardiologia")
        .select(`*, paciente:paciente_id (id, identidad, nombre, telefono, sexo, fecha_nacimiento)`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistorias((data as any[]) || []);
    } catch (error: any) {
      console.error("Error al cargar historias:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistorias(); }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta historia clínica? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("clinico_historias_cardiologia").delete().eq("id", id);
    if (error) { alert("Error al eliminar: " + error.message); return; }
    setHistorias(prev => prev.filter(h => h.id !== id));
  };

  const handlePrint = (historia: Historia) => {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Historia Clínica - Cardiología</title>
          <style>
            body { font-family: Georgia, serif; max-width: 700px; margin: 2rem auto; color: #111; }
            h1 { font-size: 1.4rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
            h2 { font-size: 1rem; color: #444; margin-top: 1.5rem; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .field { margin-bottom: 0.75rem; }
            .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
            .value { font-size: 0.95rem; font-weight: 600; }
            .obs { background: #f5f5f5; padding: 1rem; border-left: 3px solid #333; white-space: pre-wrap; }
            .footer { margin-top: 3rem; border-top: 1px solid #ccc; padding-top: 1rem; display: flex; justify-content: space-between; }
            @media print { body { margin: 1cm; } }
          </style>
        </head>
        <body>
          <h1>Historia Clínica — Cardiología y Medicina Interna</h1>
          <h2>Datos del Paciente</h2>
          <div class="grid">
            <div class="field"><div class="label">Nombre</div><div class="value">${historia.paciente?.nombre || "—"}</div></div>
            <div class="field"><div class="label">Identidad</div><div class="value">${historia.paciente?.identidad || "—"}</div></div>
            <div class="field"><div class="label">Teléfono</div><div class="value">${historia.paciente?.telefono || "—"}</div></div>
            <div class="field"><div class="label">Sexo</div><div class="value">${historia.paciente?.sexo || "—"}</div></div>
          </div>
          <h2>Consulta</h2>
          <div class="field"><div class="label">Fecha</div><div class="value">${new Date(historia.created_at).toLocaleString("es-DO")}</div></div>
          <div class="field"><div class="label">Motivo de Consulta</div><div class="value">${historia.motivo_consulta}</div></div>
          <h2>Signos Vitales</h2>
          <div class="grid">
            <div class="field"><div class="label">Presión Arterial</div><div class="value">${historia.presion_arterial || "—"} mmHg</div></div>
            <div class="field"><div class="label">Frecuencia Cardíaca</div><div class="value">${historia.frecuencia_cardiaca ? historia.frecuencia_cardiaca + " lpm" : "—"}</div></div>
          </div>
          <h2>Observaciones / Plan de Tratamiento</h2>
          <div class="obs">${historia.observaciones || "Sin observaciones."}</div>
          <div class="footer">
            <div>_________________________<br>Firma del Médico Tratante<br><small>Módulo de Cardiología</small></div>
            <div style="text-align:right;color:#666;font-size:0.8rem">Generado: ${new Date().toLocaleString("es-DO")}</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const filtered = historias.filter(h => {
    const q = search.toLowerCase();
    return (
      h.paciente?.nombre?.toLowerCase().includes(q) ||
      h.paciente?.identidad?.toLowerCase().includes(q) ||
      h.motivo_consulta?.toLowerCase().includes(q)
    );
  });

  return (
    <section className={`card ${styles.section}`} style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h3 className={styles.sectionTitle} style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <History size={20} /> Historial de Consultas
        </h3>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Buscar paciente o motivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "2rem", width: "240px", fontSize: "0.85rem" }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>Cargando historial...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>
          {search ? "No se encontraron resultados." : "Aún no hay historias guardadas."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map(h => (
            <HistoriaRow
              key={h.id}
              historia={h}
              onEdit={setEditTarget}
              onDelete={handleDelete}
              onPrint={handlePrint}
            />
          ))}
        </div>
      )}

      {editTarget && (
        <EditModal
          historia={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={fetchHistorias}
        />
      )}
    </section>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function CardiologiaModule() {
  const [loading, setLoading] = useState(false);
  const [historialKey, setHistorialKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identidad = formData.get("identidad") as string;
    const nombre = formData.get("nombre") as string;
    const telefono = formData.get("telefono") as string;
    const sexo = formData.get("sexo") as string;
    const fecha_nacimiento = formData.get("fecha_nacimiento") as string || null;
    
    const motivo_consulta = formData.get("motivo_consulta") as string;
    const observaciones = formData.get("observaciones") as string;
    const presion_arterial = formData.get("presion_arterial") as string;
    const frecuencia_cardiaca = parseFloat(formData.get("frecuencia_cardiaca") as string) || null;
    const proxima_cita = formData.get("proxima_cita") as string;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const { data: pacienteData, error: pacienteError } = await supabase
        .from("clinico_pacientes_cardiologia")
        .insert({ identidad, nombre, telefono, sexo, fecha_nacimiento })
        .select()
        .single();

      if (pacienteError) throw pacienteError;

      const { error: historiaError } = await supabase
        .from("clinico_historias_cardiologia")
        .insert({
          paciente_id: pacienteData.id,
          medico_id: session.user.id,
          motivo_consulta,
          observaciones,
          presion_arterial,
          frecuencia_cardiaca
        });

      if (historiaError) throw historiaError;

      if (proxima_cita) {
        await supabase.from("clinico_citas").insert({
          paciente_auth_id: pacienteData.id,
          medico_id: session.user.id,
          modulo: "cardiologia",
          motivo_cita: "Control por Cardiología",
          fecha_hora: proxima_cita,
          estado: "pendiente"
        });
      }

      alert("Historia Clínica guardada exitosamente en Supabase (Cardiología).");
      (e.target as HTMLFormElement).reset();
      // Refrescar el historial automáticamente tras guardar
      setHistorialKey(k => k + 1);

    } catch (error: any) {
      alert("Error al guardar: " + error.message + " (Si dice RLS violation, verifica que tu usuario tenga el modulo asignado 'cardiologia' o seas admin con permisos).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.moduleContainer}>
      <div className={`${styles.header} no-print`}>
        <div className={styles.titleWrapper}>
          <Activity size={32} className={styles.icon} />
          <div>
            <h1>Historia Clínica: Cardiología y Medicina Interna</h1>
            <p className="text-muted">Registro de consultas, evaluación cardiovascular y riesgo.</p>
          </div>
        </div>
        <PrintButton />
      </div>

      <form className={styles.formContent} onSubmit={handleSubmit} id="cardio-form">
        {/* Encabezado del Paciente Global */}
        <PatientHeader />

        {/* Motivo de Consulta */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Motivo de Consulta y Enfermedad Actual</h3>
          <div className="input-group">
            <label className="input-label">Motivo Principal</label>
            <input type="text" name="motivo_consulta" className="input-field" placeholder="Ej. Dolor torácico, palpitaciones, disnea..." required />
          </div>
        </section>

        {/* Examen Físico y Signos Vitales */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Signos Vitales y Exploración</h3>
          <div className={styles.grid4}>
            <div className="input-group">
              <label className="input-label">Presión Arterial (mmHg)</label>
              <input type="text" name="presion_arterial" className="input-field" placeholder="120/80" />
            </div>
            <div className="input-group">
              <label className="input-label">Frecuencia Cardíaca (lpm)</label>
              <input type="number" name="frecuencia_cardiaca" className="input-field" placeholder="75" />
            </div>
            <div className="input-group">
              <label className="input-label">Próxima Cita (Opcional)</label>
              <input type="datetime-local" name="proxima_cita" className="input-field" />
            </div>
          </div>
        </section>

        {/* Observaciones Generales */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Observaciones / Plan de Tratamiento</h3>
          <div className="input-group">
            <textarea 
              name="observaciones"
              className="input-field" 
              rows={6} 
              placeholder="Escriba aquí los hallazgos del examen físico, resultados de electrocardiogramas, plan terapéutico..."
            ></textarea>
          </div>
        </section>

        {/* Pie de Firma para Impresión */}
        <div className="print-footer">
           <div className="signature-line"></div>
           <p style={{fontWeight: 'bold', fontSize: '1.1rem', margin: '0.25rem 0'}}>Firma del Médico Tratante</p>
           <p style={{color: '#666', fontSize: '0.9rem'}}>Módulo de Cardiología</p>
        </div>

        {/* Botón de Guardar (No se imprime) */}
        <div className={`no-print ${styles.formActions}`}>
          <button type="button" className="btn btn-outline" onClick={() => (document.getElementById('cardio-form') as HTMLFormElement).reset()}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Historia Clínica'}
          </button>
        </div>
      </form>

      {/* ── Historial de Pacientes (no se imprime) ── */}
      <div className="no-print">
        <HistorialPanel refreshKey={historialKey} />
      </div>
    </div>
  );
}

// ─── Estilos inline reutilizables ─────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999, padding: "1rem",
};

const modalStyle: React.CSSProperties = {
  background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "560px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "1rem 1.5rem", borderBottom: "1px solid #e5e7eb", background: "#f9fafb",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem", fontWeight: 600, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: "6px", fontSize: "0.9rem", outline: "none",
  boxSizing: "border-box" as const,
};

const primaryBtnStyle: React.CSSProperties = {
  background: "#2563eb", color: "#fff", border: "none",
  padding: "0.5rem 1.25rem", borderRadius: "6px", cursor: "pointer",
  fontWeight: 600, fontSize: "0.875rem",
};

const outlineBtnStyle: React.CSSProperties = {
  background: "transparent", color: "#374151", border: "1px solid #d1d5db",
  padding: "0.5rem 1.25rem", borderRadius: "6px", cursor: "pointer",
  fontWeight: 500, fontSize: "0.875rem",
};

const iconBtnStyle: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "#6b7280", display: "flex", alignItems: "center",
};

const rowContainerStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden",
};

const rowHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", padding: "0.75rem 1rem",
  background: "#f9fafb", cursor: "pointer", userSelect: "none" as const,
  transition: "background 0.15s",
};

const rowDetailStyle: React.CSSProperties = {
  padding: "1rem", borderTop: "1px solid #e5e7eb", background: "#fff",
};

const actionBtnStyle = (color: string): React.CSSProperties => ({
  background: "none", border: `1px solid ${color}20`, borderRadius: "5px",
  color, cursor: "pointer", padding: "4px 6px", display: "flex",
  alignItems: "center", transition: "background 0.15s",
});
