"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, Printer, Search, X } from "lucide-react";
import styles from "./historialnuevo.module.css";

interface Paciente {
  id: string;
  nombre_completo: string;
  cedula: string;
  fecha_nacimiento: string;
  tipo_sangre?: string;
  sexo?: string;
}

export default function HistorialNuevoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [pacienteId, setPacienteId] = useState(
    searchParams.get("paciente") || ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [formData, setFormData] = useState({
    motivo_consulta: "",
    duracion_sintomas: "",
    sintomas_principales: "",
    antecedentes_enfermedad_actual: "",
    peso: "",
    altura: "",
    presion_sistolica: "",
    presion_diastolica: "",
    frecuencia_cardiaca: "",
    frecuencia_respiratoria: "",
    temperatura: "",
    saturacion_oxigeno: "",
    examen_fisico_general: "",
    diagnostico_principal: "",
    diagnosticos_secundarios: "",
    plan_tratamiento: "",
    medicamentos: "",
    recomendaciones: "",
    estudios_solicitados: "",
  });

  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || usuario?.rol !== "medico") {
      router.push("/login");
      return;
    }

    cargarPacientes();
  }, [isAuthenticated, usuario, authLoading, router]);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pacientes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data.data || []);
        setPacientesFiltrados(data.data || []);
      }
    } catch (error) {
      console.error("Error cargando pacientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      const filtrados = pacientes.filter(
        (p) =>
          p.nombre_completo.toLowerCase().includes(value.toLowerCase()) ||
          p.cedula.includes(value)
      );
      setPacientesFiltrados(filtrados);
      setShowSearchResults(true);
    } else {
      setPacientesFiltrados(pacientes);
      setShowSearchResults(false);
    }
  };

  const handleSelectPaciente = (paciente: Paciente) => {
    setPacienteId(paciente.id);
    setSearchTerm(paciente.nombre_completo);
    setShowSearchResults(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPacienteId("");
    setPacientesFiltrados(pacientes);
    setShowSearchResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pacienteId) {
      alert("Por favor selecciona un paciente");
      return;
    }

    if (!formData.diagnostico_principal || !formData.plan_tratamiento) {
      alert("Por favor completa los campos requeridos: Diagnóstico y Plan de Tratamiento");
      return;
    }

    try {
      setEnviado(true);

      const response = await fetch("/api/historiales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paciente_id: pacienteId,
          ...formData,
        }),
      });

      if (response.ok) {
        alert("Historial clínico guardado exitosamente");
        setFormData({
          motivo_consulta: "",
          duracion_sintomas: "",
          sintomas_principales: "",
          antecedentes_enfermedad_actual: "",
          peso: "",
          altura: "",
          presion_sistolica: "",
          presion_diastolica: "",
          frecuencia_cardiaca: "",
          frecuencia_respiratoria: "",
          temperatura: "",
          saturacion_oxigeno: "",
          examen_fisico_general: "",
          diagnostico_principal: "",
          diagnosticos_secundarios: "",
          plan_tratamiento: "",
          medicamentos: "",
          recomendaciones: "",
          estudios_solicitados: "",
        });
        setSearchTerm("");
        setPacienteId("");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "No se pudo guardar el historial"}`);
      }
    } catch (error) {
      console.error("Error creando historial:", error);
      alert("Error al guardar el historial clínico");
    } finally {
      setEnviado(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && printRef.current) {
      const paciente = pacientes.find((p) => p.id === pacienteId);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Historial Clínico</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
            .header { border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
            .clinic-info h1 { margin: 0; font-size: 24px; color: #2563eb; }
            .clinic-info p { margin: 3px 0; color: #666; }
            .specialty-badge { background: #2563eb; color: white; padding: 8px 15px; border-radius: 5px; font-weight: bold; text-align: center; }
            .specialty-badge-title { font-size: 12px; color: #666; margin-bottom: 5px; }
            .doctor-info { margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; }
            .doctor-info p { margin: 3px 0; }
            .section { margin-bottom: 20px; }
            .section h3 { background: #f0f0f0; padding: 10px; margin: 0 0 10px 0; font-size: 14px; border-left: 4px solid #2563eb; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { font-weight: bold; width: 200px; }
            .vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .footer { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-top">
              <div class="clinic-info">
                <h1>🏥 Historial Clínico</h1>
                <p>Clínica de Servicios Médicos</p>
              </div>
              <div class="specialty-badge">
                <div class="specialty-badge-title">ESPECIALIDAD</div>
                <strong>${usuario?.especialidad || "General"}</strong>
              </div>
            </div>
            <div class="doctor-info">
              <p><strong>Médico:</strong> ${usuario?.nombre_completo?.toUpperCase()}</p>
              <p><strong>Licencia:</strong> ${usuario?.licencia_medica || "N/A"}</p>
            </div>
          </div>

          <div class="section">
            <h3>Información del Paciente</h3>
            <div class="info-row">
              <span class="info-label">Paciente:</span>
              <span>${paciente?.nombre_completo}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cédula:</span>
              <span>${paciente?.cedula}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tipo de Sangre:</span>
              <span>${paciente?.tipo_sangre || "No especificado"}</span>
            </div>
          </div>

          <div class="section">
            <h3>Motivo de Consulta</h3>
            <p>${formData.motivo_consulta}</p>
          </div>

          ${
            formData.peso ||
            formData.altura ||
            formData.presion_sistolica ||
            formData.temperatura
              ? `
          <div class="section">
            <h3>Signos Vitales</h3>
            <div class="vitals-grid">
              ${formData.peso ? `<div><strong>Peso:</strong> ${formData.peso} kg</div>` : ""}
              ${formData.altura ? `<div><strong>Altura:</strong> ${formData.altura} m</div>` : ""}
              ${formData.temperatura ? `<div><strong>Temperatura:</strong> ${formData.temperatura}°C</div>` : ""}
              ${formData.presion_sistolica ? `<div><strong>P.A.:</strong> ${formData.presion_sistolica}/${formData.presion_diastolica || "?"} mmHg</div>` : ""}
              ${formData.frecuencia_cardiaca ? `<div><strong>F.C.:</strong> ${formData.frecuencia_cardiaca} lpm</div>` : ""}
              ${formData.frecuencia_respiratoria ? `<div><strong>F.R.:</strong> ${formData.frecuencia_respiratoria} rpm</div>` : ""}
            </div>
          </div>
          `
              : ""
          }

          ${formData.examen_fisico_general ? `
          <div class="section">
            <h3>Examen Físico</h3>
            <p>${formData.examen_fisico_general}</p>
          </div>
          ` : ""}

          <div class="section">
            <h3>Diagnóstico Principal</h3>
            <p>${formData.diagnostico_principal}</p>
          </div>

          ${formData.diagnosticos_secundarios ? `
          <div class="section">
            <h3>Diagnósticos Secundarios</h3>
            <p>${formData.diagnosticos_secundarios}</p>
          </div>
          ` : ""}

          <div class="section">
            <h3>Plan de Tratamiento</h3>
            <p>${formData.plan_tratamiento}</p>
          </div>

          ${formData.medicamentos ? `
          <div class="section">
            <h3>Medicamentos</h3>
            <p>${formData.medicamentos}</p>
          </div>
          ` : ""}

          ${formData.recomendaciones ? `
          <div class="section">
            <h3>Recomendaciones</h3>
            <p>${formData.recomendaciones}</p>
          </div>
          ` : ""}

          ${formData.estudios_solicitados ? `
          <div class="section">
            <h3>Estudios Solicitados</h3>
            <p>${formData.estudios_solicitados}</p>
          </div>
          ` : ""}

          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString("es-ES")}</p>
            <p>Este documento es confidencial y solo debe ser accesible al paciente y personal autorizado.</p>
            <p style="margin-top: 10px;">_____________________________</p>
            <p>Firma del Médico</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const paciente = pacientes.find((p) => p.id === pacienteId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Nuevo Historial Clínico</h1>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : (
        <div className={styles.formWrapper}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Búsqueda de Paciente */}
            <section className={styles.section}>
              <h2>Buscar Paciente</h2>
              <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                  <Search size={20} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o cédula..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={handleClearSearch}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {showSearchResults && pacientesFiltrados.length > 0 && (
                  <div className={styles.searchResults}>
                    {pacientesFiltrados.map((p) => (
                      <div
                        key={p.id}
                        className={styles.searchResult}
                        onClick={() => handleSelectPaciente(p)}
                      >
                        <div className={styles.resultName}>{p.nombre_completo}</div>
                        <div className={styles.resultMeta}>Cédula: {p.cedula}</div>
                      </div>
                    ))}
                  </div>
                )}

                {showSearchResults && pacientesFiltrados.length === 0 && (
                  <div className={styles.noResults}>
                    No se encontraron pacientes
                  </div>
                )}
              </div>
            </section>

            {pacienteId && paciente && (
              <>
                {/* Información del Paciente */}
                <section className={styles.section}>
                  <h3>Información del Paciente</h3>
                  <div className={styles.infoBox}>
                    <p>
                      <strong>Nombre:</strong> {paciente.nombre_completo}
                    </p>
                    <p>
                      <strong>Cédula:</strong> {paciente.cedula}
                    </p>
                    <p>
                      <strong>Tipo de Sangre:</strong>{" "}
                      {paciente.tipo_sangre || "No especificado"}
                    </p>
                  </div>
                </section>

                {/* Motivo de Consulta */}
                <section className={styles.section}>
                  <h3>Motivo de Consulta</h3>
                  <textarea
                    placeholder="Describe el motivo de la consulta"
                    value={formData.motivo_consulta}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        motivo_consulta: e.target.value,
                      })
                    }
                    required
                  />
                </section>

                {/* Síntomas y Antecedentes */}
                <section className={styles.section}>
                  <h3>Síntomas</h3>
                  <input
                    type="text"
                    placeholder="Duración de síntomas"
                    value={formData.duracion_sintomas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duracion_sintomas: e.target.value,
                      })
                    }
                  />
                  <textarea
                    placeholder="Síntomas principales"
                    value={formData.sintomas_principales}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sintomas_principales: e.target.value,
                      })
                    }
                  />
                  <textarea
                    placeholder="Antecedentes de la enfermedad actual"
                    value={formData.antecedentes_enfermedad_actual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        antecedentes_enfermedad_actual: e.target.value,
                      })
                    }
                  />
                </section>

                {/* Signos Vitales */}
                <section className={styles.section}>
                  <h3>Signos Vitales</h3>
                  <div className={styles.grid}>
                    <input
                      type="number"
                      placeholder="Peso (kg)"
                      step="0.1"
                      value={formData.peso}
                      onChange={(e) =>
                        setFormData({ ...formData, peso: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      placeholder="Altura (m)"
                      step="0.01"
                      value={formData.altura}
                      onChange={(e) =>
                        setFormData({ ...formData, altura: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      placeholder="P.A. Sistólica"
                      value={formData.presion_sistolica}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presion_sistolica: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="P.A. Diastólica"
                      value={formData.presion_diastolica}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presion_diastolica: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="F.C. (lpm)"
                      value={formData.frecuencia_cardiaca}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frecuencia_cardiaca: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="F.R. (rpm)"
                      value={formData.frecuencia_respiratoria}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frecuencia_respiratoria: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="Temperatura (°C)"
                      step="0.1"
                      value={formData.temperatura}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          temperatura: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="Sat. O2 (%)"
                      value={formData.saturacion_oxigeno}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          saturacion_oxigeno: e.target.value,
                        })
                      }
                    />
                  </div>
                </section>

                {/* Examen Físico */}
                <section className={styles.section}>
                  <h3>Examen Físico</h3>
                  <textarea
                    placeholder="Descripción del examen físico general"
                    value={formData.examen_fisico_general}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        examen_fisico_general: e.target.value,
                      })
                    }
                  />
                </section>

                {/* Diagnóstico */}
                <section className={styles.section}>
                  <h3>Diagnóstico</h3>
                  <textarea
                    placeholder="Diagnóstico principal"
                    value={formData.diagnostico_principal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        diagnostico_principal: e.target.value,
                      })
                    }
                    required
                  />
                  <textarea
                    placeholder="Diagnósticos secundarios (si aplica)"
                    value={formData.diagnosticos_secundarios}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        diagnosticos_secundarios: e.target.value,
                      })
                    }
                  />
                </section>

                {/* Plan de Tratamiento */}
                <section className={styles.section}>
                  <h3>Plan de Tratamiento</h3>
                  <textarea
                    placeholder="Descripción del plan de tratamiento"
                    value={formData.plan_tratamiento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plan_tratamiento: e.target.value,
                      })
                    }
                    required
                  />
                  <textarea
                    placeholder="Medicamentos recomendados"
                    value={formData.medicamentos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medicamentos: e.target.value,
                      })
                    }
                  />
                  <textarea
                    placeholder="Recomendaciones al paciente"
                    value={formData.recomendaciones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recomendaciones: e.target.value,
                      })
                    }
                  />
                  <textarea
                    placeholder="Estudios solicitados"
                    value={formData.estudios_solicitados}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estudios_solicitados: e.target.value,
                      })
                    }
                  />
                </section>

                {/* Botones */}
                <div className={styles.formButtons}>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={enviado}
                  >
                    <Save size={20} /> {enviado ? "Guardando..." : "Guardar Historial"}
                  </button>
                  <button
                    type="button"
                    className={styles.printBtn}
                    onClick={handlePrint}
                  >
                    <Printer size={20} /> Imprimir
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Referencia invisible para impresión */}
          <div ref={printRef} style={{ display: "none" }}>
            {pacienteId && paciente && formData.diagnostico_principal && (
              <div>
                <h1>Historial Clínico</h1>
                <p>Paciente: {paciente.nombre_completo}</p>
                <p>Diagnóstico: {formData.diagnostico_principal}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
