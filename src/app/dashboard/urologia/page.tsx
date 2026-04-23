"use client";

import { useState } from "react";
import { Droplets } from "lucide-react";
import { PatientHeader } from "@/components/PatientHeader";
import { PrintButton } from "@/components/PrintButton";
import styles from "../form.module.css";
import { supabase } from "@/lib/supabase";

export default function UrologiaModule() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identidad = formData.get("identidad") as string;
    const nombre = formData.get("nombre") as string;
    const telefono = formData.get("telefono") as string;
    const motivo_consulta = formData.get("motivo_consulta") as string;
    const examen_fisico = formData.get("examen_fisico") as string;
    const psa = parseFloat(formData.get("psa") as string) || null;
    const proxima_cita = formData.get("proxima_cita") as string;

    try {
      // 1. Obtener la sesión del médico actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const { data: userData } = await supabase.from('clinico_usuarios').select('nombre_completo').eq('id', session.user.id).single();

      // 2. Insertar Paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from("clinico_pacientes_urologia")
        .insert({
          identidad,
          nombre,
          telefono
        })
        .select()
        .single();

      if (pacienteError) throw pacienteError;

      // 3. Insertar Historia Clínica
      const { error: historiaError } = await supabase
        .from("clinico_historias_urologia")
        .insert({
          paciente_id: pacienteData.id,
          medico_id: session.user.id,
          motivo_consulta,
          examen_fisico,
          psa
        });

      if (historiaError) throw historiaError;

      // 4. Agendar Próxima Cita si se especificó
      if (proxima_cita) {
        // En un caso real buscaríamos si el paciente tiene auth_id para enlazarlo, por ahora lo dejamos genérico o sin auth_id
        await supabase.from("clinico_citas").insert({
          paciente_auth_id: pacienteData.id, // Usamos el ID de la tabla pacientes (ajuste para la app)
          medico_id: session.user.id,
          modulo: "urologia",
          motivo_cita: "Control por Urología",
          fecha_hora: proxima_cita,
          estado: "pendiente"
        });
      }

      alert("Historia Clínica guardada exitosamente en Supabase.");
      (e.target as HTMLFormElement).reset();

      // Forzar render para actualizar campos en pantalla si se necesita
      setLoading(false);

    } catch (error: any) {
      alert("Error al guardar: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.moduleContainer}>
      <div className={`${styles.header} no-print`}>
        <div className={styles.titleWrapper}>
          <Droplets size={32} className={styles.icon} color="#0284c7" />
          <div>
            <h1>Historia Clínica: Urología</h1>
            <p className="text-muted">Evaluación genitourinaria, STUI y tamizaje prostático.</p>
          </div>
        </div>
        <PrintButton />
      </div>

      <form className={styles.formContent} onSubmit={handleSubmit} id="medical-form">
        {/* Encabezado del Paciente Global */}
        <section className={`card print-break-inside-avoid ${styles.section} patient-header-print`}>
          <h3 className={styles.sectionTitle}>Datos Personales</h3>
          <div className={styles.grid4}>
             <div className="input-group">
                <label className="input-label">Identidad / DNI</label>
                <input type="text" name="identidad" className="input-field" required />
             </div>
             <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <input type="text" name="nombre" className="input-field" required />
             </div>
             <div className="input-group">
                <label className="input-label">Teléfono</label>
                <input type="text" name="telefono" className="input-field" />
             </div>
          </div>
        </section>

        {/* Motivo de Consulta */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Motivo de Consulta y Padecimiento Actual</h3>
          <div className="input-group">
            <input type="text" name="motivo_consulta" className="input-field" placeholder="Ej. Dificultad para orinar, hematuria, dolor lumbar..." required />
          </div>
        </section>

        {/* Exploración Física y Exámenes */}
        <section className={`card print-break-inside-avoid ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Examen Físico, Próstata y Resultados</h3>
          
          <div className={styles.grid2} style={{ marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">Último PSA (Antígeno Prostático) - ng/mL</label>
              <input type="number" step="0.1" name="psa" className="input-field" placeholder="Ej. 1.2" />
            </div>
            <div className="input-group">
              <label className="input-label">Próxima Cita (Opcional)</label>
              <input type="datetime-local" name="proxima_cita" className="input-field" />
            </div>
          </div>

          <div className="input-group">
            <textarea 
              name="examen_fisico"
              className="input-field" 
              rows={5} 
              placeholder="Exploración de genitales externos, resultados de ecografía..."
            ></textarea>
          </div>
        </section>

        {/* Pie de Firma para Impresión */}
        <div className="print-footer">
           <div className="signature-line"></div>
           <p style={{fontWeight: 'bold', fontSize: '1.1rem', margin: '0.25rem 0'}}>Firma del Médico Tratante</p>
           <p style={{color: '#666', fontSize: '0.9rem'}}>Módulo de Urología</p>
        </div>

        {/* Botón de Guardar (No se imprime) */}
        <div className={`no-print ${styles.formActions}`}>
          <button type="button" className="btn btn-outline" onClick={() => (document.getElementById('medical-form') as HTMLFormElement).reset()}>Cancelar</button>
          <button type="submit" className="btn btn-primary" style={{backgroundColor: '#0284c7'}} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Historia Clínica'}
          </button>
        </div>
      </form>
    </div>
  );
}
