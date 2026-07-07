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
  rol: "admin" | "medico" | "secretaria";
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
  rol: "admin" | "medico" | "secretaria";
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
export type EstadoCita =
  | "programada"
  | "en_espera"
  | "en_consulta"
  | "finalizada"
  | "completada" // legado, equivale a finalizada
  | "cancelada"
  | "no_asistio";

export interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  especialidad: string;
  fecha_cita: string;
  duracion_minutos: number;
  tipo_paciente?: "asegurado" | "privado";
  monto_estimado?: number;
  seguro_validado?: "no_aplica" | "pendiente" | "validado" | "rechazado";
  motivo_cita?: string;
  notas?: string;
  estado: EstadoCita;
  visto_paciente: boolean;
  created_at: string;
  updated_at: string;
}

export const ESTADOS_CITA_ETIQUETAS: Record<string, { label: string; color: string }> = {
  programada: { label: "Pendiente", color: "#d97706" },
  en_espera: { label: "En Espera", color: "#0284c7" },
  en_consulta: { label: "En Consulta", color: "#7c3aed" },
  finalizada: { label: "Finalizada", color: "#16a34a" },
  completada: { label: "Finalizada", color: "#16a34a" },
  cancelada: { label: "Cancelada", color: "#dc2626" },
  no_asistio: { label: "No Asistió", color: "#64748b" },
};

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

