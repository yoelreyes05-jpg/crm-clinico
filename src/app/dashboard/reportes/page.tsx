"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Printer, Eye } from "lucide-react";
import styles from "./reportes.module.css";

interface HistorialClinico {
  id: string;
  paciente_id: string;
  medico_id: string;
  especialidad: string;
  motivo_consulta: string;
  diagnostico_principal: string;
  plan_tratamiento: string;
  medicamentos?: string;
  fecha: string;
  created_at: string;
}

interface Paciente {
  id: string;
  nombre_completo: string;
  cedula: string;
}

interface Medico {
  id: string;
  nombre_completo: string;
  especialidad: string;
}

export default function ReportesPage() {
  const router = useRouter();
  const { token, loading: authLoading, isAuthenticated } = useAuth();

  const [historiales, setHistoriales] = useState<HistorialClinico[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [filtro, setFiltro] = useState({
    paciente_id: "",
    especialidad: "",
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [selectedHistorial, setSelectedHistorial] = useState<HistorialClinico | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    cargarDatos();
  }, [isAuthenticated, authLoading, router]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pacientesRes, medicosRes] = await Promise.all([
        fetch("/api/pacientes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/medicos", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (pacientesRes.ok) {
        const data = await pacientesRes.json();
        setPacientes(data.data || []);
      }
      if (medicosRes.ok) {
        const data = await medicosRes.json();
        setMedicos(data.data || []);
      }

      // Cargar historiales (simulado por ahora)
      setHistoriales([]);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (historial: HistorialClinico) => {
    const paciente = pacientes.find((p) => p.id === historial.paciente_id);
    const medico = medicos.find((m) => m.id === historial.medico_id);

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Historial Clínico</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; }
            .section { margin-bottom: 20px; }
            .section h3 { background: #f0f0f0; padding: 10px; margin: 0 0 10px 0; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { font-weight: bold; width: 150px; }
            .footer { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏥 Historial Clínico</h1>
            <p style="margin: 0;">Clínica de Servicios Médicos</p>
          </div>

          <div class="section">
            <h3>Información del Paciente</h3>
            <div class="info-row">
              <span class="info-label">Paciente:</span>
              <span>${paciente?.nombre_completo || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cédula:</span>
              <span>${paciente?.cedula || "N/A"}</span>
            </div>
          </div>

          <div class="section">
            <h3>Información de la Consulta</h3>
            <div class="info-row">
              <span class="info-label">Médico:</span>
              <span>${medico?.nombre_completo || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Especialidad:</span>
              <span>${historial.especialidad}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha:</span>
              <span>${new Date(historial.created_at).toLocaleDateString("es-ES")}</span>
            </div>
          </div>

          <div class="section">
            <h3>Motivo de Consulta</h3>
            <p>${historial.motivo_consulta}</p>
          </div>

          <div class="section">
            <h3>Diagnóstico Principal</h3>
            <p>${historial.diagnostico_principal}</p>
          </div>

          <div class="section">
            <h3>Plan de Tratamiento</h3>
            <p>${historial.plan_tratamiento}</p>
          </div>

          ${historial.medicamentos ? `
          <div class="section">
            <h3>Medicamentos</h3>
            <p>${historial.medicamentos}</p>
          </div>
          ` : ""}

          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString("es-ES")}</p>
            <p>Este documento es confidencial y solo debe ser accesible al paciente y personal autorizado.</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const getNombrePaciente = (id: string) => {
    return pacientes.find((p) => p.id === id)?.nombre_completo || "N/A";
  };

  const getNombreMedico = (id: string) => {
    return medicos.find((m) => m.id === id)?.nombre_completo || "N/A";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Reportes y Historiales</h1>
      </div>

      <div className={styles.filtrosContainer}>
        <h3>Filtros</h3>
        <div className={styles.filtros}>
          <select
            value={filtro.paciente_id}
            onChange={(e) =>
              setFiltro({ ...filtro, paciente_id: e.target.value })
            }
          >
            <option value="">Todos los pacientes</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_completo}
              </option>
            ))}
          </select>

          <select
            value={filtro.especialidad}
            onChange={(e) =>
              setFiltro({ ...filtro, especialidad: e.target.value })
            }
          >
            <option value="">Todas las especialidades</option>
            <option value="cardiologia">Cardiología</option>
            <option value="medicina_interna">Medicina Interna</option>
            <option value="urologia">Urología</option>
            <option value="ginecologia">Ginecología</option>
            <option value="pediatria">Pediatría</option>
            <option value="dermatologia">Dermatología</option>
            <option value="oftalmologia">Oftalmología</option>
            <option value="traumatologia">Traumatología</option>
          </select>

          <input
            type="date"
            value={filtro.fecha_inicio}
            onChange={(e) =>
              setFiltro({ ...filtro, fecha_inicio: e.target.value })
            }
            placeholder="Desde"
          />

          <input
            type="date"
            value={filtro.fecha_fin}
            onChange={(e) =>
              setFiltro({ ...filtro, fecha_fin: e.target.value })
            }
            placeholder="Hasta"
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando reportes...</div>
      ) : selectedHistorial ? (
        <div className={styles.detailContainer}>
          <button
            className={styles.backDetailBtn}
            onClick={() => setSelectedHistorial(null)}
          >
            ← Volver
          </button>

          <div className={styles.historialDetail}>
            <div className={styles.detailHeader}>
              <h2>Historial Clínico</h2>
              <button
                className={styles.printBtn}
                onClick={() => handlePrint(selectedHistorial)}
              >
                <Printer size={20} /> Imprimir
              </button>
            </div>

            <div className={styles.detailContent}>
              <section>
                <h3>Información del Paciente</h3>
                <p>
                  <strong>Paciente:</strong>{" "}
                  {getNombrePaciente(selectedHistorial.paciente_id)}
                </p>
              </section>

              <section>
                <h3>Información de la Consulta</h3>
                <p>
                  <strong>Médico:</strong>{" "}
                  {getNombreMedico(selectedHistorial.medico_id)}
                </p>
                <p>
                  <strong>Especialidad:</strong> {selectedHistorial.especialidad}
                </p>
                <p>
                  <strong>Fecha:</strong>{" "}
                  {new Date(selectedHistorial.created_at).toLocaleDateString(
                    "es-ES"
                  )}
                </p>
              </section>

              <section>
                <h3>Motivo de Consulta</h3>
                <p>{selectedHistorial.motivo_consulta}</p>
              </section>

              <section>
                <h3>Diagnóstico Principal</h3>
                <p>{selectedHistorial.diagnostico_principal}</p>
              </section>

              <section>
                <h3>Plan de Tratamiento</h3>
                <p>{selectedHistorial.plan_tratamiento}</p>
              </section>

              {selectedHistorial.medicamentos && (
                <section>
                  <h3>Medicamentos</h3>
                  <p>{selectedHistorial.medicamentos}</p>
                </section>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {historiales.length === 0 ? (
            <p className={styles.empty}>
              No hay historiales registrados. Los historiales se crearán cuando
              se realicen consultas médicas.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Especialidad</th>
                  <th>Motivo</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historiales.map((historial) => (
                  <tr key={historial.id}>
                    <td>{getNombrePaciente(historial.paciente_id)}</td>
                    <td>{getNombreMedico(historial.medico_id)}</td>
                    <td>{historial.especialidad}</td>
                    <td>{historial.motivo_consulta}</td>
                    <td>
                      {new Date(historial.created_at).toLocaleDateString(
                        "es-ES"
                      )}
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.viewBtn}
                        onClick={() => setSelectedHistorial(historial)}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className={styles.printBtn}
                        onClick={() => handlePrint(historial)}
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
