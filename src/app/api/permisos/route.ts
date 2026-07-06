export const dynamic = "force-dynamic";

// ============================================================
// API PERMISOS DE ESPECIALIDADES
// GET  /api/permisos → admin: todos (con datos del médico);
//                      médico: solo los suyos
// POST /api/permisos → upsert de permisos (solo admin)
// Si un médico no tiene registro, se aplican permisos por defecto
// (todo permitido) — el frontend usa PERMISOS_POR_DEFECTO.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    let query = supabase
      .from("permisos_especialidades")
      .select("*, medico:usuarios_clinica!permisos_especialidades_medico_id_fkey(id, nombre_completo, email, especialidad)")
      .order("created_at", { ascending: false });

    if (auth.rol !== "admin") {
      query = supabase
        .from("permisos_especialidades")
        .select("*")
        .eq("medico_id", auth.id);
    }

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
    if (!auth || auth.rol !== "admin") {
      return NextResponse.json({ error: "Solo el administrador puede gestionar permisos" }, { status: 401 });
    }

    const body = await request.json();
    const { medico_id, especialidad } = body;

    if (!medico_id || !especialidad) {
      return NextResponse.json({ error: "Médico y especialidad son requeridos" }, { status: 400 });
    }

    const registro = {
      medico_id,
      especialidad,
      acceso_modulo: body.acceso_modulo ?? true,
      acceso_contabilidad: body.acceso_contabilidad ?? true,
      acceso_seguros: body.acceso_seguros ?? true,
      acceso_reportes: body.acceso_reportes ?? false,
      otorgado_por: auth.id,
      notas: body.notas || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("permisos_especialidades")
      .upsert([registro], { onConflict: "medico_id,especialidad" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Permisos actualizados" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
