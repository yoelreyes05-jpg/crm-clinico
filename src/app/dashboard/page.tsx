import Link from "next/link";
import { Activity, HeartPulse, Baby, Droplets, ArrowRight } from "lucide-react";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const modules = [
    {
      title: "Cardiología e Interna",
      desc: "Historias clínicas, factores de riesgo, ecocardiogramas.",
      icon: <Activity size={32} />,
      color: "var(--color-primary)",
      path: "/dashboard/cardiologia"
    },
    {
      title: "Ginecología y Obstetricia",
      desc: "Control prenatal, historial AGO, citologías.",
      icon: <HeartPulse size={32} />,
      color: "#e11d48",
      path: "/dashboard/ginecologia"
    },
    {
      title: "Pediatría",
      desc: "Crecimiento, hitos del desarrollo, inmunizaciones.",
      icon: <Baby size={32} />,
      color: "#8b5cf6",
      path: "/dashboard/pediatria"
    },
    {
      title: "Urología",
      desc: "Síntomas STUI, función prostática, uroanálisis.",
      icon: <Droplets size={32} />,
      color: "#0284c7",
      path: "/dashboard/urologia"
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Panel Principal</h1>
          <p className="text-muted">Bienvenido al Sistema de Gestión Médica CRM.</p>
        </div>
      </header>

      <section className={styles.grid}>
        {modules.map((mod) => (
          <div key={mod.path} className={`card ${styles.moduleCard}`}>
            <div className={styles.iconWrapper} style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
              {mod.icon}
            </div>
            <h3>{mod.title}</h3>
            <p>{mod.desc}</p>
            <Link href={mod.path} className={styles.linkBtn}>
              <span>Ingresar al Módulo</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </section>

      {/* Aquí luego podemos añadir métricas rápidas de los pacientes si hay bd configurada */}
    </div>
  );
}
