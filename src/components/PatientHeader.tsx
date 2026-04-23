"use client";

import styles from "./components.module.css";

export function PatientHeader() {
  return (
    <section className={`card ${styles.patientHeader} patient-header-print print-break-inside-avoid`}>
      <h3 className={styles.sectionTitle}>Datos del Paciente</h3>
      
      <div className={styles.patientGrid}>
        <div className="input-group">
          <label className="input-label">Nombre Completo</label>
          <input type="text" name="nombre" className="input-field" placeholder="Ej. Juan Pérez" required />
        </div>
        
        <div className="input-group">
          <label className="input-label">Fecha de Nacimiento</label>
          <input type="date" name="fecha_nacimiento" className="input-field" />
        </div>

        <div className="input-group">
          <label className="input-label">Identidad (DNI/Pasaporte)</label>
          <input type="text" name="identidad" className="input-field" placeholder="000-0000000-0" required />
        </div>

        <div className="input-group">
          <label className="input-label">Sexo</label>
          <select name="sexo" className="input-field">
            <option value="">Seleccione...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Teléfono de Contacto</label>
          <input type="tel" name="telefono" className="input-field" placeholder="(000) 000-0000" />
        </div>

        <div className="input-group">
          <label className="input-label">Ocupación</label>
          <input type="text" name="ocupacion" className="input-field" placeholder="Profesión u oficio" />
        </div>
      </div>
    </section>
  );
}
