"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Edit2, Trash2, Key, X } from "lucide-react";
import styles from "./medicos.module.css";

interface Medico {
  id: string;
  nombre_completo: string;
  email: string;
  especialidad: string;
  licencia_medica?: string;
  telefono?: string;
  estado: boolean;
}

export default function MedicosPage() {
  const router = useRouter();
  const { token, loading: authLoading, isAuthenticated } = useAuth();

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedMedicoId, setSelectedMedicoId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    contrasena_nueva: "",
    confirmar_contrasena: "",
  });
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    password: "",
    especialidad: "",
    licencia_medica: "",
    telefono: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    cargarMedicos();
  }, [isAuthenticated, authLoading, router]);

  const cargarMedicos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/medicos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedicos(data.data || []);
      }
    } catch (error) {
      console.error("Error cargando médicos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/medicos/${editingId}` : "/api/medicos";
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
        alert(editingId ? "Médico actualizado" : "Médico creado");
        setShowForm(false);
        setEditingId(null);
        setFormData({
          nombre_completo: "",
          email: "",
          password: "",
          especialidad: "",
          licencia_medica: "",
          telefono: "",
        });
        cargarMedicos();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error guardando médico:", error);
      alert("Error al guardar médico");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.contrasena_nueva || !passwordData.confirmar_contrasena) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (passwordData.contrasena_nueva !== passwordData.confirmar_contrasena) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.contrasena_nueva.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const response = await fetch("/api/medicos/cambiar-contrasena", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medico_id: selectedMedicoId,
          contrasena_nueva: passwordData.contrasena_nueva,
        }),
      });

      if (response.ok) {
        alert("Contraseña actualizada exitosamente");
        setShowPasswordModal(false);
        setPasswordData({
          contrasena_nueva: "",
          confirmar_contrasena: "",
        });
        setSelectedMedicoId(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cambiar contraseña");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este médico?")) return;

    try {
      const response = await fetch(`/api/medicos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Médico eliminado");
        cargarMedicos();
      }
    } catch (error) {
      console.error("Error eliminando médico:", error);
      alert("Error al eliminar médico");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Gestión de Médicos</h1>
        <button
          className={styles.addBtn}
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setFormData({
                nombre_completo: "",
                email: "",
                password: "",
                especialidad: "",
                licencia_medica: "",
                telefono: "",
              });
            }
          }}
        >
          <Plus size={20} /> Agregar Médico
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h2>{editingId ? "Editar Médico" : "Crear Nuevo Médico"}</h2>
          <form onSubmit={handleSubmit}>
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
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            {!editingId && (
              <input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            )}
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
              type="text"
              placeholder="Licencia Médica"
              value={formData.licencia_medica}
              onChange={(e) =>
                setFormData({ ...formData, licencia_medica: e.target.value })
              }
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
            />
            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitBtn}>
                {editingId ? "Actualizar" : "Crear"} Médico
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    nombre_completo: "",
                    email: "",
                    password: "",
                    especialidad: "",
                    licencia_medica: "",
                    telefono: "",
                  });
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Cambiar Contraseña */}
      {showPasswordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Cambiar Contraseña</h3>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedMedicoId(null);
                  setPasswordData({
                    contrasena_nueva: "",
                    confirmar_contrasena: "",
                  });
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nueva Contraseña *</label>
                <input
                  type="password"
                  placeholder="Ingresa nueva contraseña"
                  value={passwordData.contrasena_nueva}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      contrasena_nueva: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Confirmar Contraseña *</label>
                <input
                  type="password"
                  placeholder="Confirma la contraseña"
                  value={passwordData.confirmar_contrasena}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmar_contrasena: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className={styles.formButtons}>
                <button type="submit" className={styles.submitBtn}>
                  Cambiar Contraseña
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedMedicoId(null);
                    setPasswordData({
                      contrasena_nueva: "",
                      confirmar_contrasena: "",
                    });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Cargando médicos...</div>
      ) : (
        <div className={styles.listContainer}>
          {medicos.length === 0 ? (
            <p className={styles.empty}>No hay médicos registrados</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Especialidad</th>
                  <th>Licencia</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {medicos.map((medico) => (
                  <tr key={medico.id}>
                    <td>{medico.nombre_completo}</td>
                    <td>{medico.email}</td>
                    <td>{medico.especialidad}</td>
                    <td>{medico.licencia_medica || "-"}</td>
                    <td>{medico.telefono || "-"}</td>
                    <td className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingId(medico.id);
                          setFormData({
                            nombre_completo: medico.nombre_completo,
                            email: medico.email,
                            password: "",
                            especialidad: medico.especialidad,
                            licencia_medica: medico.licencia_medica || "",
                            telefono: medico.telefono || "",
                          });
                          setShowForm(true);
                        }}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className={styles.passwordBtn}
                        onClick={() => {
                          setSelectedMedicoId(medico.id);
                          setShowPasswordModal(true);
                        }}
                        title="Cambiar contraseña"
                      >
                        <Key size={18} />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(medico.id)}
                        title="Eliminar"
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
