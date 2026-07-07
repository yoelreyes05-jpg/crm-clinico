"use client";

// ============================================================
// MÓDULO ARS (admin) — administración de aseguradoras
// Configuración de integración (adapter, API, credenciales),
// catálogo de planes y tarifarios por aseguradora.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Landmark, Settings, X, Plus, Trash2, ExternalLink } from "lucide-react";
import styles from "../his.module.css";

const RD = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

interface Ars {
  id: string;
  nombre: string;
  telefono?: string;
  portal_web?: string;
  adapter?: string;
  api_base_url?: string;
  api_usuario?: string;
  api_key?: string;
  api_token?: string;
  dias_pago_promedio?: number;
  requiere_autorizacion_previa?: boolean;
}

interface Plan { id: string; nombre: string; copago_defecto: number; cobertura_pct: number; descripcion?: string; }
interface Tarifa { id: string; codigo?: string; descripcion: string; tarifa: number; copago: number; }

export default function ArsAdminPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading } = useAuth();

  const [aseguradoras, setAseguradoras] = useState<Ars[]>([]);
  const [seleccionada, setSeleccionada] = useState<Ars | null>(null);
  const [tab, setTab] = useState<"config" | "planes" | "tarifas">("config");
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [guardando, setGuardando] = useState(false);

  const [configForm, setConfigForm] = useState({
    adapter: "manual", api_base_url: "", api_usuario: "", api_key: "", api_token: "",
    telefono: "", portal_web: "", dias_pago_promedio: "30",
  });
  const [planForm, setPlanForm] = useState({ nombre: "", copago_defecto: "", cobertura_pct: "80", descripcion: "" });
  const [tarifaForm, setTarifaForm] = useState({ codigo: "", descripcion: "", tarifa: "", copago: "" });

  const cargar = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/aseguradoras", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAseguradoras((await res.json()).data || []);
  }, [token]);

  useEffect(() => {
    if (authLoading || !usuario) return;
    if (usuario.rol !== "admin") {
      router.push("/dashboard");
      return;
    }
    cargar();
  }, [authLoading, usuario, router, cargar]);

  const abrirConfig = async (a: Ars) => {
    setSeleccionada(a);
    setTab("config");
    setConfigForm({
      adapter: a.adapter || "manual",
      api_base_url: a.api_base_url || "",
      api_usuario: a.api_usuario || "",
      api_key: a.api_key || "",
      api_token: a.api_token || "",
      telefono: a.telefono || "",
      portal_web: a.portal_web || "",
      dias_pago_promedio: String(a.dias_pago_promedio || 30),
    });
    const headers = { Authorization: `Bearer ${token}` };
    const [rp, rt] = await Promise.all([
      fetch(`/api/ars/catalogos?tipo=planes&aseguradora_id=${a.id}`, { headers }),
      fetch(`/api/ars/catalogos?tipo=tarifas&aseguradora_id=${a.id}`, { headers }),
    ]);
    if (rp.ok) setPlanes((await rp.json()).data || []);
    if (rt.ok) setTarifas((await rt.json()).data || []);
  };

  const guardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionada) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/aseguradoras/${seleccionada.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...configForm, dias_pago_promedio: Number(configForm.dias_pago_promedio) }),
      });
      if (res.ok) {
        alert("Configuración guardada");
        cargar();
      } else alert(`Error: ${(await res.json()).error}`);
    } finally {
      setGuardando(false);
    }
  };

  const agregarCatalogo = async (tipo: "planes" | "tarifas") => {
    if (!seleccionada) return;
    const body =
      tipo === "planes"
        ? { tipo, aseguradora_id: seleccionada.id, ...planForm, copago_defecto: Number(planForm.copago_defecto || 0), cobertura_pct: Number(planForm.cobertura_pct || 80) }
        : { tipo, aseguradora_id: seleccionada.id, ...tarifaForm, tarifa: Number(tarifaForm.tarifa || 0), copago: Number(tarifaForm.copago || 0) };
    const res = await fetch("/api/ars/catalogos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      abrirConfig(seleccionada);
      setPlanForm({ nombre: "", copago_defecto: "", cobertura_pct: "80", descripcion: "" });
      setTarifaForm({ codigo: "", descripcion: "", tarifa: "", copago: "" });
    } else alert(`Error: ${(await res.json()).error}`);
  };

  const eliminarCatalogo = async (tipo: "planes" | "tarifas", id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await fetch("/api/ars/catalogos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tipo, id }),
    });
    if (seleccionada) abrirConfig(seleccionada);
  };

  if (authLoading || !usuario || usuario.rol !== "admin") return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><Landmark size={24} color="#0284c7" /> ARS — Aseguradoras</h1>
          <p className={styles.subtitle}>
            Configura la integración de cada ARS (adapter, API, credenciales), sus planes y tarifarios
          </p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Aseguradora</th>
              <th>Adapter</th>
              <th>API</th>
              <th>Días pago prom.</th>
              <th>Portal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {aseguradoras.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.nombre}</strong></td>
                <td>
                  <span className={`${styles.badge} ${a.adapter && a.adapter !== "manual" ? styles.badgeVerde : styles.badgeGris}`}>
                    {a.adapter || "manual"}
                  </span>
                </td>
                <td>{a.api_base_url ? <span className={`${styles.badge} ${styles.badgeAzul}`}>Configurada</span> : "—"}</td>
                <td>{a.dias_pago_promedio || 30} días</td>
                <td>
                  {a.portal_web ? (
                    <a href={a.portal_web} target="_blank" rel="noopener noreferrer" style={{ color: "#0284c7", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Portal <ExternalLink size={12} />
                    </a>
                  ) : "—"}
                </td>
                <td>
                  <button className={`${styles.btnMini} ${styles.btnMiniAzul}`} onClick={() => abrirConfig(a)}>
                    <Settings size={12} /> Configurar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Modal de configuración ===== */}
      {seleccionada && (
        <div className={styles.modalOverlay} onClick={() => setSeleccionada(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}><Settings size={17} /> {seleccionada.nombre}</span>
              <button className={styles.iconBtn} onClick={() => setSeleccionada(null)}><X size={18} /></button>
            </div>

            <div className={styles.tabs} style={{ marginBottom: 16 }}>
              <button className={`${styles.tab} ${tab === "config" ? styles.tabActive : ""}`} onClick={() => setTab("config")}>Integración / API</button>
              <button className={`${styles.tab} ${tab === "planes" ? styles.tabActive : ""}`} onClick={() => setTab("planes")}>Planes ({planes.length})</button>
              <button className={`${styles.tab} ${tab === "tarifas" ? styles.tabActive : ""}`} onClick={() => setTab("tarifas")}>Tarifario ({tarifas.length})</button>
            </div>

            {tab === "config" && (
              <form onSubmit={guardarConfig}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Adapter (arquitectura desacoplada)</label>
                    <select className={styles.select} value={configForm.adapter} onChange={(e) => setConfigForm({ ...configForm, adapter: e.target.value })}>
                      <option value="manual">manual — sin API (tarifario/plan local)</option>
                      <option value="api_generico">api_generico — API REST con credenciales</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>URL base de la API</label>
                    <input className={styles.input} type="text" placeholder="https://api.ars.com.do/v1" value={configForm.api_base_url} onChange={(e) => setConfigForm({ ...configForm, api_base_url: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Usuario API</label>
                    <input className={styles.input} type="text" value={configForm.api_usuario} onChange={(e) => setConfigForm({ ...configForm, api_usuario: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>API Key</label>
                    <input className={styles.input} type="password" value={configForm.api_key} onChange={(e) => setConfigForm({ ...configForm, api_key: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Token</label>
                    <input className={styles.input} type="password" value={configForm.api_token} onChange={(e) => setConfigForm({ ...configForm, api_token: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Días de pago promedio</label>
                    <input className={styles.input} type="number" min="1" value={configForm.dias_pago_promedio} onChange={(e) => setConfigForm({ ...configForm, dias_pago_promedio: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Teléfono</label>
                    <input className={styles.input} type="text" value={configForm.telefono} onChange={(e) => setConfigForm({ ...configForm, telefono: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Portal web</label>
                    <input className={styles.input} type="text" value={configForm.portal_web} onChange={(e) => setConfigForm({ ...configForm, portal_web: e.target.value })} />
                  </div>
                </div>
                <div className={styles.nota} style={{ marginTop: 14 }}>
                  Con adapter <b>manual</b>, la validación de cobertura usa el tarifario y los planes configurados aquí.
                  Cuando la ARS provea API (requiere convenio), cambia a <b>api_generico</b> o solicita un adapter propio.
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary} disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar configuración"}
                  </button>
                </div>
              </form>
            )}

            {tab === "planes" && (
              <div>
                <div className={styles.formGrid} style={{ marginBottom: 14 }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre del plan</label>
                    <input className={styles.input} value={planForm.nombre} onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })} placeholder="Básico, Complementario..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>% cobertura ARS</label>
                    <input className={styles.input} type="number" min="0" max="100" value={planForm.cobertura_pct} onChange={(e) => setPlanForm({ ...planForm, cobertura_pct: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Copago por defecto (RD$)</label>
                    <input className={styles.input} type="number" min="0" value={planForm.copago_defecto} onChange={(e) => setPlanForm({ ...planForm, copago_defecto: e.target.value })} />
                  </div>
                  <div className={styles.formGroup} style={{ justifyContent: "flex-end" }}>
                    <button className={styles.btnVerde} onClick={() => agregarCatalogo("planes")} type="button">
                      <Plus size={14} /> Agregar plan
                    </button>
                  </div>
                </div>
                <table className={styles.table}>
                  <thead><tr><th>Plan</th><th>Cobertura</th><th>Copago</th><th></th></tr></thead>
                  <tbody>
                    {planes.map((p) => (
                      <tr key={p.id}>
                        <td>{p.nombre}</td>
                        <td>{p.cobertura_pct}%</td>
                        <td>{RD.format(Number(p.copago_defecto))}</td>
                        <td><button className={styles.iconBtn} onClick={() => eliminarCatalogo("planes", p.id)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "tarifas" && (
              <div>
                <div className={styles.formGrid} style={{ marginBottom: 14 }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Código</label>
                    <input className={styles.input} value={tarifaForm.codigo} onChange={(e) => setTarifaForm({ ...tarifaForm, codigo: e.target.value })} placeholder="CONS-01" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Servicio</label>
                    <input className={styles.input} value={tarifaForm.descripcion} onChange={(e) => setTarifaForm({ ...tarifaForm, descripcion: e.target.value })} placeholder="Consulta, Sonografía..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tarifa ARS (RD$)</label>
                    <input className={styles.input} type="number" min="0" value={tarifaForm.tarifa} onChange={(e) => setTarifaForm({ ...tarifaForm, tarifa: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Copago (RD$)</label>
                    <input className={styles.input} type="number" min="0" value={tarifaForm.copago} onChange={(e) => setTarifaForm({ ...tarifaForm, copago: e.target.value })} />
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`} style={{ alignItems: "flex-end" }}>
                    <button className={styles.btnVerde} onClick={() => agregarCatalogo("tarifas")} type="button">
                      <Plus size={14} /> Agregar tarifa
                    </button>
                  </div>
                </div>
                <table className={styles.table}>
                  <thead><tr><th>Código</th><th>Servicio</th><th>Tarifa ARS</th><th>Copago</th><th></th></tr></thead>
                  <tbody>
                    {tarifas.map((t) => (
                      <tr key={t.id}>
                        <td>{t.codigo || "—"}</td>
                        <td>{t.descripcion}</td>
                        <td>{RD.format(Number(t.tarifa))}</td>
                        <td>{RD.format(Number(t.copago))}</td>
                        <td><button className={styles.iconBtn} onClick={() => eliminarCatalogo("tarifas", t.id)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
