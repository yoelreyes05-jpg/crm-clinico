"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  LogOut,
  Home,
  Settings,
} from "lucide-react";
import styles from "./layout-nuevo.module.css";

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  key: string;
  adminOnly?: boolean;
}

const adminMenuItems: MenuItem[] = [
  { href: "/dashboard", label: "Inicio", icon: <Home size={20} />, key: "inicio" },
  { href: "/dashboard/medicos", label: "Médicos", icon: <Users size={20} />, key: "medicos", adminOnly: true },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: <Users size={20} />, key: "pacientes" },
  { href: "/dashboard/citas", label: "Citas", icon: <Calendar size={20} />, key: "citas" },
  { href: "/dashboard/reportes", label: "Reportes", icon: <FileText size={20} />, key: "reportes" },
];

const medicoMenuItems: MenuItem[] = [
  { href: "/dashboard/mi-dashboard", label: "Dashboard", icon: <BarChart3 size={20} />, key: "dashboard" },
  { href: "/dashboard/mis-citas", label: "Mis Citas", icon: <Calendar size={20} />, key: "mis-citas" },
  { href: "/dashboard/mis-pacientes", label: "Mis Pacientes", icon: <Users size={20} />, key: "mis-pacientes" },
  { href: "/dashboard/historial-nuevo", label: "Historial", icon: <FileText size={20} />, key: "historial" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, loading, logout } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!usuario) {
    return null;
  }

  const menuItems = usuario.rol === "medico" ? medicoMenuItems : adminMenuItems;
  const filteredMenu = menuItems.filter((item) => !item.adminOnly || usuario.rol === "admin");

  const initials = usuario.nombre_completo
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  return (
    <div className={styles.layout}>
      {/* Animated Background */}
      <div className={styles.animatedBg}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <div className={styles.blob3}></div>
      </div>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🏥</div>
            <div className={styles.logoText}>
              <h2>CRM</h2>
              <p>Clínico</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className={styles.nav}>
            {filteredMenu.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={styles.navItem}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </a>
            ))}
          </nav>

          {/* User Card */}
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{usuario.nombre_completo}</p>
              <p className={styles.userRole}>
                {usuario.rol === "admin" ? "Administrador" : "Médico"}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button className={styles.logoutBtn} onClick={logout}>
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarContent}>
            <h1 className={styles.pageTitle}>Panel Médico</h1>
            <div className={styles.topBarRight}>
              <div className={styles.userEmail}>{usuario.email}</div>
              {usuario.especialidad && (
                <span className={styles.specialtyBadge}>{usuario.especialidad}</span>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
        </div>
        <p className={styles.loadingText}>Cargando...</p>
      </div>
    </div>
  );
}
