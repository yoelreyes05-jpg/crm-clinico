export const dynamic = "force-dynamic";

// ============================================================
// API AUTORIZACIONES DE SEGURO
// GET  /api/autorizaciones → lista (médico: las suyas, admin: todas)
//      Query: ?estado=pendiente&paciente_id=&medico_id=(admin)
// POST /api/autorizaciones → crear solicitud de autorización
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const pacienteId = searchParams.get("paciente_id");
    const medicoIdParam = searchParams.get("medico_id");

    const medicoId = auth.rol === "admin" ? medicoIdParam : auth.id;

    let query = supabase
      .from("autorizaciones_seguro")
      .select("*, paciente:pacientes(id, nombre_completo, cedula), aseguradora:aseguradoras(id, nombre, portal_web, telefono_autorizaciones)")
      .order("created_at", { ascending: false });

    if (medicoId) query = query.eq("medico_id", medicoId);
    if (estado) query = query.eq("estado", estado);
    if (pacienteId) query = query.eq("paciente_id", pacienteId);

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
    const { paciente_id, aseguradora_id, tipo_servicio, descripcion_servicio } = body;

    if (!paciente_id || !aseguradora_id || !tipo_servicio || !descripcion_servicio) {
      return NextResponse.json(
        { error: "Paciente, aseguradora, tipo y descripción del servicio son requeridos" },
        { status: 400 }
      );
    }

    const medico_id = auth.rol === "admin" && body.medico_id ? body.medico_id : auth.id;
    const especialidad = body.especialidad || auth.especialidad || "general";

    const { data, error } = await supabase
      .from("autorizaciones_seguro")
      .insert([{
        paciente_id,
        medico_id,
        aseguradora_id,
        seguro_paciente_id: body.seguro_paciente_id || null,
        cita_id: body.cita_id || null,
        historial_id: body.historial_id || null,
        especialidad,
        tipo_servicio,
        descripcion_servicio,
        codigo_procedimiento: body.codigo_procedimiento || null,
        diagnostico_cie10: body.diagnostico_cie10 || null,
        numero_autorizacion: body.numero_autorizacion || null,
        fecha_solicitud: body.fecha_solicitud || new Date().toISOString().slice(0, 10),
        fecha_respuesta: body.fecha_respuesta || null,
        fecha_vencimiento: body.fecha_vencimiento || null,
        via_solicitud: body.via_solicitud || "portal",
        monto_solicitado: Number(body.monto_solicitado || 0),
        monto_autorizado: Number(body.monto_autorizado || 0),
        monto_diferencia: Number(body.monto_diferencia || 0),
        copago_paciente: Number(body.copago_paciente || 0),
        estado: body.estado || "pendiente",
        notas: body.notas || null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Autorización registrada" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
