"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Users,
  Plus,
  Save,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Lock,
  Mail,
  User,
  Stethoscope,
  Calendar,
} from "lucide-react";
import styles from "../dashboard.module.css";
import { supabase } from "@/lib/supabase";
import adminStyles from "./admin.module.css";

interface Usuario {
  id: string;
  email: string;
  rol: 'admin' | 'medico' | 'paciente';
  modulo_asignado?: string;
  nombre_completo?: string;
  created_at: string;
}

const MODULOS = [
  { value: 'urologia', label: '🔬 Urología', color: '#8b5cf6' },
  { value: 'ginecologia', label: '🩺 Ginecología', color: '#ec4899' },
  { value: 'cardiologia', label: '❤️ Cardiología', color: '#ef4444' },
  { value: 'pediatria', label: '👶 Pediatría', color: '#f59e0b' },
];

const ROLES = [
  { value: 'admin', label: 'Administrador', icon: ShieldAlert, color: '#0284c7' },
  { value: 'medico', label: 'Médico', icon: Stethoscope, color: '#06b6d4' },
  { value: 'paciente', label: 'Paciente', icon: User, color: '#10b981' },
];

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ medicos: 0, pacientes: 0, total: 0 });
  const [successMsg, setSuccessMsg] = useState("");

  const [nuevo, setNuevo] = useState({
    nombre: "",
    email: "",
    password: "",
    modulo: "urologia",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data } = await supabase
      .from("clinico_usuarios")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (data?.rol !== "admin") {
      window.location.href = "/dashboard";
      return;
    }

    setIsAdmin(true);
    fetchUsuarios();
  };

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('clinico_usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsuarios(data || []);

      // Calcular estadísticas
      const medicos = data?.filter(u => u.rol === 'medico').length || 0;
      const pacientes = data?.filter(u => u.rol === 'paciente').length || 0;
      setStats({ medicos, pacientes, total: data?.length || 0 });
    } catch (error: any) {
      alert("Error al cargar usuarios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (userId: string, rol: string, modulo: string) => {
    try {
      const { error } = await supabase
        .from('clinico_usuarios')
        .update({ rol, modulo_asignado: modulo || null })
        .eq('id', userId);

      if (error) throw error;

      setSuccessMsg("✅ Usuario actualizado correctamente");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchUsuarios();
      setEditingId(null);
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const crearDoctor = async () => {
    if (!nuevo.email || !nuevo.password || !nuevo.nombre) {
      alert("Completa todos los campos");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: nuevo.email,
        password: nuevo.password,
      });

      if (error) throw error;

      await supabase.from("clinico_usuarios").insert({
        id: data.user?.id,
        email: nuevo.email,
        nombre_completo: nuevo.nombre,
        rol: "medico",
        modulo_asignado: nuevo.modulo,
      });

      setSuccessMsg("✅ Médico creado exitosamente");
      setTimeout(() => setSuccessMsg(""), 3000);
      setNuevo({ nombre: "", email: "", password: "", modulo: "urologia" });
      fetchUsuarios();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const getRoleColor = (rol: string) => {
    const role = ROLES.find(r => r.value === rol);
    return role?.color || "#64748b";
  };

  const getModuleLabel = (modulo?: string) => {
    const mod = MODULOS.find(m => m.value === modulo);
    return mod?.label || "Sin módulo";
  };

  if (!isAdmin) return null;

  return (
    <div className={adminStyles.container}>
      {/* HEADER PREMIUM */}
      <header className={adminStyles.header}>
        <div className={adminStyles.headerContent}>
          <div className={adminStyles.headerIcon}>
            <ShieldAlert size={40} color="white" />
          </div>
          <div className={adminStyles.headerText}>
            <h1>Centro de Administración</h1>
            <p>Gestión integral del sistema clínico</p>
          </div>
        </div>
      </header>

      {/* ESTADÍSTICAS */}
      <div className={adminStyles.statsGrid}>
        <div className={adminStyles.statCard} style={{ borderLeftColor: '#0284c7' }}>
          <Users size={28} color="#0284c7" />
          <div>
            <p className={adminStyles.statLabel}>Usuarios Totales</p>
            <h3 className={adminStyles.statValue}>{stats.total}</h3>
          </div>
        </div>

        <div className={adminStyles.statCard} style={{ borderLeftColor: '#06b6d4' }}>
          <Stethoscope size={28} color="#06b6d4" />
          <div>
            <p className={adminStyles.statLabel}>Médicos</p>
            <h3 className={adminStyles.statValue}>{stats.medicos}</h3>
          </div>
        </div>

        <div className={adminStyles.statCard} style={{ borderLeftColor: '#10b981' }}>
          <User size={28} color="#10b981" />
          <div>
            <p className={adminStyles.statLabel}>Pacientes</p>
            <h3 className={adminStyles.statValue}>{stats.pacientes}</h3>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className={adminStyles.successMessage}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CREAR MÉDICO */}
      <section className={adminStyles.sectionCard}>
        <div className={adminStyles.sectionHeader}>
          <Plus size={24} />
          <h2>Agregar Nuevo Médico</h2>
        </div>

        <div className={adminStyles.formGrid}>
          <div className={adminStyles.formGroup}>
            <label>
              <User size={16} /> Nombre Completo
            </label>
            <input
              type="text"
              placeholder="Dr. Juan Pérez"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              className={adminStyles.input}
            />
          </div>

          <div className={adminStyles.formGroup}>
            <label>
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              placeholder="medico@clinica.com"
              value={nuevo.email}
              onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
              className={adminStyles.input}
            />
          </div>

          <div className={adminStyles.formGroup}>
            <label>
              <Lock size={16} /> Contraseña Temporal
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={nuevo.password}
              onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
              className={adminStyles.input}
            />
          </div>

          <div className={adminStyles.formGroup}>
            <label>
              <Stethoscope size={16} /> Especialidad
            </label>
            <select
              value={nuevo.modulo}
              onChange={(e) => setNuevo({ ...nuevo, modulo: e.target.value })}
              className={adminStyles.select}
            >
              {MODULOS.map(mod => (
                <option key={mod.value} value={mod.value}>
                  {mod.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className={adminStyles.buttonPrimary} onClick={crearDoctor}>
          <Plus size={18} /> Crear Médico
        </button>
      </section>

      {/* LISTADO DE USUARIOS */}
      <section className={adminStyles.sectionCard}>
        <div className={adminStyles.sectionHeader}>
          <Users size={24} />
          <h2>Directorio de Usuarios</h2>
        </div>

        {loading ? (
          <p className={adminStyles.loadingText}>⏳ Cargando usuarios...</p>
        ) : usuarios.length === 0 ? (
          <div className={adminStyles.emptyState}>
            <AlertCircle size={40} color="#94a3b8" />
            <p>No hay usuarios registrados aún</p>
          </div>
        ) : (
          <div className={adminStyles.tableWrapper}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Especialidad</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id} className={adminStyles.tableRow}>
                    <td className={adminStyles.nameCell}>
                      <div className={adminStyles.userAvatar}>
                        {user.nombre_completo?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={adminStyles.userName}>{user.nombre_completo || "Sin nombre"}</p>
                        <p className={adminStyles.userEmail}>{user.email}</p>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {editingId === user.id ? (
                        <select
                          value={user.rol}
                          onChange={(e) => {
                            setUsuarios(prev =>
                              prev.map(u =>
                                u.id === user.id ? { ...u, rol: e.target.value as any } : u
                              )
                            );
                          }}
                          className={adminStyles.select}
                        >
                          {ROLES.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={adminStyles.roleBadge}
                          style={{ backgroundColor: `${getRoleColor(user.rol)}20`, color: getRoleColor(user.rol) }}
                        >
                          {ROLES.find(r => r.value === user.rol)?.label}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === user.id ? (
                        <select
                          value={user.modulo_asignado || ''}
                          onChange={(e) => {
                            setUsuarios(prev =>
                              prev.map(u =>
                                u.id === user.id ? { ...u, modulo_asignado: e.target.value } : u
                              )
                            );
                          }}
                          className={adminStyles.select}
                        >
                          <option value="">Sin módulo</option>
                          {MODULOS.map(mod => (
                            <option key={mod.value} value={mod.value}>
                              {mod.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={adminStyles.moduleBadge}>
                          {getModuleLabel(user.modulo_asignado)}
                        </span>
                      )}
                    </td>
                    <td className={adminStyles.dateCell}>
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className={adminStyles.actionCell}>
                      {editingId === user.id ? (
                        <>
                          <button
                            className={adminStyles.buttonSave}
                            onClick={() => handleUpdate(user.id, user.rol, user.modulo_asignado || '')}
                          >
                            <Save size={16} />
                          </button>
                          <button
                            className={adminStyles.buttonCancel}
                            onClick={() => setEditingId(null)}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          className={adminStyles.buttonEdit}
                          onClick={() => setEditingId(user.id)}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}