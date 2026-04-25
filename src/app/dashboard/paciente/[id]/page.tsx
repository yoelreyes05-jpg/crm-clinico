"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Plus, Heart, FileText, ChevronDown, ChevronUp,
  Activity, Printer,
} from "lucide-react";
import styles from "./paciente.module.css";

/* =========================================================
   TIPOS
   ========================================================= */
interface Paciente {
  id: string; cedula: string; nombre_completo: string;
  fecha_nacimiento: string; sexo: string;
  telefono?: string; email?: string; tipo_sangre?: string;
  direccion?: string; alergias?: string; antecedentes_medicos?: string;
  estado_civil?: string; ocupacion?: string;
}

interface HistorialGine {
  id: string;
  embarazo?: boolean; tbc_pulmonar?: boolean; hipertension?: boolean;
  gemelares?: boolean; diabetes?: boolean; hipertension_cronica?: boolean;
  cirugia_pelvico_uterina?: boolean; infertilidad?: boolean;
  antecedentes_familiares?: string;
  ta_inicial?: string; vdrl?: string; hb?: string;
  fum?: string; fpp?: string; dudas?: string; antitetanicas?: string;
  controles_prenatales?: any[];
}

interface Historial {
  id: string; especialidad: string; motivo_consulta: string;
  diagnostico_principal: string; diagnosticos_secundarios?: string;
  plan_tratamiento: string; medicamentos?: string; recomendaciones?: string;
  estudios_solicitados?: string; duracion_sintomas?: string;
  sintomas_principales?: string; antecedentes_enfermedad_actual?: string;
  examen_fisico_general?: string;
  peso?: number; altura?: number; presion_sistolica?: number;
  presion_diastolica?: number; frecuencia_cardiaca?: number;
  frecuencia_respiratoria?: number; temperatura?: number; saturacion_oxigeno?: number;
  created_at: string;
  historiales_ginecologia?: HistorialGine[];
}

/* =========================================================
   HELPERS
   ========================================================= */
