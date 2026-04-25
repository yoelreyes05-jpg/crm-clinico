"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Check } from "lucide-react";
import styles from "./misant.module.css";

interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  especialidad: string;
  fecha_cita: string;
  duracion_minutos: number;
  motivo_cita?: string;
  estado: string;
  visto_paciente: boolean;
}

interface Paciente {
  id: string;
  nombre_completo: string;
  cedula: string;
  telefono?: string;
}

export default function MisCitasPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [filtro, setFiltro] = useState("todas");

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
      const [citasRes, pacientesRes] = await Promise.all([
        fetch("/api/citas", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/pacientes", {
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
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNombrePaciente = (id: string) => {
    const paciente = pacientes.find((p) => p.id === id);
    return paciente ? `${paciente.nombre_completo} (${paciente.cedula})` : id;
  };

  const formatoFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleString("es-ES");
  };

  const getCitasFiltradas = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    return citas.filter((cita) => {
      const fechaCita = new Date(cita.fecha_cita);
      if (cita.estado !== "programada") return false;

      if (filtro === "hoy") {
        const citaHoy = new Date(cita.fecha_cita);
        citaHoy.setHours(0, 0, 0, 0);
        return citaHoy.getTime() === hoy.getTime();
      }
      if (filtro === "proximo") {
        return fechaCita > new Date();
      }
      return true;
    });
  };

  const handleMarcarAsistencia = async (citaId: string) => {
    try {
      const response = await fetch(`/api/citas/${citaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: "completada",
          visto_paciente: true,
        }),
      });

      if (response.ok) {
        cargarDatos();
      }
    } catch (error) {
      console.error("Error marcando asistencia:", error);
    }
  };

  const citasFiltradas = getCitasFiltradas();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Mis Citas</h1>
      </div>

      <div className={styles.filtrosContainer}>
        <button
          className={`${styles.filterBtn} ${filtro === "todas" ? styles.active : ""}`}
          onClick={() => setFiltro("todas")}
        >
          Todas
        </button>
        <button
          className={`${styles.filterBtn} ${filtro === "hoy" ? styles.active : ""}`}
          onClick={() => setFiltro("hoy")}
        >
          Hoy
        </button>
        <button
          className={`${styles.filterBtn} ${filtro === "proximo" ? styles.active : ""}`}
          onClick={() => setFiltro("proximo")}
        >
          Próximas
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando citas...</div>
      ) : citasFiltradas.length === 0 ? (
        <div className={styles.empty}>
          {filtro === "todas"
            ? "No tienes citas programadas"
            : `No tienes citas ${filtro === "hoy" ? "para hoy" : "próximas"}`}
        </div>
      ) : (
        <div className={styles.citasGrid}>
          {citasFiltradas.map((cita) => (
            <div key={cita.id} className={styles.citaCard}>
              <div className={styles.cardHeader}>
                <h3>{getNombrePaciente(cita.paciente_id)}</h3>
                {cita.visto_paciente && (
                  <span className={styles.badge}>Asistió</span>
                )}
              </div>

              <div className={styles.cardContent}>
                <p>
                  <strong>Especialidad:</strong> {cita.especialidad}
                </p>
                <p>
                  <strong>Fecha:</strong> {formatoFecha(cita.fecha_cita)}
                </p>
                <p>
                  <strong>Duración:</strong> {cita.duracion_minutos} minutos
                </p>
                {cita.motivo_cita && (
                  <p>
                    <strong>Motivo:</strong> {cita.motivo_cita}
                  </p>
                )}
              </div>

              {!cita.visto_paciente && (
                <button
                  className={styles.marcarBtn}
                  onClick={() => handleMarcarAsistencia(cita.id)}
                >
                  <Check size={18} /> Marcar como Completada
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
