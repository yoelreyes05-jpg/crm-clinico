"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import styles from "./pacientes.module.css";

interface Paciente {
  id: string;
  cedula: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  tipo_sangre?: string;
  estado: boolean;
}

export default function PacientesPage() {
  const router = useRouter();
  const { token, loading: authLoading, isAuthenticated } = useAuth();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre_completo: "",
    fecha_nacimiento: "",
    sexo: "M",
    telefono: "",
    email: "",
    direccion: "",
    ciudad: "",
    tipo_sangre: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    cargarPacientes();
  }, [isAuthenticated, authLoading, router]);

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
      }
    } catch (error) {
      console.error("Error cargando pacientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/pacientes/${editingId}` : "/api/pacientes";
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
          cedula: "",
          nombre_completo: "",
          fecha_nacimiento: "",
          sexo: "M",
          telefono: "",
          email: "",
          direccion: "",
          ciudad: "",
          tipo_sangre: "",
        });
        cargarPacientes();
      }
    } catch (error) {
      console.error("Error guardando paciente:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este paciente?")) return;

    try {
      const response = await fetch(`/api/pacientes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        cargarPacientes();
      }
    } catch (error) {
      console.error("Error eliminando paciente:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Gestión de Pacientes</h1>
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} /> Agregar Paciente
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h2>{editingId ? "Editar Paciente" : "Crear Nuevo Paciente"}</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Cédula"
              value={formData.cedula}
              onChange={(e) =>
                setFormData({ ...formData, cedula: e.target.value })
              }
              required
              disabled={!!editingId}
            />
            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.nombre_completo}
              onChange={(e) =>
                setFormData({ ...formData, nombre_completo: e.target.value })
              }
              required
            />
            <input
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) =>
                setFormData({ ...formData, fecha_nacimiento: e.target.value })
              }
              required
            />
            <select
              value={formData.sexo}
              onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
              required
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={(e) =>
                setFormData({ ...formData, direccion: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={(e) =>
                setFormData({ ...formData, ciudad: e.target.value })
              }
            />
            <select
              value={formData.tipo_sangre}
              onChange={(e) =>
                setFormData({ ...formData, tipo_sangre: e.target.value })
              }
            >
              <option value="">Seleccionar tipo de sangre</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitBtn}>
                {editingId ? "Actualizar" : "Crear"} Paciente
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
        <div className={styles.loading}>Cargando pacientes...</div>
      ) : (
        <div className={styles.listContainer}>
          {pacientes.length === 0 ? (
            <p className={styles.empty}>No hay pacientes registrados</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Nacimiento</th>
                  <th>Teléfono</th>
                  <th>Tipo Sangre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>{paciente.cedula}</td>
                    <td>{paciente.nombre_completo}</td>
                    <td>
                      {new Date(paciente.fecha_nacimiento).toLocaleDateString()}
                    </td>
                    <td>{paciente.telefono || "-"}</td>
                    <td>{paciente.tipo_sangre || "-"}</td>
                    <td className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingId(paciente.id);
                          setFormData({
                            cedula: paciente.cedula,
                            nombre_completo: paciente.nombre_completo,
                            fecha_nacimiento: paciente.fecha_nacimiento,
                            sexo: paciente.sexo,
                            telefono: paciente.telefono || "",
                            email: paciente.email || "",
                            direccion: paciente.direccion || "",
                            ciudad: paciente.ciudad || "",
                            tipo_sangre: paciente.tipo_sangre || "",
                          });
                          setShowForm(true);
                        }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(paciente.id)}
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
