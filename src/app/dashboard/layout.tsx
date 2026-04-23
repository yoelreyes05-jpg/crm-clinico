"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("usuario");
    if (u) {
      setUsuario(JSON.parse(u));
    }
  }, []);

  // ⛔ opcional: evita render si no hay usuario cargado aún
  if (!usuario) return null;

  return (
    <div className={styles.layout}>
      <Sidebar usuario={usuario} />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}