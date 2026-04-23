"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { PatientHeader } from "@/components/PatientHeader";
import { PrintButton } from "@/components/PrintButton";
import styles from "../form.module.css";
import { supabase } from "@/lib/supabase";

export default function CardiologiaModule() {
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
    </div>
  );
}
