"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  Plus,
} from "lucide-react";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { usuario, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !usuario) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingScreen}>Cargando...</div>
      </div>
    );
  }

  const adminModules = [
    {
      id: "medicos",
      title: "Médicos",
      description: "Crear, editar y administrar médicos por especialidad",
      icon: Users,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      href: "/dashboard/medicos",
      action: "Gestionar Médicos",
    },
    {
      id: "pacientes",
      title: "Pacientes",
      description: "Ver y administrar todos los pacientes del sistema",
      icon: Users,
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      href: "/dashboard/pacientes",
      action: "Ver Pacientes",
    },
    {
      id: "citas",
      title: "Citas",
      description: "Visualizar y gestionar todas las citas programadas",
      icon: Calendar,
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      href: "/dashboard/citas",
      action: "Gestionar Citas",
    },
    {
      id: "reportes",
      title: "Reportes",
      description: "Generar reportes y análisis de estadísticas",
      icon: FileText,
      color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      href: "/dashboard/reportes",
      action: "Ver Reportes",
    },
  ];

  const medicoModules = [
    {
      id: "nuevo-paciente",
      title: "Nuevo Paciente",
      description: "Crear y registrar nuevos pacientes en el sistema",
      icon: Plus,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      href: "/dashboard/crear-paciente",
      action: "Crear Paciente",
    },
    {
      id: "mis-pacientes",
      title: "Mis Pacientes",
      description: "Gestionar y consultar información de tus pacientes",
      icon: Users,
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      href: "/dashboard/mis-pacientes",
      action: "Ver Pacientes",
    },
    {
      id: "nueva-cita",
      title: "Agendar Cita",
      description: "Programar nuevas citas para tus pacientes",
      icon: Calendar,
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      href: "/dashboard/crear-cita",
      action: "Agendar Cita",
    },
    {
      id: "mis-citas",
      title: "Mis Citas",
      description: "Visualizar tus citas programadas y actuales",
      icon: Clock,
      color: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      href: "/dashboard/mis-citas",
      action: "Ver Citas",
    },
    {
      id: "historial",
      title: "Historial Clínico",
      description: "Crear y gestionar historiales clínicos de pacientes",
      icon: FileText,
      color: "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
      href: "/dashboard/historial-nuevo",
      action: "Nuevo Historial",
    },
    {
      id: "mi-dashboard",
      title: "Mi Dashboard",
      description: "Ver estadísticas y resumen de tu actividad",
      icon: TrendingUp,
      color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      href: "/dashboard/mi-dashboard",
      action: "Ver Dashboard",
    },
  ];

  const modules = usuario.rol === "admin" ? adminModules : medicoModules;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>
            {usuario.rol === "admin"
              ? "Panel de Administración"
              : "Mi Área de Trabajo"}
          </h1>
          <p className={styles.textMuted}>
            Bienvenido, {usuario.nombre_completo}
            {usuario.especialidad && ` • ${usuario.especialidad}`}
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className={styles.grid}>
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              className={styles.moduleCard}
              onClick={() => router.push(module.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push(module.href);
                }
              }}
            >
              <div
                className={styles.iconWrapper}
                style={{ background: module.color }}
              >
                <Icon size={28} color="white" />
              </div>

              <h3>{module.title}</h3>
              <p>{module.description}</p>

              <a className={styles.linkBtn} href={module.href}>
                {module.action}
                <ArrowRight size={16} />
              </a>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className={styles.infoSection}>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Sistema</span>
            <span className={styles.infoValue}>CRM Clínico v1.0.0</span>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Rol</span>
            <span className={styles.infoValue}>
              {usuario.rol === "admin" ? "Administrador" : "Médico"}
            </span>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{usuario.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const Clock = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
