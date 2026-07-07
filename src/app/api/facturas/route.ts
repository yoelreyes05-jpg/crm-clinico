export const dynamic = "force-dynamic";

// ============================================================
// API FACTURACIÓN
// GET  /api/facturas → lista (médico: las suyas; admin/secretaria: todas)
// POST /api/facturas → crear factura con:
//   - División automática: monto_paciente (copago) + monto_ars
//   - Asientos contables automáticos (partida doble)
//   - Movimiento en contabilidad del médico
//   - Reclamación a la ARS por la porción pendiente
//   - Trazabilidad: cita → factura → asiento → reclamación
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";
import { crearAsiento, cuentaPorMetodo, CUENTAS } from "@/lib/contabilidad";
import { registrarAuditoria } from "@/lib/auditoria";

const esStaff = (rol: string) => rol === "admin" || rol === "secretaria";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const medicoIdParam = searchParams.get("medico_id");

    const medicoId = esStaff(auth.rol) ? medicoIdParam : auth.id;

    let query = supabase
      .from("facturas_clinica")
      .select("*, paciente:pacientes(id, nombre_completo, cedula), aseguradora:aseguradoras(id, nombre), medico:usuarios_clinica(id, nombre_completo)")
      .order("created_at", { ascending: false });

    if (medicoId) query = query.eq("medico_id", medicoId);
    if (estado) query = query.eq("estado", estado);
    if (desde) query = query.gte("fecha_emision", desde);
    if (hasta) query = query.lte("fecha_emision", hasta);

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
    const { paciente_id, descripcion, total } = body;
    if (!paciente_id || !descripcion || total === undefined) {
      return NextResponse.json(
        { error: "Paciente, descripción y total son requeridos" },
        { status: 400 }
      );
    }

    const medico_id = esStaff(auth.rol) && body.medico_id ? body.medico_id : auth.id;
    const totalNum = Number(total);
    const montoArs = Math.min(Number(body.monto_ars || 0), totalNum);
    const montoPaciente = Number(
      body.monto_paciente !== undefined ? body.monto_paciente : totalNum - montoArs
    );
    const pagaAhora = body.paciente_paga_ahora !== false; // por defecto el paciente paga en caja
    const metodoPago = body.metodo_pago_paciente || "efectivo";
    const hoy = new Date().toISOString().slice(0, 10);

    // Número de factura secuencial
    const { count } = await supabase
      .from("facturas_clinica")
      .select("id", { count: "exact", head: true });
    const numeroFactura = `FACT-${String((count || 0) + 1).padStart(6, "0")}`;

    // Especialidad del médico
    let especialidad = body.especialidad || auth.especialidad;
    if (!especialidad) {
      const { data: med } = await supabase
        .from("usuarios_clinica").select("especialidad").eq("id", medico_id).single();
      especialidad = med?.especialidad || "general";
    }

    // ============ 1. Crear la factura ============
    const { data: factura, error } = await supabase
      .from("facturas_clinica")
      .insert([{
        numero_factura: numeroFactura,
        ncf: body.ncf || null,
        cita_id: body.cita_id || null,
        historial_id: body.historial_id || null,
        paciente_id,
        medico_id,
        aseguradora_id: body.aseguradora_id || null,
        validacion_id: body.validacion_id || null,
        especialidad,
        descripcion,
        subtotal: Number(body.subtotal ?? totalNum),
        descuento: Number(body.descuento || 0),
        itbis: Number(body.itbis || 0),
        total: totalNum,
        monto_paciente: montoPaciente,
        monto_ars: montoArs,
        pagado_paciente: pagaAhora ? montoPaciente : 0,
        pagado_ars: 0,
        metodo_pago_paciente: pagaAhora ? metodoPago : null,
        estado: montoArs > 0 || !pagaAhora ? (pagaAhora && montoPaciente > 0 ? "parcial" : "emitida") : "pagada",
        fecha_emision: body.fecha_emision || hoy,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ============ 2. Asientos contables automáticos ============
    // a) Pago del paciente en caja: Debe Caja/Banco, Haber Ingresos
    if (pagaAhora && montoPaciente > 0) {
      await crearAsiento(supabase, {
        descripcion: `${numeroFactura} — Cobro paciente (${descripcion})`,
        referencia_tipo: "factura",
        referencia_id: factura.id,
        medico_id,
        creado_por: auth.id,
        fecha: hoy,
        partidas: [
          { cuenta_codigo: cuentaPorMetodo(metodoPago), debe: montoPaciente },
          { cuenta_codigo: CUENTAS.INGRESOS_SERVICIOS, haber: montoPaciente },
        ],
      });
    }
    // b) Porción no cobrada al paciente: Debe CxC Pacientes, Haber Ingresos
    if (!pagaAhora && montoPaciente > 0) {
      await crearAsiento(supabase, {
        descripcion: `${numeroFactura} — Por cobrar a paciente (${descripcion})`,
        referencia_tipo: "factura",
        referencia_id: factura.id,
        medico_id,
        creado_por: auth.id,
        fecha: hoy,
        partidas: [
          { cuenta_codigo: CUENTAS.CXC_PACIENTES, debe: montoPaciente },
          { cuenta_codigo: CUENTAS.INGRESOS_SERVICIOS, haber: montoPaciente },
        ],
      });
    }
    // c) Porción ARS: Debe CxC-ARS, Haber Ingresos
    if (montoArs > 0) {
      await crearAsiento(supabase, {
        descripcion: `${numeroFactura} — Por cobrar a ARS (${descripcion})`,
        referencia_tipo: "factura",
        referencia_id: factura.id,
        medico_id,
        creado_por: auth.id,
        fecha: hoy,
        partidas: [
          { cuenta_codigo: CUENTAS.CXC_ARS, debe: montoArs },
          { cuenta_codigo: CUENTAS.INGRESOS_SERVICIOS, haber: montoArs },
        ],
      });
    }

    // ============ 3. Movimiento en la contabilidad del médico ============
    if (pagaAhora && montoPaciente > 0) {
      await supabase.from("movimientos_financieros").insert([{
        medico_id,
        especialidad,
        paciente_id,
        cita_id: body.cita_id || null,
        aseguradora_id: body.aseguradora_id || null,
        tipo: montoArs > 0 ? "copago" : "consulta",
        concepto: `${numeroFactura} — ${descripcion}`.slice(0, 250),
        monto: montoPaciente,
        metodo_pago: metodoPago,
        fuente: "paciente",
        fecha_movimiento: hoy,
        estado: "cobrado",
        comprobante: numeroFactura,
      }]);
    }

    // ============ 4. Reclamación automática a la ARS ============
    let reclamacionId = null;
    if (montoArs > 0 && body.aseguradora_id) {
      const { data: reclamacion } = await supabase
        .from("reclamaciones_ars")
        .insert([{
          medico_id,
          aseguradora_id: body.aseguradora_id,
          paciente_id,
          especialidad,
          numero_reclamacion: numeroFactura,
          descripcion: `${numeroFactura} — ${descripcion}`.slice(0, 250),
          fecha_servicio: hoy,
          fecha_envio: hoy,
          monto_reclamado: montoArs,
          estado: "enviada",
        }])
        .select("id")
        .single();
      reclamacionId = reclamacion?.id || null;
      if (reclamacionId) {
        await supabase.from("facturas_clinica").update({ reclamacion_id: reclamacionId }).eq("id", factura.id);
      }
    }

    // ============ 5. Marcar cita como finalizada/facturada ============
    if (body.cita_id) {
      await supabase
        .from("citas")
        .update({ estado: "finalizada", updated_at: new Date().toISOString() })
        .eq("id", body.cita_id);
    }

    await registrarAuditoria(supabase, {
      usuario_id: auth.id,
      usuario_email: auth.email,
      accion: "facturar",
      entidad: "factura",
      entidad_id: factura.id,
      detalles: { numero_factura: numeroFactura, total: totalNum, monto_paciente: montoPaciente, monto_ars: montoArs },
    });

    return NextResponse.json(
      { data: { ...factura, reclamacion_id: reclamacionId }, message: `Factura ${numeroFactura} emitida con asientos contables generados` },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
