"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Users, KeyRound, Save } from "lucide-react";
import styles from "../dashboard.module.css";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('clinico_usuarios')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error: any) {
      alert("Error al cargar usuarios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (userId: string, currentRol: string, currentModulo: string) => {
    try {
      const { error } = await supabase
        .from('clinico_usuarios')
        .update({ rol: currentRol, modulo_asignado: currentModulo })
        .eq('id', userId);

      if (error) throw error;
      alert("Usuario actualizado exitosamente");
    } catch (error: any) {
      alert("Error al actualizar: " + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <ShieldAlert size={36} color="var(--color-danger)" />
          <div>
            <h1>Panel de Administrador (Programador)</h1>
            <p className="text-muted">Gestión de Accesos, Médicos y Reseteo de Contraseñas.</p>
          </div>
        </div>
      </header>

      <section className={styles.grid}>
        <div className={`card ${styles.moduleCard}`}>
          <div className={styles.iconWrapper} style={{ backgroundColor: `rgba(239, 68, 68, 0.1)`, color: "var(--color-danger)" }}>
            <Users size={32} />
          </div>
          <h3>Gestión de Médicos</h3>
          <p>Asigna módulos y roles a los usuarios registrados.</p>
        </div>

        <div className={`card ${styles.moduleCard}`}>
          <div className={styles.iconWrapper} style={{ backgroundColor: `rgba(245, 158, 11, 0.1)`, color: "var(--color-warning)" }}>
            <KeyRound size={32} />
          </div>
          <h3>Reseteo de Claves</h3>
          <p>Para resetear claves, usa el panel de Auth en Supabase por seguridad.</p>
        </div>
      </section>

      <section className="card" style={{marginTop: '2rem'}}>
        <h3>Usuarios Registrados en el Sistema</h3>
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse', minWidth: '700px'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--color-border)'}}>
                  <th style={{padding: '0.5rem'}}>Nombre</th>
                  <th style={{padding: '0.5rem'}}>Email</th>
                  <th style={{padding: '0.5rem'}}>Rol</th>
                  <th style={{padding: '0.5rem'}}>Módulo Asignado</th>
                  <th style={{padding: '0.5rem'}}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(user => (
                  <tr key={user.id} style={{borderBottom: '1px solid var(--color-border)'}}>
                    <td style={{padding: '0.5rem'}}>{user.nombre_completo || 'Sin nombre'}</td>
                    <td style={{padding: '0.5rem'}}>{user.email}</td>
                    <td style={{padding: '0.5rem'}}>
                      <select 
                        defaultValue={user.rol || ''}
                        onChange={(e) => {user.rol = e.target.value}}
                        style={{padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc'}}
                      >
                        <option value="paciente">Paciente</option>
                        <option value="medico">Médico</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{padding: '0.5rem'}}>
                      <select 
                        defaultValue={user.modulo_asignado || ''}
                        onChange={(e) => {user.modulo_asignado = e.target.value}}
                        style={{padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc'}}
                      >
                        <option value="">Ninguno (Paciente/Admin)</option>
                        <option value="urologia">Urología</option>
                        <option value="ginecologia">Ginecología</option>
                        <option value="cardiologia">Cardiología</option>
                        <option value="pediatria">Pediatría</option>
                      </select>
                    </td>
                    <td style={{padding: '0.5rem'}}>
                      <button 
                        onClick={() => handleUpdate(user.id, user.rol, user.modulo_asignado)}
                        className="btn btn-primary" 
                        style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'center'}}
                      >
                        <Save size={14} /> Guardar
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
