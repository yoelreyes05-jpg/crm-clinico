"use client";

import { useEffect, useState } from "react";
import { LogOut, FileText, HeartPulse, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./portal.module.css";
import { supabase } from "@/lib/supabase";

export default function PortalPaciente() {
  const router = useRouter();
  const [citas, setCitas] = useState<any[]>([]);
  const [userName, setUserName] = useState("Paciente");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDataAndCitas();
  }, []);

  const fetchUserDataAndCitas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: user } = await supabase.from('clinico_usuarios').select('nombre_completo').eq('id', session.user.id).single();
      if (user?.nombre_completo) {
        setUserName(user.nombre_completo);
      }

      const { data: citasData, error } = await supabase
        .from('clinico_citas')
        .select('*, clinico_usuarios!clinico_citas_medico_id_fkey(nombre_completo)')
        .eq('paciente_auth_id', session.user.id)
        .gte('fecha_hora', new Date().toISOString())
        .order('fecha_hora', { ascending: true });

      if (error) throw error;
      setCitas(citasData || []);
    } catch (error: any) {
      console.error("Error al cargar portal:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const confirmarCita = async (citaId: string) => {
    try {
      const { error } = await supabase
        .from('clinico_citas')
        .update({ estado: 'confirmada' })
        .eq('id', citaId);

      if (error) throw error;
      alert("¡Cita confirmada exitosamente!");
      fetchUserDataAndCitas(); // Recargar citas
    } catch (error: any) {
      alert("Error al confirmar cita: " + error.message);
    }
  };

  const getModuleBadgeClass = (modulo: string) => {
    switch(modulo) {
      case 'cardiologia': return styles.badgeCardio;
      case 'urologia': return styles.badgeUro;
      case 'ginecologia': return styles.badgeGineco || styles.badgeCardio; // Fallback if missing
      case 'pediatria': return styles.badgePedia || styles.badgeUro; // Fallback if missing
      default: return styles.badgeCardio;
    }
  };

  return (
    <div className={styles.portalContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <HeartPulse size={28} className={styles.logoIcon} />
          <h2>Mi Salud App (PWA)</h2>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit'}}>
          <LogOut size={20} />
          <span className={styles.hideMobile}>Cerrar Sesión</span>
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <h1>Hola, {userName}</h1>
          <p>Bienvenido a tu portal médico personal.</p>
        </section>

        <section className={styles.historySection} style={{marginBottom: '2.5rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
            <h2 style={{margin: 0}}>Tus Próximas Citas</h2>
            {citas.filter(c => c.estado === 'pendiente').length > 0 && (
              <span style={{background: 'var(--color-danger)', color: 'white', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold'}}>
                {citas.filter(c => c.estado === 'pendiente').length} Pendientes
              </span>
            )}
          </div>
          
          {loading ? (
            <p>Cargando tus citas...</p>
          ) : citas.length === 0 ? (
            <p className="text-muted">No tienes próximas citas programadas.</p>
          ) : (
            citas.map(cita => (
              <div key={cita.id} className={`card ${styles.timelineItem}`} style={{borderLeft: cita.estado === 'confirmada' ? '4px solid #10b981' : '4px solid var(--color-warning)', background: cita.estado === 'confirmada' ? '#ecfdf5' : '#fffbeb', marginBottom: '1rem'}}>
                <div className={styles.itemHeader}>
                  <span className={styles.date} style={{color: cita.estado === 'confirmada' ? '#10b981' : 'var(--color-warning)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    {new Date(cita.fecha_hora).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                    {cita.estado === 'confirmada' && <CheckCircle size={16} />}
                  </span>
                  <span className={getModuleBadgeClass(cita.modulo)} style={{textTransform: 'capitalize'}}>{cita.modulo}</span>
                </div>
                <h4>{cita.motivo_cita}</h4>
                <p className={styles.doctor}>Dr(a). {cita.clinico_usuarios?.nombre_completo || 'No asignado'}</p>
                <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem'}}>
                  {cita.estado === 'pendiente' ? (
                    <button onClick={() => confirmarCita(cita.id)} className="btn btn-primary" style={{flex: 1, backgroundColor: 'var(--color-warning)', border: 'none', color: '#000'}}>
                      Confirmar Asistencia
                    </button>
                  ) : (
                    <div style={{flex: 1, padding: '0.5rem', backgroundColor: '#10b981', color: 'white', textAlign: 'center', borderRadius: 'var(--radius-md)', fontWeight: 'bold'}}>
                      Asistencia Confirmada
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        <section className={styles.historySection}>
          <h2>Tu Historial de Consultas</h2>
          
          <div className={styles.timeline}>
            <p className="text-muted">El historial de consultas médicas anteriores aparecerá aquí próximamente.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
