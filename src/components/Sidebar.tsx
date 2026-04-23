import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HeartPulse, 
  LayoutDashboard, 
  Activity, 
  Baby, 
  Droplets,
  LogOut,
  Users
} from 'lucide-react';
import styles from './sidebar.module.css';
import { supabase } from '@/lib/supabase';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Cardiología', path: '/dashboard/cardiologia', icon: <Activity size={20} /> },
    { name: 'Ginecología', path: '/dashboard/ginecologia', icon: <HeartPulse size={20} /> },
    { name: 'Pediatría', path: '/dashboard/pediatria', icon: <Baby size={20} /> },
    { name: 'Urología', path: '/dashboard/urologia', icon: <Droplets size={20} /> },
    { name: 'Pacientes', path: '/dashboard/pacientes', icon: <Users size={20} /> },
  ];

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
        <button onClick={handleLogout} className={styles.logoutBtn} style={{width: '100%', background: 'none', border: 'none', cursor: 'pointer'}}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
