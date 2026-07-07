"use client";

// ============================================================
// MI SECRETARIA (médico)
// El médico crea y gestiona su propia secretaria:
// datos, contraseña, activar/desactivar y permisos básicos
// (citas, pacientes, contabilidad, facturación).
// Los permisos avanzados los controla solo el administrador.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, KeyRound, Info, X } from "lucide-react";
import styles from "../his.module.css";

interface Secretaria {
  id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  estado: boolean;
  asignado_a?: string;
}

const PERMISOS_BASICOS: { campo: string; label: string }[] = [
  { campo: "acceso_citas", label: "Citas (ver y agendar)" },
  { campo: "acceso_pacientes", label: "Pacientes (ver y registrar)" },
  { campo: "acceso_contabilidad", label: "Contabilidad" },
  { campo: "acceso_facturacion", label: "Facturación" },
];

export default function MiSecretariaPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading } = useAuth();

  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [permisos, setPermisos] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPassModal, setShowPassModal] = useState<Secretaria | null>(null);
  const [nuevaPass, setNuevaPass] = useState("");

  const [form, setForm] = useState({
    nombre_completo: "",
    email: "",
    password: "",
    telefono: "",
  });

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resSec, resPerm] = await Promise.all([
        fetch("/api/secretarias", { headers }),
        fetch("/api/permisos", { headers }),
      ]);
      const lista: Secretaria[] = resSec.ok ? (await resSec.json()).data || [] : [];
      setSecretarias(lista);

      // Permisos de cada secretaria (el médico ve solo los suyos vía
      // /api/permisos, así que los pedimos por secretaria vía admin no;
      // usamos el registro guardado con medico_id = secretaria.id)
      const permMap: Record<string, Record<string, boolean>> = {};
      // El endpoint /api/permisos como médico devuelve SUS permisos, no los de la secretaria.
      // Por eso pedimos los de cada secretaria con el parámetro dedicado:
      for (const s of lista) {
        const r = await fetch(`/api/permisos?usuario_id=${s.id}`, { headers });
        if (r.ok) {
          const p = ((await r.json()).data || [])[0];
          permMap[s.id] = {
            acceso_citas: p?.acceso_citas ?? true,
            acceso_pacientes: p?.acceso_pacientes ?? true,
            acceso_contabilidad: p?.acceso_contabilidad ?? true,
            acceso_facturacion: p?.acceso_facturacion ?? true,
          };
        }
      }
      setPermisos(permMap);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading || !usuario) return;
    if (usuario.rol !== "medico") {
      router.push("/dashboard");
      return;
    }
    cargar();
  }, [authLoading, usuario, router, cargar]);

  const crearSecretaria = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch("/api/secretarias", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        alert("Secretaria creada. Ya puede iniciar sesión con su email y contraseña.");
        setShowForm(false);
        setForm({ nombre_completo: "", email: "", password: "", telefono: "" });
        cargar();
      } else {
        alert(`Error: ${d.error}`);
      }
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPermiso = async (sec: Secretaria, campo: string, valor: boolean) => {
    const nuevos = { ...(permisos[sec.id] || {}), [campo]: valor };
    setPermisos((prev) => ({ ...prev, [sec.id]: nuevos }));
    const res = await fetch("/api/permisos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        medico_id: sec.id,
        especialidad: "secretaria",
        ...nuevos,
      }),
    });
    if (!res.ok) {
      alert(`Error: ${(await res.json()).error}`);
      cargar();
    }
  };

  const toggleEstado = async (sec: Secretaria) => {
    const res = await fetch(`/api/secretarias/${sec.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: !sec.estado }),
    });
    if (res.ok) cargar();
    else alert(`Error: ${(await res.json()).error}`);
  };

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPassModal) return;
    const res = await fetch(`/api/secretarias/${showPassModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: nuevaPass }),
    });
    const d = await res.json();
    if (res.ok) {
      alert("Contraseña actualizada");
      setShowPassModal(null);
      setNuevaPass("");
    } else {
      alert(`Error: ${d.error}`);
    }
  };

  if (authLoading || !usuario || usuario.rol !== "medico") return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><UserPlus size={24} color="#0284c7" /> Mi Secretaria</h1>
          <p className={styles.subtitle}>
            Crea y gestiona tu secretaria: acceso, contraseña y permisos básicos
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
          <UserPlus size={16} /> Crear secretaria
        </button>
      </div>

      <div className={styles.nota}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Tu secretaria solo verá <b>tus</b> citas, pacientes, contabilidad y facturación — nunca los
          historiales clínicos. Los permisos avanzados (CxC, Finanzas, Libros) los controla el administrador.
        </span>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.vacio}>Cargando...</p>
        ) : secretarias.length === 0 ? (
          <p className={styles.vacio}>Aún no tienes secretaria. Créala con el botón de arriba.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Secretaria</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Permisos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {secretarias.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.nombre_completo}</strong>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{s.email}</div>
                  </td>
                  <td>{s.telefono || "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${s.estado ? styles.badgeVerde : styles.badgeRojo}`}>
                      {s.estado ? "Activa" : "Desactivada"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {PERMISOS_BASICOS.map(({ campo, label }) => (
                        <label key={campo} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={permisos[s.id]?.[campo] ?? true}
                            onChange={(e) => cambiarPermiso(s, campo, e.target.checked)}
                            style={{ accentColor: "#0284c7", width: 15, height: 15 }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className={styles.acciones}>
                    <button className={`${styles.btnMini} ${styles.btnMiniAzul}`} onClick={() => setShowPassModal(s)}>
                      <KeyRound size={12} /> Contraseña
                    </button>
                    <button
                      className={`${styles.btnMini} ${s.estado ? styles.btnMiniRojo : styles.btnMiniVerde}`}
                      onClick={() => toggleEstado(s)}
                    >
                      {s.estado ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== Modal crear secretaria ===== */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}><UserPlus size={17} /> Crear mi secretaria</span>
              <button className={styles.iconBtn} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={crearSecretaria}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Nombre completo *</label>
                  <input className={styles.input} type="text" required value={form.nombre_completo}
                    onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email (para iniciar sesión) *</label>
                  <input className={styles.input} type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contraseña *</label>
                  <input className={styles.input} type="password" required minLength={6} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Teléfono</label>
                  <input className={styles.input} type="tel" value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={guardando}>
                  {guardando ? "Creando..." : "Crear secretaria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal cambiar contraseña ===== */}
      {showPassModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPassModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}><KeyRound size={16} /> Contraseña de {showPassModal.nombre_completo}</span>
              <button className={styles.iconBtn} onClick={() => setShowPassModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={cambiarPassword}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nueva contraseña *</label>
                <input className={styles.input} type="password" required minLength={6} value={nuevaPass}
                  onChange={(e) => setNuevaPass(e.target.value)} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setShowPassModal(null)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>Cambiar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
