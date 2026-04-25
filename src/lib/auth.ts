// ============================================================
// FUNCIONES DE AUTENTICACIÓN
// Método fetch-based similar al CRM automotriz
// ============================================================

import { UsuarioSession, LoginResponse } from "@/types";

// ============================================================
// TIPOS LOCALES
// ============================================================

export interface SessionData {
  user: UsuarioSession;
  token: string;
  expiresAt: number;
}

// ============================================================
// GESTIÓN DE SESIÓN (localStorage)
// ============================================================

const SESSION_KEY = "clinic_session";
const SESSION_EXPIRY_HOURS = 12;

export function guardarSesion(sessionData: SessionData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

export function obtenerSesion(): SessionData | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored);

    // Verificar si expiró
    if (session.expiresAt && session.expiresAt < Date.now()) {
      eliminarSesion();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error al parsear sesión:", error);
    return null;
  }
}

export function eliminarSesion(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function renovarSesion(): SessionData | null {
  const session = obtenerSesion();
  if (!session) return null;

  // Extender tiempo de expiración
  const newSession: SessionData = {
    ...session,
    expiresAt: Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
  };

  guardarSesion(newSession);
  return newSession;
}

// ============================================================
// LOGIN
// ============================================================

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    // Validar inputs
    if (!email || !password) {
      return {
        success: false,
        error: "Email y contraseña son requeridos",
      };
    }

    // POST a /api/auth/login
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Error al iniciar sesión",
      };
    }

    // Guardar sesión
    if (data.user && data.token) {
      const sessionData: SessionData = {
        user: data.user,
        token: data.token,
        expiresAt: Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
      };

      guardarSesion(sessionData);

      return {
        success: true,
        user: data.user,
        message: "Sesión iniciada correctamente",
      };
    }

    return {
      success: false,
      error: "Respuesta inválida del servidor",
    };
  } catch (error) {
    console.error("Error en login:", error);
    return {
      success: false,
      error: "Error de conexión",
    };
  }
}

// ============================================================
// LOGOUT
// ============================================================

export async function logout(): Promise<boolean> {
  try {
    // Notificar al backend (opcional)
    await fetch("/api/auth/logout", {
      method: "POST",
    }).catch(() => {
      // Ignorar errores de logout en backend
    });

    // Limpiar sesión local
    eliminarSesion();
    return true;
  } catch (error) {
    console.error("Error en logout:", error);
    eliminarSesion();
    return false;
  }
}

// ============================================================
// VERIFICAR AUTENTICACIÓN
// ============================================================

export function estaAutenticado(): boolean {
  const session = obtenerSesion();
  return session !== null && session.expiresAt > Date.now();
}

export function obtenerUsuarioActual(): UsuarioSession | null {
  const session = obtenerSesion();
  return session?.user || null;
}

export function obtenerToken(): string | null {
  const session = obtenerSesion();
  return session?.token || null;
}

export function esAdmin(): boolean {
  const usuario = obtenerUsuarioActual();
  return usuario?.rol === "admin";
}

export function esDoctor(): boolean {
  const usuario = obtenerUsuarioActual();
  return usuario?.rol === "medico";
}

export function obtenerEspecialidad(): string | undefined {
  const usuario = obtenerUsuarioActual();
  return usuario?.especialidad;
}

// ============================================================
// VALIDACIONES
// ============================================================

export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarPassword(password: string): boolean {
  // Mínimo 6 caracteres
  return password.length >= 6;
}

export function validarCedula(cedula: string): boolean {
  // Solo números, 8-12 dígitos
  return /^\d{8,12}$/.test(cedula);
}

// ============================================================
// HELPER: FETCH CON AUTENTICACIÓN
// ============================================================

export async function fetchAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = obtenerToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// ============================================================
// VERIFICACIÓN DE PERMISOS
// ============================================================

export function puedeVerEspecialidad(especialidad: string): boolean {
  const usuario = obtenerUsuarioActual();

  // Admin ve todo
  if (usuario?.rol === "admin") {
    return true;
  }

  // Médico solo ve su especialidad
  if (usuario?.rol === "medico") {
    return usuario.especialidad === especialidad;
  }

  return false;
}

export function puedeEditarPaciente(pacienteId: string): boolean {
  const usuario = obtenerUsuarioActual();

  // Admin puede editar
  if (usuario?.rol === "admin") {
    return true;
  }

  // TODO: Implementar verificación de si el paciente
  // pertenece a la especialidad del médico

  return usuario?.rol === "medico";
}

// ============================================================
// MANEJO DE ERRORES DE AUTENTICACIÓN
// ============================================================

export function manejarErrorAuth(error: any): string {
  if (error.status === 401) {
    eliminarSesion();
    return "Sesión expirada. Por favor inicia sesión nuevamente.";
  }

  if (error.status === 403) {
    return "No tienes permiso para acceder a este recurso.";
  }

  if (error.message === "Failed to fetch") {
    return "Error de conexión. Verifica tu internet.";
  }

  return error.message || "Error desconocido";
}

// ============================================================
// INICIAR SESIÓN AUTOMÁTICAMENTE SI EXISTE TOKEN
// ============================================================

export function inicializarAuth(): SessionData | null {
  return obtenerSesion();
}
