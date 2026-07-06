"use client";

// ============================================================
// PESTAÑA DE PERMISOS (solo admin)
// El administrador habilita/deshabilita por médico:
//  - Módulo de especialidad (ficha clínica)
//  - Pestaña de contabilidad
//  - Módulo de seguros/autorizaciones
//  - Reportes avanzados
// Si el médico no tiene registro, tiene acceso por defecto.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { KeyRound, Info } from "lucide-react";
import { PermisoEspecialidad, PERMISOS_POR_DEFECTO, ESPECIALIDADES_ETIQUETAS } from "@/types";
import styles from "./permisos.module.css";

interface MedicoRow {
  id: string;
  nombre_completo: string;
  email: string;
  especialidad: string;
  permisos: {
    acceso_modulo: boolean;
    acceso_contabilidad: boolean;
    acceso_seguros: boolean;
    acceso_reportes: boolean;
  };
}

type CampoPermiso = "acceso_modulo" | "acceso_contabilidad" | "acceso_seguros" | "acceso_reportes";

export default function PermisosPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading } = useAuth();
  const [filas, setFilas] = useState<MedicoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resMed, resPerm] = await Promise.all([
        fetch("/api/medicos", { headers }),
        fetch("/api/permisos", { headers }),
      ]);
      const medicos = resMed.ok ? (await resMed.json()).data || [] : [];
      const permisos: PermisoEspecialidad[] = resPerm.ok ? (await resPerm.json()).data || [] : [];

      const rows: MedicoRow[] = medicos.map((m: any) => {
        const p = permisos.find((x) => x.medico_id === m.id);
        return {
          id: m.id,
          nombre_completo: m.nombre_completo,
          email: m.email,
          especialidad: m.especialidad || "general",
          permisos: p
            ? {
                acceso_modulo: p.acceso_modulo,
                acceso_contabilidad: p.acceso_contabilidad,
                acceso_seguros: p.acceso_seguros,
                acceso_reportes: p.acceso_reportes,
              }
            : { ...PERMISOS_POR_DEFECTO },
        };
      });
      setFilas(rows);
    } catch (e) {
      console.error("Error cargando permisos:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!usuario) return;
    if (usuario.rol !== "admin") {
      router.push("/dashboard");
      return;
    }
    cargar();
  }, [authLoading, usuario, router, cargar]);

  const cambiarPermiso = async (fila: MedicoRow, campo: CampoPermiso, valor: boolean) => {
    // Actualización optimista
    setFilas((prev) =>
      prev.map((f) =>
        f.id === fila.id ? { ...f, permisos: { ...f.permisos, [campo]: valor } } : f
      )
    );
    setGuardando(fila.id);
    try {
      const res = await fetch("/api/permisos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          medico_id: fila.id,
          especialidad: fila.especialidad,
          ...fila.permisos,
          [campo]: valor,
        }),
      });
      if (!res.ok) {
        alert(`Error: ${(await res.json()).error}`);
        cargar(); // revertir
      }
    } catch {
      cargar();
    } finally {
      setGuardando(null);
    }
  };

  if (authLoading || !usuario || usuario.rol !== "admin") return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <KeyRound size={24} color="#0284c7" />
            Permisos de Especialidades
          </h1>
          <p className={styles.subtitle}>
            Controla qué módulos puede usar cada médico. Los cambios se aplican de inmediato.
          </p>
        </div>
        {guardando && <span className={styles.guardando}>Guardando...</span>}
      </div>

      <div className={styles.nota}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Por defecto todos los médicos tienen acceso a su módulo de especialidad, contabilidad y seguros.
          Desactiva aquí lo que quieras restringir. <b>Reportes avanzados</b> está desactivado por defecto.
        </span>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.vacio}>Cargando...</p>
        ) : filas.length === 0 ? (
          <p className={styles.vacio}>No hay médicos registrados.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Médico</th>
                <th>Especialidad</th>
                <th>Módulo de especialidad</th>
                <th>Contabilidad</th>
                <th>Seguros / Autorizaciones</th>
                <th>Reportes avanzados</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const esp = ESPECIALIDADES_ETIQUETAS[f.especialidad];
                return (
                  <tr key={f.id}>
                    <td>
                      <div className={styles.medicoNombre}>{f.nombre_completo}</div>
                      <div className={styles.medicoEmail}>{f.email}</div>
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {esp ? `${esp.icono} ${esp.label}` : f.especialidad}
                      </span>
                    </td>
                    {(["acceso_modulo", "acceso_contabilidad", "acceso_seguros", "acceso_reportes"] as CampoPermiso[]).map((campo) => (
                      <td key={campo}>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={f.permisos[campo]}
                            onChange={(e) => cambiarPermiso(f, campo, e.target.checked)}
                          />
                          <span className={styles.slider} />
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
