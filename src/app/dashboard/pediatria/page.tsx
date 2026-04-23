"use client";

import { useState } from "react";
import { Baby } from "lucide-react";
import { PatientHeader } from "@/components/PatientHeader";
import { PrintButton } from "@/components/PrintButton";
import styles from "../form.module.css";
import { supabase } from "@/lib/supabase";

export default function PediatriaModule() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identidad_tutor = formData.get("identidad") as string;
    const nombre = formData.get("nombre") as string;
    const telefono_tutor = formData.get("telefono") as string;
    const sexo = formData.get("sexo") as string;
    const fecha_nacimiento = formData.get("fecha_nacimiento") as string || null;

    const motivo_consulta = formData.get("motivo_consulta") as string;
    const semanas_gestacion = parseFloat(formData.get("semanas_gestacion") as string) || null;
    const peso_nacer = parseFloat(formData.get("peso_nacer") as string) || null;
    const apgar = formData.get("apgar") as string;
    
    const peso_actual = parseFloat(formData.get("peso_actual") as string) || null;
    const talla_actual = parseFloat(formData.get("talla_actual") as string) || null;
    const observaciones = formData.get("observaciones") as string;
    const proxima_cita = formData.get("proxima_cita") as string;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const { data: pacienteData, error: pacienteError } = await supabase
        .from("clinico_pacientes_pediatria")
        .insert({ identidad_tutor, nombre, telefono_tutor, sexo, fecha_nacimiento })
        .select()
        .single();

      if (pacienteError) throw pacienteError;

      const { error: historiaError } = await supabase
        .from("clinico_historias_pediatria")
        .insert({
          paciente_id: pacienteData.id,
          medico_id: session.user.id,
          motivo_consulta,
          semanas_gestacion,
          peso_nacer,
          apgar,
          peso_actual,
          talla_actual,
          observaciones
        });

      if (historiaError) throw historiaError;

      if (proxima_cita) {
        await supabase.from("clinico_citas").insert({
          paciente_auth_id: pacienteData.id,
          medico_id: session.user.id,
          modulo: "pediatria",
          motivo_cita: "Control por Pediatría",
          fecha_hora: proxima_cita,
          estado: "pendiente"
        });
      }

      alert("Historia Clínica guardada exitosamente en Supabase (Pediatría).");
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
          <Baby size={32} className={styles.icon} color="#8b5cf6" />
          <div>
            <h1>Historia Clínica: Pediatría</h1>
            <p className="text-muted">Desarrollo psicomotor, inmunizaciones y antropometría.</p>
          </div>
        </div>
        <PrintButton />
      </div>

      <form className={styles.formContent} onSubmit={handleSubmit} id="pediatria-form">
        {/* Encabezado del Paciente Global */}
        <PatientHeader />

        {/* Motivo de Consulta */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Motivo de Consulta</h3>
          <div className="input-group">
            <input type="text" name="motivo_consulta" className="input-field" placeholder="Ej. Control de niño sano, fiebre, problemas respiratorios..." required />
          </div>
        </section>

        {/* Antecedentes Perinatales */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Antecedentes Perinatales</h3>
          <div className={styles.grid4}>
            <div className="input-group">
              <label className="input-label">Semanas de Gestación</label>
              <input type="number" name="semanas_gestacion" className="input-field" placeholder="Ej. 39" />
            </div>
            <div className="input-group">
              <label className="input-label">Peso al Nacer (g)</label>
              <input type="number" name="peso_nacer" className="input-field" placeholder="Ej. 3200" />
            </div>
            <div className="input-group">
              <label className="input-label">Talla al Nacer (cm)</label>
              <input type="number" name="talla_nacer" className="input-field" placeholder="Ej. 50" />
            </div>
            <div className="input-group">
              <label className="input-label">Apgar (1min / 5min)</label>
              <input type="text" name="apgar" className="input-field" placeholder="Ej. 8 / 9" />
            </div>
          </div>
          
          <div className={styles.grid2} style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Tipo de Parto</label>
              <select name="tipo_parto" className="input-field">
                <option value="">Seleccione...</option>
                <option value="eutocico">Eutócico (Vaginal Normal)</option>
                <option value="distocico">Distócico (Instrumentado)</option>
                <option value="cesarea">Cesárea</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Lactancia Principal</label>
              <select name="lactancia" className="input-field">
                <option value="">Seleccione...</option>
                <option value="materna_exclusiva">Materna Exclusiva</option>
                <option value="mixta">Mixta</option>
                <option value="formula">Fórmula Artificial</option>
              </select>
            </div>
          </div>
        </section>

        {/* Exploración y Observaciones */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Antropometría y Observaciones Clínicas</h3>
          
          <div className={styles.grid4} style={{ marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">Peso Actual (kg)</label>
              <input type="number" step="0.1" name="peso_actual" className="input-field" placeholder="Ej. 10.5" />
            </div>
            <div className="input-group">
              <label className="input-label">Talla Actual (cm)</label>
              <input type="number" step="0.1" name="talla_actual" className="input-field" placeholder="Ej. 85" />
            </div>
            <div className="input-group">
              <label className="input-label">Perímetro Cefálico (cm)</label>
              <input type="number" step="0.1" name="perimetro_cefalico" className="input-field" placeholder="Ej. 48" />
            </div>
            <div className="input-group">
              <label className="input-label">Temperatura (°C)</label>
              <input type="number" step="0.1" name="temperatura" className="input-field" placeholder="Ej. 37.2" />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <textarea 
              name="observaciones"
              className="input-field" 
              rows={5} 
              placeholder="Describa el examen físico, percentiles en curvas de crecimiento (OMS), recomendaciones nutricionales y tratamiento..."
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
           <p style={{color: '#666', fontSize: '0.9rem'}}>Módulo de Pediatría</p>
        </div>

        {/* Botón de Guardar (No se imprime) */}
        <div className={`no-print ${styles.formActions}`}>
          <button type="button" className="btn btn-outline" onClick={() => (document.getElementById('pediatria-form') as HTMLFormElement).reset()}>Cancelar</button>
          <button type="submit" className="btn btn-primary" style={{backgroundColor: '#8b5cf6'}} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Historia Clínica'}
          </button>
        </div>
      </form>
    </div>
  );
}
