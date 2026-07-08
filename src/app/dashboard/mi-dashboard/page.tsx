"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import styles from "./midash.module.css";

interface Estadisticas {
  totalCitas: number;
  citasHoy: number;
  citasCompletadas: number;
  totalPacientes: number;
}

export default function MiDashboardPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<Estadisticas>({
    totalCitas: 0,
    citasHoy: 0,
    citasCompletadas: 0,
    totalPacientes: 0,
  });
  const [loading, setLoading] = useState(authLoading);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || usuario?.rol !== "medico") {
      router.push("/login");
      return;
    }

    cargarEstadisticas();
  }, [isAuthenticated, usuario, authLoading, router]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const [citasRes, pacientesRes] = await Promise.all([
        fetch("/api/citas", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/pacientes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let citasData = [];
      let pacientesData = [];

      if (citasRes.ok) {
        const data = await citasRes.json();
        citasData = data.data || [];
      }
      if (pacientesRes.ok) {
        const data = await pacientesRes.json();
        pacientesData = data.data || [];
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const citasHoy = citasData.filter((cita: any) => {
        const fechaCita = new Date(cita.fecha_cita);
        fechaCita.setHours(0, 0, 0, 0);
        return (
          fechaCita.getTime() === hoy.getTime() &&
          cita.estado === "programada"
        );
      });

      const citasCompletadas = citasData.filter(
        (cita: any) => cita.estado === "completada"
      );

      setStats({
        totalCitas: citasData.length,
        citasHoy: citasHoy.length,
        citasCompletadas: citasCompletadas.length,
        totalPacientes: pacientesData.length,
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Mi Dashboard</h1>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando estadísticas...</div>
      ) : (
        <>
          {/* Tarjeta de Bienvenida */}
          <div className={styles.welcomeCard}>
            <h2>BIENVENIDO, {usuario?.nombre_completo?.toUpperCase()}! 👋</h2>
            <p>Especialidad: {usuario?.especialidad?.toUpperCase() || "No especificada"}</p>
          </div>

          {/* Estadísticas */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.cardBlue}`}>
              <div className={styles.statIcon}>
                <Calendar size={32} />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Citas Hoy</p>
                <p className={styles.statValue}>{stats.citasHoy}</p>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.cardGreen}`}>
              <div className={styles.statIcon}>
                <CheckCircle size={32} />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Completadas</p>
                <p className={styles.statValue}>{stats.citasCompletadas}</p>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.cardOrange}`}>
              <div className={styles.statIcon}>
                <Users size={32} />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Mis Pacientes</p>
                <p className={styles.statValue}>{stats.totalPacientes}</p>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.cardPurple}`}>
              <div className={styles.statIcon}>
                <TrendingUp size={32} />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Citas</p>
                <p className={styles.statValue}>{stats.totalCitas}</p>
              </div>
            </div>
          </div>

          {/* Accesos Rápidos */}
          <div className={styles.quickAccessSection}>
            <h3>Accesos Rápidos</h3>
            <div className={styles.quickAccessGrid}>
              <button
                className={styles.quickAccessBtn}
                onClick={() => router.push("/dashboard/mis-citas")}
              >
                <Calendar size={24} />
                <span>Ver Mis Citas</span>
              </button>
              <button
                className={styles.quickAccessBtn}
                onClick={() => router.push("/dashboard/mis-pacientes")}
              >
                <Users size={24} />
                <span>Ver Mis Pacientes</span>
              </button>
              <button
                className={styles.quickAccessBtn}
                onClick={() => router.push("/dashboard/historial-nuevo")}
              >
                <TrendingUp size={24} />
                <span>Crear Historial</span>
              </button>
            </div>
          </div>

          {/* Información Útil */}
          <div className={styles.infoSection}>
            <h3>Información del Sistema</h3>
            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <h4>📋 Gestión de Citas</h4>
                <p>
                  Visualiza y gestiona todas tus citas programadas de forma
                  fácil y rápida.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h4>👥 Mis Pacientes</h4>
                <p>
                  Accede a la información de todos tus pacientes registrados en
                  el sistema.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h4>📝 Historiales Clínicos</h4>
                <p>
                  Crea y gestiona historiales clínicos detallados para cada
                  consulta.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
