"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, Printer, Search, X, Plus, Trash2 } from "lucide-react";
import styles from "./ginecologia.module.css";

// ─── Interfaces ──────────────────────────────────────────────

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
  presentacion: string;
  fcc_mov: string;
  edema: boolean;
  varice: boolean;
  proteinuria: string;
  hemoglobina_ctrl: string;
  proximo_control: string;
  observaciones: string;
}

const controlVacio = (id: number): ControlPrenatal => ({
  id,
  fecha: "",
  edad_gestacional: "",
  peso: "",
  ta: "",
  altura_uterina: "",
  presentacion: "cefalica",
  fcc_mov: "",
  edema: false,
  varice: false,
  proteinuria: "",
  hemoglobina_ctrl: "",
  proximo_control: "",
  observaciones: "",
});

// ─── Utilidades ─────────────────────────────────────────────

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

const fmtFecha = (f: string | null | undefined) =>
  f ? new Date(f + "T12:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Componente principal ─────────────────────────────────────

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
  const [historialExistente, setHistorialExistente] = useState<any[]>([]);
  const [cargandoHistoriales, setCargandoHistoriales] = useState(false);

  // ── Antecedentes patológicos (ampliados — MSP RD / CLAP / OMS) ──
  const [antecedentes, setAntecedentes] = useState({
    // Clásicos — backward compatible
    embarazo: false,
    tbc_pulmonar: false,
    hipertension: false,
    gemelares: false,
    diabetes: false,
    hipertension_cronica: false,
    cirugia_pelvico_uterina: false,
    infertilidad: false,
    antecedentes_familiares: "",
    // Enfermedades crónicas
    ant_cardiopatia: false,
    ant_asma: false,
    ant_enfermedad_renal: false,
    ant_hipotiroidismo: false,
    ant_epilepsia: false,
    ant_lupus: false,
    ant_depresion: false,
    ant_anemia_cronica: false,
    ant_trombofilia: false,
    ant_obesidad: false,
    // Infecciosos / ITS
    ant_vih_sida: false,
    ant_hepatitis_b_prev: false,
    ant_sifilis_previa: false,
    ant_its: false,
    // Ginecológicos
    ant_mioma_miomectomia: false,
    ant_conizacion: false,
    ant_endometriosis: false,
    ant_sop: false,
    ant_cerclaje_previo: false,
    // Obstétricos de riesgo
    ant_parto_pretermino: false,
    ant_cesarea_previa: false,
    ant_rciu: false,
    ant_perdida_fetal: false,
    ant_hemorragia_posparto: false,
    ant_diabetes_gestacional: false,
    ant_incomp_cervical: false,
    // Hábitos y factores sociales
    ant_tabaquismo: false,
    ant_alcoholismo: false,
    ant_drogas: false,
    // Texto libre
    antecedentes_personales_otros: "",
  });

  // ── Fórmula obstétrica ──
  const [formula, setFormula] = useState({ g: "", p: "", a: "", c: "", v: "" });

  // ── Historial obstétrico previo ──
  const [histObstetrico, setHistObstetrico] = useState({
    partos_vaginales: "",
    ultimo_parto_fecha: "",
    ultimo_rn_peso_gr: "",
    antec_rn_macrosomico: false,
    antec_rn_bajo_peso: false,
    antec_mortalidad_perinatal: false,
    antec_preeclampsia: false,
  });

  // ── Datos del embarazo actual ──
  const [embarazoActual, setEmbarazoActual] = useState({
    tipo_embarazo: "unico",
    planificado: "" as "" | "true" | "false",
    edad_gestacional_ingreso: "",
    fum: "",
    fpp: "",
  });

  // ── Exámenes iniciales (CLAP completo) ──
  const [examenes, setExamenes] = useState({
    ta_inicial: "",
    vdrl: "",
    hb: "",
    hematocrito: "",
    plaquetas: "",
    grupo_rh: "",
    hiv: "",
    glucemia_ayunas: "",
    hepatitis_b: "",
    toxoplasma: "",
    urocultivo: "",
    estreptococo_b: "",
    antitetanicas: "",
  });

  // ── Controles prenatales ──
  const [controles, setControles] = useState<ControlPrenatal[]>([
    controlVacio(1), controlVacio(2), controlVacio(3), controlVacio(4),
  ]);

  // ── Datos del parto ──
  const [parto, setParto] = useState({
    parto_fecha: "",
    parto_tipo: "",
    parto_inicio: "",
    parto_semanas: "",
    ruptura_membranas: "",
    parto_duracion_horas: "",
    anestesia: "",
    episiotomia: false,
    desgarro: "",
    hemorragia_postparto: false,
    parto_indicacion_cesarea: "",
    parto_complicaciones: "",
  });

  // ── Recién nacido ──
  const [rn, setRn] = useState({
    rn_sexo: "",
    rn_peso_gr: "",
    rn_talla_cm: "",
    rn_perimetro_cefalico: "",
    rn_apgar_1: "",
    rn_apgar_5: "",
    rn_reanimacion: false,
    rn_malformaciones: "",
    rn_lactancia_materna: false,
    rn_ingreso_uci: false,
    rn_observaciones: "",
  });

  // ── Puerperio ──
  const [puerperio, setPuerperio] = useState({
    puerperio_estado: "",
    puerperio_complicaciones: "",
    puerperio_anticonceptivo: "",
    alta_fecha: "",
    alta_observaciones: "",
  });

  // ── Clínico general ──
  const [clinico, setCli] = useState({
    motivo_consulta: "",
    diagnostico_principal: "",
    plan_tratamiento: "",
    observaciones: "",
    peso: "",
    presion_sistolica: "",
    presion_diastolica: "",
  });

  // ─── Effects ──────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || usuario?.rol !== "medico") { router.push("/login"); return; }
    cargarPacientes().then(() => {
      const pid = searchParams.get("paciente");
      if (pid) cargarHistorialesGine(pid);
    });
  }, [isAuthenticated, usuario, authLoading]);

  useEffect(() => {
    if (embarazoActual.fum) {
      setEmbarazoActual(prev => ({ ...prev, fpp: calcularFPP(embarazoActual.fum) }));
    }
  }, [embarazoActual.fum]);

  useEffect(() => {
    const p = parseInt(formula.p) || 0;
    const a = parseInt(formula.a) || 0;
    const c = parseInt(formula.c) || 0;
    if (formula.p || formula.a || formula.c) {
      setFormula(prev => ({ ...prev, g: String(p + a + c + 1) }));
    }
  }, [formula.p, formula.a, formula.c]);

  // ─── Carga de datos ────────────────────────────────────────

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pacientes", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        const lista = d.data || [];
        setPacientes(lista);
        const pid = searchParams.get("paciente");
        if (pid) {
          const p = lista.find((x: any) => x.id === pid);
          if (p) {
            setSearchTerm(p.nombre_completo);
            if (p.tipo_sangre) setExamenes(prev => ({ ...prev, grupo_rh: p.tipo_sangre }));
          }
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
      else setHistorialExistente([]);
    } finally { setCargandoHistoriales(false); }
  };

  // ─── Handlers ─────────────────────────────────────────────

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cedula.includes(searchTerm)
  );

  const paciente = pacientes.find(p => p.id === pacienteId);

  const agregarControl = () => {
    if (controles.length >= 14) return;
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
      const payload = {
        paciente_id: pacienteId,
        ...clinico,
        ...antecedentes,
        formula_g: formula.g ? parseInt(formula.g) : null,
        formula_p: formula.p ? parseInt(formula.p) : null,
        formula_a: formula.a ? parseInt(formula.a) : null,
        formula_c: formula.c ? parseInt(formula.c) : null,
        formula_v: formula.v ? parseInt(formula.v) : null,
        ...histObstetrico,
        ...embarazoActual,
        planificado: embarazoActual.planificado === "true" ? true : embarazoActual.planificado === "false" ? false : null,
        ...examenes,
        controles_prenatales: controles,
        ...parto,
        ...rn,
        ...puerperio,
      };

      const res = await fetch("/api/historiales/ginecologia", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccessMsg("Ficha ginecológica obstétrica guardada exitosamente");
        setTimeout(() => router.push("/dashboard/mis-pacientes"), 1800);
      } else {
        setErrorMsg(result.error || "Error al guardar");
      }
    } catch { setErrorMsg("Error de conexión"); }
    finally { setEnviado(false); }
  };

  // ─── Impresión ────────────────────────────────────────────

  const handlePrint = () => {
    if (!paciente) return;

    // ── Mapas de etiquetas (valores DB → texto en español imprimible) ──
    const mapPartotipo: Record<string, string> = {
      vaginal_espontaneo: "Vaginal espontáneo",
      vaginal_instrumentado: "Vaginal instrumentado",
      cesarea_electiva: "Cesárea electiva",
      cesarea_urgente: "Cesárea urgente",
    };
    const mapInicio: Record<string, string> = {
      espontaneo: "Espontáneo",
      inducido: "Inducido",
      cesarea_programada: "Cesárea sin labor",
    };
    const mapAnestesia: Record<string, string> = {
      ninguna: "Ninguna",
      local: "Local",
      regional_epidural: "Epidural (regional)",
      regional_espinal: "Espinal (regional)",
      general: "General",
    };
    const mapDesgarro: Record<string, string> = {
      ninguno: "Ninguno",
      grado_1: "Grado I",
      grado_2: "Grado II",
      grado_3: "Grado III",
      grado_4: "Grado IV",
    };
    const mapPresentacion: Record<string, string> = {
      cefalica: "Cefálica",
      podalica: "Podálica",
      transversa: "Transversa",
      indefinida: "Indefinida",
    };
    const lbl = (map: Record<string, string>, val: string) => map[val] || val || "—";

    const formulaStr = [
      formula.g ? `G${formula.g}` : "",
      formula.p ? `P${formula.p}` : "",
      formula.a ? `A${formula.a}` : "",
      formula.c ? `C${formula.c}` : "",
      formula.v ? `V${formula.v}` : "",
    ].filter(Boolean).join(" ");

    // ── Listas de antecedentes por categoría ──
    const antCronicos: [string, boolean][] = [
      ["Embarazo previo", antecedentes.embarazo],
      ["Diabetes mellitus", antecedentes.diabetes],
      ["Hipertensión arterial", antecedentes.hipertension],
      ["HTA Crónica", antecedentes.hipertension_cronica],
      ["Tuberculosis (TBC)", antecedentes.tbc_pulmonar],
      ["Cardiopatía / Enf. cardíaca", antecedentes.ant_cardiopatia],
      ["Asma bronquial / EPOC", antecedentes.ant_asma],
      ["Enf. renal / Nefropatía", antecedentes.ant_enfermedad_renal],
      ["Hipotiroidismo / Enf. tiroidea", antecedentes.ant_hipotiroidismo],
      ["Epilepsia / Convulsiones", antecedentes.ant_epilepsia],
      ["Lupus (LES) / Autoinmune", antecedentes.ant_lupus],
      ["Depresión / Salud mental", antecedentes.ant_depresion],
      ["Anemia crónica / Hemoglobinopatía", antecedentes.ant_anemia_cronica],
      ["Trombofilia / Coagulopatía", antecedentes.ant_trombofilia],
      ["Obesidad (IMC ≥ 30)", antecedentes.ant_obesidad],
      ["Embarazo gemelar previo", antecedentes.gemelares],
    ];
    const antInfecciosos: [string, boolean][] = [
      ["VIH / SIDA (conocido previo)", antecedentes.ant_vih_sida],
      ["Hepatitis B (antecedente)", antecedentes.ant_hepatitis_b_prev],
      ["Sífilis (tratada previamente)", antecedentes.ant_sifilis_previa],
      ["Otras ITS (gonorrea, clamidia, VPH, herpes)", antecedentes.ant_its],
    ];
    const antGine: [string, boolean][] = [
      ["Cirugía pélvico-uterina", antecedentes.cirugia_pelvico_uterina],
      ["Infertilidad tratada", antecedentes.infertilidad],
      ["Mioma uterino / Miomectomía", antecedentes.ant_mioma_miomectomia],
      ["Conización cervical / LEEP", antecedentes.ant_conizacion],
      ["Endometriosis", antecedentes.ant_endometriosis],
      ["Síndrome de ovario poliquístico (SOP)", antecedentes.ant_sop],
      ["Cerclaje cervical previo", antecedentes.ant_cerclaje_previo],
    ];
    const antObst: [string, boolean][] = [
      ["Parto pretérmino previo (<37 sem)", antecedentes.ant_parto_pretermino],
      ["Cesárea previa", antecedentes.ant_cesarea_previa],
      ["Preeclampsia previa", histObstetrico.antec_preeclampsia],
      ["RCIU previo", antecedentes.ant_rciu],
      ["Pérdida fetal / Muerte intrauterina", antecedentes.ant_perdida_fetal],
      ["Hemorragia posparto previa", antecedentes.ant_hemorragia_posparto],
      ["Diabetes gestacional previa", antecedentes.ant_diabetes_gestacional],
      ["Incompetencia cervical", antecedentes.ant_incomp_cervical],
      ["RN Macrosómico (>4 kg)", histObstetrico.antec_rn_macrosomico],
      ["RN Bajo peso (<2.5 kg)", histObstetrico.antec_rn_bajo_peso],
      ["Mortalidad perinatal previa", histObstetrico.antec_mortalidad_perinatal],
    ];
    const antHabitos: [string, boolean][] = [
      ["Tabaquismo activo", antecedentes.ant_tabaquismo],
      ["Consumo de alcohol", antecedentes.ant_alcoholismo],
      ["Consumo de drogas / Sustancias", antecedentes.ant_drogas],
    ];

    const antSection = (titulo: string, lista: [string, boolean][]) => `
      <div class="ant-cat-title">${titulo}</div>
      <div class="ant-grid">
        ${lista.map(([etiq, val]) => `
          <div class="ant-item ${val ? "si" : ""}">
            <div class="ant-check">${val ? "✓" : ""}</div>${etiq}
          </div>`).join("")}
      </div>`;

    const controlesConFecha = controles.filter(c => c.fecha);
    const controlesHtml = controlesConFecha.map((c, i) => `
      <tr>
        <td style="text-align:center;background:#f8fafc">${i + 1}</td>
        <td>${fmtFecha(c.fecha)}</td>
        <td style="text-align:center">${c.edad_gestacional || ""}</td>
        <td style="text-align:center">${c.peso || ""}</td>
        <td style="text-align:center">${c.ta || ""}</td>
        <td style="text-align:center">${c.altura_uterina || ""}</td>
        <td style="text-align:center">${lbl(mapPresentacion, c.presentacion)}</td>
        <td style="text-align:center">${c.fcc_mov || ""}</td>
        <td style="text-align:center">${c.edema ? "Sí" : "No"}</td>
        <td style="text-align:center">${c.varice ? "Sí" : "No"}</td>
        <td style="text-align:center">${c.proteinuria === "negativo" ? "Neg." : c.proteinuria || "—"}</td>
        <td style="text-align:center">${c.hemoglobina_ctrl || "—"}</td>
        <td>${c.observaciones || ""}</td>
      </tr>`).join("");

    const filasFaltantes = Math.max(0, 12 - controlesConFecha.length);
    const filasVacias = Array(filasFaltantes).fill(0).map((_, i) => `
      <tr>
        <td style="text-align:center;background:#f8fafc">${controlesConFecha.length + i + 1}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>`).join("");

    const htmlContent = `<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8">
      <title>Historia Clínica Perinatal — ${paciente.nombre_completo}</title>
      <style>
        @page { size: letter; margin: 10mm 8mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 8.5px; color: #111; line-height: 1.3; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #be185d; padding-bottom: 5px; margin-bottom: 7px; }
        .clinic h1 { font-size: 13px; color: #be185d; }
        .clinic p { font-size: 8px; color: #555; }
        .badge { background: #be185d; color: white; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-align: center; white-space: nowrap; }
        .info-paciente { display: grid; grid-template-columns: repeat(4,1fr); gap: 3px; background: #fdf2f8; border: 1px solid #fbcfe8; padding: 5px 7px; border-radius: 4px; margin-bottom: 7px; }
        .info-item label { display: block; font-size: 7px; color: #9d174d; text-transform: uppercase; font-weight: bold; }
        .info-item span { font-size: 9px; font-weight: bold; }
        .section-title { background: #be185d; color: white; padding: 2px 7px; font-size: 8.5px; font-weight: bold; text-transform: uppercase; margin: 6px 0 3px; border-radius: 2px; }
        .ant-cat-title { font-size: 7.5px; font-weight: bold; color: #9d174d; text-transform: uppercase; margin: 4px 0 2px; border-bottom: 1px solid #fbcfe8; padding-bottom: 1px; }
        .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 3px; margin-bottom: 3px; }
        .exam-item { border-bottom: 1px solid #ddd; padding: 2px 0; }
        .exam-item label { display: block; font-size: 7px; color: #777; text-transform: uppercase; font-weight: bold; }
        .exam-item span { font-size: 9px; font-weight: bold; min-height: 11px; display: block; }
        .ant-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 2px; margin-bottom: 2px; }
        .ant-item { display: flex; align-items: center; gap: 3px; border: 1px solid #ddd; padding: 2px 5px; border-radius: 2px; font-size: 8px; }
        .ant-item.si { border-color: #be185d; background: #fce7f3; color: #9d174d; font-weight: bold; }
        .ant-check { width: 8px; height: 8px; border: 1.5px solid currentColor; display: inline-flex; align-items: center; justify-content: center; border-radius: 1px; font-size: 6.5px; flex-shrink:0; }
        table { width: 100%; border-collapse: collapse; font-size: 7.5px; }
        th { background: #be185d; color: white; padding: 2px 3px; text-align: center; font-size: 7px; white-space: nowrap; }
        td { border: 1px solid #d1d5db; padding: 2px 3px; height: 14px; }
        tr:nth-child(even) td { background: #fdf9f0; }
        .field-line { border-bottom: 1px solid #e5e7eb; padding: 2px 0; margin-bottom: 2px; }
        .field-line label { font-size: 7px; color: #777; text-transform: uppercase; font-weight: bold; display: block; }
        .field-line span { font-size: 8.5px; min-height: 12px; display: block; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
        .footer { margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .firma { text-align: center; padding-top: 22px; border-top: 1px solid #333; font-size: 7.5px; color: #555; }
      </style>
    </head><body>

    <div class="header">
      <div class="clinic">
        <h1>🏥 Historia Clínica Perinatal</h1>
        <p>Dr./Dra. ${usuario?.nombre_completo?.toUpperCase() || ""} &nbsp;·&nbsp; Ginecología / Obstetricia &nbsp;·&nbsp; Estándar CLAP/SMR (OPS-OMS)</p>
        <p>Fecha: ${new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })}</p>
      </div>
      <div class="badge">OBSTETRICIA<br>PRENATAL</div>
    </div>

    <div class="info-paciente">
      <div class="info-item"><label>Paciente</label><span>${paciente.nombre_completo}</span></div>
      <div class="info-item"><label>Cédula</label><span>${paciente.cedula}</span></div>
      <div class="info-item"><label>Edad</label><span>${calcularEdad(paciente.fecha_nacimiento)}</span></div>
      <div class="info-item"><label>Teléfono</label><span>${paciente.telefono || "—"}</span></div>
      <div class="info-item"><label>FUM</label><span>${fmtFecha(embarazoActual.fum)}</span></div>
      <div class="info-item"><label>FPP</label><span>${fmtFecha(embarazoActual.fpp)}</span></div>
      <div class="info-item"><label>Tipo embarazo</label><span>${embarazoActual.tipo_embarazo === "unico" ? "Único" : embarazoActual.tipo_embarazo === "gemelar" ? "Gemelar" : embarazoActual.tipo_embarazo || "Único"}</span></div>
      <div class="info-item"><label>EG al ingreso</label><span>${embarazoActual.edad_gestacional_ingreso || "—"}</span></div>
    </div>

    ${formulaStr ? `
    <div style="margin-bottom:5px;padding:3px 8px;background:#fdf2f8;border-radius:4px;display:inline-block">
      <span style="font-size:8px;color:#9d174d;font-weight:bold;text-transform:uppercase">Fórmula obstétrica:</span>
      <span style="font-size:14px;font-weight:bold;color:#be185d;margin-left:8px">${formulaStr}</span>
      ${histObstetrico.partos_vaginales ? `<span style="font-size:8px;color:#555;margin-left:8px">(${histObstetrico.partos_vaginales} partos vaginales)</span>` : ""}
      ${histObstetrico.ultimo_parto_fecha ? `<span style="font-size:8px;color:#555;margin-left:8px">· Último parto: ${fmtFecha(histObstetrico.ultimo_parto_fecha)}</span>` : ""}
    </div>` : ""}

    <div class="section-title">Antecedentes Patológicos</div>
    ${antSection("Enfermedades Crónicas", antCronicos)}
    ${antSection("Antecedentes Infecciosos / Infecciones de Transmisión Sexual", antInfecciosos)}
    ${antSection("Antecedentes Ginecológicos y Quirúrgicos", antGine)}
    ${antSection("Antecedentes Obstétricos de Riesgo", antObst)}
    ${antSection("Hábitos y Factores de Riesgo Social", antHabitos)}
    ${antecedentes.antecedentes_familiares ? `<div class="field-line"><label>Antecedentes familiares</label><span>${antecedentes.antecedentes_familiares}</span></div>` : ""}
    ${antecedentes.antecedentes_personales_otros ? `<div class="field-line"><label>Otros antecedentes personales</label><span>${antecedentes.antecedentes_personales_otros}</span></div>` : ""}

    <div class="section-title">Exámenes de Laboratorio Iniciales (CLAP)</div>
    <div class="grid4">
      <div class="exam-item"><label>T.A. Inicial</label><span>${examenes.ta_inicial||"—"}</span></div>
      <div class="exam-item"><label>VDRL / RPR (Sífilis)</label><span>${examenes.vdrl||"—"}</span></div>
      <div class="exam-item"><label>Hemoglobina (g/dL)</label><span>${examenes.hb||"—"}</span></div>
      <div class="exam-item"><label>Hematocrito (%)</label><span>${examenes.hematocrito||"—"}</span></div>
      <div class="exam-item"><label>Grupo sanguíneo / Rh</label><span>${examenes.grupo_rh||"—"}</span></div>
      <div class="exam-item"><label>VIH</label><span>${examenes.hiv||"—"}</span></div>
      <div class="exam-item"><label>Glucemia en ayunas</label><span>${examenes.glucemia_ayunas ? examenes.glucemia_ayunas + " mg/dL" : "—"}</span></div>
      <div class="exam-item"><label>Hepatitis B (HBsAg)</label><span>${examenes.hepatitis_b||"—"}</span></div>
      <div class="exam-item"><label>Toxoplasma IgG / IgM</label><span>${examenes.toxoplasma||"—"}</span></div>
      <div class="exam-item"><label>Urocultivo</label><span>${examenes.urocultivo||"—"}</span></div>
      <div class="exam-item"><label>Estreptococo B (SGB)</label><span>${examenes.estreptococo_b||"—"}</span></div>
      <div class="exam-item"><label>Antitetánicas</label><span>${examenes.antitetanicas||"—"}</span></div>
    </div>

    <div class="section-title">Controles Prenatales</div>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Fecha</th><th>EG</th><th>Peso</th><th>T.A.</th>
          <th>A.U.</th><th>Presentación</th><th>FCC/MOV</th>
          <th>Edema</th><th>Várice</th><th>Proteinuria</th><th>Hb ctrl</th><th>Observaciones</th>
        </tr>
      </thead>
      <tbody>${controlesHtml}${filasVacias}</tbody>
    </table>

    ${parto.parto_fecha || parto.parto_tipo ? `
    <div class="section-title">Datos del Parto</div>
    <div class="grid4">
      <div class="exam-item"><label>Fecha y hora del parto</label><span>${parto.parto_fecha ? new Date(parto.parto_fecha).toLocaleString("es-ES") : "—"}</span></div>
      <div class="exam-item"><label>Tipo de parto</label><span>${lbl(mapPartotipo, parto.parto_tipo)}</span></div>
      <div class="exam-item"><label>Inicio del trabajo de parto</label><span>${lbl(mapInicio, parto.parto_inicio)}</span></div>
      <div class="exam-item"><label>Semanas al parto</label><span>${parto.parto_semanas ? parto.parto_semanas + " semanas" : "—"}</span></div>
      <div class="exam-item"><label>Ruptura de membranas</label><span>${parto.ruptura_membranas||"—"}</span></div>
      <div class="exam-item"><label>Duración trabajo de parto</label><span>${parto.parto_duracion_horas ? parto.parto_duracion_horas + " horas" : "—"}</span></div>
      <div class="exam-item"><label>Anestesia utilizada</label><span>${lbl(mapAnestesia, parto.anestesia)}</span></div>
      <div class="exam-item"><label>Desgarro perineal</label><span>${lbl(mapDesgarro, parto.desgarro)}</span></div>
      <div class="exam-item"><label>Episiotomía</label><span>${parto.episiotomia ? "Sí, realizada" : "No"}</span></div>
      <div class="exam-item"><label>Hemorragia posparto</label><span>${parto.hemorragia_postparto ? "Sí, presente" : "No"}</span></div>
      ${parto.parto_indicacion_cesarea ? `<div class="exam-item" style="grid-column:span 2"><label>Indicación de la cesárea</label><span>${parto.parto_indicacion_cesarea}</span></div>` : ""}
    </div>
    ${parto.parto_complicaciones ? `<div class="field-line"><label>Complicaciones del parto</label><span>${parto.parto_complicaciones}</span></div>` : ""}
    ` : ""}

    ${rn.rn_peso_gr || rn.rn_apgar_1 ? `
    <div class="section-title">Datos del Recién Nacido</div>
    <div class="grid4">
      <div class="exam-item"><label>Sexo</label><span>${rn.rn_sexo === "M" ? "Masculino" : rn.rn_sexo === "F" ? "Femenino" : "—"}</span></div>
      <div class="exam-item"><label>Peso al nacer</label><span>${rn.rn_peso_gr ? rn.rn_peso_gr + " gramos" : "—"}</span></div>
      <div class="exam-item"><label>Talla</label><span>${rn.rn_talla_cm ? rn.rn_talla_cm + " cm" : "—"}</span></div>
      <div class="exam-item"><label>Perímetro cefálico</label><span>${rn.rn_perimetro_cefalico ? rn.rn_perimetro_cefalico + " cm" : "—"}</span></div>
      <div class="exam-item"><label>Apgar al 1 minuto</label><span>${rn.rn_apgar_1 || "—"}</span></div>
      <div class="exam-item"><label>Apgar a los 5 minutos</label><span>${rn.rn_apgar_5 || "—"}</span></div>
      <div class="exam-item"><label>Reanimación neonatal</label><span>${rn.rn_reanimacion ? "Sí, requerida" : "No"}</span></div>
      <div class="exam-item"><label>Lactancia materna</label><span>${rn.rn_lactancia_materna ? "Sí, iniciada" : "No"}</span></div>
      <div class="exam-item"><label>Ingreso UCI neonatal</label><span>${rn.rn_ingreso_uci ? "Sí" : "No"}</span></div>
    </div>
    ${rn.rn_malformaciones ? `<div class="field-line"><label>Malformaciones / Anomalías congénitas</label><span>${rn.rn_malformaciones}</span></div>` : ""}
    ${rn.rn_observaciones ? `<div class="field-line"><label>Observaciones del recién nacido</label><span>${rn.rn_observaciones}</span></div>` : ""}
    ` : ""}

    ${puerperio.puerperio_estado || puerperio.alta_fecha || puerperio.puerperio_anticonceptivo ? `
    <div class="section-title">Puerperio</div>
    <div class="grid4">
      <div class="exam-item"><label>Estado del puerperio</label><span>${puerperio.puerperio_estado === "normal" ? "Normal" : puerperio.puerperio_estado === "complicado" ? "Complicado" : puerperio.puerperio_estado || "—"}</span></div>
      <div class="exam-item"><label>Anticonceptivo posparto</label><span>${puerperio.puerperio_anticonceptivo || "—"}</span></div>
      <div class="exam-item"><label>Fecha de alta</label><span>${fmtFecha(puerperio.alta_fecha)}</span></div>
    </div>
    ${puerperio.puerperio_complicaciones ? `<div class="field-line"><label>Complicaciones del puerperio</label><span>${puerperio.puerperio_complicaciones}</span></div>` : ""}
    ${puerperio.alta_observaciones ? `<div class="field-line"><label>Indicaciones al alta / Próxima cita</label><span>${puerperio.alta_observaciones}</span></div>` : ""}
    ` : ""}

    <div class="section-title">Diagnóstico y Plan de Tratamiento</div>
    <div class="grid2">
      <div>
        <div class="field-line"><label>Diagnóstico principal</label><span>${clinico.diagnostico_principal||""}</span></div>
        <div class="field-line"><label>Plan de tratamiento</label><span>${clinico.plan_tratamiento||""}</span></div>
      </div>
      <div>
        ${clinico.motivo_consulta ? `<div class="field-line"><label>Motivo de consulta</label><span>${clinico.motivo_consulta}</span></div>` : ""}
        <div class="field-line"><label>Observaciones</label><span>${clinico.observaciones||""}</span></div>
      </div>
    </div>

    <div class="footer">
      <div class="firma">Firma del Médico</div>
      <div class="firma">Firma del Paciente / Familiar</div>
      <div class="firma">Sello / Fecha</div>
    </div>

    </body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open();
    doc.write(htmlContent);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  // ─── Render ────────────────────────────────────────────────

  if (authLoading || loading) {
    return <div className={styles.loading}><div className={styles.spinner} /><p>Cargando...</p></div>;
  }

  const inputCls = styles.input;
  const selCls = styles.select;
  const labelCls = styles.label;
  const fgCls = styles.fieldGroup;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}><ArrowLeft size={18} /><span>Volver</span></button>
        <div>
          <h1>Historia Clínica Perinatal</h1>
          <p className={styles.subtitle}>Ginecología / Obstetricia · Estándar CLAP/SMR (OPS-OMS)</p>
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

        {/* ══ SELECCIONAR PACIENTE ══ */}
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
            {searchTerm && (
              <button type="button" className={styles.clearBtn}
                onClick={() => { setSearchTerm(""); setPacienteId(""); setShowResults(false); }}>
                <X size={14} />
              </button>
            )}
          </div>
          {showResults && searchTerm && (
            <div className={styles.searchResults}>
              {pacientesFiltrados.slice(0, 6).map(p => (
                <div key={p.id} className={styles.searchResult}
                  onClick={() => {
                    setPacienteId(p.id);
                    setSearchTerm(p.nombre_completo);
                    setShowResults(false);
                    cargarHistorialesGine(p.id);
                    if (p.tipo_sangre) setExamenes(prev => ({ ...prev, grupo_rh: p.tipo_sangre! }));
                  }}>
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

          {/* ══ FICHAS EXISTENTES ══ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📂 Fichas Ginecológicas Registradas</h2>
            {cargandoHistoriales && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Cargando registros...</p>}
            {!cargandoHistoriales && historialExistente.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                No hay fichas registradas para este paciente. Complete el formulario para crear la primera.
              </p>
            )}
            {!cargandoHistoriales && historialExistente.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historialExistente.map((h: any, i: number) => {
                  const g = h.historiales_ginecologia?.[0];
                  return (
                    <div key={h.id} style={{ padding: "10px 14px", background: "var(--primary-bg)", border: "1px solid var(--border-hover)", borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>
                          Ficha #{historialExistente.length - i} — {h.diagnostico_principal}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(h.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      {h.motivo_consulta && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Motivo: {h.motivo_consulta}</span>}
                      {g && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 10, flexWrap: "wrap", marginTop: 3 }}>
                          {g.fum && <span>FUM: {fmtFecha(g.fum)}</span>}
                          {g.fpp && <span>FPP: {fmtFecha(g.fpp)}</span>}
                          {(g.formula_g || g.formula_p) && (
                            <span>
                              {[g.formula_g && `G${g.formula_g}`, g.formula_p && `P${g.formula_p}`, g.formula_a && `A${g.formula_a}`, g.formula_c && `C${g.formula_c}`].filter(Boolean).join(" ")}
                            </span>
                          )}
                          {g.controles_prenatales?.length > 0 && <span>Controles: {g.controles_prenatales.length}</span>}
                          {g.parto_tipo && <span>Parto: {g.parto_tipo}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                ↓ Complete el formulario a continuación para agregar una nueva ficha
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              ANTECEDENTES PATOLÓGICOS — AMPLIADOS (MSP RD / CLAP)
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📋 Antecedentes Patológicos</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
              Marque todos los antecedentes presentes. Basado en Protocolos MSP República Dominicana y estándar CLAP/OMS.
            </p>

            {/* — Enfermedades Crónicas — */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginBottom: 6, borderBottom: "1px solid var(--border)", paddingBottom: 3 }}>
              Enfermedades Crónicas
            </p>
            <div className={styles.antGrid} style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 14 }}>
              {([
                ["embarazo", "Embarazo previo"],
                ["diabetes", "Diabetes mellitus"],
                ["hipertension", "Hipertensión arterial"],
                ["hipertension_cronica", "HTA Crónica"],
                ["tbc_pulmonar", "Tuberculosis (TBC)"],
                ["ant_cardiopatia", "Cardiopatía / Enf. cardíaca"],
                ["ant_asma", "Asma bronquial / EPOC"],
                ["ant_enfermedad_renal", "Enf. renal / Nefropatía"],
                ["ant_hipotiroidismo", "Hipotiroidismo / Enf. tiroidea"],
                ["ant_epilepsia", "Epilepsia / Convulsiones"],
                ["ant_lupus", "Lupus (LES) / Autoinmune"],
                ["ant_depresion", "Depresión / Salud mental"],
                ["ant_anemia_cronica", "Anemia crónica / Hemoglobinopatía"],
                ["ant_trombofilia", "Trombofilia / Coagulopatía"],
                ["ant_obesidad", "Obesidad (IMC ≥ 30)"],
                ["gemelares", "Embarazo gemelar previo"],
              ] as [keyof typeof antecedentes, string][]).map(([campo, label]) => (
                <label key={campo} className={`${styles.antItem} ${antecedentes[campo as keyof typeof antecedentes] ? styles.antItemSi : ""}`}>
                  <input type="checkbox"
                    checked={!!antecedentes[campo as keyof typeof antecedentes]}
                    onChange={() => toggleAnt(campo as keyof typeof antecedentes)}
                    className={styles.antCheck} />
                  {label}
                </label>
              ))}
            </div>

            {/* — Infecciosos / ITS — */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginBottom: 6, borderBottom: "1px solid var(--border)", paddingBottom: 3 }}>
              Antecedentes Infecciosos / Infecciones de Transmisión Sexual (ITS)
            </p>
            <div className={styles.antGrid} style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 14 }}>
              {([
                ["ant_vih_sida", "VIH / SIDA (conocido previo)"],
                ["ant_hepatitis_b_prev", "Hepatitis B (antecedente previo)"],
                ["ant_sifilis_previa", "Sífilis (tratada previamente)"],
                ["ant_its", "Otras ITS (gonorrea, clamidia, VPH, herpes)"],
              ] as [keyof typeof antecedentes, string][]).map(([campo, label]) => (
                <label key={campo} className={`${styles.antItem} ${antecedentes[campo as keyof typeof antecedentes] ? styles.antItemSi : ""}`}>
                  <input type="checkbox"
                    checked={!!antecedentes[campo as keyof typeof antecedentes]}
                    onChange={() => toggleAnt(campo as keyof typeof antecedentes)}
                    className={styles.antCheck} />
                  {label}
                </label>
              ))}
            </div>

            {/* — Ginecológicos — */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginBottom: 6, borderBottom: "1px solid var(--border)", paddingBottom: 3 }}>
              Antecedentes Ginecológicos y Quirúrgicos
            </p>
            <div className={styles.antGrid} style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 14 }}>
              {([
                ["cirugia_pelvico_uterina", "Cirugía pélvico-uterina previa"],
                ["infertilidad", "Infertilidad tratada"],
                ["ant_mioma_miomectomia", "Mioma uterino / Miomectomía"],
                ["ant_conizacion", "Conización cervical / LEEP"],
                ["ant_endometriosis", "Endometriosis"],
                ["ant_sop", "Síndrome ovario poliquístico (SOP)"],
                ["ant_cerclaje_previo", "Cerclaje cervical previo"],
              ] as [keyof typeof antecedentes, string][]).map(([campo, label]) => (
                <label key={campo} className={`${styles.antItem} ${antecedentes[campo as keyof typeof antecedentes] ? styles.antItemSi : ""}`}>
                  <input type="checkbox"
                    checked={!!antecedentes[campo as keyof typeof antecedentes]}
                    onChange={() => toggleAnt(campo as keyof typeof antecedentes)}
                    className={styles.antCheck} />
                  {label}
                </label>
              ))}
            </div>

            {/* — Obstétricos de Riesgo — */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginBottom: 6, borderBottom: "1px solid var(--border)", paddingBottom: 3 }}>
              Antecedentes Obstétricos de Riesgo
            </p>
            <div className={styles.antGrid} style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 14 }}>
              {([
                ["ant_parto_pretermino", "Parto pretérmino previo (<37 sem)"],
                ["ant_cesarea_previa", "Cesárea previa"],
                ["ant_rciu", "RCIU previo (restricción crecimiento)"],
                ["ant_perdida_fetal", "Pérdida fetal / Muerte intrauterina"],
                ["ant_hemorragia_posparto", "Hemorragia posparto previa"],
                ["ant_diabetes_gestacional", "Diabetes gestacional previa"],
                ["ant_incomp_cervical", "Incompetencia cervical / Abortos tardíos"],
              ] as [keyof typeof antecedentes, string][]).map(([campo, label]) => (
                <label key={campo} className={`${styles.antItem} ${antecedentes[campo as keyof typeof antecedentes] ? styles.antItemSi : ""}`}>
                  <input type="checkbox"
                    checked={!!antecedentes[campo as keyof typeof antecedentes]}
                    onChange={() => toggleAnt(campo as keyof typeof antecedentes)}
                    className={styles.antCheck} />
                  {label}
                </label>
              ))}
            </div>

            {/* — Hábitos y Factores Sociales — */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginBottom: 6, borderBottom: "1px solid var(--border)", paddingBottom: 3 }}>
              Hábitos y Factores de Riesgo Social
            </p>
            <div className={styles.antGrid} style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 14 }}>
              {([
                ["ant_tabaquismo", "Tabaquismo activo"],
                ["ant_alcoholismo", "Consumo de alcohol"],
                ["ant_drogas", "Consumo de drogas / Sustancias"],
              ] as [keyof typeof antecedentes, string][]).map(([campo, label]) => (
                <label key={campo} className={`${styles.antItem} ${antecedentes[campo as keyof typeof antecedentes] ? styles.antItemSi : ""}`}>
                  <input type="checkbox"
                    checked={!!antecedentes[campo as keyof typeof antecedentes]}
                    onChange={() => toggleAnt(campo as keyof typeof antecedentes)}
                    className={styles.antCheck} />
                  {label}
                </label>
              ))}
            </div>

            <div className={fgCls}>
              <label className={labelCls}>Antecedentes Familiares</label>
              <input className={inputCls} type="text"
                placeholder="Hipertensión, diabetes, malformaciones, enfermedades hereditarias..."
                value={antecedentes.antecedentes_familiares}
                onChange={e => setAntecedentes(prev => ({ ...prev, antecedentes_familiares: e.target.value }))} />
            </div>
            <div className={fgCls} style={{ marginTop: 8 }}>
              <label className={labelCls}>Otros Antecedentes Personales Relevantes</label>
              <textarea className={styles.textarea} rows={2}
                placeholder="Cualquier otro antecedente médico o quirúrgico no listado arriba..."
                value={antecedentes.antecedentes_personales_otros}
                onChange={e => setAntecedentes(prev => ({ ...prev, antecedentes_personales_otros: e.target.value }))} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              FÓRMULA OBSTÉTRICA — NUEVO
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🔢 Fórmula Obstétrica</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
              G = Gestaciones totales · P = Partos a término · A = Abortos · C = Cesáreas · V = Hijos vivos actualmente
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 16 }}>
              {(["g","p","a","c","v"] as const).map(k => (
                <div key={k} className={fgCls}>
                  <label className={labelCls} style={{ textAlign: "center" }}>
                    {k.toUpperCase()}
                    <span style={{ fontWeight: "normal", marginLeft: 4, fontSize: 10 }}>
                      {k==="g"?"(Total)":k==="p"?"(Partos)":k==="a"?"(Abortos)":k==="c"?"(Cesáreas)":"(Vivos)"}
                    </span>
                  </label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    max="20"
                    placeholder="0"
                    value={formula[k]}
                    style={{ textAlign: "center", fontWeight: 700, fontSize: 18 }}
                    onChange={e => setFormula(prev => ({ ...prev, [k]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Historial obstétrico previo</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
              <div className={fgCls}>
                <label className={labelCls}>Partos vaginales previos</label>
                <input className={inputCls} type="number" min="0" placeholder="0"
                  value={histObstetrico.partos_vaginales}
                  onChange={e => setHistObstetrico(p => ({ ...p, partos_vaginales: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Fecha último parto</label>
                <input className={inputCls} type="date"
                  value={histObstetrico.ultimo_parto_fecha}
                  onChange={e => setHistObstetrico(p => ({ ...p, ultimo_parto_fecha: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Peso último RN (gr)</label>
                <input className={inputCls} type="number" min="0" placeholder="ej: 3200"
                  value={histObstetrico.ultimo_rn_peso_gr}
                  onChange={e => setHistObstetrico(p => ({ ...p, ultimo_rn_peso_gr: e.target.value }))} />
              </div>
            </div>
            <div className={styles.antGrid} style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
              {([
                ["antec_preeclampsia", "Preeclampsia previa"],
                ["antec_rn_macrosomico", "RN Macrosómico (>4kg)"],
                ["antec_rn_bajo_peso", "RN Bajo peso (<2.5kg)"],
                ["antec_mortalidad_perinatal", "Mort. Perinatal previa"],
              ] as [keyof typeof histObstetrico, string][]).map(([campo, label]) => (
                <label key={campo} className={`${styles.antItem} ${histObstetrico[campo] ? styles.antItemSi : ""}`}>
                  <input type="checkbox"
                    checked={!!histObstetrico[campo]}
                    onChange={() => setHistObstetrico(p => ({ ...p, [campo]: !p[campo] }))}
                    className={styles.antCheck} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              DATOS DEL EMBARAZO ACTUAL
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🤰 Datos del Embarazo Actual</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <div className={fgCls}>
                <label className={labelCls}>FUM (Última Menstruación)</label>
                <input className={inputCls} type="date"
                  value={embarazoActual.fum}
                  onChange={e => setEmbarazoActual(p => ({ ...p, fum: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>FPP (Fecha Probable Parto)</label>
                <input className={inputCls} type="date"
                  value={embarazoActual.fpp}
                  onChange={e => setEmbarazoActual(p => ({ ...p, fpp: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>EG al ingreso</label>
                <input className={inputCls} type="text" placeholder="ej: 10 sem 3 días"
                  value={embarazoActual.edad_gestacional_ingreso}
                  onChange={e => setEmbarazoActual(p => ({ ...p, edad_gestacional_ingreso: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Tipo de embarazo</label>
                <select className={selCls} value={embarazoActual.tipo_embarazo}
                  onChange={e => setEmbarazoActual(p => ({ ...p, tipo_embarazo: e.target.value }))}>
                  <option value="unico">Único</option>
                  <option value="gemelar">Gemelar</option>
                  <option value="triple">Triple</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>¿Embarazo planificado?</label>
                <select className={selCls} value={embarazoActual.planificado}
                  onChange={e => setEmbarazoActual(p => ({ ...p, planificado: e.target.value as any }))}>
                  <option value="">No especificado</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Motivo de consulta</label>
                <input className={inputCls} type="text" placeholder="Motivo principal"
                  value={clinico.motivo_consulta}
                  onChange={e => setCli(p => ({ ...p, motivo_consulta: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Peso actual (kg)</label>
                <input className={inputCls} type="text" placeholder="kg"
                  value={clinico.peso}
                  onChange={e => setCli(p => ({ ...p, peso: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>T.A. Inicial</label>
                <input className={inputCls} type="text" placeholder="120/80"
                  value={examenes.ta_inicial}
                  onChange={e => setExamenes(p => ({ ...p, ta_inicial: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              EXÁMENES DE LABORATORIO INICIALES — CLAP
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🔬 Exámenes de Laboratorio Iniciales (CLAP)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <div className={fgCls}>
                <label className={labelCls}>VDRL / RPR</label>
                <input className={inputCls} type="text" placeholder="Reactivo / No reactivo"
                  value={examenes.vdrl}
                  onChange={e => setExamenes(p => ({ ...p, vdrl: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Hemoglobina (g/dL)</label>
                <input className={inputCls} type="text" placeholder="g/dL"
                  value={examenes.hb}
                  onChange={e => setExamenes(p => ({ ...p, hb: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Hematocrito (%)</label>
                <input className={inputCls} type="text" placeholder="%"
                  value={examenes.hematocrito}
                  onChange={e => setExamenes(p => ({ ...p, hematocrito: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Plaquetas (10³/µL)</label>
                <input className={inputCls} type="text" placeholder="ej: 250"
                  value={examenes.plaquetas}
                  onChange={e => setExamenes(p => ({ ...p, plaquetas: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Grupo sanguíneo / Rh</label>
                <select className={selCls} value={examenes.grupo_rh}
                  onChange={e => setExamenes(p => ({ ...p, grupo_rh: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>VIH</label>
                <select className={selCls} value={examenes.hiv}
                  onChange={e => setExamenes(p => ({ ...p, hiv: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="NR">No Reactivo (NR)</option>
                  <option value="R">Reactivo (R)</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Glucemia en ayunas (mg/dL)</label>
                <input className={inputCls} type="text" placeholder="mg/dL"
                  value={examenes.glucemia_ayunas}
                  onChange={e => setExamenes(p => ({ ...p, glucemia_ayunas: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Hepatitis B (HBsAg)</label>
                <select className={selCls} value={examenes.hepatitis_b}
                  onChange={e => setExamenes(p => ({ ...p, hepatitis_b: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="Negativo">Negativo</option>
                  <option value="Positivo">Positivo</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Toxoplasma IgG / IgM</label>
                <input className={inputCls} type="text" placeholder="ej: IgG+ / IgM-"
                  value={examenes.toxoplasma}
                  onChange={e => setExamenes(p => ({ ...p, toxoplasma: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Urocultivo</label>
                <input className={inputCls} type="text" placeholder="Negativo / Positivo"
                  value={examenes.urocultivo}
                  onChange={e => setExamenes(p => ({ ...p, urocultivo: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Estreptococo B (SGB 35-37 sem)</label>
                <select className={selCls} value={examenes.estreptococo_b}
                  onChange={e => setExamenes(p => ({ ...p, estreptococo_b: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="Negativo">Negativo</option>
                  <option value="Positivo">Positivo</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="No realizado">No realizado</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Antitetánicas</label>
                <input className={inputCls} type="text" placeholder="ej: 1ra dosis / Completa"
                  value={examenes.antitetanicas}
                  onChange={e => setExamenes(p => ({ ...p, antitetanicas: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              CONTROLES PRENATALES — EXPANDIDO
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <h2 className={styles.cardTitle}>🗓 Controles Prenatales</h2>
              <span className={styles.controlCount}>{controles.length} / 14</span>
              {controles.length < 14 && (
                <button type="button" className={styles.addBtn} onClick={agregarControl}>
                  <Plus size={14} /> Agregar
                </button>
              )}
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.controlTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>EG</th>
                    <th>Peso (kg)</th>
                    <th>T.A.</th>
                    <th>A.U. (cm)</th>
                    <th>Presentación</th>
                    <th>FCC / MOV</th>
                    <th>Edema</th>
                    <th>Várice</th>
                    <th>Proteinuria</th>
                    <th>Hb ctrl</th>
                    <th>Próx. Control</th>
                    <th>Obs.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {controles.map((c, i) => (
                    <tr key={c.id}>
                      <td className={styles.tdNum}>{i + 1}</td>
                      <td><input type="date" className={styles.tdInput} value={c.fecha} onChange={e => actualizarControl(i, "fecha", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInput} placeholder="10s3d" value={c.edad_gestacional} onChange={e => actualizarControl(i, "edad_gestacional", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInputSm} placeholder="kg" value={c.peso} onChange={e => actualizarControl(i, "peso", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInputSm} placeholder="120/80" value={c.ta} onChange={e => actualizarControl(i, "ta", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInputSm} placeholder="cm" value={c.altura_uterina} onChange={e => actualizarControl(i, "altura_uterina", e.target.value)} /></td>
                      <td>
                        <select style={{ fontSize: 11, padding: "1px 2px", border: "1px solid #ddd", borderRadius: 3, width: "100%", minWidth: 80 }}
                          value={c.presentacion}
                          onChange={e => actualizarControl(i, "presentacion", e.target.value)}>
                          <option value="cefalica">Cefálica</option>
                          <option value="podalica">Podálica</option>
                          <option value="transversa">Transversa</option>
                          <option value="indefinida">Indefinida</option>
                        </select>
                      </td>
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
                        <select style={{ fontSize: 11, padding: "1px 2px", border: "1px solid #ddd", borderRadius: 3, width: "100%" }}
                          value={c.proteinuria}
                          onChange={e => actualizarControl(i, "proteinuria", e.target.value)}>
                          <option value="">—</option>
                          <option value="negativo">Neg.</option>
                          <option value="trazas">Trazas</option>
                          <option value="1+">1+</option>
                          <option value="2+">2+</option>
                          <option value="3+">3+</option>
                        </select>
                      </td>
                      <td><input type="text" className={styles.tdInputSm} placeholder="g/dL" value={c.hemoglobina_ctrl} onChange={e => actualizarControl(i, "hemoglobina_ctrl", e.target.value)} /></td>
                      <td><input type="date" className={styles.tdInput} value={c.proximo_control} onChange={e => actualizarControl(i, "proximo_control", e.target.value)} /></td>
                      <td><input type="text" className={styles.tdInput} placeholder="notas" value={c.observaciones} onChange={e => actualizarControl(i, "observaciones", e.target.value)} /></td>
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

          {/* ══════════════════════════════════════════════════════
              DATOS DEL PARTO — NUEVO
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🏥 Datos del Parto</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
              Completar al momento del parto. Dejar en blanco si aún no ha ocurrido.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <div className={fgCls}>
                <label className={labelCls}>Fecha y hora del parto</label>
                <input className={inputCls} type="datetime-local"
                  value={parto.parto_fecha}
                  onChange={e => setParto(p => ({ ...p, parto_fecha: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Tipo de parto</label>
                <select className={selCls} value={parto.parto_tipo}
                  onChange={e => setParto(p => ({ ...p, parto_tipo: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="vaginal_espontaneo">Vaginal espontáneo</option>
                  <option value="vaginal_instrumentado">Vaginal instrumentado</option>
                  <option value="cesarea_electiva">Cesárea electiva</option>
                  <option value="cesarea_urgente">Cesárea urgente</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Inicio del trabajo de parto</label>
                <select className={selCls} value={parto.parto_inicio}
                  onChange={e => setParto(p => ({ ...p, parto_inicio: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="espontaneo">Espontáneo</option>
                  <option value="inducido">Inducido</option>
                  <option value="cesarea_programada">Cesárea sin labor</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Semanas al parto</label>
                <input className={inputCls} type="number" min="20" max="45" placeholder="ej: 39"
                  value={parto.parto_semanas}
                  onChange={e => setParto(p => ({ ...p, parto_semanas: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Ruptura de membranas</label>
                <input className={inputCls} type="text" placeholder="ej: Espontánea a las 14:20 h"
                  value={parto.ruptura_membranas}
                  onChange={e => setParto(p => ({ ...p, ruptura_membranas: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Duración del T. de parto (horas)</label>
                <input className={inputCls} type="text" placeholder="horas"
                  value={parto.parto_duracion_horas}
                  onChange={e => setParto(p => ({ ...p, parto_duracion_horas: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Anestesia</label>
                <select className={selCls} value={parto.anestesia}
                  onChange={e => setParto(p => ({ ...p, anestesia: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="ninguna">Ninguna</option>
                  <option value="local">Local</option>
                  <option value="regional_epidural">Epidural</option>
                  <option value="regional_espinal">Espinal</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Desgarro perineal</label>
                <select className={selCls} value={parto.desgarro}
                  onChange={e => setParto(p => ({ ...p, desgarro: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="ninguno">Ninguno</option>
                  <option value="grado_1">Grado I</option>
                  <option value="grado_2">Grado II</option>
                  <option value="grado_3">Grado III</option>
                  <option value="grado_4">Grado IV</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, margin: "12px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={parto.episiotomia}
                  onChange={e => setParto(p => ({ ...p, episiotomia: e.target.checked }))} />
                Episiotomía realizada
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={parto.hemorragia_postparto}
                  onChange={e => setParto(p => ({ ...p, hemorragia_postparto: e.target.checked }))} />
                Hemorragia posparto
              </label>
            </div>
            {(parto.parto_tipo === "cesarea_electiva" || parto.parto_tipo === "cesarea_urgente") && (
              <div className={fgCls}>
                <label className={labelCls}>Indicación de la cesárea</label>
                <input className={inputCls} type="text" placeholder="Justificación clínica de la cesárea"
                  value={parto.parto_indicacion_cesarea}
                  onChange={e => setParto(p => ({ ...p, parto_indicacion_cesarea: e.target.value }))} />
              </div>
            )}
            <div className={fgCls} style={{ marginTop: 8 }}>
              <label className={labelCls}>Complicaciones del parto</label>
              <textarea className={styles.textarea} rows={2} placeholder="Describa cualquier complicación"
                value={parto.parto_complicaciones}
                onChange={e => setParto(p => ({ ...p, parto_complicaciones: e.target.value }))} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              RECIÉN NACIDO — NUEVO
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>👶 Recién Nacido</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <div className={fgCls}>
                <label className={labelCls}>Sexo</label>
                <select className={selCls} value={rn.rn_sexo}
                  onChange={e => setRn(p => ({ ...p, rn_sexo: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Peso al nacer (gr)</label>
                <input className={inputCls} type="number" min="0" placeholder="ej: 3200"
                  value={rn.rn_peso_gr}
                  onChange={e => setRn(p => ({ ...p, rn_peso_gr: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Talla (cm)</label>
                <input className={inputCls} type="number" min="0" step="0.1" placeholder="cm"
                  value={rn.rn_talla_cm}
                  onChange={e => setRn(p => ({ ...p, rn_talla_cm: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Perímetro cefálico (cm)</label>
                <input className={inputCls} type="number" min="0" step="0.1" placeholder="cm"
                  value={rn.rn_perimetro_cefalico}
                  onChange={e => setRn(p => ({ ...p, rn_perimetro_cefalico: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Apgar al 1 minuto (0-10)</label>
                <input className={inputCls} type="number" min="0" max="10"
                  value={rn.rn_apgar_1}
                  onChange={e => setRn(p => ({ ...p, rn_apgar_1: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Apgar a los 5 min (0-10)</label>
                <input className={inputCls} type="number" min="0" max="10"
                  value={rn.rn_apgar_5}
                  onChange={e => setRn(p => ({ ...p, rn_apgar_5: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, margin: "12px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={rn.rn_reanimacion}
                  onChange={e => setRn(p => ({ ...p, rn_reanimacion: e.target.checked }))} />
                Requirió reanimación
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={rn.rn_lactancia_materna}
                  onChange={e => setRn(p => ({ ...p, rn_lactancia_materna: e.target.checked }))} />
                Lactancia materna iniciada
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={rn.rn_ingreso_uci}
                  onChange={e => setRn(p => ({ ...p, rn_ingreso_uci: e.target.checked }))} />
                Ingreso a UCI neonatal
              </label>
            </div>
            <div className={styles.grid2}>
              <div className={fgCls}>
                <label className={labelCls}>Malformaciones / Anomalías</label>
                <textarea className={styles.textarea} rows={2} placeholder="Ninguna / Describa"
                  value={rn.rn_malformaciones}
                  onChange={e => setRn(p => ({ ...p, rn_malformaciones: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Observaciones del RN</label>
                <textarea className={styles.textarea} rows={2} placeholder="Observaciones adicionales"
                  value={rn.rn_observaciones}
                  onChange={e => setRn(p => ({ ...p, rn_observaciones: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              PUERPERIO — NUEVO
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🌸 Puerperio</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              <div className={fgCls}>
                <label className={labelCls}>Estado del puerperio</label>
                <select className={selCls} value={puerperio.puerperio_estado}
                  onChange={e => setPuerperio(p => ({ ...p, puerperio_estado: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="normal">Normal</option>
                  <option value="complicado">Complicado</option>
                </select>
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Anticonceptivo posparto</label>
                <input className={inputCls} type="text" placeholder="ej: DIU, Inyectable, Condón"
                  value={puerperio.puerperio_anticonceptivo}
                  onChange={e => setPuerperio(p => ({ ...p, puerperio_anticonceptivo: e.target.value }))} />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Fecha de alta</label>
                <input className={inputCls} type="date"
                  value={puerperio.alta_fecha}
                  onChange={e => setPuerperio(p => ({ ...p, alta_fecha: e.target.value }))} />
              </div>
            </div>
            {puerperio.puerperio_estado === "complicado" && (
              <div className={fgCls} style={{ marginTop: 8 }}>
                <label className={labelCls}>Complicaciones del puerperio</label>
                <textarea className={styles.textarea} rows={2} placeholder="Describa las complicaciones"
                  value={puerperio.puerperio_complicaciones}
                  onChange={e => setPuerperio(p => ({ ...p, puerperio_complicaciones: e.target.value }))} />
              </div>
            )}
            <div className={fgCls} style={{ marginTop: 8 }}>
              <label className={labelCls}>Observaciones del alta</label>
              <textarea className={styles.textarea} rows={2} placeholder="Indicaciones al egreso, próxima cita, etc."
                value={puerperio.alta_observaciones}
                onChange={e => setPuerperio(p => ({ ...p, alta_observaciones: e.target.value }))} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              DIAGNÓSTICO Y TRATAMIENTO — GINECOLOGÍA (INTACTO)
          ═══════════════════════════════════════════════════════ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📝 Diagnóstico y Tratamiento</h2>
            <div className={styles.grid2}>
              <div className={fgCls}>
                <label className={labelCls}>Diagnóstico Principal *</label>
                <textarea className={styles.textarea} rows={3} placeholder="Diagnóstico principal"
                  value={clinico.diagnostico_principal}
                  onChange={e => setCli(p => ({ ...p, diagnostico_principal: e.target.value }))} required />
              </div>
              <div className={fgCls}>
                <label className={labelCls}>Plan de Tratamiento</label>
                <textarea className={styles.textarea} rows={3} placeholder="Plan de tratamiento"
                  value={clinico.plan_tratamiento}
                  onChange={e => setCli(p => ({ ...p, plan_tratamiento: e.target.value }))} />
              </div>
            </div>
            <div className={fgCls} style={{ marginTop: 12 }}>
              <label className={labelCls}>Observaciones</label>
              <textarea className={styles.textarea} rows={2} placeholder="Observaciones adicionales"
                value={clinico.observaciones}
                onChange={e => setCli(p => ({ ...p, observaciones: e.target.value }))} />
            </div>
          </div>

          {/* ══ BOTONES ══ */}
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
