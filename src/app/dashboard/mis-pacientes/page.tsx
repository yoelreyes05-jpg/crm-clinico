"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Search, FileText, Heart, ChevronDown, ChevronUp,
  ClipboardList, Plus, FolderOpen, Edit2, Trash2, X, Save,
} from "lucide-react";
import styles from "./mispacientes.module.css";

interface Paciente {
  id: string;
  cedula: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  tipo_sangre?: string;
  alergias?: string;
  antecedentes_medicos?: string;
  estado_civil?: string;
  ocupacion?: string;
}

interface Historial {
  id: string;
  especialidad: string;
  motivo_consulta?: string;
  duracion_sintomas?: string;
  sintomas_principales?: string;
  antecedentes_enfermedad_actual?: string;
  peso?: number;
  altura?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  frecuencia_respiratoria?: number;
  temperatura?: number;
  saturacion_oxigeno?: number;
  examen_fisico_general?: string;
  diagnostico_principal: string;
  diagnosticos_secundarios?: string;
  plan_tratamiento?: string;
  medicamentos?: string;
  recomendaciones?: string;
  estudios_solicitados?: string;
  created_at: string;
  usuarios_clinica?: { nombre_completo: string; especialidad: string } | null;
}

const calcularEdad = (fecha: string) => {
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const getInitials = (nombre: string) =>
  nombre.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

// ============================================================
// MODAL EDITAR PACIENTE
// ============================================================
function ModalEditarPaciente({
  paciente,
  token,
  onClose,
  onGuardado,
}: {
  paciente: Paciente;
  token: string;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [form, setForm] = useState({
    nombre_completo: paciente.nombre_completo,
    fecha_nacimiento: paciente.fecha_nacimiento?.slice(0, 10) || "",
    sexo: paciente.sexo,
    telefono: paciente.telefono || "",
    email: paciente.email || "",
    direccion: paciente.direccion || "",
    ciudad: paciente.ciudad || "",
    tipo_sangre: paciente.tipo_sangre || "",
    alergias: paciente.alergias || "",
    antecedentes_medicos: paciente.antecedentes_medicos || "",
    estado_civil: paciente.estado_civil || "",
    ocupacion: paciente.ocupacion || "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`/api/pacientes/${paciente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onGuardado();
        onClose();
      } else {
        const d = await res.json();
        setError(d.error || "Error al guardar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Editar Paciente</h2>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleGuardar} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Cédula</label>
              <input value={paciente.cedula} disabled className={styles.inputDisabled} />
            </div>
            <div className={styles.formGroup}>
              <label>Nombre Completo *</label>
              <input
                value={form.nombre_completo}
                onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                required className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Fecha de Nacimiento</label>
              <input
                type="date" value={form.fecha_nacimiento}
                onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Sexo</label>
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} className={styles.input}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Teléfono</label>
              <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Dirección</label>
              <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Ciudad</label>
              <input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Tipo de Sangre</label>
              <select value={form.tipo_sangre} onChange={e => setForm({ ...form, tipo_sangre: e.target.value })} className={styles.input}>
                <option value="">Sin especificar</option>
                {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Estado Civil</label>
              <select value={form.estado_civil} onChange={e => setForm({ ...form, estado_civil: e.target.value })} className={styles.input}>
                <option value="">Sin especificar</option>
                <option value="soltero">Soltero/a</option>
                <option value="casado">Casado/a</option>
                <option value="union_libre">Unión libre</option>
                <option value="divorciado">Divorciado/a</option>
                <option value="viudo">Viudo/a</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Ocupación</label>
              <input value={form.ocupacion} onChange={e => setForm({ ...form, ocupacion: e.target.value })} className={styles.input} />
            </div>
          </div>
          <div className={styles.formGroup} style={{ gridColumn: "1/-1" }}>
            <label>Alergias</label>
            <textarea
              value={form.alergias}
              onChange={e => setForm({ ...form, alergias: e.target.value })}
              className={styles.textarea} rows={2}
              placeholder="Ej: Penicilina, Mariscos..."
            />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: "1/-1" }}>
            <label>Antecedentes Médicos</label>
            <textarea
              value={form.antecedentes_medicos}
              onChange={e => setForm({ ...form, antecedentes_medicos: e.target.value })}
              className={styles.textarea} rows={2}
              placeholder="Ej: HTA, DM2, cirugías previas..."
            />
          </div>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnGuardar} disabled={guardando}>
              <Save size={15} /> {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// ITEM DE HISTORIAL CON TODOS LOS CAMPOS (expandible)
// ============================================================
function HistorialDetalleItem({ h }: { h: Historial }) {
  const [abierto, setAbierto] = useState(false);
  const esGine = h.especialidad === "ginecologia";

  return (
    <div className={styles.historialItem} style={{ flexDirection: "column", alignItems: "stretch", padding: 0 }}>
      {/* Cabecera clickable */}
      <button
        className={styles.historialItemHeader}
        onClick={() => setAbierto(v => !v)}
      >
        <div className={`${styles.historialIcon} ${esGine ? styles.historialIconGine : styles.historialIconGen}`} style={{ flexShrink: 0 }}>
          {esGine ? <Heart size={13} /> : <FileText size={13} />}
        </div>
        <div className={styles.historialBody} style={{ flex: 1 }}>
          <p className={styles.historialDiag}>{h.diagnostico_principal}</p>
          <div className={styles.historialMeta}>
            <span>{formatFecha(h.created_at)}</span>
            <span className={styles.historialEsp}>{h.especialidad || "General"}</span>
            {h.usuarios_clinica && <span>Dr. {h.usuarios_clinica.nombre_completo}</span>}
          </div>
        </div>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          {abierto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {/* Detalle expandido */}
      {abierto && (
        <div className={styles.historialDetalle}>
          {/* Signos vitales */}
          {(h.peso || h.altura || h.presion_sistolica || h.temperatura || h.frecuencia_cardiaca || h.saturacion_oxigeno) && (
            <div className={styles.vitalesGrid}>
              {h.peso && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Peso</span><span className={styles.vitalVal}>{h.peso} kg</span></div>}
              {h.altura && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Altura</span><span className={styles.vitalVal}>{h.altura} m</span></div>}
              {h.presion_sistolica && <div className={styles.vitalItem}><span className={styles.vitalLabel}>P.A.</span><span className={styles.vitalVal}>{h.presion_sistolica}/{h.presion_diastolica} mmHg</span></div>}
              {h.frecuencia_cardiaca && <div className={styles.vitalItem}><span className={styles.vitalLabel}>F.C.</span><span className={styles.vitalVal}>{h.frecuencia_cardiaca} lpm</span></div>}
              {h.temperatura && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Temp.</span><span className={styles.vitalVal}>{h.temperatura}°C</span></div>}
              {h.saturacion_oxigeno && <div className={styles.vitalItem}><span className={styles.vitalLabel}>Sat O₂</span><span className={styles.vitalVal}>{h.saturacion_oxigeno}%</span></div>}
              {h.frecuencia_respiratoria && <div className={styles.vitalItem}><span className={styles.vitalLabel}>F.R.</span><span className={styles.vitalVal}>{h.frecuencia_respiratoria} rpm</span></div>}
            </div>
          )}
          {h.motivo_consulta && <div className={styles.campoDetalle}><strong>Motivo:</strong> {h.motivo_consulta}</div>}
          {h.duracion_sintomas && <div className={styles.campoDetalle}><strong>Duración síntomas:</strong> {h.duracion_sintomas}</div>}
          {h.sintomas_principales && <div className={styles.campoDetalle}><strong>Síntomas:</strong> {h.sintomas_principales}</div>}
          {h.antecedentes_enfermedad_actual && <div className={styles.campoDetalle}><strong>Antecedentes:</strong> {h.antecedentes_enfermedad_actual}</div>}
          {h.examen_fisico_general && <div className={styles.campoDetalle}><strong>Examen físico:</strong> {h.examen_fisico_general}</div>}
          {h.diagnosticos_secundarios && <div className={styles.campoDetalle}><strong>Diagnósticos secundarios:</strong> {h.diagnosticos_secundarios}</div>}
          {h.plan_tratamiento && <div className={styles.campoDetalle}><strong>Plan de tratamiento:</strong> {h.plan_tratamiento}</div>}
          {h.medicamentos && <div className={styles.campoDetalle}><strong>Medicamentos:</strong> {h.medicamentos}</div>}
          {h.recomendaciones && <div className={styles.campoDetalle}><strong>Recomendaciones:</strong> {h.recomendaciones}</div>}
          {h.estudios_solicitados && <div className={styles.campoDetalle}><strong>Estudios solicitados:</strong> {h.estudios_solicitados}</div>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CARD INDIVIDUAL CON HISTORIALES EXPANDIBLES
// ============================================================
function PacienteCard({
  paciente,
  esGinecologo,
  token,
  onVerExpediente,
  onNuevoHistorial,
  onFichaGineco,
  onEditar,
  onEliminar,
}: {
  paciente: Paciente;
  esGinecologo: boolean;
  token: string;
  onVerExpediente: (id: string) => void;
  onNuevoHistorial: (id: string) => void;
  onFichaGineco: (id: string) => void;
  onEditar: (p: Paciente) => void;
  onEliminar: (id: string, nombre: string) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [historiales, setHistoriales] = useState<Historial[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargado, setCargado] = useState(false);

  const cargarHistoriales = async () => {
    if (cargado) { setExpandido(v => !v); return; }
    setExpandido(true);
    setCargando(true);
    try {
      const [resGen, resGine] = await Promise.all([
        fetch(`/api/historiales?paciente_id=${paciente.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/historiales/ginecologia?paciente_id=${paciente.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const gen: Historial[] = resGen.ok ? (await resGen.json()).data || [] : [];
      const gine: Historial[] = resGine.ok ? (await resGine.json()).data || [] : [];
      const genIds = new Set(gen.map(h => h.id));
      const soloGine = gine.filter(g => !genIds.has(g.id));
      const todos = [...gen, ...soloGine].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistoriales(todos);
      setCargado(true);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.pacienteCard}>
      {/* Cabecera */}
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{getInitials(paciente.nombre_completo)}</div>
        <div className={styles.cardHeaderInfo}>
          <h3>{paciente.nombre_completo}</h3>
          <p className={styles.cedula}>Cédula: {paciente.cedula}</p>
        </div>
        {paciente.tipo_sangre && (
          <span className={styles.bloodBadge}>{paciente.tipo_sangre}</span>
        )}
        {/* Botones editar / eliminar */}
        <div className={styles.cardHeaderActions}>
          <button
            className={styles.btnEditar}
            title="Editar paciente"
            onClick={() => onEditar(paciente)}
          >
            <Edit2 size={13} />
          </button>
          <button
            className={styles.btnEliminar}
            title="Eliminar paciente"
            onClick={() => onEliminar(paciente.id, paciente.nombre_completo)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Info básica */}
      <div className={styles.cardContent}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Edad</span>
          <span>{calcularEdad(paciente.fecha_nacimiento)} años</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Sexo</span>
          <span>{paciente.sexo === "M" ? "Masculino" : "Femenino"}</span>
        </div>
        {paciente.telefono && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Teléfono</span>
            <span>{paciente.telefono}</span>
          </div>
        )}
        {paciente.email && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Email</span>
            <span>{paciente.email}</span>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className={styles.cardActions}>
        <button className={styles.btnHistorial} onClick={() => onVerExpediente(paciente.id)}>
          <FolderOpen size={14} /> Ver Expediente
        </button>
        <button
          className={styles.btnHistorial}
          style={{ background: "var(--success)", flexShrink: 0, flex: "none", padding: "7px 10px" }}
          onClick={() => onNuevoHistorial(paciente.id)}
        >
          <Plus size={14} />
        </button>
        {esGinecologo && (
          <button className={styles.btnGineco} onClick={() => onFichaGineco(paciente.id)}>
            <Heart size={14} /> Ficha Ginecológica
          </button>
        )}
      </div>

      {/* Botón ver historiales existentes */}
      <button
        className={`${styles.btnVerHistoriales} ${expandido ? styles.active : ""}`}
        onClick={cargarHistoriales}
      >
        <ClipboardList size={14} />
        Ver Historiales Existentes
        {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Lista de historiales expandible */}
      {expandido && (
        <div className={styles.historialesSection}>
          <div className={styles.historialesHeader}>
            <span>Registros clínicos</span>
            {!cargando && <span className={styles.historialCount}>{historiales.length}</span>}
          </div>

          {cargando && <div className={styles.loadingHistoriales}>Cargando historiales...</div>}

          {!cargando && historiales.length === 0 && (
            <div className={styles.emptyHistoriales}>Sin historiales registrados aún</div>
          )}

          {!cargando && (
            <div className={styles.historialesList}>
              {historiales.map(h => (
                <HistorialDetalleItem key={h.id} h={h} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function MisPacientesPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pacienteEditando, setPacienteEditando] = useState<Paciente | null>(null);

  const esGinecologo = usuario?.especialidad === "ginecologia";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || usuario?.rol !== "medico") { router.push("/login"); return; }
    cargarPacientes();
  }, [isAuthenticated, usuario, authLoading]);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pacientes", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setPacientes(d.data || []); }
    } finally { setLoading(false); }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}?\n\nEl paciente quedará inactivo y sus datos médicos se conservan.`)) return;
    try {
      const res = await fetch(`/api/pacientes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        cargarPacientes();
      } else {
        alert(`Error al eliminar: ${json.error || "Error desconocido"}`);
      }
    } catch (e: any) {
      alert(`Error de conexión: ${e.message}`);
    }
  };

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cedula.includes(searchTerm)
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1>Mis Pacientes</h1>
      </div>

      {/* Búsqueda */}
      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <span className={styles.resultCount}>
          {pacientesFiltrados.length} paciente{pacientesFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /><p>Cargando pacientes...</p></div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className={styles.empty}>
          {searchTerm ? "No se encontraron pacientes con esa búsqueda" : "No tienes pacientes registrados"}
        </div>
      ) : (
        <div className={styles.pacientesGrid}>
          {pacientesFiltrados.map(p => (
            <PacienteCard
              key={p.id}
              paciente={p}
              esGinecologo={esGinecologo}
              token={token || ""}
              onVerExpediente={id => router.push(`/dashboard/paciente/${id}`)}
              onNuevoHistorial={id => router.push(`/dashboard/historial-nuevo?paciente=${id}`)}
              onFichaGineco={id => router.push(`/dashboard/historial-ginecologia?paciente=${id}`)}
              onEditar={p => setPacienteEditando(p)}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}

      {/* Modal Editar */}
      {pacienteEditando && (
        <ModalEditarPaciente
          paciente={pacienteEditando}
          token={token || ""}
          onClose={() => setPacienteEditando(null)}
          onGuardado={cargarPacientes}
        />
      )}
    </div>
  );
}
