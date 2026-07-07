"use client";

// ============================================================
// PESTAÑA DE PERMISOS (solo admin) — CONTROL TOTAL DEL SISTEMA
// El administrador habilita/deshabilita cada módulo por usuario
// (médicos y secretarias): especialidad, citas, pacientes,
// contabilidad, seguros, facturación, CxC, finanzas, libros,
// reportes. Sin registro en BD = permisos por defecto.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { KeyRound, Info } from "lucide-react";
import {
  PermisoEspecialidad, PERMISOS_POR_DEFECTO, PERMISOS_ETIQUETAS, ESPECIALIDADES_ETIQUETAS,
} from "@/types";
import styles from "./permisos.module.css";

type PermisosMap = Record<string, boolean>;

interface UsuarioRow {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  especialidad: string;
  asignado_a?: string;
  permisos: PermisosMap;
}

const CAMPOS = Object.keys(PERMISOS_ETIQUETAS);

export default function PermisosPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading } = useAuth();
  const [filas, setFilas] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<UsuarioRow | null>(null);

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resUsuarios, resPerm] = await Promise.all([
        fetch("/api/medicos?todos=1", { headers }),
        fetch("/api/permisos", { headers }),
      ]);
      const usuarios = resUsuarios.ok ? (await resUsuarios.json()).data || [] : [];
      const permisos: PermisoEspecialidad[] = resPerm.ok ? (await resPerm.json()).data || [] : [];

      const rows: UsuarioRow[] = usuarios.map((u: any) => {
        const p = permisos.find((x) => x.medico_id === u.id);
        const base: PermisosMap = { ...PERMISOS_POR_DEFECTO };
        if (p) {
          for (const campo of CAMPOS) {
            const valor = (p as any)[campo];
            if (valor !== undefined && valor !== null) base[campo] = valor;
          }
        }
        return {
          id: u.id,
          nombre_completo: u.nombre_completo,
          email: u.email,
          rol: u.rol || "medico",
          especialidad: u.especialidad || (u.rol === "secretaria" ? "secretaria" : "general"),
          asignado_a: u.asignado_a || undefined,
          permisos: base,
        };
      });
      setFilas(rows);
      // Mantener seleccionado actualizado
      setSeleccionado((prev) => (prev ? rows.find((r) => r.id === prev.id) || null : null));
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

  const cambiarPermiso = async (fila: UsuarioRow, campo: string, valor: boolean) => {
    const nuevos = { ...fila.permisos, [campo]: valor };
    setFilas((prev) => prev.map((f) => (f.id === fila.id ? { ...f, permisos: nuevos } : f)));
    setSeleccionado((prev) => (prev && prev.id === fila.id ? { ...prev, permisos: nuevos } : prev));
    setGuardando(fila.id);
    try {
      const res = await fetch("/api/permisos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          medico_id: fila.id,
          especialidad: fila.especialidad,
          ...nuevos,
        }),
      });
      if (!res.ok) {
        alert(`Error: ${(await res.json()).error}`);
        cargar();
      }
    } catch {
      cargar();
    } finally {
      setGuardando(null);
    }
  };

  if (authLoading || !usuario || usuario.rol !== "admin") return null;

  const medicos = filas.filter((f) => f.rol === "medico");
  const secretarias = filas.filter((f) => f.rol === "secretaria");

  const renderTabla = (lista: UsuarioRow[], titulo: string) => (
    <>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#334155", margin: "6px 0 0" }}>{titulo}</h2>
      <div className={styles.tableWrap}>
        {lista.length === 0 ? (
          <p className={styles.vacio}>No hay usuarios en esta categoría.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Especialidad / Rol</th>
                <th>Permisos activos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((f) => {
                const esp = ESPECIALIDADES_ETIQUETAS[f.especialidad];
                const activos = CAMPOS.filter((c) => f.permisos[c]).length;
                return (
                  <tr key={f.id}>
                    <td>
                      <div className={styles.medicoNombre}>{f.nombre_completo}</div>
                      <div className={styles.medicoEmail}>{f.email}</div>
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {f.rol === "secretaria"
                          ? `🗂️ Secretaria${f.asignado_a ? ` de ${filas.find((m) => m.id === f.asignado_a)?.nombre_completo || "—"}` : " (clínica)"}`
                          : esp ? `${esp.icono} ${esp.label}` : f.especialidad}
                      </span>
                    </td>
                    <td>{activos} de {CAMPOS.length} módulos</td>
                    <td>
                      <button
                        className={styles.btnEditar}
                        onClick={() => setSeleccionado(seleccionado?.id === f.id ? null : f)}
                      >
                        {seleccionado?.id === f.id ? "Cerrar" : "Gestionar permisos"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <KeyRound size={24} color="#0284c7" />
            Permisos — Control Total del Sistema
          </h1>
          <p className={styles.subtitle}>
            Activa o desactiva cada módulo por usuario. Los cambios se aplican de inmediato.
          </p>
        </div>
        {guardando && <span className={styles.guardando}>Guardando...</span>}
      </div>

      <div className={styles.nota}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Los <b>médicos</b> tienen por defecto: especialidad, citas, pacientes, contabilidad, seguros y facturación.
          Las <b>secretarias</b> ven citas, pacientes, contabilidad y facturación, pero <b>nunca los historiales clínicos</b> (bloqueado por rol).
          CxC, Finanzas, Libros y Reportes se activan aquí cuando tú lo decidas.
        </span>
      </div>

      {loading ? (
        <div className={styles.tableWrap}><p className={styles.vacio}>Cargando...</p></div>
      ) : (
        <>
          {renderTabla(medicos, "Médicos")}
          {renderTabla(secretarias, "Secretarias")}
        </>
      )}

      {/* ===== Panel de permisos del usuario seleccionado ===== */}
      {seleccionado && (
        <div className={styles.tableWrap}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
            <strong>Permisos de {seleccionado.nombre_completo}</strong>
            <span style={{ color: "#94a3b8", fontSize: 13 }}> — los cambios se guardan automáticamente</span>
          </div>
          <div className={styles.gridPermisos}>
            {CAMPOS.map((campo) => {
              // La secretaria no tiene módulo de especialidad ni seguros clínicos propios
              const noAplica = seleccionado.rol === "secretaria" && ["acceso_modulo", "acceso_seguros"].includes(campo);
              if (noAplica) return null;
              return (
                <label key={campo} className={styles.permisoItem}>
                  <span>{PERMISOS_ETIQUETAS[campo]}</span>
                  <span className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={seleccionado.permisos[campo]}
                      onChange={(e) => cambiarPermiso(seleccionado, campo, e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
