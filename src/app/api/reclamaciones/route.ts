export const dynamic = "force-dynamic";

// ============================================================
// API RECLAMACIONES ARS — Lo que la aseguradora debe al médico
// GET  /api/reclamaciones → lista (médico: las suyas, admin: todas)
// POST /api/reclamaciones → crear reclamación
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, obtenerMedicoAsignado, supabaseAdmin as supabase } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const medicoIdParam = searchParams.get("medico_id");

    let medicoId = auth.rol === "admin" || auth.rol === "secretaria" ? medicoIdParam : auth.id;
    if (auth.rol === "secretaria") {
      const asignado = await obtenerMedicoAsignado(auth);
      if (asignado) medicoId = asignado;
    }

    let query = supabase
      .from("reclamaciones_ars")
      .select("*, paciente:pacientes(id, nombre_completo, cedula), aseguradora:aseguradoras(id, nombre)")
      .order("created_at", { ascending: false });

    if (medicoId) query = query.eq("medico_id", medicoId);
    if (estado) query = query.eq("estado", estado);

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
    const { aseguradora_id, descripcion, monto_reclamado } = body;

    if (!aseguradora_id || !descripcion || monto_reclamado === undefined) {
      return NextResponse.json(
        { error: "Aseguradora, descripción y monto reclamado son requeridos" },
        { status: 400 }
      );
    }

    const medico_id = auth.rol === "admin" && body.medico_id ? body.medico_id : auth.id;
    const especialidad = body.especialidad || auth.especialidad || "general";

    const { data, error } = await supabase
      .from("reclamaciones_ars")
      .insert([{
        medico_id,
        aseguradora_id,
        paciente_id: body.paciente_id || null,
        autorizacion_id: body.autorizacion_id || null,
        especialidad,
        numero_reclamacion: body.numero_reclamacion || null,
        descripcion,
        fecha_servicio: body.fecha_servicio || null,
        fecha_envio: body.fecha_envio || null,
        monto_reclamado: Number(monto_reclamado),
        monto_glosado: Number(body.monto_glosado || 0),
        monto_pagado: Number(body.monto_pagado || 0),
        estado: body.estado || "preparando",
        notas: body.notas || null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Reclamación registrada" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
