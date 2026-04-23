"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  HeartPulse, 
  LayoutDashboard, 
  Activity, 
  Baby, 
  Droplets,
  LogOut,
  Users,
  ShieldAlert
} from 'lucide-react';
import styles from './sidebar.module.css';
import { supabase } from '@/lib/supabase';

type UserProfile = {
  rol: 'admin' | 'medico' | 'paciente';
  modulo_asignado: string | null;
  nombre_completo: string | null;
};

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [perfil, setPerfil] = useState<UserProfile | null>(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('clinico_usuarios')
        .select('rol, modulo_asignado, nombre_completo')
        .eq('id', user.id)
        .single();

      if (data) setPerfil(data as UserProfile);
    };

    cargarPerfil();
  }, []);

  const itemsAdmin: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Administrador', path: '/dashboard/admin', icon: <ShieldAlert size={20} /> },
    { name: 'Pacientes', path: '/dashboard/pacientes', icon: <Users size={20} /> },
  ];

  const moduloIconos: Record<string, React.ReactNode> = {
    cardiologia: <Activity size={20} />,
    ginecologia: <HeartPulse size={20} />,
    pediatria: <Baby size={20} />,
    urologia: <Droplets size={20} />,
  };

  const moduloNombres: Record<string, string> = {
    cardiologia: 'Cardiología',
    ginecologia: 'Ginecología',
    pediatria: 'Pediatría',
    urologia: 'Urología',
  };

  const getItemsMedico = (): NavItem[] => {
    const modulo = perfil?.modulo_asignado || '';
    const items: NavItem[] = [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    ];
    if (modulo && moduloNombres[modulo]) {
      items.push({
        name: moduloNombres[modulo],
        path: `/dashboard/${modulo}`,
        icon: moduloIconos[modulo],
      });
    }
    items.push({ name: 'Pacientes', path: '/dashboard/pacientes', icon: <Users size={20} /> });
    return items;
  };

  const navItems: NavItem[] =
    !perfil
      ? [{ name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> }]
      : perfil.rol === 'admin'
      ? itemsAdmin
      : perfil.rol === 'medico'
      ? getItemsMedico()
      : [{ name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> }];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className={`${styles.sidebar} no-print`}>
      <div className={styles.logo}>
        <HeartPulse size={32} className={styles.logoIcon} />
        <h2>CRM Clínico</h2>
      </div>

      {perfil && (
        <div style={{ padding: '0 1.5rem', marginBottom: '1.25rem' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0
          }}>
            {perfil.rol === 'admin' ? '🛡️ Administrador' : perfil.rol === 'medico' ? '🩺 Médico' : '👤 Usuario'}
          </p>
          {perfil.nombre_completo && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              {perfil.nombre_completo}
            </p>
          )}
        </div>
      )}

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link 
            href={item.path} 
            key={item.path}
            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          onClick={handleLogout}
          className={styles.logoutBtn}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
