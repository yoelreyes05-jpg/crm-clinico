export const dynamic = "force-dynamic";

// ============================================================
// API SECRETARIAS
// GET  /api/secretarias → médico: las suyas · admin: todas
// POST /api/secretarias → crear secretaria
//   - Médico: se le asigna automáticamente (asignado_a = él)
//   - Admin: puede asignarla a cualquier médico o dejarla
//     sin asignar (secretaria de toda la clínica)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { PERMISOS_POR_DEFECTO } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || (auth.rol !== "admin" && auth.rol !== "medico")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let query = supabase
      .from("usuarios_clinica")
      .select("id, nombre_completo, email, telefono, estado, asignado_a, created_at")
      .eq("rol", "secretaria")
      .order("nombre_completo", { ascending: true });

    if (auth.rol === "medico") query = query.eq("asignado_a", auth.id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || (auth.rol !== "admin" && auth.rol !== "medico")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre_completo, email, password } = body;
    if (!nombre_completo || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // El médico solo puede asignarse la secretaria a sí mismo
    const asignado_a = auth.rol === "medico" ? auth.id : (body.asignado_a || null);

    // Email único
    const { data: existente } = await supabase
      .from("usuarios_clinica")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existente) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("usuarios_clinica")
      .insert([{
        nombre_completo,
        email,
        password_hash: passwordHash,
        rol: "secretaria",
        especialidad: null,
        telefono: body.telefono || null,
        asignado_a,
        estado: true,
      }])
      .select("id, nombre_completo, email, telefono, estado, asignado_a")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Permisos iniciales de la secretaria (básicos; sin módulos clínicos)
    await supabase.from("permisos_especialidades").upsert([{
      medico_id: data.id,
      especialidad: "secretaria",
      ...PERMISOS_POR_DEFECTO,
      acceso_modulo: false,
      acceso_seguros: false,
      acceso_citas: body.acceso_citas ?? true,
      acceso_pacientes: body.acceso_pacientes ?? true,
      acceso_contabilidad: body.acceso_contabilidad ?? true,
      acceso_facturacion: body.acceso_facturacion ?? true,
      otorgado_por: auth.id,
      updated_at: new Date().toISOString(),
    }], { onConflict: "medico_id,especialidad" });

    await registrarAuditoria(supabase, {
      usuario_id: auth.id,
      usuario_email: auth.email,
      accion: "crear",
      entidad: "secretaria",
      entidad_id: data.id,
      detalles: { asignado_a, creada_por_rol: auth.rol },
    });

    return NextResponse.json(
      { data, message: "Secretaria creada con sus permisos" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
