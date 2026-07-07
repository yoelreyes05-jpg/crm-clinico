export const dynamic = "force-dynamic";

// ============================================================
// API SEGUROS DE PACIENTES — Afiliación de cada paciente a su ARS
// GET  /api/seguros-pacientes?paciente_id= → seguros de un paciente
// POST /api/seguros-pacientes → registrar seguro de paciente
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, obtenerMedicoAsignado, supabaseAdmin as supabase } from "@/lib/api-auth";

// IDs de los pacientes que pertenecen a un médico
// (registrados por él, con citas o con historiales suyos)
async function pacientesDelMedico(medicoId: string): Promise<string[]> {
  const ids = new Set<string>();
  const [porRegistro, porCitas, porHistoriales] = await Promise.all([
    supabase.from("pacientes").select("id").eq("medico_id", medicoId),
    supabase.from("citas").select("paciente_id").eq("medico_id", medicoId),
    supabase.from("historiales_clinicos").select("paciente_id").eq("medico_id", medicoId),
  ]);
  (porRegistro.data || []).forEach((p: any) => ids.add(p.id));
  (porCitas.data || []).forEach((c: any) => c.paciente_id && ids.add(c.paciente_id));
  (porHistoriales.data || []).forEach((h: any) => h.paciente_id && ids.add(h.paciente_id));
  return Array.from(ids);
}

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");

    let query = supabase
      .from("seguros_pacientes")
      .select("*, aseguradora:aseguradoras(id, nombre, portal_web, telefono_autorizaciones), paciente:pacientes(id, nombre_completo, cedula)")
      .eq("estado", true)
      .order("created_at", { ascending: false });

    if (pacienteId) query = query.eq("paciente_id", pacienteId);

    // Aislamiento por médico: cada médico solo ve los seguros de SUS
    // pacientes (aunque otro médico sea de la misma especialidad).
    // Secretaria asignada → los del médico asignado. Admin → todo.
    let medicoScope: string | null = null;
    if (auth.rol === "medico") medicoScope = auth.id;
    else if (auth.rol === "secretaria") medicoScope = await obtenerMedicoAsignado(auth);

    if (medicoScope && !pacienteId) {
      const ids = await pacientesDelMedico(medicoScope);
      if (ids.length === 0) return NextResponse.json({ data: [] });
      query = query.in("paciente_id", ids);
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
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { paciente_id, aseguradora_id, numero_afiliado } = body;

    if (!paciente_id || !aseguradora_id || !numero_afiliado) {
      return NextResponse.json(
        { error: "Paciente, aseguradora y número de afiliado son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("seguros_pacientes")
      .insert([{
        paciente_id,
        aseguradora_id,
        numero_afiliado,
        plan: body.plan || null,
        regimen: body.regimen || "contributivo",
        titular: body.titular ?? true,
        nombre_titular: body.nombre_titular || null,
        vigente_desde: body.vigente_desde || null,
        vigente_hasta: body.vigente_hasta || null,
        verificado: body.verificado ?? false,
        fecha_verificacion: body.fecha_verificacion || null,
        notas: body.notas || null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Seguro del paciente registrado" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