// ============================================================
// ASEGURADORAS (ARS - República Dominicana)
// ============================================================
export interface Aseguradora {
  id: string;
  nombre: string;
  codigo?: string;
  telefono?: string;
  telefono_autorizaciones?: string;
  email_autorizaciones?: string;
  portal_web?: string;
  requiere_autorizacion_previa: boolean;
  dias_pago_promedio?: number;
  notas?: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SeguroPaciente {
  id: string;
  paciente_id: string;
  aseguradora_id: string;
  numero_afiliado: string;
  plan?: string;
  regimen?: string; // contributivo, subsidiado, pensionado, privado
  titular: boolean;
  nombre_titular?: string;
  vigente_desde?: string;
  vigente_hasta?: string;
  verificado: boolean;
  fecha_verificacion?: string;
  notas?: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
  aseguradora?: Aseguradora;
  paciente?: Paciente;
}

// ============================================================
// AUTORIZACIONES DE SEGURO
// ============================================================
export type EstadoAutorizacion = "pendiente" | "aprobada" | "rechazada" | "vencida" | "utilizada";

export interface AutorizacionSeguro {
  id: string;
  paciente_id: string;
  medico_id: string;
  aseguradora_id: string;
  seguro_paciente_id?: string;
  cita_id?: string;
  historial_id?: string;
  especialidad: string;
  tipo_servicio: string;
  descripcion_servicio: string;
  codigo_procedimiento?: string;
  diagnostico_cie10?: string;
  numero_autorizacion?: string;
  fecha_solicitud: string;
  fecha_respuesta?: string;
  fecha_vencimiento?: string;
  via_solicitud?: string;
  monto_solicitado: number;
  monto_autorizado: number;
  monto_diferencia: number;
  copago_paciente: number;
  estado: EstadoAutorizacion;
  motivo_rechazo?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  paciente?: Paciente;
  aseguradora?: Aseguradora;
}

export const TIPOS_SERVICIO_AUTORIZACION = [
  "consulta",
  "procedimiento",
  "cirugia",
  "estudio",
  "laboratorio",
  "medicamento",
  "terapia",
] as const;

// ============================================================
// MOVIMIENTOS FINANCIEROS (Contabilidad)
// ============================================================
export type TipoMovimiento = "consulta" | "procedimiento" | "copago" | "diferencia" | "pago_ars" | "gasto" | "otro";
export type EstadoMovimiento = "cobrado" | "pendiente" | "anulado";

export interface MovimientoFinanciero {
  id: string;
  medico_id: string;
  especialidad: string;
  paciente_id?: string;
  cita_id?: string;
  historial_id?: string;
  autorizacion_id?: string;
  aseguradora_id?: string;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  metodo_pago: string; // efectivo, tarjeta, transferencia, cheque, seguro
  fuente: string; // paciente, aseguradora, otro
  fecha_movimiento: string;
  estado: EstadoMovimiento;
  comprobante?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  paciente?: Paciente;
  aseguradora?: Aseguradora;
}

export const TIPOS_MOVIMIENTO_ETIQUETAS: Record<TipoMovimiento, { label: string; esIngreso: boolean }> = {
  consulta: { label: "Consulta", esIngreso: true },
  procedimiento: { label: "Procedimiento", esIngreso: true },
  copago: { label: "Copago", esIngreso: true },
  diferencia: { label: "Diferencia", esIngreso: true },
  pago_ars: { label: "Pago de ARS", esIngreso: true },
  gasto: { label: "Gasto", esIngreso: false },
  otro: { label: "Otro", esIngreso: true },
};

// ============================================================
// RECLAMACIONES A LA ARS (Cuentas por cobrar)
// ============================================================
export type EstadoReclamacion = "preparando" | "enviada" | "pagada" | "parcial" | "rechazada" | "glosada";

export interface ReclamacionARS {
  id: string;
  medico_id: string;
  aseguradora_id: string;
  paciente_id?: string;
  autorizacion_id?: string;
  especialidad: string;
  numero_reclamacion?: string;
  descripcion: string;
  fecha_servicio?: string;
  fecha_envio?: string;
  fecha_pago?: string;
  monto_reclamado: number;
  monto_glosado: number;
  monto_pagado: number;
  estado: EstadoReclamacion;
  motivo_glosa?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  paciente?: Paciente;
  aseguradora?: Aseguradora;
}

// ============================================================
// PERMISOS DE ESPECIALIDADES
// ============================================================
export interface PermisoEspecialidad {
  id: string;
  medico_id: string;
  especialidad: string;
  acceso_modulo: boolean;
  acceso_contabilidad: boolean;
  acceso_seguros: boolean;
  acceso_reportes: boolean;
  acceso_citas: boolean;
  acceso_pacientes: boolean;
  acceso_facturacion: boolean;
  acceso_cxc: boolean;
  acceso_finanzas: boolean;
  acceso_libros: boolean;
  otorgado_por?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  medico?: Usuario;
}

// Permisos por defecto cuando el admin no ha configurado nada
export const PERMISOS_POR_DEFECTO = {
  acceso_modulo: true,
  acceso_contabilidad: true,
  acceso_seguros: true,
  acceso_reportes: false,
  acceso_citas: true,
  acceso_pacientes: true,
  acceso_facturacion: true,
  acceso_cxc: false,
  acceso_finanzas: false,
  acceso_libros: false,
};

export const PERMISOS_ETIQUETAS: Record<string, string> = {
  acceso_modulo: "Módulo de especialidad",
  acceso_citas: "Citas",
  acceso_pacientes: "Pacientes",
  acceso_contabilidad: "Contabilidad",
  acceso_seguros: "Seguros / ARS",
  acceso_facturacion: "Facturación",
  acceso_cxc: "Cuentas por Cobrar",
  acceso_finanzas: "Dashboard Financiero",
  acceso_libros: "Libros Contables",
  acceso_reportes: "Reportes avanzados",
};

// ============================================================
// VALIDACIÓN DE COBERTURA (integración ARS)
// ============================================================
export interface ValidacionCobertura {
  id: string;
  paciente_id: string;
  seguro_paciente_id?: string;
  aseguradora_id: string;
  cita_id?: string;
  validado_por?: string;
  estado: "pendiente" | "validado" | "rechazado" | "error";
  cobertura_aprobada: boolean;
  copago: number;
  deducible: number;
  monto_autorizado: number;
  numero_autorizacion?: string;
  fecha_validacion?: string;
  via: "api" | "manual";
  notas?: string;
  created_at?: string;
  aseguradora?: Aseguradora;
}

export interface PlanARS {
  id: string;
  aseguradora_id: string;
  nombre: string;
  descripcion?: string;
  copago_defecto: number;
  cobertura_pct: number;
  estado: boolean;
}

export interface TarifaARS {
  id: string;
  aseguradora_id: string;
  codigo?: string;
  descripcion: string;
  tarifa: number;
  copago: number;
  estado: boolean;
}

// ============================================================
// FACTURACIÓN
// ============================================================
export interface Factura {
  id: string;
  numero_factura: string;
  ncf?: string;
  cita_id?: string;
  historial_id?: string;
  paciente_id: string;
  medico_id: string;
  aseguradora_id?: string;
  validacion_id?: string;
  reclamacion_id?: string;
  especialidad?: string;
  descripcion: string;
  subtotal: number;
  descuento: number;
  itbis: number;
  total: number;
  monto_paciente: number;
  monto_ars: number;
  pagado_paciente: number;
  pagado_ars: number;
  metodo_pago_paciente?: string;
  estado: "emitida" | "parcial" | "pagada" | "anulada";
  fecha_emision: string;
  created_at?: string;
  paciente?: Paciente;
  aseguradora?: Aseguradora;
  medico?: Usuario;
}

// ============================================================
// CONTABILIDAD (asientos)
// ============================================================
export interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  tipo: "activo" | "pasivo" | "capital" | "ingreso" | "gasto";
  estado: boolean;
}

export interface PartidaContable {
  id: string;
  asiento_id: string;
  cuenta_codigo: string;
  debe: number;
  haber: number;
  cuenta?: CuentaContable;
}

export interface AsientoContable {
  id: string;
  numero_asiento: number;
  fecha: string;
  descripcion: string;
  referencia_tipo?: string;
  referencia_id?: string;
  medico_id?: string;
  partidas?: PartidaContable[];
  created_at?: string;
}

// ============================================================
// RESUMEN FINANCIERO (para la pestaña de contabilidad)
// ============================================================
export interface ResumenFinanciero {
  total_ingresos: number;
  total_gastos: number;
  balance: number;
  ingresos_pacientes: number;
  ingresos_aseguradoras: number;
  pendiente_cobrar_ars: number; // Lo que deben las aseguradoras
  total_movimientos: number;
}
