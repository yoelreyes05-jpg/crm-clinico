"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Search, FileText, Heart, ChevronDown, ChevronUp,
  ClipboardList, Plus, FolderOpen,
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
  tipo_sangre?: string;
}

interface Historial {
  id: string;
  especialidad: string;
  motivo_consulta: string;
  diagnostico_principal: string;
  created_at: string;
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
// CARD INDIVIDUAL CON HISTORIALES EXPANDIBLES
// ============================================================
function PacienteCard({
  paciente,
  esGinecologo,
  token,
  onVerExpediente,
  onNuevoHistorial,
  onFichaGineco,
}: {
  paciente: Paciente;
  esGinecologo: boolean;
  token: string;
  onVerExpediente: (id: string) => void;
  onNuevoHistorial: (id: string) => void;
  onFichaGineco: (id: string) => void;
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

      // Merge evitando duplicados (los ginecológicos están también en gen con especialidad='ginecologia')
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
        <button className={styles.btnHistorial} style={{ background: "var(--success)", flexShrink: 0, flex: "none", padding: "7px 10px" }} onClick={() => onNuevoHistorial(paciente.id)}>
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
              {historiales.map(h => {
                const esGine = h.especialidad === "ginecologia";
                return (
                  <div key={h.id} className={styles.historialItem}>
                    <div className={`${styles.historialIcon} ${esGine ? styles.historialIconGine : styles.historialIconGen}`}>
                      {esGine ? <Heart size={14} /> : <FileText size={14} />}
                    </div>
                    <div className={styles.historialBody}>
                      <p className={styles.historialDiag}>{h.diagnostico_principal}</p>
                      <div className={styles.historialMeta}>
                        <span>{formatFecha(h.created_at)}</span>
                        <span className={styles.historialEsp}>{h.especialidad || "General"}</span>
                        {h.motivo_consulta && <span>{h.motivo_consulta}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
