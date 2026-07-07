export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ============================================================
// CLIENTE SUPABASE
// ============================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// JWT VERIFY — usa 'id' (igual que el login)
// ============================================================
interface JwtPayload {
  id: string;
  rol: string;
  email: string;
  especialidad?: string;
}

function verifyAuth(request: NextRequest): JwtPayload | null {
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

// ============================================================
// GET /api/medicos — Listar médicos (solo admin)
// Lee de usuarios_clinica con rol='medico'
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Admin ve todos los campos; médico/secretaria solo lista básica (para agendar citas)
    const selectFields = auth.rol === "admin"
      ? "id, nombre_completo, email, especialidad, licencia_medica, telefono, estado, rol, asignado_a, created_at"
      : "id, nombre_completo, especialidad";

    // ?todos=1 (solo admin): incluye también secretarias (para el panel de permisos)
    const { searchParams } = new URL(request.url);
    const incluirTodos = auth.rol === "admin" && searchParams.get("todos") === "1";

    let query = supabase
      .from("usuarios_clinica")
      .select(selectFields)
      .eq("estado", true)
      .order("nombre_completo", { ascending: true });

    query = incluirTodos ? query.in("rol", ["medico", "secretaria"]) : query.eq("rol", "medico");

    // Secretaria asignada a un médico → solo ve a su médico
    if (auth.rol === "secretaria") {
      const { data: yo } = await supabase
        .from("usuarios_clinica")
        .select("asignado_a")
        .eq("id", auth.id)
        .single();
      if (yo?.asignado_a) query = query.eq("id", yo.asignado_a);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo médicos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

// ============================================================
// POST /api/medicos — Crear médico (solo admin)
// Inserta en usuarios_clinica con rol='medico'
// Así el médico puede hacer login inmediatamente
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre_completo, email, password, especialidad, licencia_medica, telefono } = body;

    if (!nombre_completo || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Verificar email único en usuarios_clinica
    const { data: existente } = await supabase
      .from("usuarios_clinica")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 400 }
      );
    }

    // Hash de contraseña (bcrypt)
    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("usuarios_clinica")
      .insert([{
        nombre_completo,
        email,
        password_hash: passwordHash,   // columna correcta de usuarios_clinica
        rol: body.rol === "secretaria" ? "secretaria" : "medico",
        especialidad: body.rol === "secretaria" ? null : (especialidad || null),
        asignado_a: body.rol === "secretaria" ? (body.asignado_a || null) : null,
        licencia_medica: licencia_medica || null,
        telefono: telefono || null,
        estado: true,
      }])
      .select("id, nombre_completo, email, especialidad, licencia_medica, telefono, estado, rol")
      .single();

    if (error) {
      console.error("Error creando médico:", error.message);
      return NextResponse.json({ error: `Error al crear médico: ${error.message}` }, { status: 500 });
    }

    // ========================================================
    // Crear automáticamente los módulos del nuevo usuario:
    // registro de permisos propio (cada médico tiene su ID y
    // NUNCA ve datos de otro, aunque compartan especialidad —
    // todas las APIs filtran por medico_id).
    // Con esto quedan activos: citas, pacientes, contabilidad,
    // seguros/ARS, facturación y su módulo de especialidad,
    // más la opción "Mi Secretaria".
    // ========================================================
    const esSecretariaNueva = (data as any).rol === "secretaria";
    await supabase.from("permisos_especialidades").upsert([{
      medico_id: (data as any).id,
      especialidad: esSecretariaNueva ? "secretaria" : ((data as any).especialidad || "general"),
      acceso_modulo: !esSecretariaNueva,
      acceso_citas: true,
      acceso_pacientes: true,
      acceso_contabilidad: true,
      acceso_seguros: !esSecretariaNueva,
      acceso_facturacion: true,
      acceso_cxc: false,
      acceso_finanzas: false,
      acceso_libros: false,
      acceso_reportes: false,
      otorgado_por: auth.id,
      updated_at: new Date().toISOString(),
    }], { onConflict: "medico_id,especialidad" });

    return NextResponse.json(
      { data, message: "Usuario creado con todos sus módulos (contabilidad, seguros, facturación, citas y permisos propios)" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
