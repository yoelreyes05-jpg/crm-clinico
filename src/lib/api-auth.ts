// ============================================================
// HELPER COMPARTIDO DE AUTENTICACIÓN PARA RUTAS API
// ============================================================
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface JwtPayload {
  id: string;
  rol: string;
  email: string;
  especialidad?: string;
}

export function verifyAuth(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const jwtSecret =
      process.env.JWT_SECRET ||
      "dev_secret_jwt_key_change_in_production_min_32_chars";
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Si el usuario es una secretaria asignada a un médico, devuelve
 * el id de ese médico (su vista queda limitada a él).
 * Secretaria sin asignar (de toda la clínica) → null (ve todo).
 */
export async function obtenerMedicoAsignado(auth: JwtPayload): Promise<string | null> {
  if (auth.rol !== "secretaria") return null;
  const { data } = await supabaseAdmin
    .from("usuarios_clinica")
    .select("asignado_a")
    .eq("id", auth.id)
    .single();
  return data?.asignado_a || null;
}
