// ============================================================
// TIPOS TYPESCRIPT PARA EL CRM CLÍNICO
// ============================================================

// ============================================================
// USUARIOS
// ============================================================
export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  cedula?: string;
  rol: "admin" | "medico";
  especialidad?: string;
  licencia_medica?: string;
  telefono?: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsuarioLogin {
  email: string;
  password: string;
}

export interface UsuarioSession {
  id: string;
  email: string;
  nombre_completo: string;
  rol: "admin" | "medico";
  especialidad?: string;
  licencia_medica?: string;
  token?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: UsuarioSession;
  message?: string;
  error?: string;
}

// ============================================================
// PACIENTES
// ============================================================
export interface Paciente {
  id: string;
  cedula: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  sexo: "M" | "F";
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  estado_civil?: string;
  ocupacion?: string;
  alergias?: string;
  antecedentes_medicos?: string;
  tipo_sangre?: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CITAS
// ============================================================
export interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  especialidad: string;
  fecha_cita: string;
  duracion_minutos: number;
  motivo_cita?: string;
  notas?: string;
  estado: "programada" | "completada" | "cancelada";
  visto_paciente: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// HISTORIALES CLÍNICOS
// ============================================================
export interface HistorialClinico {
  id: string;
  paciente_id: string;
  medico_id: string;
  cita_id?: string;
  especialidad: string;
  motivo_consulta: string;
  duracion_sintomas?: string;
  sintomas_principales?: string;
  antecedentes_enfermedad_actual?: string;
  peso?: number;
  altura?: number;
  imc?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  frecuencia_respiratoria?: number;
  temperatura?: number;
  saturacion_oxigeno?: number;
  examen_fisico_general?: string;
  diagnostico_principal: string;
  diagnosticos_secundarios?: string;
  codigos_diagnostico?: string;
  plan_tratamiento: string;
  medicamentos?: string;
  recomendaciones?: string;
  proxima_cita_sugerida?: string;
  estudios_solicitados?: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ESPECIALIDADES
// ============================================================
export const ESPECIALIDADES = {
  CARDIOLOGIA: "cardiologia",
  MEDICINA_INTERNA: "medicina_interna",
  UROLOGIA: "urologia",
  GINECOLOGIA: "ginecologia",
  PEDIATRIA: "pediatria",
  DERMATOLOGIA: "dermatologia",
  OFTALMOLOGIA: "oftalmologia",
  TRAUMATOLOGIA: "traumatologia",
} as const;

export const ESPECIALIDADES_PUBLICAS = [
  "cardiologia",
  "medicina_interna",
  "urologia",
  "ginecologia",
  "pediatria",
];

export const ESPECIALIDADES_OCULTAS = [
  "dermatologia",
  "oftalmologia",
  "traumatologia",
];

export const ESPECIALIDADES_ETIQUETAS: Record<string, { label: string; icono: string; color: string }> = {
  cardiologia: { label: "Cardiología", icono: "❤️", color: "#ef4444" },
  medicina_interna: { label: "Medicina Interna", icono: "🏥", color: "#3b82f6" },
  urologia: { label: "Urología", icono: "🔬", color: "#8b5cf6" },
  ginecologia: { label: "Ginecología", icono: "👩‍⚕️", color: "#ec4899" },
  pediatria: { label: "Pediatría", icono: "👶", color: "#f59e0b" },
  dermatologia: { label: "Dermatología", icono: "🩹", color: "#06b6d4" },
  oftalmologia: { label: "Oftalmología", icono: "👁️", color: "#10b981" },
  traumatologia: { label: "Traumatología", icono: "🦴", color: "#d946ef" },
};
