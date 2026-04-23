"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Activity } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al login o dashboard inmediatamente
    // Para propositos de demostración de UI, redirigimos al login
    const timer = setTimeout(() => {
      router.push("/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.loaderWrapper}>
        <Activity className={styles.icon} size={64} />
        <h1 className={styles.title}>CRM Clínico</h1>
        <p className={styles.subtitle}>Iniciando sistema de gestión integral...</p>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );
}
