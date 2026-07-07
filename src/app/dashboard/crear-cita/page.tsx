"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, Search, UserPlus, CheckCircle2 } from "lucide-react";
import styles from "./crearCita.module.css";

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

export default function CrearCitaPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [enviado, setEnviado] = useState(false);

  // Búsqueda de paciente por cédula
  const [cedulaBusqueda, setCedulaBusqueda] = useState("");
  const [pacienteEncontrado, setPacienteEncontrado] = useState<Paciente | null>(null);
  const [busquedaSinResultado, setBusquedaSinResultado] = useState(false);

  const [formData, setFormData] = useState({
    paciente_id: "",
    medico_id: usuario?.id || "",
    especialidad: usuario?.especialidad || "",
    fecha_cita: "",
    duracion_minutos: 30,
    tipo_paciente: "privado",
    motivo_cita: "",
    notas: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || usuario?.rol !== "medico") {
      router.push("/login");
      return;
    }

    cargarDatos();
  }, [isAuthenticated, usuario, authLoading, router]);

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
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar paciente por cédula (con o sin guiones)
  const buscarPaciente = () => {
    const cedula = cedulaBusqueda.replace(/[\s-]/g, "");
    if (!cedula) {
      alert("Escribe la cédula del paciente para buscar");
      return;
    }
    const encontrado = pacientes.find(
      (p) => (p.cedula || "").replace(/[\s-]/g, "") === cedula
    );
    if (encontrado) {
      setPacienteEncontrado(encontrado);
      setBusquedaSinResultado(false);
      setFormData((prev) => ({ ...prev, paciente_id: encontrado.id }));
    } else {
      setPacienteEncontrado(null);
      setBusquedaSinResultado(true);
      setFormData((prev) => ({ ...prev, paciente_id: "" }));
    }
  };

  const limpiarBusqueda = () => {
    setCedulaBusqueda("");
    setPacienteEncontrado(null);
    setBusquedaSinResultado(false);
    setFormData((prev) => ({ ...prev, paciente_id: "" }));
  };

  const irANuevoPaciente = () => {
    const cedula = cedulaBusqueda.replace(/[\s-]/g, "");
    router.push(`/dashboard/crear-paciente${cedula ? `?cedula=${cedula}` : ""}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.paciente_id ||
      !formData.medico_id ||
      !formData.especialidad ||
      !formData.fecha_cita
    ) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setEnviado(true);

      const response = await fetch("/api/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Cita agendada exitosamente");
        setFormData({
          paciente_id: "",
          medico_id: usuario?.id || "",
          especialidad: usuario?.especialidad || "",
          fecha_cita: "",
          duracion_minutos: 30,
          tipo_paciente: "privado",
          motivo_cita: "",
          notas: "",
        });
        router.push("/dashboard/mis-citas");
      } else {
        alert("Error al agendar la cita");
      }
    } catch (error) {
      console.error("Error agendando cita:", error);
      alert("Error al agendar la cita");
    } finally {
      setEnviado(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Agendar Nueva Cita</h1>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : (
        <div className={styles.formWrapper}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <section className={styles.section}>
              <h2>Seleccionar Paciente *</h2>

              {/* Búsqueda por cédula */}
              <div className={styles.searchRow}>
                <input
                  type="text"
                  placeholder="Buscar por cédula (Ej: 001-1234567-8)"
                  value={cedulaBusqueda}
                  onChange={(e) => {
                    setCedulaBusqueda(e.target.value);
                    setBusquedaSinResultado(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      buscarPaciente();
                    }
                  }}
                  className={styles.searchInput}
                />
                <button
                  type="button"
                  className={styles.searchBtn}
                  onClick={buscarPaciente}
                >
                  <Search size={17} /> Buscar
                </button>
                <button
                  type="button"
                  className={styles.newPatientBtn}
                  onClick={irANuevoPaciente}
                  disabled={!busquedaSinResultado}
                  title={
                    busquedaSinResultado
                      ? "Registrar este paciente nuevo"
                      : "Se habilita cuando la cédula buscada no está registrada"
                  }
                >
                  <UserPlus size={17} /> Nuevo Paciente
                </button>
              </div>

              {/* Resultado de la búsqueda */}
              {pacienteEncontrado && (
                <div className={styles.pacienteCard}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <div>
                    <strong>{pacienteEncontrado.nombre_completo}</strong>
                    <span> — Cédula: {pacienteEncontrado.cedula}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.limpiarBtn}
                    onClick={limpiarBusqueda}
                  >
                    Cambiar
                  </button>
                </div>
              )}
              {busquedaSinResultado && (
                <div className={styles.noEncontrado}>
                  No hay ningún paciente registrado con esa cédula.
                  Usa el botón <b>Nuevo Paciente</b> para registrarlo.
                </div>
              )}

              {/* Alternativa: seleccionar de la lista */}
              {!pacienteEncontrado && (
                <select
                  value={formData.paciente_id}
                  onChange={(e) => {
                    setFormData({ ...formData, paciente_id: e.target.value });
                    const sel = pacientes.find((p) => p.id === e.target.value);
                    if (sel) {
                      setPacienteEncontrado(sel);
                      setBusquedaSinResultado(false);
                    }
                  }}
                  className={styles.selectField}
                >
                  <option value="">O selecciona de tu lista de pacientes...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_completo} ({p.cedula})
                    </option>
                  ))}
                </select>
              )}
            </section>

            <section className={styles.section}>
              <h2>Información de la Cita</h2>
              <div className={styles.grid}>
                <div>
                  <label>Médico *</label>
                  <select
                    value={formData.medico_id}
                    onChange={(e) =>
                      setFormData({ ...formData, medico_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar médico</option>
                    {medicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Especialidad *</label>
                  <select
                    value={formData.especialidad}
                    onChange={(e) =>
                      setFormData({ ...formData, especialidad: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar especialidad</option>
                    <option value="cardiologia">Cardiología</option>
                    <option value="medicina_interna">Medicina Interna</option>
                    <option value="urologia">Urología</option>
                    <option value="ginecologia">Ginecología</option>
                    <option value="pediatria">Pediatría</option>
                    <option value="dermatologia">Dermatología</option>
                    <option value="oftalmologia">Oftalmología</option>
                    <option value="traumatologia">Traumatología</option>
                  </select>
                </div>
              </div>

              <div className={styles.grid}>
                <div>
                  <label>Fecha y Hora de la Cita *</label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_cita}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_cita: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label>Tipo de Paciente *</label>
                  <div className={styles.checklistRow}>
                    <label className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={formData.tipo_paciente === "asegurado"}
                        onChange={() =>
                          setFormData({ ...formData, tipo_paciente: "asegurado" })
                        }
                      />
                      <span>Asegurado (ARS)</span>
                    </label>
                    <label className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={formData.tipo_paciente === "privado"}
                        onChange={() =>
                          setFormData({ ...formData, tipo_paciente: "privado" })
                        }
                      />
                      <span>Privado</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label>Motivo de la Cita</label>
                <input
                  type="text"
                  placeholder="Ej: Consulta de seguimiento"
                  value={formData.motivo_cita}
                  onChange={(e) =>
                    setFormData({ ...formData, motivo_cita: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Notas Adicionales</label>
                <textarea
                  placeholder="Notas sobre la cita..."
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                />
              </div>
            </section>

            <div className={styles.formButtons}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={enviado}
              >
                <Save size={20} /> {enviado ? "Agendando..." : "Agendar Cita"}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => router.back()}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
