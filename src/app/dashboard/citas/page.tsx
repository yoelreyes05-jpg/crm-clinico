"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import styles from "./citas.module.css";

interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  especialidad: string;
  fecha_cita: string;
  duracion_minutos: number;
  motivo_cita?: string;
  notas?: string;
  estado: string;
  visto_paciente: boolean;
}

export default function CitasPage() {
  const router = useRouter();
  const { token, loading: authLoading, isAuthenticated } = useAuth();

  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    paciente_id: "",
    medico_id: "",
    especialidad: "",
    fecha_cita: "",
    duracion_minutos: 30,
    motivo_cita: "",
    notas: "",
  });

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
      const [citasRes, pacientesRes, medicosRes] = await Promise.all([
        fetch("/api/citas", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/pacientes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/medicos", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (citasRes.ok) {
        const data = await citasRes.json();
        setCitas(data.data || []);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/citas/${editingId}` : "/api/citas";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          paciente_id: "",
          medico_id: "",
          especialidad: "",
          fecha_cita: "",
          duracion_minutos: 30,
          motivo_cita: "",
          notas: "",
        });
        cargarDatos();
      }
    } catch (error) {
      console.error("Error guardando cita:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;

    try {
      const response = await fetch(`/api/citas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        cargarDatos();
      }
    } catch (error) {
      console.error("Error cancelando cita:", error);
    }
  };

  const getNombrePaciente = (id: string) => {
    return pacientes.find((p) => p.id === id)?.nombre_completo || id;
  };

  const getNombreMedico = (id: string) => {
    return medicos.find((m) => m.id === id)?.nombre_completo || id;
  };

  const formatoFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleString("es-ES");
  };

  const getEstadoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      programada: "badge-programada",
      completada: "badge-completada",
      cancelada: "badge-cancelada",
    };
    return colores[estado] || "badge-programada";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Gestión de Citas</h1>
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} /> Agendar Cita
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h2>{editingId ? "Editar Cita" : "Agendar Nueva Cita"}</h2>
          <form onSubmit={handleSubmit}>
            <select
              value={formData.paciente_id}
              onChange={(e) =>
                setFormData({ ...formData, paciente_id: e.target.value })
              }
              required
            >
              <option value="">Seleccionar paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_completo}
                </option>
              ))}
            </select>

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
                  {m.nombre_completo?.toUpperCase()}
                </option>
              ))}
            </select>

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

            <input
              type="datetime-local"
              value={formData.fecha_cita}
              onChange={(e) =>
                setFormData({ ...formData, fecha_cita: e.target.value })
              }
              required
            />

            <input
              type="number"
              placeholder="Duración (minutos)"
              value={formData.duracion_minutos}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duracion_minutos: parseInt(e.target.value),
                })
              }
            />

            <input
              type="text"
              placeholder="Motivo de la cita"
              value={formData.motivo_cita}
              onChange={(e) =>
                setFormData({ ...formData, motivo_cita: e.target.value })
              }
            />

            <textarea
              placeholder="Notas adicionales"
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              style={{ gridColumn: "1 / -1" }}
            />

            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitBtn}>
                {editingId ? "Actualizar" : "Agendar"} Cita
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Cargando citas...</div>
      ) : (
        <div className={styles.listContainer}>
          {citas.length === 0 ? (
            <p className={styles.empty}>No hay citas agendadas</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Especialidad</th>
                  <th>Fecha y Hora</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => (
                  <tr key={cita.id}>
                    <td>{getNombrePaciente(cita.paciente_id)}</td>
                    <td>{getNombreMedico(cita.medico_id)}</td>
                    <td>{cita.especialidad}</td>
                    <td>{formatoFecha(cita.fecha_cita)}</td>
                    <td>{cita.duracion_minutos} min</td>
                    <td>
                      <span className={`${styles.badge} ${styles[getEstadoBadge(cita.estado)]}`}>
                        {cita.estado}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingId(cita.id);
                          setFormData({
                            paciente_id: cita.paciente_id,
                            medico_id: cita.medico_id,
                            especialidad: cita.especialidad,
                            fecha_cita: cita.fecha_cita,
                            duracion_minutos: cita.duracion_minutos,
                            motivo_cita: cita.motivo_cita || "",
                            notas: cita.notas || "",
                          });
                          setShowForm(true);
                        }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(cita.id)}
                      >
                        <Trash2 size={18} />
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