const calcularEdad = (fecha: string) => {
  const hoy = new Date(); const nac = new Date(fecha);
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
  return e;
};
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
const fmtDate = (d: string) =>
  d ? new Date(d + "T12:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—";

/* =========================================================
   IMPRESIÓN — Historial Clínico General
   ========================================================= */
function abrirVentanaImpresion(html: string) {
  const SCRIPT = "<scr" + "ipt>window.onload=function(){window.print();}<\/scr" + "ipt>";
  const htmlFinal = html.replace("</body>", SCRIPT + "</body>");
  const blob = new Blob([htmlFinal], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

function imprimirHistorialGeneral(paciente: Paciente, h: Historial, medicoNombre: string) {
  const html = `<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8">
  <title>Historial Clínico — ${paciente.nombre_completo}</title>
  <style>
    @page { size: letter; margin: 14mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 9.5px; color: #111; line-height: 1.4; }

    .hdr { display: flex; justify-content: space-between; align-items: flex-start;
           border-bottom: 2.5px solid #0369a1; padding-bottom: 8px; margin-bottom: 10px; }
    .hdr-left h1 { font-size: 16px; color: #0369a1; margin-bottom: 3px; }
    .hdr-left p { font-size: 9px; color: #555; }
    .badge { background: #0369a1; color: #fff; padding: 6px 14px;
             border-radius: 5px; font-size: 10px; font-weight: bold; text-align: center; }

    .pac-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px;
                background: #f0f7ff; border: 1px solid #bae0ff; padding: 8px 10px;
                border-radius: 5px; margin-bottom: 10px; }
    .pac-item label { display: block; font-size: 7.5px; color: #555;
                      text-transform: uppercase; font-weight: bold; margin-bottom: 1px; }
    .pac-item span { font-size: 10px; font-weight: bold; }

    .sec-title { background: #0369a1; color: #fff; padding: 3px 10px;
                 font-size: 9px; font-weight: bold; text-transform: uppercase;
                 letter-spacing: .5px; margin: 10px 0 6px; border-radius: 3px; }

    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-bottom: 8px; }
    .field { border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .field label { display: block; font-size: 7.5px; color: #777; text-transform: uppercase; font-weight: bold; }
    .field p { font-size: 9.5px; min-height: 12px; font-weight: 500; margin-top: 1px; }
    .field-block { border: 1px solid #ddd; border-radius: 3px; padding: 5px 7px; min-height: 22px; margin-top: 2px; }
    .field-block label { font-size: 7.5px; color: #777; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px; }
    .field-block p { font-size: 9.5px; line-height: 1.4; }

    .vital-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; margin-bottom: 8px; }
    .vital { background: #f0f7ff; border: 1px solid #bae0ff; border-radius: 4px; padding: 5px 7px; }
    .vital label { font-size: 7.5px; color: #555; text-transform: uppercase; font-weight: bold; display: block; }
    .vital span { font-size: 13px; font-weight: 800; color: #0369a1; }
    .vital small { font-size: 8px; color: #777; }

    .footer { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .firma { text-align: center; padding-top: 26px; border-top: 1px solid #555;
             font-size: 8.5px; color: #555; }
    .meta { font-size: 8px; color: #999; margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px; }
  </style>
</head><body>

<div class="hdr">
  <div class="hdr-left">
    <h1>🏥 HISTORIAL CLINICO</h1>
    <p>Médico: ${medicoNombre} &nbsp;·&nbsp; Especialidad: ${h.especialidad || "General"}</p>
    <p>Fecha de consulta: ${fmt(h.created_at)} &nbsp;·&nbsp; Emitido: ${fmt(new Date().toISOString())}</p>
  </div>
  <div class="badge">${(h.especialidad || "GENERAL").toUpperCase()}</div>
</div>

<div class="pac-grid">
  <div class="pac-item"><label>Paciente</label><span>${paciente.nombre_completo}</span></div>
  <div class="pac-item"><label>Cédula</label><span>${paciente.cedula}</span></div>
  <div class="pac-item"><label>Edad</label><span>${calcularEdad(paciente.fecha_nacimiento)} años</span></div>
  <div class="pac-item"><label>Tipo de Sangre</label><span>${paciente.tipo_sangre || "—"}</span></div>
  <div class="pac-item"><label>Sexo</label><span>${paciente.sexo === "M" ? "Masculino" : "Femenino"}</span></div>
  <div class="pac-item"><label>Teléfono</label><span>${paciente.telefono || "—"}</span></div>
  <div class="pac-item"><label>Estado Civil</label><span>${paciente.estado_civil || "—"}</span></div>
  <div class="pac-item"><label>Ocupación</label><span>${paciente.ocupacion || "—"}</span></div>
</div>

<div class="sec-title">Motivo de Consulta</div>
<div class="grid2">
  <div class="field"><label>Motivo</label><p>${h.motivo_consulta || "—"}</p></div>
  <div class="field"><label>Duración de síntomas</label><p>${h.duracion_sintomas || "—"}</p></div>
</div>
${h.sintomas_principales ? `<div class="field-block"><label>Síntomas principales</label><p>${h.sintomas_principales}</p></div>` : ""}
${h.antecedentes_enfermedad_actual ? `<div class="field-block" style="margin-top:5px"><label>Antecedentes de la enfermedad actual</label><p>${h.antecedentes_enfermedad_actual}</p></div>` : ""}

${(h.peso || h.altura || h.presion_sistolica || h.temperatura || h.frecuencia_cardiaca || h.saturacion_oxigeno) ? `
<div class="sec-title">Signos Vitales</div>
<div class="vital-grid">
  ${h.peso ? `<div class="vital"><label>Peso</label><span>${h.peso}</span> <small>kg</small></div>` : ""}
  ${h.altura ? `<div class="vital"><label>Altura</label><span>${h.altura}</span> <small>cm/m</small></div>` : ""}
  ${h.presion_sistolica ? `<div class="vital"><label>Presión Arterial</label><span>${h.presion_sistolica}/${h.presion_diastolica || "?"}</span> <small>mmHg</small></div>` : ""}
  ${h.temperatura ? `<div class="vital"><label>Temperatura</label><span>${h.temperatura}</span> <small>°C</small></div>` : ""}
  ${h.frecuencia_cardiaca ? `<div class="vital"><label>Frec. Cardíaca</label><span>${h.frecuencia_cardiaca}</span> <small>lpm</small></div>` : ""}
  ${h.frecuencia_respiratoria ? `<div class="vital"><label>Frec. Respiratoria</label><span>${h.frecuencia_respiratoria}</span> <small>rpm</small></div>` : ""}
  ${h.saturacion_oxigeno ? `<div class="vital"><label>Sat. O₂</label><span>${h.saturacion_oxigeno}</span> <small>%</small></div>` : ""}
</div>` : ""}

${h.examen_fisico_general ? `<div class="sec-title">Examen Físico</div><div class="field-block"><p>${h.examen_fisico_general}</p></div>` : ""}

<div class="sec-title">Diagnóstico y Plan de Tratamiento</div>
<div class="grid2">
  <div class="field-block"><label>Diagnóstico Principal</label><p>${h.diagnostico_principal}</p></div>
  <div class="field-block"><label>Plan de Tratamiento</label><p>${h.plan_tratamiento}</p></div>
</div>
${h.diagnosticos_secundarios ? `<div class="field-block" style="margin-top:5px"><label>Diagnósticos Secundarios</label><p>${h.diagnosticos_secundarios}</p></div>` : ""}
${h.medicamentos ? `<div class="field-block" style="margin-top:5px"><label>Medicamentos Prescritos</label><p>${h.medicamentos}</p></div>` : ""}
${h.recomendaciones ? `<div class="field-block" style="margin-top:5px"><label>Recomendaciones</label><p>${h.recomendaciones}</p></div>` : ""}
${h.estudios_solicitados ? `<div class="field-block" style="margin-top:5px"><label>Estudios Solicitados</label><p>${h.estudios_solicitados}</p></div>` : ""}
${paciente.alergias ? `<div class="field-block" style="margin-top:5px;border-color:#fca5a5;background:#fff5f5"><label style="color:#dc2626">⚠ Alergias del paciente</label><p>${paciente.alergias}</p></div>` : ""}

<div class="footer">
  <div class="firma">Firma del Médico</div>
  <div class="firma">Firma del Paciente</div>
  <div class="firma">Sello / Fecha</div>
</div>
<p class="meta">ID Historial: ${h.id} &nbsp;·&nbsp; Generado el ${new Date().toLocaleString("es-ES")}</p>
</body></html>`;
  abrirVentanaImpresion(html);
}

/* =========================================================
   IMPRESIÓN — Ficha Ginecológica
   ========================================================= */
function imprimirFichaGine(paciente: Paciente, h: Historial, medicoNombre: string) {
  const gine = h.historiales_ginecologia?.[0];

  const antList = gine ? [
    ["Embarazo", gine.embarazo], ["TBC Pulmonar", gine.tbc_pulmonar],
    ["Hipertensión", gine.hipertension], ["Gemelares", gine.gemelares],
    ["Diabetes", gine.diabetes], ["HTA Crónica", gine.hipertension_cronica],
    ["Cir. Pélvico-Uterina", gine.cirugia_pelvico_uterina], ["Infertilidad", gine.infertilidad],
  ] : [];

  const controles = gine?.controles_prenatales || [];
  const filasVacias = 12 - controles.length;

  const controlesHtml = controles.map((c: any, i: number) => `
    <tr>
      <td style="text-align:center;background:#f8fafc;font-weight:700">${i + 1}</td>
      <td>${c.fecha || ""}</td>
      <td style="text-align:center">${c.edad_gestacional || ""}</td>
      <td style="text-align:center">${c.peso || ""}</td>
      <td style="text-align:center">${c.ta || ""}</td>
      <td style="text-align:center">${c.altura_uterina || ""}</td>
      <td style="text-align:center">${c.fcc_mov || ""}</td>
      <td style="text-align:center">${c.edema ? "Sí" : "No"}</td>
      <td style="text-align:center">${c.varice ? "Sí" : "No"}</td>
    </tr>`).join("");

  const filasVaciasHtml = Array(Math.max(0, filasVacias)).fill(0).map((_, i) => `
    <tr>
      <td style="text-align:center;background:#f8fafc;font-weight:700">${controles.length + i + 1}</td>
      <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8">
  <title>Ficha Ginecológica — ${paciente.nombre_completo}</title>
  <style>
    @page { size: letter; margin: 12mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 9px; color: #111; line-height: 1.3; }

    .hdr { display: flex; justify-content: space-between; align-items: flex-start;
           border-bottom: 2.5px solid #7c3aed; padding-bottom: 7px; margin-bottom: 9px; }
    .hdr-left h1 { font-size: 15px; color: #7c3aed; margin-bottom: 2px; }
    .hdr-left p { font-size: 8.5px; color: #555; }
    .badge { background: #7c3aed; color: #fff; padding: 5px 12px;
             border-radius: 5px; font-size: 10px; font-weight: bold; text-align: center; }

    .pac-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 4px;
                background: #fdf4ff; border: 1px solid #ddd6fe; padding: 7px 9px;
                border-radius: 4px; margin-bottom: 8px; }
    .pac-item label { display: block; font-size: 7.5px; color: #7c3aed;
                      text-transform: uppercase; font-weight: bold; margin-bottom: 1px; }
    .pac-item span { font-size: 10px; font-weight: bold; }

    .sec-title { background: #7c3aed; color: #fff; padding: 3px 9px;
                 font-size: 8.5px; font-weight: bold; text-transform: uppercase;
                 letter-spacing: .5px; margin: 8px 0 5px; border-radius: 2px; }

    .ant-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 4px; margin-bottom: 6px; }
    .ant-item { display: flex; align-items: center; gap: 5px; border: 1px solid #ddd;
                padding: 4px 7px; border-radius: 4px; font-size: 9px; }
    .ant-item.si { border-color: #7c3aed; background: #fdf4ff; color: #7c3aed; font-weight: bold; }
    .ant-check { width: 9px; height: 9px; border: 1.5px solid currentColor; display: inline-flex;
                 align-items: center; justify-content: center; border-radius: 2px; font-size: 7px; flex-shrink:0; }

    .exam-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; margin-bottom: 7px; }
    .exam-item { border-bottom: 1px solid #ddd; padding-bottom: 3px; }
    .exam-item label { display: block; font-size: 7.5px; color: #777; text-transform: uppercase; font-weight: bold; }
    .exam-item span { font-size: 10px; font-weight: bold; min-height: 12px; display: block; }

    .diag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 6px; }
    .field-block { border: 1px solid #ddd; border-radius: 3px; padding: 4px 6px; min-height: 18px; }
    .field-block label { font-size: 7.5px; color: #777; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px; }
    .field-block p { font-size: 9.5px; }

    table { width: 100%; border-collapse: collapse; font-size: 8px; }
    th { background: #7c3aed; color: #fff; padding: 4px 5px;
         text-align: center; font-size: 7.5px; font-weight: bold; white-space: nowrap; }
    td { border: 1px solid #d1d5db; padding: 3px 4px; height: 16px; }
    tr:nth-child(even) td { background: #f9fafb; }

    .footer { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .firma { text-align: center; padding-top: 26px; border-top: 1px solid #555; font-size: 8.5px; color: #555; }
    .meta { font-size: 7.5px; color: #aaa; margin-top: 8px; border-top: 1px solid #eee; padding-top: 4px; }
  </style>
</head><body>

<div class="hdr">
  <div class="hdr-left">
    <h1>💜 Ficha Ginecológica Obstétrica</h1>
    <p>Dra./Dr. ${medicoNombre} &nbsp;·&nbsp; Especialidad: Ginecología</p>
    <p>Fecha de consulta: ${fmt(h.created_at)} &nbsp;·&nbsp; Emitido: ${fmt(new Date().toISOString())}</p>
  </div>
  <div class="badge">GINECOLOGÍA<br>OBSTETRICIA</div>
</div>

<div class="pac-grid">
  <div class="pac-item"><label>Paciente</label><span>${paciente.nombre_completo}</span></div>
  <div class="pac-item"><label>Cédula</label><span>${paciente.cedula}</span></div>
  <div class="pac-item"><label>Edad</label><span>${calcularEdad(paciente.fecha_nacimiento)} años</span></div>
  <div class="pac-item"><label>Tipo de Sangre</label><span>${paciente.tipo_sangre || "—"}</span></div>
  <div class="pac-item"><label>Sexo</label><span>${paciente.sexo === "M" ? "Masculino" : "Femenino"}</span></div>
  <div class="pac-item"><label>Teléfono</label><span>${paciente.telefono || "—"}</span></div>
  <div class="pac-item"><label>F. Nacimiento</label><span>${fmtDate(paciente.fecha_nacimiento)}</span></div>
  <div class="pac-item"><label>Estado Civil</label><span>${paciente.estado_civil || "—"}</span></div>
</div>

<div class="sec-title">Antecedentes Patológicos</div>
<div class="ant-grid">
  ${antList.map(([lbl, val]) => `
    <div class="ant-item ${val ? "si" : ""}">
      <div class="ant-check">${val ? "✓" : ""}</div>
      ${lbl}
    </div>`).join("")}
</div>
${gine?.antecedentes_familiares ? `<div class="field-block" style="margin-bottom:6px"><label>Antecedentes Familiares</label><p>${gine.antecedentes_familiares}</p></div>` : ""}

<div class="sec-title">Datos Iniciales y Exámenes</div>
<div class="exam-grid">
  <div class="exam-item"><label>T.A. Inicial</label><span>${gine?.ta_inicial || "—"}</span></div>
  <div class="exam-item"><label>VDRL</label><span>${gine?.vdrl || "—"}</span></div>
  <div class="exam-item"><label>Hb (Hemoglobina)</label><span>${gine?.hb || "—"}</span></div>
  <div class="exam-item"><label>Tipo de Sangre</label><span>${paciente.tipo_sangre || "—"}</span></div>
  <div class="exam-item"><label>FUM</label><span>${gine?.fum ? fmtDate(gine.fum) : "—"}</span></div>
  <div class="exam-item"><label>FPP</label><span>${gine?.fpp ? fmtDate(gine.fpp) : "—"}</span></div>
  <div class="exam-item"><label>Antitetánicas</label><span>${gine?.antitetanicas || "—"}</span></div>
  <div class="exam-item"><label>Motivo Consulta</label><span>${h.motivo_consulta || "—"}</span></div>
</div>

<div class="sec-title">Controles Prenatales (12 Controles)</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>Fecha</th><th>Edad Gestacional</th><th>Peso (kg)</th>
      <th>T.A.</th><th>Alt. Uterina</th><th>FCC / MOV</th><th>Edema</th><th>Várice</th>
    </tr>
  </thead>
  <tbody>
    ${controlesHtml}
    ${filasVaciasHtml}
  </tbody>
</table>

<div class="diag-grid" style="margin-top:8px">
  <div class="field-block"><label>Diagnóstico Principal</label><p>${h.diagnostico_principal || "—"}</p></div>
  <div class="field-block"><label>Plan de Tratamiento</label><p>${h.plan_tratamiento || "—"}</p></div>
</div>
${gine?.dudas ? `<div class="field-block" style="margin-top:4px"><label>Dudas / Observaciones</label><p>${gine.dudas}</p></div>` : ""}

<div class="footer">
  <div class="firma">Firma del Médico</div>
  <div class="firma">Firma del Paciente</div>
  <div class="firma">Sello / Fecha</div>
</div>
<p class="meta">ID Historial: ${h.id} &nbsp;·&nbsp; Generado el ${new Date().toLocaleString("es-ES")}</p>
</body></html>`;
  abrirVentanaImpresion(html);
}

/* =========================================================
   COMPONENTE: Detalle de un historial
   ========================================================= */
function HistorialCard({
  h, index, paciente, medicoNombre,
}: {
  h: Historial; index: number; paciente: Paciente; medicoNombre: string;
}) {
  const [open, setOpen] = useState(index === 0);
  const esGine = h.especialidad === "ginecologia";
  const gine: HistorialGine | undefined = h.historiales_ginecologia?.[0];

  const tieneVitales = h.peso || h.altura || h.presion_sistolica || h.temperatura || h.frecuencia_cardiaca || h.saturacion_oxigeno;

  const antList = gine ? [
    ["Embarazo", gine.embarazo], ["TBC Pulmonar", gine.tbc_pulmonar],
    ["Hipertensión", gine.hipertension], ["Gemelares", gine.gemelares],
    ["Diabetes", gine.diabetes], ["HTA Crónica", gine.hipertension_cronica],
    ["Cir. Pélvico-Uterina", gine.cirugia_pelvico_uterina], ["Infertilidad", gine.infertilidad],
  ] : [];

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (esGine) imprimirFichaGine(paciente, h, medicoNombre);
    else imprimirHistorialGeneral(paciente, h, medicoNombre);
  };

  return (
    <div className={styles.historialCard}>
      {/* Cabecera clickeable */}
      <div
        className={`${styles.historialHeader} ${open ? styles.expanded : ""}`}
        onClick={() => setOpen(v => !v)}
        role="button"
      >
        <div className={`${styles.historialIconWrap} ${esGine ? styles.iconGine : styles.iconGen}`}>
          {esGine ? <Heart size={16} /> : <FileText size={16} />}
        </div>
        <div className={styles.historialMeta}>
          <p className={styles.historialDiag}>{h.diagnostico_principal}</p>
          <div className={styles.historialSub}>
            <span>{fmt(h.created_at)}</span>
            <span className={`${styles.espBadge} ${esGine ? styles.espBadgeGine : ""}`}>
              {h.especialidad || "General"}
            </span>
            {h.motivo_consulta && <span>{h.motivo_consulta}</span>}
          </div>
        </div>

        {/* Botón imprimir individual */}
        <button className={`${styles.printBtn} ${esGine ? styles.printBtnGine : ""}`} onClick={handlePrint} title="Imprimir este historial">
          <Printer size={14} />
          <span>Imprimir</span>
        </button>

        {open ? <ChevronUp size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
               : <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
      </div>

      {/* Contenido expandible */}
      {open && (
        <div className={styles.historialDetalle}>

          {tieneVitales && (
            <>
              <p className={styles.sectionTitle}>Signos Vitales</p>
              <div className={styles.vitalesGrid}>
                {h.peso && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Peso</span><span className={styles.vitalValue}>{h.peso}</span><span className={styles.vitalUnit}>kg</span></div>}
                {h.altura && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Altura</span><span className={styles.vitalValue}>{h.altura}</span><span className={styles.vitalUnit}>cm/m</span></div>}
                {h.presion_sistolica && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Presión Arterial</span><span className={styles.vitalValue}>{h.presion_sistolica}/{h.presion_diastolica}</span><span className={styles.vitalUnit}>mmHg</span></div>}
                {h.temperatura && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Temperatura</span><span className={styles.vitalValue}>{h.temperatura}</span><span className={styles.vitalUnit}>°C</span></div>}
                {h.frecuencia_cardiaca && <div className={styles.vitalItem}><span className={styles.vitalLabel}>F.C.</span><span className={styles.vitalValue}>{h.frecuencia_cardiaca}</span><span className={styles.vitalUnit}>lpm</span></div>}
                {h.frecuencia_respiratoria && <div className={styles.vitalItem}><span className={styles.vitalLabel}>F.R.</span><span className={styles.vitalValue}>{h.frecuencia_respiratoria}</span><span className={styles.vitalUnit}>rpm</span></div>}
                {h.saturacion_oxigeno && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Sat. O₂</span><span className={styles.vitalValue}>{h.saturacion_oxigeno}</span><span className={styles.vitalUnit}>%</span></div>}
              </div>
            </>
          )}

          {(h.duracion_sintomas || h.sintomas_principales || h.antecedentes_enfermedad_actual) && (
            <>
              <p className={styles.sectionTitle}>Síntomas y Antecedentes</p>
              <div className={`${styles.detalleGrid} ${styles.detalleGrid2}`}>
                {h.duracion_sintomas && <div className={styles.detalleItem}><span className={styles.detalleLabel}>Duración síntomas</span><span className={styles.detalleValue}>{h.duracion_sintomas}</span></div>}
                {h.sintomas_principales && <div className={styles.detalleItem}><span className={styles.detalleLabel}>Síntomas principales</span><span className={styles.detalleValue}>{h.sintomas_principales}</span></div>}
              </div>
              {h.antecedentes_enfermedad_actual && <div className={styles.detalleItem} style={{ marginBottom: 10 }}><span className={styles.detalleLabel}>Antecedentes enfermedad actual</span><p className={styles.detalleValueBlock}>{h.antecedentes_enfermedad_actual}</p></div>}
            </>
          )}

          {h.examen_fisico_general && (
            <>
              <p className={styles.sectionTitle}>Examen Físico</p>
              <p className={styles.detalleValueBlock}>{h.examen_fisico_general}</p>
            </>
          )}

          <p className={styles.sectionTitle}>Diagnóstico y Tratamiento</p>
          <div className={`${styles.detalleGrid} ${styles.detalleGrid2}`} style={{ marginBottom: 10 }}>
            <div className={styles.detalleItem}>
              <span className={styles.detalleLabel}>Diagnóstico principal</span>
              <p className={styles.detalleValueBlock}>{h.diagnostico_principal}</p>
            </div>
            <div className={styles.detalleItem}>
              <span className={styles.detalleLabel}>Plan de tratamiento</span>
              <p className={styles.detalleValueBlock}>{h.plan_tratamiento}</p>
            </div>
          </div>
          {h.diagnosticos_secundarios && <div className={styles.detalleItem} style={{ marginBottom: 8 }}><span className={styles.detalleLabel}>Diagnósticos secundarios</span><p className={styles.detalleValueBlock}>{h.diagnosticos_secundarios}</p></div>}
          {h.medicamentos && <div className={styles.detalleItem} style={{ marginBottom: 8 }}><span className={styles.detalleLabel}>Medicamentos</span><p className={styles.detalleValueBlock}>{h.medicamentos}</p></div>}
          {h.recomendaciones && <div className={styles.detalleItem} style={{ marginBottom: 8 }}><span className={styles.detalleLabel}>Recomendaciones</span><p className={styles.detalleValueBlock}>{h.recomendaciones}</p></div>}
          {h.estudios_solicitados && <div className={styles.detalleItem} style={{ marginBottom: 8 }}><span className={styles.detalleLabel}>Estudios solicitados</span><p className={styles.detalleValueBlock}>{h.estudios_solicitados}</p></div>}

          {/* Datos ginecológicos */}
          {esGine && gine && (
            <>
              <p className={styles.sectionTitle}>Ficha Ginecológica</p>
              <div className={styles.detalleGrid}>
                {gine.fum && <div className={styles.detalleItem}><span className={styles.detalleLabel}>FUM</span><span className={styles.detalleValue}>{gine.fum}</span></div>}
                {gine.fpp && <div className={styles.detalleItem}><span className={styles.detalleLabel}>FPP</span><span className={styles.detalleValue}>{gine.fpp}</span></div>}
                {gine.ta_inicial && <div className={styles.detalleItem}><span className={styles.detalleLabel}>T.A. Inicial</span><span className={styles.detalleValue}>{gine.ta_inicial}</span></div>}
                {gine.vdrl && <div className={styles.detalleItem}><span className={styles.detalleLabel}>VDRL</span><span className={styles.detalleValue}>{gine.vdrl}</span></div>}
                {gine.hb && <div className={styles.detalleItem}><span className={styles.detalleLabel}>Hb</span><span className={styles.detalleValue}>{gine.hb}</span></div>}
                {gine.antitetanicas && <div className={styles.detalleItem}><span className={styles.detalleLabel}>Antitetánicas</span><span className={styles.detalleValue}>{gine.antitetanicas}</span></div>}
              </div>

              {antList.some(([, v]) => v) && (
                <>
                  <p className={styles.sectionTitle}>Antecedentes Patológicos</p>
                  <div className={styles.antGrid}>
                    {antList.map(([lbl, val]) => (
                      <div key={String(lbl)} className={`${styles.antItem} ${val ? styles.antSi : ""}`}>
                        <div className={`${styles.antDot} ${val ? styles.antDotSi : ""}`} />
                        {String(lbl)}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {gine.antecedentes_familiares && <div className={styles.detalleItem} style={{ marginBottom: 10 }}><span className={styles.detalleLabel}>Antecedentes familiares</span><p className={styles.detalleValueBlock}>{gine.antecedentes_familiares}</p></div>}
              {gine.dudas && <div className={styles.detalleItem} style={{ marginBottom: 10 }}><span className={styles.detalleLabel}>Dudas / Observaciones</span><p className={styles.detalleValueBlock}>{gine.dudas}</p></div>}

              {gine.controles_prenatales && gine.controles_prenatales.length > 0 && (
                <>
                  <p className={styles.sectionTitle}>Controles Prenatales ({gine.controles_prenatales.length})</p>
                  <div className={styles.tableWrap}>
                    <table className={styles.controlTable}>
                      <thead>
                        <tr>
                          <th>#</th><th>Fecha</th><th>Edad Gest.</th>
                          <th>Peso</th><th>T.A.</th><th>Alt. Uterina</th>
                          <th>FCC/MOV</th><th>Edema</th><th>Várice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gine.controles_prenatales.map((c: any, i: number) => (
                          <tr key={i}>
                            <td className={styles.tdNum}>{i + 1}</td>
                            <td>{c.fecha || "—"}</td>
                            <td>{c.edad_gestacional || "—"}</td>
                            <td>{c.peso || "—"}</td>
                            <td>{c.ta || "—"}</td>
                            <td>{c.altura_uterina || "—"}</td>
                            <td>{c.fcc_mov || "—"}</td>
                            <td>{c.edema ? "Sí" : "No"}</td>
                            <td>{c.varice ? "Sí" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PÁGINA PRINCIPAL
   ========================================================= */
export default function PacienteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const pacienteId = params.id as string;
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historiales, setHistoriales] = useState<Historial[]>([]);
  const [loading, setLoading] = useState(true);

  const esGinecologo = usuario?.especialidad === "ginecologia";
  const medicoNombre = usuario?.nombre_completo || "Médico";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    cargarTodo();
  }, [authLoading, isAuthenticated, pacienteId]);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resPac, resHist, resGine] = await Promise.all([
        fetch(`/api/pacientes/${pacienteId}`, { headers }),
        fetch(`/api/historiales?paciente_id=${pacienteId}`, { headers }),
        fetch(`/api/historiales/ginecologia?paciente_id=${pacienteId}`, { headers }),
      ]);

      if (resPac.ok) {
        const d = await resPac.json();
        setPaciente(d.data || d);
      }

      const histGen: Historial[] = resHist.ok ? (await resHist.json()).data || [] : [];
      const histGineRaw: any[] = resGine.ok ? (await resGine.json()).data || [] : [];

      const gineMap = new Map(histGineRaw.map((g: any) => [g.id, g]));
      const merged: Historial[] = histGen.map(h =>
        gineMap.has(h.id)
          ? { ...h, historiales_ginecologia: gineMap.get(h.id).historiales_ginecologia }
          : h
      );
      histGineRaw.forEach((g: any) => {
        if (!histGen.find(h => h.id === g.id)) merged.push(g as Historial);
      });
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setHistoriales(merged);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}><div className={styles.spinner} /><p>Cargando expediente...</p></div>
      </div>
    );
  }

  if (!paciente) {
    return <div className={styles.container}><p style={{ color: "var(--danger)" }}>Paciente no encontrado.</p></div>;
  }

  const histGen = historiales.filter(h => h.especialidad !== "ginecologia");
  const histGineco = historiales.filter(h => h.especialidad === "ginecologia");

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1>Expediente · {paciente.nombre_completo}</h1>
        <div className={styles.headerActions}>
          <button className={styles.btnAdd} onClick={() => router.push(`/dashboard/historial-nuevo?paciente=${pacienteId}`)}>
            <Plus size={14} /> Nuevo Historial
          </button>
          {esGinecologo && (
            <button className={styles.btnGineco} onClick={() => router.push(`/dashboard/historial-ginecologia?paciente=${pacienteId}`)}>
              <Heart size={14} /> Ficha Ginecológica
            </button>
          )}
        </div>
      </div>

      {/* Info del paciente */}
      <div className={styles.card}>
        <p className={styles.cardTitle}><Activity size={16} /> Datos del Paciente</p>
        <div className={styles.pacienteGrid}>
          <div className={styles.infoItem}><span className={styles.infoLabel}>Nombre completo</span><span className={styles.infoValue}>{paciente.nombre_completo}</span></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}>Cédula</span><span className={styles.infoValue}>{paciente.cedula}</span></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}>Edad</span><span className={styles.infoValue}>{calcularEdad(paciente.fecha_nacimiento)} años</span></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}>Sexo</span><span className={styles.infoValue}>{paciente.sexo === "M" ? "Masculino" : "Femenino"}</span></div>
          {paciente.tipo_sangre && <div className={styles.infoItem}><span className={styles.infoLabel}>Tipo de sangre</span><span className={styles.bloodValue}>{paciente.tipo_sangre}</span></div>}
          {paciente.telefono && <div className={styles.infoItem}><span className={styles.infoLabel}>Teléfono</span><span className={styles.infoValue}>{paciente.telefono}</span></div>}
          {paciente.email && <div className={styles.infoItem}><span className={styles.infoLabel}>Email</span><span className={styles.infoValue}>{paciente.email}</span></div>}
          {paciente.estado_civil && <div className={styles.infoItem}><span className={styles.infoLabel}>Estado civil</span><span className={styles.infoValue}>{paciente.estado_civil}</span></div>}
          {paciente.ocupacion && <div className={styles.infoItem}><span className={styles.infoLabel}>Ocupación</span><span className={styles.infoValue}>{paciente.ocupacion}</span></div>}
          {paciente.direccion && <div className={styles.infoItem} style={{ gridColumn: "span 2" }}><span className={styles.infoLabel}>Dirección</span><span className={styles.infoValue}>{paciente.direccion}</span></div>}
          {paciente.alergias && <div className={styles.infoItem} style={{ gridColumn: "span 2" }}><span className={styles.infoLabel}>Alergias</span><span className={styles.tagValue}>{paciente.alergias}</span></div>}
          {paciente.antecedentes_medicos && <div className={styles.infoItem} style={{ gridColumn: "span 4" }}><span className={styles.infoLabel}>Antecedentes médicos</span><p className={styles.detalleValueBlock}>{paciente.antecedentes_medicos}</p></div>}
        </div>
      </div>

      {/* Resumen */}
      <div className={styles.statsBar}>
        <span className={styles.statBadge}><FileText size={14} /> {histGen.length} Historial{histGen.length !== 1 ? "es" : ""} General{histGen.length !== 1 ? "es" : ""}</span>
        {histGineco.length > 0 && <span className={`${styles.statBadge} ${styles.statBadgeGine}`}><Heart size={14} /> {histGineco.length} Ficha{histGineco.length !== 1 ? "s" : ""} Ginecológica{histGineco.length !== 1 ? "s" : ""}</span>}
      </div>

      {/* Historiales */}
      {historiales.length === 0 ? (
        <div className={styles.emptyHistoriales}>
          No hay historiales registrados para este paciente. Usa los botones de arriba para agregar uno.
        </div>
      ) : (
        historiales.map((h, i) => (
          <HistorialCard key={h.id} h={h} index={i} paciente={paciente} medicoNombre={medicoNombre} />
        ))
      )}
    </div>
  );
}
