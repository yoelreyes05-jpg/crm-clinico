"use client";

import { useState } from "react";
import { HeartPulse } from "lucide-react";
import { PatientHeader } from "@/components/PatientHeader";
import { PrintButton } from "@/components/PrintButton";
import styles from "../form.module.css";
import { supabase } from "@/lib/supabase";

export default function GinecologiaModule() {
  const [loading, setLoading] = useState(false);

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
    const menarquia = parseFloat(formData.get("menarquia") as string) || null;
    const fur = formData.get("fur") as string || null;
    const gestaciones = parseInt(formData.get("gestaciones") as string) || 0;
    const partos = parseInt(formData.get("partos") as string) || 0;
    const abortos = parseInt(formData.get("abortos") as string) || 0;
    const cesareas = parseInt(formData.get("cesareas") as string) || 0;
    const metodo_anticonceptivo = formData.get("metodo_anticonceptivo") as string;
    const examen_fisico = formData.get("examen_fisico") as string;
    const proxima_cita = formData.get("proxima_cita") as string;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const { data: pacienteData, error: pacienteError } = await supabase
        .from("clinico_pacientes_ginecologia")
        .insert({ identidad, nombre, telefono, sexo, fecha_nacimiento })
        .select()
        .single();

      if (pacienteError) throw pacienteError;

      const { error: historiaError } = await supabase
        .from("clinico_historias_ginecologia")
        .insert({
          paciente_id: pacienteData.id,
          medico_id: session.user.id,
          motivo_consulta,
          menarquia,
          fur,
          gestaciones,
          partos,
          abortos,
          cesareas,
          metodo_anticonceptivo,
          examen_fisico
        });

      if (historiaError) throw historiaError;

      if (proxima_cita) {
        await supabase.from("clinico_citas").insert({
          paciente_auth_id: pacienteData.id,
          medico_id: session.user.id,
          modulo: "ginecologia",
          motivo_cita: "Control por Ginecología",
          fecha_hora: proxima_cita,
          estado: "pendiente"
        });
      }

      alert("Historia Clínica guardada exitosamente en Supabase (Ginecología).");
      (e.target as HTMLFormElement).reset();

    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.moduleContainer}>
      <div className={`${styles.header} no-print`}>
        <div className={styles.titleWrapper}>
          <HeartPulse size={32} className={styles.icon} color="#e11d48" />
          <div>
            <h1>Historia Clínica: Ginecología y Obstetricia</h1>
            <p className="text-muted">Control prenatal, historial AGO, y evaluación ginecológica.</p>
          </div>
        </div>
        <PrintButton />
      </div>

      <form className={styles.formContent} onSubmit={handleSubmit} id="gineco-form">
        {/* Encabezado del Paciente Global */}
        <PatientHeader />

        {/* Motivo de Consulta */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Motivo de Consulta</h3>
          <div className="input-group">
            <input type="text" name="motivo_consulta" className="input-field" placeholder="Ej. Control prenatal, dolor pélvico, alteración menstrual..." required />
          </div>
        </section>

        {/* Antecedentes Gineco-Obstétricos (AGO) */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Antecedentes Gineco-Obstétricos (AGO)</h3>
          <div className={styles.grid4}>
            <div className="input-group">
              <label className="input-label">Menarquia (edad)</label>
              <input type="number" name="menarquia" className="input-field" placeholder="Ej. 12" />
            </div>
            <div className="input-group">
              <label className="input-label">F.U.R. (Última regla)</label>
              <input type="date" name="fur" className="input-field" />
            </div>
            <div className="input-group">
              <label className="input-label">Patrón Menstrual</label>
              <input type="text" name="patron_menstrual" className="input-field" placeholder="Ej. 28/4, regular" />
            </div>
          </div>
          
          <h4 className="input-label" style={{marginTop: '1rem', marginBottom: '0.5rem'}}>Fórmula Obstétrica</h4>
          <div className={styles.grid4}>
            <div className="input-group">
              <label className="input-label">Gestaciones (G)</label>
              <input type="number" name="gestaciones" className="input-field" placeholder="0" />
            </div>
            <div className="input-group">
              <label className="input-label">Partos (P)</label>
              <input type="number" name="partos" className="input-field" placeholder="0" />
            </div>
            <div className="input-group">
              <label className="input-label">Abortos (A)</label>
              <input type="number" name="abortos" className="input-field" placeholder="0" />
            </div>
            <div className="input-group">
              <label className="input-label">Cesáreas (C)</label>
              <input type="number" name="cesareas" className="input-field" placeholder="0" />
            </div>
          </div>
        </section>

        {/* Listas de Cotejo y Selecciones */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Factores de Riesgo y Salud Reproductiva</h3>
          
          <div className={styles.grid2} style={{ marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">Método Anticonceptivo Actual</label>
              <select name="metodo_anticonceptivo" className="input-field">
                <option value="">Ninguno</option>
                <option value="aco">Anticonceptivos Orales (ACO)</option>
                <option value="diu">DIU (Cobre / Hormonal)</option>
                <option value="implante">Implante Subdérmico</option>
                <option value="barrera">Método de Barrera (Preservativo)</option>
                <option value="quirurgico">Esterilización Quirúrgica</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Última Citología (Papanicolaou)</label>
              <select className="input-field">
                <option value="">Desconocido / Nunca</option>
                <option value="normal_1y">Normal (hace &lt; 1 año)</option>
                <option value="normal_3y">Normal (hace &gt; 1 año)</option>
                <option value="anormal">Anormal / Alterado</option>
              </select>
            </div>
          </div>
        </section>

        {/* Examen Físico y Plan */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Exploración Física y Observaciones</h3>
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <textarea 
              name="examen_fisico"
              className="input-field" 
              rows={6} 
              placeholder="Exploración mamaria, tacto vaginal, ecografía (hallazgos), plan de tratamiento..."
            ></textarea>
          </div>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <label className="input-label">Próxima Cita (Opcional)</label>
            <input type="datetime-local" name="proxima_cita" className="input-field" />
          </div>
        </section>

        {/* Pie de Firma para Impresión */}
        <div className="print-footer">
           <div className="signature-line"></div>
           <p style={{fontWeight: 'bold', fontSize: '1.1rem', margin: '0.25rem 0'}}>Firma del Médico Tratante</p>
           <p style={{color: '#666', fontSize: '0.9rem'}}>Módulo de Ginecología</p>
        </div>

        {/* Botón de Guardar (No se imprime) */}
        <div className={`no-print ${styles.formActions}`}>
          <button type="button" className="btn btn-outline" onClick={() => (document.getElementById('gineco-form') as HTMLFormElement).reset()}>Cancelar</button>
          <button type="submit" className="btn btn-primary" style={{backgroundColor: '#e11d48'}} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Historia Clínica'}
          </button>
        </div>
      </form>
    </div>
  );
}
