"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Users, KeyRound, Save, UserPlus } from "lucide-react";
import styles from "../dashboard.module.css";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔹 estados para crear doctor
  const [nuevo, setNuevo] = useState({
    nombre: "",
    email: "",
    password: "",
    modulo: "general",
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  // 🔐 VALIDAR ADMIN
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
    } catch (error: any) {
      alert("Error al cargar usuarios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ACTUALIZAR USUARIO
  const handleUpdate = async (userId: string, rol: string, modulo: string) => {
    try {
      const { error } = await supabase
        .from('clinico_usuarios')
        .update({ rol, modulo_asignado: modulo })
        .eq('id', userId);

      if (error) throw error;
      alert("Usuario actualizado");
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  // 🔥 CREAR DOCTOR
  const crearDoctor = async () => {
    if (!nuevo.email || !nuevo.password) {
      return alert("Completa email y contraseña");
    }

    try {
      // 1. Crear usuario en Auth
      const { data, error } = await supabase.auth.signUp({
        email: nuevo.email,
        password: nuevo.password,
      });

      if (error) throw error;

      // 2. Guardar en tabla
      await supabase.from("clinico_usuarios").insert({
        id: data.user?.id,
        email: nuevo.email,
        nombre_completo: nuevo.nombre,
        rol: "medico",
        modulo_asignado: nuevo.modulo,
      });

      alert("✅ Doctor creado");
      setNuevo({ nombre: "", email: "", password: "", modulo: "general" });
      fetchUsuarios();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <ShieldAlert size={36} color="var(--color-danger)" />
          <div>
            <h1>Panel de Administrador</h1>
            <p className="text-muted">Control total del sistema</p>
          </div>
        </div>
      </header>

      {/* 🔥 CREAR DOCTOR */}
      <section className="card" style={{ marginTop: 20 }}>
        <h3><UserPlus size={18}/> Crear Médico</h3>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4, 1fr)" }}>
          <input
            placeholder="Nombre"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          />
          <input
            placeholder="Email"
            value={nuevo.email}
            onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={nuevo.password}
            onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
          />
          <select
            value={nuevo.modulo}
            onChange={(e) => setNuevo({ ...nuevo, modulo: e.target.value })}
          >
            <option value="general">General</option>
            <option value="urologia">Urología</option>
            <option value="ginecologia">Ginecología</option>
            <option value="cardiologia">Cardiología</option>
            <option value="pediatria">Pediatría</option>
          </select>
        </div>

        <button onClick={crearDoctor} style={{ marginTop: 10 }}>
          ➕ Crear Médico
        </button>
      </section>

      {/* LISTADO */}
      <section className="card" style={{marginTop: '2rem'}}>
        <h3>Usuarios Registrados</h3>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', marginTop: '1rem'}}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(user => (
                  <tr key={user.id}>
                    <td>{user.nombre_completo || "—"}</td>
                    <td>{user.email}</td>

                    {/* 🔥 FIX REACT */}
                    <td>
                      <select
                        value={user.rol || ""}
                        onChange={(e) => {
                          setUsuarios(prev =>
                            prev.map(u =>
                              u.id === user.id ? { ...u, rol: e.target.value } : u
                            )
                          );
                        }}
                      >
                        <option value="paciente">Paciente</option>
                        <option value="medico">Médico</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={user.modulo_asignado || ""}
                        onChange={(e) => {
                          setUsuarios(prev =>
                            prev.map(u =>
                              u.id === user.id ? { ...u, modulo_asignado: e.target.value } : u
                            )
                          );
                        }}
                      >
                        <option value="">Ninguno</option>
                        <option value="urologia">Urología</option>
                        <option value="ginecologia">Ginecología</option>
                        <option value="cardiologia">Cardiología</option>
                        <option value="pediatria">Pediatría</option>
                      </select>
                    </td>

                    <td>
                      <button
                        onClick={() => handleUpdate(user.id, user.rol, user.modulo_asignado)}
                      >
                        <Save size={14}/> Guardar
                      </button>
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