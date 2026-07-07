// ============================================================
// AUDITORÍA — registro histórico de todas las operaciones
// ============================================================
import { SupabaseClient } from "@supabase/supabase-js";

export async function registrarAuditoria(
  supabase: SupabaseClient,
  datos: {
    usuario_id?: string;
    usuario_email?: string;
    accion: string;   // crear, actualizar, anular, validar, pagar, facturar...
    entidad: string;  // cita, paciente, factura, asiento, validacion...
    entidad_id?: string;
    detalles?: Record<string, any>;
  }
): Promise<void> {
  try {
    await supabase.from("auditoria").insert([{
      usuario_id: datos.usuario_id || null,
      usuario_email: datos.usuario_email || null,
      accion: datos.accion,
      entidad: datos.entidad,
      entidad_id: datos.entidad_id || null,
      detalles: datos.detalles || null,
    }]);
  } catch (e) {
    // La auditoría nunca debe romper la operación principal
    console.error("Error registrando auditoría:", e);
  }
}
