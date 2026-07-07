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

    const { searchParams } = new URL(request.url);
    const usuarioIdParam = searchParams.get("usuario_id");

    let query = supabase
      .from("permisos_especialidades")
      .select("*, medico:usuarios_clinica!permisos_especialidades_medico_id_fkey(id, nombre_completo, email, especialidad)")
      .order("created_at", { ascending: false });

    if (auth.rol !== "admin") {
      // Un médico puede consultar los permisos de SU secretaria asignada
      let idConsulta = auth.id;
      if (usuarioIdParam && auth.rol === "medico") {
        const { data: objetivo } = await supabase
          .from("usuarios_clinica")
          .select("rol, asignado_a")
          .eq("id", usuarioIdParam)
          .single();
        if (objetivo?.rol === "secretaria" && objetivo?.asignado_a === auth.id) {
          idConsulta = usuarioIdParam;
        }
      }
      query = supabase
        .from("permisos_especialidades")
        .select("*")
        .eq("medico_id", idConsulta);
    } else if (usuarioIdParam) {
      query = query.eq("medico_id", usuarioIdParam);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

// Permisos que un MÉDICO puede otorgar a su propia secretaria.
// Los avanzados (cxc, finanzas, libros, reportes, módulo, seguros)
// solo los controla el administrador.
const PERMISOS_BASICOS_SECRETARIA = [
  "acceso_citas", "acceso_pacientes", "acceso_contabilidad", "acceso_facturacion",
];

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || (auth.rol !== "admin" && auth.rol !== "medico")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { medico_id, especialidad } = body;

    if (!medico_id || !especialidad) {
      return NextResponse.json({ error: "Usuario y especialidad son requeridos" }, { status: 400 });
    }

    // ===== MÉDICO: solo permisos básicos de SU secretaria =====
    if (auth.rol === "medico") {
      const { data: objetivo } = await supabase
        .from("usuarios_clinica")
        .select("id, rol, asignado_a")
        .eq("id", medico_id)
        .single();

      if (!objetivo || objetivo.rol !== "secretaria" || objetivo.asignado_a !== auth.id) {
        return NextResponse.json(
          { error: "Solo puedes gestionar los permisos de tu propia secretaria" },
          { status: 403 }
        );
      }

      // Preservar los permisos avanzados existentes (solo admin los cambia)
      const { data: actual } = await supabase
        .from("permisos_especialidades")
        .select("*")
        .eq("medico_id", medico_id)
        .eq("especialidad", especialidad)
        .maybeSingle();

      const registroMedico: Record<string, any> = {
        medico_id,
        especialidad,
        acceso_modulo: actual?.acceso_modulo ?? false,
        acceso_seguros: actual?.acceso_seguros ?? false,
        acceso_reportes: actual?.acceso_reportes ?? false,
        acceso_cxc: actual?.acceso_cxc ?? false,
        acceso_finanzas: actual?.acceso_finanzas ?? false,
        acceso_libros: actual?.acceso_libros ?? false,
        otorgado_por: auth.id,
        updated_at: new Date().toISOString(),
      };
      for (const campo of PERMISOS_BASICOS_SECRETARIA) {
        registroMedico[campo] = body[campo] ?? actual?.[campo] ?? true;
      }

      const { data, error } = await supabase
        .from("permisos_especialidades")
        .upsert([registroMedico], { onConflict: "medico_id,especialidad" })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data, message: "Permisos de tu secretaria actualizados" }, { status: 201 });
    }

    // ===== ADMIN: control total =====
    const registro = {
      medico_id,
      especialidad,
      acceso_modulo: body.acceso_modulo ?? true,
      acceso_contabilidad: body.acceso_contabilidad ?? true,
      acceso_seguros: body.acceso_seguros ?? true,
      acceso_reportes: body.acceso_reportes ?? false,
      acceso_citas: body.acceso_citas ?? true,
      acceso_pacientes: body.acceso_pacientes ?? true,
      acceso_facturacion: body.acceso_facturacion ?? true,
      acceso_cxc: body.acceso_cxc ?? false,
      acceso_finanzas: body.acceso_finanzas ?? false,
      acceso_libros: body.acceso_libros ?? false,
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
