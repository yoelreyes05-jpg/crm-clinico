"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  LogOut,
  Home,
  Plus,
  UserPlus,
  ClipboardList,
  Activity,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Heart,
} from "lucide-react";
import { useState } from "react";
import styles from "./layout.module.css";

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  key: string;
}

const adminMenuItems: MenuItem[] = [
  { href: "/dashboard", label: "Inicio", icon: <Home size={20} />, key: "inicio" },
  { href: "/dashboard/medicos", label: "Médicos", icon: <Stethoscope size={20} />, key: "medicos" },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: <Users size={20} />, key: "pacientes" },
  { href: "/dashboard/citas", label: "Citas", icon: <Calendar size={20} />, key: "citas" },
  { href: "/dashboard/reportes", label: "Reportes", icon: <FileText size={20} />, key: "reportes" },
];

const medicoMenuItems: MenuItem[] = [
  { href: "/dashboard/mi-dashboard", label: "Dashboard", icon: <BarChart3 size={20} />, key: "mi-dashboard" },
  { href: "/dashboard/mis-citas", label: "Mis Citas", icon: <Calendar size={20} />, key: "mis-citas" },
  { href: "/dashboard/crear-cita", label: "Agendar Cita", icon: <Plus size={20} />, key: "crear-cita" },
  { href: "/dashboard/mis-pacientes", label: "Mis Pacientes", icon: <Users size={20} />, key: "mis-pacientes" },
  { href: "/dashboard/crear-paciente", label: "Nuevo Paciente", icon: <UserPlus size={20} />, key: "crear-paciente" },
  { href: "/dashboard/historial-nuevo", label: "Historial Clínico", icon: <ClipboardList size={20} />, key: "historial-nuevo" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, loading, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) return <LoadingScreen />;
  if (!usuario) return null;

  // Menú base + ítems de especialidad dinámica
  const especialidadItems: MenuItem[] = [];
  if (usuario.rol === "medico" && usuario.especialidad === "ginecologia") {
    especialidadItems.push({
      href: "/dashboard/historial-ginecologia",
      label: "Ficha Ginecológica",
      icon: <Heart size={20} />,
      key: "historial-ginecologia",
    });
  }

  const menuItems = usuario.rol === "medico"
    ? [...medicoMenuItems, ...especialidadItems]
    : adminMenuItems;

  const initials = usuario.nombre_completo
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  const currentPage = menuItems.find((m) => isActive(m.href))?.label || "Dashboard";

  return (
    <div className={styles.layout}>
      {/* ======= SIDEBAR ======= */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <Activity size={22} color="#0284c7" />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>MediCRM</span>
              <span className={styles.logoSub}>Sistema Clínico</span>
            </div>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Rol badge */}
        {!collapsed && (
          <div className={styles.rolBadge}>
            <span className={styles.rolDot} />
            <span>
              {usuario.rol === "admin" ? "Administrador" : "Médico"}
              {usuario.especialidad && ` · ${usuario.especialidad}`}
            </span>
          </div>
        )}

        <div className={styles.divider} />

        {/* Navegación */}
        <nav className={styles.nav}>
          {!collapsed && (
            <p className={styles.navSection}>
              {usuario.rol === "admin" ? "Administración" : "Panel Médico"}
            </p>
          )}
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                {active && !collapsed && <span className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />
        <div className={styles.divider} />

        {/* Usuario */}
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>{initials}</div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <p className={styles.userName}>{usuario.nombre_completo}</p>
              <p className={styles.userEmail}>{usuario.email}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          className={`${styles.logoutBtn} ${collapsed ? styles.logoutCollapsed : ""}`}
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut size={17} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </aside>

      {/* ======= MAIN ======= */}
      <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : ""}`}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.breadcrumb}>
              <span className={styles.breadHome}>CRM Clínico</span>
              <span className={styles.breadSep}>/</span>
              <span className={styles.breadCurrent}>{currentPage}</span>
            </div>
          </div>
          <div className={styles.topBarRight}>
            {usuario.especialidad && (
              <span className={styles.especialidadBadge}>
                <Stethoscope size={12} />
                {usuario.especialidad}
              </span>
            )}
            <div className={styles.topAvatar} title={usuario.nombre_completo}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingCard}>
        <Activity size={36} color="#0284c7" />
        <div className={styles.loadingDots}>
          <span />
          <span />
          <span />
        </div>
        <p className={styles.loadingText}>Cargando sistema...</p>
      </div>
    </div>
  );
}
