export const dynamic = "force-dynamic";

// ============================================================
// API VALIDACIÓN DE COBERTURA (integración ARS vía adapters)
// POST /api/ars/validar
//   { paciente_id, cita_id?, tipo_servicio?, monto_servicio? }
// Busca el seguro del paciente, ejecuta el adapter de su ARS,
// guarda la validación y actualiza la cita (seguro_validado).
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";
import { getAdapter } from "@/lib/ars-adapters";
import { registrarAuditoria } from "@/lib/auditoria";

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { paciente_id, cita_id, tipo_servicio, monto_servicio, codigo_procedimiento } = body;
    if (!paciente_id) {
      return NextResponse.json({ error: "paciente_id es requerido" }, { status: 400 });
    }

    // 1. Seguro activo del paciente
    const { data: seguros } = await supabase
      .from("seguros_pacientes")
      .select("*, aseguradora:aseguradoras(*)")
      .eq("paciente_id", paciente_id)
      .eq("estado", true)
      .order("created_at", { ascending: false })
      .limit(1);

    const seguro = (seguros || [])[0];
    if (!seguro || !seguro.aseguradora) {
      return NextResponse.json(
        { error: "El paciente no tiene seguro registrado. Regístralo primero en Seguros." },
        { status: 404 }
      );
    }

    const aseguradora = seguro.aseguradora;

    // 2. Contexto: tarifa específica y plan configurados para esa ARS
    let tarifa = null;
    if (tipo_servicio || codigo_procedimiento) {
      const { data: tarifas } = await supabase
        .from("tarifarios_ars")
        .select("tarifa, copago, descripcion, codigo")
        .eq("aseguradora_id", aseguradora.id)
        .eq("estado", true);
      tarifa =
        (tarifas || []).find(
          (t: any) =>
            (codigo_procedimiento && t.codigo === codigo_procedimiento) ||
            (tipo_servicio && t.descripcion?.toLowerCase().includes(String(tipo_servicio).toLowerCase()))
        ) || null;
    }

    let plan = null;
    if (seguro.plan) {
      const { data: planes } = await supabase
        .from("planes_ars")
        .select("copago_defecto, cobertura_pct, nombre")
        .eq("aseguradora_id", aseguradora.id)
        .eq("estado", true);
      plan = (planes || []).find(
        (p: any) => p.nombre?.toLowerCase() === String(seguro.plan).toLowerCase()
      ) || (planes || [])[0] || null;
    }

    // 3. Ejecutar el adapter correspondiente
    const adapter = getAdapter(aseguradora.adapter);
    const resultado = await adapter.validarCobertura(
      aseguradora,
      {
        numero_afiliado: seguro.numero_afiliado,
        tipo_servicio,
        codigo_procedimiento,
        monto_servicio: Number(monto_servicio || 0),
        plan: seguro.plan,
      },
      { tarifa: tarifa || undefined, plan: plan || undefined }
    );

    // 4. Guardar la validación
    const { data: validacion, error } = await supabase
      .from("validaciones_cobertura")
      .insert([{
        paciente_id,
        seguro_paciente_id: seguro.id,
        aseguradora_id: aseguradora.id,
        cita_id: cita_id || null,
        validado_por: auth.id,
        estado: resultado.estado,
        cobertura_aprobada: resultado.cobertura_aprobada,
        copago: resultado.copago,
        deducible: resultado.deducible,
        monto_autorizado: resultado.monto_autorizado,
        numero_autorizacion: resultado.numero_autorizacion || null,
        via: resultado.via,
        respuesta_raw: resultado.respuesta_raw || null,
        notas: resultado.mensaje || null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 5. Actualizar el estado de validación en la cita
    if (cita_id) {
      await supabase
        .from("citas")
        .update({
          seguro_validado: resultado.estado === "validado" ? "validado" : resultado.estado === "rechazado" ? "rechazado" : "pendiente",
          updated_at: new Date().toISOString(),
        })
        .eq("id", cita_id);
    }

    await registrarAuditoria(supabase, {
      usuario_id: auth.id,
      usuario_email: auth.email,
      accion: "validar_cobertura",
      entidad: "validacion",
      entidad_id: validacion.id,
      detalles: { paciente_id, aseguradora: aseguradora.nombre, resultado: resultado.estado },
    });

    return NextResponse.json({
      data: validacion,
      aseguradora: { id: aseguradora.id, nombre: aseguradora.nombre },
      seguro: { numero_afiliado: seguro.numero_afiliado, plan: seguro.plan, titular: seguro.titular },
      mensaje: resultado.mensaje,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

// GET /api/ars/validar?paciente_id=&cita_id= → última validación
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");
    const citaId = searchParams.get("cita_id");

    let query = supabase
      .from("validaciones_cobertura")
      .select("*, aseguradora:aseguradoras(id, nombre)")
      .order("created_at", { ascending: false })
      .limit(1);
    if (citaId) query = query.eq("cita_id", citaId);
    else if (pacienteId) query = query.eq("paciente_id", pacienteId);
    else return NextResponse.json({ error: "paciente_id o cita_id requerido" }, { status: 400 });

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: (data || [])[0] || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
