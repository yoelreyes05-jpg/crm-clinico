import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// FUNCIONES HELPER PARA USUARIOS
// ============================================================

export async function obtenerUsuarioPorEmail(email: string) {
  const { data, error } = await supabase
    .from("usuarios_clinica")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Error al obtener usuario:", error);
    return null;
  }

  return data;
}

export async function obtenerMedicosPorEspecialidad(especialidad: string) {
  const { data, error } = await supabase
    .from("usuarios_clinica")
    .select("*")
    .eq("especialidad", especialidad)
    .eq("rol", "medico")
    .eq("estado", true);

  if (error) {
    console.error("Error al obtener médicos:", error);
    return [];
  }

  return data || [];
}

export async function obtenerTodosMedicos() {
  const { data, error } = await supabase
    .from("usuarios_clinica")
    .select("*")
    .eq("rol", "medico")
    .eq("estado", true);

  if (error) {
    console.error("Error al obtener médicos:", error);
    return [];
  }

  return data || [];
}

// ============================================================
// FUNCIONES HELPER PARA PACIENTES
// ============================================================

export async function obtenerPaciente(cedula: string) {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("cedula", cedula)
    .single();

  if (error) {
    console.error("Error al obtener paciente:", error);
    return null;
  }

  return data;
}

export async function obtenerTodosPacientes() {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*");

  if (error) {
    console.error("Error al obtener pacientes:", error);
    return [];
  }

  return data || [];
}

export async function crearPaciente(pacienteData: any) {
  const { data, error } = await supabase
    .from("pacientes")
    .insert([pacienteData])
    .select()
    .single();

  if (error) {
    console.error("Error al crear paciente:", error);
    return null;
  }

  return data;
}

export async function actualizarPaciente(cedula: string, updates: any) {
  const { data, error } = await supabase
    .from("pacientes")
    .update(updates)
    .eq("cedula", cedula)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar paciente:", error);
    return null;
  }

  return data;
}

// ============================================================
// FUNCIONES HELPER PARA CITAS
// ============================================================

export async function obtenerCitasPaciente(pacienteId: string) {
  const { data, error } = await supabase
    .from("citas")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("fecha_cita", { ascending: false });

  if (error) {
    console.error("Error al obtener citas:", error);
    return [];
  }

  return data || [];
}

export async function obtenerCitasMedico(medicoId: string) {
  const { data, error } = await supabase
    .from("citas")
    .select("*")
    .eq("medico_id", medicoId)
    .order("fecha_cita", { ascending: true });

  if (error) {
    console.error("Error al obtener citas del médico:", error);
    return [];
  }

  return data || [];
}

export async function crearCita(citaData: any) {
  const { data, error } = await supabase
    .from("citas")
    .insert([citaData])
    .select()
    .single();

  if (error) {
    console.error("Error al crear cita:", error);
    return null;
  }

  return data;
}

export async function marcarCitaVista(citaId: string) {
  const { data, error } = await supabase
    .from("citas")
    .update({ visto_paciente: true })
    .eq("id", citaId)
    .select()
    .single();

  if (error) {
    console.error("Error al marcar cita como vista:", error);
    return null;
  }

  return data;
}

// ============================================================
// FUNCIONES HELPER PARA HISTORIALES
// ============================================================

export async function crearHistorial(historialData: any) {
  const { data, error } = await supabase
    .from("historiales_clinicos")
    .insert([historialData])
    .select()
    .single();

  if (error) {
    console.error("Error al crear historial:", error);
    return null;
  }

  return data;
}

export async function obtenerHistorialesPaciente(pacienteId: string) {
  const { data, error } = await supabase
    .from("historiales_clinicos")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener historiales:", error);
    return [];
  }

  return data || [];
}

export async function obtenerHistorialCompleto(historialId: string) {
  const { data, error } = await supabase
    .from("historiales_clinicos")
    .select("*")
    .eq("id", historialId)
    .single();

  if (error) {
    console.error("Error al obtener historial completo:", error);
    return null;
  }

  return data;
}

// ============================================================
// FUNCIONES HELPER PARA NOTIFICACIONES
// ============================================================

export async function crearNotificacion(notificacionData: any) {
  const { data, error } = await supabase
    .from("notificaciones")
    .insert([notificacionData])
    .select()
    .single();

  if (error) {
    console.error("Error al crear notificación:", error);
    return null;
  }

  return data;
}

export async function obtenerNotificacionesPaciente(pacienteId: string) {
  const { data, error } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener notificaciones:", error);
    return [];
  }

  return data || [];
}

export async function marcarNotificacionLeida(notificacionId: string) {
  const { data, error } = await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("id", notificacionId)
    .select()
    .single();

  if (error) {
    console.error("Error al marcar notificación como leída:", error);
    return null;
  }

  return data;
}

// ============================================================
// FUNCIONES HELPER PARA RECETAS
// ============================================================

export async function crearReceta(recetaData: any) {
  const { data, error } = await supabase
    .from("recetas_medicas")
    .insert([recetaData])
    .select()
    .single();

  if (error) {
    console.error("Error al crear receta:", error);
    return null;
  }

  return data;
}

export async function obtenerRecetasPaciente(pacienteId: string) {
  const { data, error } = await supabase
    .from("recetas_medicas")
    .select("*")
    .eq("paciente_id", pacienteId)
    .eq("activa", true);

  if (error) {
    console.error("Error al obtener recetas:", error);
    return [];
  }

  return data || [];
}

// ============================================================
// FUNCIONES HELPER PARA ESTUDIOS
// ============================================================

export async function solicitarEstudio(estudioData: any) {
  const { data, error } = await supabase
    .from("estudios_diagnosticos")
    .insert([estudioData])
    .select()
    .single();

  if (error) {
    console.error("Error al solicitar estudio:", error);
    return null;
  }

  return data;
}

export async function obtenerEstudiosPaciente(pacienteId: string) {
  const { data, error } = await supabase
    .from("estudios_diagnosticos")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("fecha_solicitud", { ascending: false });

  if (error) {
    console.error("Error al obtener estudios:", error);
    return [];
  }

  return data || [];
}
