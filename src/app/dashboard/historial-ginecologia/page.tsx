"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, Printer, Search, X, Plus, Trash2 } from "lucide-react";
import styles from "./ginecologia.module.css";

interface Paciente {
  id: string;
  nombre_completo: string;
  cedula: string;
  fecha_nacimiento: string;
  tipo_sangre?: string;
  telefono?: string;
}

interface ControlPrenatal {
  id: number;
  fecha: string;
  edad_gestacional: string;
  peso: string;
  ta: string;
  altura_uterina: string;
  fcc_mov: string;
  edema: boolean;
  varice: boolean;
}

const controlVacio = (id: number): ControlPrenatal => ({
  id,
  fecha: "",
  edad_gestacional: "",
  peso: "",
  ta: "",
  altura_uterina: "",
  fcc_mov: "",
  edema: false,
  varice: false,
});

const calcularEdad = (fecha: string) => {
  if (!fecha) return "";
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
};

const calcularFPP = (fum: string): string => {
  if (!fum) return "";
  const d = new Date(fum);
  d.setDate(d.getDate() + 280);
  return d.toISOString().split("T")[0];
};

export default function HistorialGinecologiaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [pacienteId, setPacienteId] = useState(searchParams.get("paciente") || "");
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ---- Historiales existentes del paciente ---- */
  const [historialExistente, setHistorialExistente] = useState<any[]>([]);
  const [cargandoHistoriales, setCargandoHistoriales] = useState(false);

  /* ---- Antecedentes ---- */
  const [antecedentes, setAntecedentes] = useState({
    embarazo: false,
    tbc_pulmonar: false,
    hipertension: false,
    gemelares: false,
    diabetes: false,
    hipertension_cronica: false,
    cirugia_pelvico_uterina: false,
    infertilidad: false,
    antecedentes_familiares: "",
  });

  /* ---- Exámenes / Datos iniciales ---- */
  const [examenes, setExamenes] = useState({
    ta_inicial: "",
    vdrl: "",
    hb: "",
    tipo_sangre: "",
    fum: "",
    fpp: "",
    dudas: "",
    antitetanicas: "",
  });

  /* ---- Controles prenatales (hasta 12) ---- */
  const [controles, setControles] = useState<ControlPrenatal[]>([
    controlVacio(1),
    controlVacio(2),
    controlVacio(3),
    controlVacio(4),
  ]);

  /* ---- Datos clínicos generales ---- */
  const [clinico, setCli] = useState({
    motivo_consulta: "",
    diagnostico_principal: "",
    plan_tratamiento: "",
    observaciones: "",
    peso: "",
    presion_sistolica: "",
    presion_diastolica: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || usuario?.rol !== "medico") { router.push("/login"); return; }
    cargarPacientes().then(() => {
      // Si viene paciente por URL, cargar sus historiales automáticamente
      const pacienteParam = searchParams.get("paciente");
      if (pacienteParam) {
        cargarHistorialesGine(pacienteParam);
      }
    });
  }, [isAuthenticated, usuario, authLoading]);

  // Calcular FPP automáticamente al cambiar FUM
  useEffect(() => {
    if (examenes.fum) {
      setExamenes(prev => ({ ...prev, fpp: calcularFPP(examenes.fum) }));
    }
  }, [examenes.fum]);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pacientes", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        const lista = d.data || [];
        setPacientes(lista);
        // Si hay paciente pre-seleccionado en URL, mostrar su nombre
        const pacienteParam = searchParams.get("paciente");
        if (pacienteParam) {
          const p = lista.find((x: any) => x.id === pacienteParam);
          if (p) setSearchTerm(p.nombre_completo);
        }
      }
    } finally { setLoading(false); }
  };

  const cargarHistorialesGine = async (id: string) => {
    setCargandoHistoriales(true);
    try {
      const res = await fetch(`/api/historiales/ginecologia?paciente_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setHistorialExistente(d.data || []); }
      else { setHistorialExistente([]); }
    } finally { setCargandoHistoriales(false); }
  };

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cedula.includes(searchTerm)
  );

  const paciente = pacientes.find(p => p.id === pacienteId);

  const agregarControl = () => {
    if (controles.length >= 12) return;
    setControles(prev => [...prev, controlVacio(prev.length + 1)]);
  };

  const quitarControl = (idx: number) => {
    setControles(prev => prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, id: i + 1 })));
  };

  const actualizarControl = (idx: number, campo: keyof ControlPrenatal, valor: string | boolean) => {
    setControles(prev => prev.map((c, i) => i === idx ? { ...c, [campo]: valor } : c));
  };

  const toggleAnt = (campo: keyof typeof antecedentes) => {
    setAntecedentes(prev => ({ ...prev, [campo]: !prev[campo as keyof typeof antecedentes] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null); setSuccessMsg(null);
    if (!pacienteId) { setErrorMsg("Selecciona un paciente"); return; }
    if (!clinico.diagnostico_principal) { setErrorMsg("El diagnóstico principal es requerido"); return; }

    try {
      setEnviado(true);
      const res = await fetch("/api/historiales/ginecologia", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paciente_id: pacienteId,
          ...clinico,
          ...antecedentes,
          ...examenes,
          controles_prenatales: controles,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccessMsg("Ficha ginecológica guardada exitosamente");
        setTimeout(() => router.push("/dashboard/mis-pacientes"), 1800);
      } else {
        setErrorMsg(result.error || "Error al guardar");
      }
    } catch { setErrorMsg("Error de conexión"); }
    finally { setEnviado(false); }
  };

  const handlePrint = () => {
    if (!paciente) return;
    const w = window.open("", "_blank");
    if (!w) return;

    const antList = [
      ["Embarazo", antecedentes.embarazo],
      ["TBC Pulmonar", antecedentes.tbc_pulmonar],
      ["Hipertensión", antecedentes.hipertension],
      ["Gemelares", antecedentes.gemelares],
      ["Diabetes", antecedentes.diabetes],
      ["HTA Crónica", antecedentes.hipertension_cronica],
      ["Cir. Pélvico-Uterina", antecedentes.cirugia_pelvico_uterina],
      ["Infertilidad", antecedentes.infertilidad],
    ];

    const controlesHtml = controles.map((c, i) => `
      <tr>
        <td style="text-align:center;background:#f8fafc">${i + 1}</td>
        <td>${c.fecha || ""}</td>
        <td style="text-align:center">${c.edad_gestacional || ""}</td>
        <td style="text-align:center">${c.peso || ""}</td>
        <td style="text-align:center">${c.ta || ""}</td>
        <td style="text-align:center">${c.altura_uterina || ""}</td>
        <td style="text-align:center">${c.fcc_mov || ""}</td>
        <td style="text-align:center">${c.edema ? "Sí" : "No"}</td>
        <td style="text-align:center">${c.varice ? "Sí" : "No"}</td>
      </tr>`).join("");

    // Rellenar hasta 12 filas
    const filasFaltantes = 12 - controles.length;
    const filasVacias = Array(filasFaltantes).fill(0).map((_, i) => `
      <tr>
        <td style="text-align:center;background:#f8fafc">${controles.length + i + 1}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>`).join("");

    w.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8">
      <title>Ficha Ginecológica — ${paciente.nombre_completo}</title>
      <style>
        @page { size: letter; margin: 12mm 10mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 9px; color: #111; line-height: 1.3; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0369a1; padding-bottom: 6px; margin-bottom: 8px; }
        .clinic h1 { font-size: 14px; color: #0369a1; margin: 0; }
        .clinic p { font-size: 9px; color: #555; }
        .badge { background: #0369a1; color: white; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; text-align: center; }
        .info-paciente { display: grid; grid-template-columns: repeat(4,1fr); gap: 4px; background: #f0f7ff; border: 1px solid #bae0ff; padding: 6px 8px; border-radius: 4px; margin-bottom: 8px; }
        .info-item label { display: block; font-size: 7.5px; color: #555; text-transform: uppercase; font-weight: bold; }
        .info-item span { font-size: 9.5px; font-weight: bold; }
        .section-title { background: #0369a1; color: white; padding: 3px 8px; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: .5px; margin: 7px 0 4px; border-radius: 2px; }
        .ant-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 3px; margin-bottom: 4px; }
        .ant-item { display: flex; align-items: center; gap: 4px; border: 1px solid #ddd; padding: 3px 6px; border-radius: 3px; font-size: 9px; }
        .ant-item.si { border-color: #0369a1; background: #e0f2fe; color: #0369a1; font-weight: bold; }
        .ant-check { width: 9px; height: 9px; border: 1.5px solid currentColor; display: inline-flex; align-items: center; justify-content: center; border-radius: 1px; font-size: 7px; flex-shrink:0; }
        .examenes-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 4px; margin-bottom: 4px; }
        .exam-item { border-bottom: 1px solid #ddd; padding: 2px 0 3px; }
        .exam-item label { display: block; font-size: 7.5px; color: #777; text-transform: uppercase; font-weight: bold; }
        .exam-item span { font-size: 10px; font-weight: bold; min-height: 12px; display: block; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
        .field-line { border-bottom: 1px solid #ddd; padding: 2px 0 3px; margin-bottom: 3px; }
        .field-line label { font-size: 7.5px; color: #777; text-transform: uppercase; font-weight: bold; display: block; }
        .field-line span { font-size: 9.5px; min-height: 13px; display: block; }
        table { width: 100%; border-collapse: collapse; font-size: 8px; }
        th { background: #0369a1; color: white; padding: 3px 4px; text-align: center; font-size: 7.5px; font-weight: bold; white-space: nowrap; }
        td { border: 1px solid #d1d5db; padding: 3px 4px; height: 16px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .footer { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .firma { text-align: center; padding-top: 28px; border-top: 1px solid #333; font-size: 8px; color: #555; }
        .text-block { border: 1px solid #ddd; padding: 4px 6px; min-height: 20px; border-radius: 2px; font-size: 9px; margin-top: 2px; }
      </style>
    </head><body>

    <div class="header">
      <div class="clinic">
        <h1>🏥 Ficha Ginecológica Obstétrica</h1>
        <p>Dr./Dra. ${usuario?.nombre_completo || ""} &nbsp;·&nbsp; Especialidad: Ginecología</p>
        <p>Fecha de emisión: ${new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })}</p>
      </div>
      <div class="badge">GINECOLOGÍA<br>OBSTETRICIA</div>
    </div>

    <div class="info-paciente">
      <div class="info-item"><label>Paciente</label><span>${paciente.nombre_completo}</span></div>
      <div class="info-item"><label>Cédula</label><span>${paciente.cedula}</span></div>
      <div class="info-item"><label>Edad</label><span>${calcularEdad(paciente.fecha_nacimiento)}</span></div>
      <div class="info-item"><label>Teléfono</label><span>${paciente.telefono || "—"}</span></div>
    </div>

    <div class="section-title">Antecedentes Patológicos</div>
    <div class="ant-grid">
      ${antList.map(([lbl, val]) => `
        <div class="ant-item ${val ? "si" : ""}">
          <div class="ant-check">${val ? "✓" : ""}</div>
          ${lbl}
        </div>`).join("")}
    </div>
    ${antecedentes.antecedentes_familiares ? `
      <div class="field-line"><label>Antecedentes familiares</label><span>${antecedentes.antecedentes_familiares}</span></div>` : ""}

    <div class="section-title">Datos Iniciales y Exámenes</div>
    <div class="examenes-grid">
      <div class="exam-item"><label>T.A. Inicial</label><span>${examenes.ta_inicial || "—"}</span></div>
      <div class="exam-item"><label>VDRL</label><span>${examenes.vdrl || "—"}</span></div>
      <div class="exam-item"><label>Hb (Hemoglobina)</label><span>${examenes.hb || "—"}</span></div>
      <div class="exam-item"><label>Tipo de Sangre</label><span>${examenes.tipo_sangre || paciente.tipo_sangre || "—"}</span></div>
      <div class="exam-item"><label>FUM</label><span>${examenes.fum ? new Date(examenes.fum + "T12:00").toLocaleDateString("es-ES") : "—"}</span></div>
      <div class="exam-item"><label>FPP</label><span>${examenes.fpp ? new Date(examenes.fpp + "T12:00").toLocaleDateString("es-ES") : "—"}</span></div>
      <div class="exam-item"><label>Antitetánicas</label><span>${examenes.antitetanicas || "—"}</span></div>
      <div class="exam-item"><label>Motivo Consulta</label><span>${clinico.motivo_consulta || "—"}</span></div>
    </div>

    <div class="section-title">Controles Prenatales (12 Controles)</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Fecha</th>
          <th>Edad Gestacional</th>
          <th>Peso (kg)</th>
          <th>T.A.</th>
          <th>Alt. Uterina</th>
          <th>FCC / MOV</th>
          <th>Edema</th>
          <th>Várice</th>
        </tr>
      </thead>
      <tbody>
        ${controlesHtml}
        ${filasVacias}
      </tbody>
    </table>

    <div class="row2" style="margin-top:8px">
      <div>
        <div class="field-line"><label>Diagnóstico Principal</label><span>${clinico.diagnostico_principal || ""}</span></div>
        <div class="field-line"><label>Plan de Tratamiento</label><span>${clinico.plan_tratamiento || ""}</span></div>
      </div>
      <div>
        <div class="field-line"><label>Dudas / Observaciones</label><span>${examenes.dudas || clinico.observaciones || ""}</span></div>
      </div>
    </div>

    <div class="footer">
      <div class="firma">Firma del Médico</div>
      <div class="firma">Firma del Paciente</div>
      <div class="firma">Sello / Fecha</div>
    </div>

    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  if (authLoading || loading) {
    return <div className={styles.loading}><div className={styles.spinner} /><p>Cargando...</p></div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}><ArrowLeft size={18} /><span>Volver</span></button>
        <div>
          <h1>Ficha Ginecológica Obstétrica</h1>
          <p className={styles.subtitle}>Registro completo · Ginecología</p>
        </div>
        <div className={styles.headerActions}>
          {pacienteId && (
            <button type="button" className={styles.printBtn} onClick={handlePrint}>
              <Printer size={16} /> Imprimir Ficha
            </button>
          )}
        </div>
      </div>

      {errorMsg && <div className={styles.alertError}>⚠ {errorMsg}</div>}
      {successMsg && <div className={styles.alertSuccess}>✓ {successMsg}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ===== BUSCAR PACIENTE ===== */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>👤 Seleccionar Paciente</h2>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por nombre o cédula..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
            />
            {searchTerm && <button type="button" className={styles.clearBtn} onClick={() => { setSearchTerm(""); setPacienteId(""); setShowResults(false); }}><X size={14} /></button>}
          </div>
          {showResults && searchTerm && (
            <div className={styles.searchResults}>
              {pacientesFiltrados.slice(0, 6).map(p => (
                <div key={p.id} className={styles.searchResult} onClick={() => { setPacienteId(p.id); setSearchTerm(p.nombre_completo); setShowResults(false); cargarHistorialesGine(p.id); }}>
                  <strong>{p.nombre_completo}</strong>
                  <span>Cédula: {p.cedula}</span>
                </div>
              ))}
              {pacientesFiltrados.length === 0 && <div className={styles.noResults}>Sin resultados</div>}
            </div>
          )}
          {paciente && (
            <div className={styles.pacienteInfo}>
              <div><label>Paciente</label><strong>{paciente.nombre_completo}</strong></div>
              <div><label>Cédula</label><strong>{paciente.cedula}</strong></div>
              <div><label>Edad</label><strong>{calcularEdad(paciente.fecha_nacimiento)}</strong></div>
              <div><label>Tel.</label><strong>{paciente.telefono || "—"}</strong></div>
            </div>
          )}
        </div>

        {paciente && (<>

          {/* ===== FICHAS EXISTENTES ===== */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📂 Fichas Ginecológicas Registradas</h2>
            {cargandoHistoriales && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Cargando registros...</p>}
            {!cargandoHistoriales && historialExistente.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                No hay fichas ginecológicas registradas para este paciente. Complete el formulario abajo para crear la primera.
              </p>
            )}
            {!cargandoHistoriales && historialExistente.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historialExistente.map((h: any, i: number) => (
                  <div key={h.id} style={{
                    padding: "10px 14px",
                    background: "var(--primary-bg)",
                    border: "1px solid var(--border-hover)",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                        Ficha #{historialExistente.length - i} — {h.diagnostico_principal}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {new Date(h.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {h.motivo_consulta && (
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Motivo: {h.motivo_consulta}
                      </span>
                    )}
                    {h.historiales_ginecologia?.[0] && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {h.historiales_ginecologia[0].fum && <span>FUM: {h.historiales_ginecologia[0].fum}</span>}
                        {h.historiales_ginecologia[0].fpp && <span>FPP: {h.historiales_ginecologia[0].fpp}</span>}
                        {h.historiales_ginecologia[0].controles_prenatales?.length > 0 &&
                          <span>Controles: {h.historiales_ginecologia[0].controles_prenatales.length}</span>
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                ↓ Complete el formulario a continuación para agregar una nueva ficha ginecológica
              </p>
            </div>
          </div>

          {/* ===== ANTECEDENTES ===== */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📋 Antecedentes Patológicos</h2>
            <div className={styles.antGrid}>
              {([
                ["embarazo", "Embarazo"],
                ["tbc_pulmonar", "TBC Pulmonar"],
                ["hipertension", "Hipertensión"],
                ["gemelares", "Gemelares"],
                ["diabetes", "Diabetes"],
                ["hipertension_cronica", "HTA Crónica"],
                ["cirugia_pelvico_uterina", "Cir. Pélvico-Uterina"],
                ["infertilidad", "Infertilidad"],
              ] as [keyof typeof antecedentes, string][]).map(([campo, label]) => (
                <label key={campo} className={`${styles.antItem} ${antecedentes[campo] ? styles.antItemSi : ""}`}>
                  <input type="checkbox" checked={!!antecedentes[campo]} onChange={() => toggleAnt(campo)} className={styles.antCheck} />
                  {label}
                </label>
              ))}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Antecedentes Familiares</label>
              <input className={styles.input} type="text" placeholder="Describa antecedentes familiares relevantes"
                value={antecedentes.antecedentes_familiares}
                onChange={e => setAntecedentes(prev => ({ ...prev, antecedentes_familiares: e.target.value }))} />
            </div>
          </div>

          {/* ===== EXÁMENES / DATOS INICIALES ===== */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🔬 Datos Iniciales y Exámenes</h2>
            <div className={styles.grid4}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>T.A. Inicial</label>
                <input className={styles.input} type="text" placeholder="120/80"
                  value={examenes.ta_inicial} onChange={e => setExamenes(p => ({ ...p, ta_inicial: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>VDRL</label>
                <input className={styles.input} type="text" placeholder="Reactivo / No reactivo"
                  value={examenes.vdrl} onChange={e => setExamenes(p => ({ ...p, vdrl: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Hb (Hemoglobina)</label>
                <input className={styles.input} type="text" placeholder="g/dL"
                  value={examenes.hb} onChange={e => setExamenes(p => ({ ...p, hb: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tipo de Sangre</label>
                <select className={styles.select}
                  value={examenes.tipo_sangre || paciente.tipo_sangre || ""}
                  onChange={e => setExamenes(p => ({ ...p, tipo_sangre: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>FUM (Última Menstruación)</label>
                <input className={styles.input} type="date"
                  value={examenes.fum} onChange={e => setExamenes(p => ({ ...p, fum: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>FPP (Fecha Probable Parto)</label>
                <input className={styles.input} type="date"
                  value={examenes.fpp} onChange={e => setExamenes(p => ({ ...p, fpp: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Antitetánicas</label>
                <input className={styles.input} type="text" placeholder="Ej: 1ra dosis / completa"
                  value={examenes.antitetanicas} onChange={e => setExamenes(p => ({ ...p, antitetanicas: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Motivo de Consulta</label>
                <input className={styles.input} type="text" placeholder="Motivo principal"
                  value={clinico.motivo_consulta} onChange={e => setCli(p => ({ ...p, motivo_consulta: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ===== CONTROLES PRENATALES ===== */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <h2 className={styles.cardTitle}>🗓 Controles Prenatales</h2>
              <span className={styles.controlCount}>{controles.length} / 12</span>
              {controles.length < 12 && (
                <button type="button" className={styles.addBtn} onClick={agregarControl}>
                  <Plus size={14} /> Agregar control
                </button>
              )}
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.controlTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Edad Gest.</th>
                    <th>Peso (kg)</th>
                    <th>T.A.</th>
                    <th>Alt. Uterina</th>
                    <th>FCC / MOV</th>
                    <th>Edema</th>
                    <th>Várice</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {controles.map((c, i) => (
                    <tr key={c.id}>
                      <td className={styles.tdNum}>{i + 1}</td>
                      <td><input type="date" className={styles.tdInput} value={c.fecha} onChange={e => actualizarControl(i, "fecha", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInput} placeholder="Ej: 8 sem" value={c.edad_gestacional} onChange={e => actualizarControl(i, "edad_gestacional", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInputSm} placeholder="kg" value={c.peso} onChange={e => actualizarControl(i, "peso", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInputSm} placeholder="120/80" value={c.ta} onChange={e => actualizarControl(i, "ta", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInputSm} placeholder="cm" value={c.altura_uterina} onChange={e => actualizarControl(i, "altura_uterina", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInputSm} placeholder="+/+" value={c.fcc_mov} onChange={e => actualizarControl(i, "fcc_mov", e.target.value)} /></td>
                      <td className={styles.tdCheck}>
                        <label className={`${styles.checkToggle} ${c.edema ? styles.checkOn : ""}`}>
                          <input type="checkbox" checked={c.edema} onChange={e => actualizarControl(i, "edema", e.target.checked)} />
                          {c.edema ? "Sí" : "No"}
                        </label>
                      </td>
                      <td className={styles.tdCheck}>
                        <label className={`${styles.checkToggle} ${c.varice ? styles.checkOn : ""}`}>
                          <input type="checkbox" checked={c.varice} onChange={e => actualizarControl(i, "varice", e.target.checked)} />
                          {c.varice ? "Sí" : "No"}
                        </label>
                      </td>
                      <td>
                        {controles.length > 1 && (
                          <button type="button" className={styles.removeBtn} onClick={() => quitarControl(i)}><Trash2 size={13} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== DIAGNÓSTICO / TRATAMIENTO ===== */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📝 Diagnóstico y Tratamiento</h2>
            <div className={styles.grid2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Diagnóstico Principal *</label>
                <textarea className={styles.textarea} rows={3} placeholder="Diagnóstico principal"
                  value={clinico.diagnostico_principal} onChange={e => setCli(p => ({ ...p, diagnostico_principal: e.target.value }))} required />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Plan de Tratamiento *</label>
                <textarea className={styles.textarea} rows={3} placeholder="Plan de tratamiento"
                  value={clinico.plan_tratamiento} onChange={e => setCli(p => ({ ...p, plan_tratamiento: e.target.value }))} />
              </div>
            </div>
            <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
              <label className={styles.label}>Dudas / Observaciones</label>
              <textarea className={styles.textarea} rows={2} placeholder="Dudas del paciente u observaciones adicionales"
                value={examenes.dudas} onChange={e => setExamenes(p => ({ ...p, dudas: e.target.value }))} />
            </div>
          </div>

          {/* ===== BOTONES ===== */}
          <div className={styles.formButtons}>
            <button type="submit" className={styles.submitBtn} disabled={enviado}>
              {enviado ? <><div className={styles.btnSpinner} /> Guardando...</> : <><Save size={16} /> Guardar Ficha</>}
            </button>
            <button type="button" className={styles.printBtnSm} onClick={handlePrint}>
              <Printer size={16} /> Imprimir
            </button>
            <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Cancelar</button>
          </div>

        </>)}
      </form>
    </div>
  );
}
