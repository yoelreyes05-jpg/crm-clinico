export const dynamic = "force-dynamic";

// ============================================================
// API FACTURAS [id]
// PUT con { accion }:
//  - "pago_paciente" { monto, metodo } → Debe Caja/Banco, Haber CxC-Pacientes
//  - "pago_ars" { monto }             → Debe Banco, Haber CxC-ARS
//  - "anular"                          → anula factura (asiento de reversa)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";
import { crearAsiento, cuentaPorMetodo, CUENTAS } from "@/lib/contabilidad";
import { registrarAuditoria } from "@/lib/auditoria";

const esStaff = (rol: string) => rol === "admin" || rol === "secretaria";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data: factura } = await supabase.from("facturas_clinica").select("*").eq("id", params.id).single();
    if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    if (!esStaff(auth.rol) && factura.medico_id !== auth.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (factura.estado === "anulada") {
      return NextResponse.json({ error: "La factura está anulada" }, { status: 400 });
    }

    const body = await request.json();
    const accion = body.accion;
    const hoy = new Date().toISOString().slice(0, 10);

    // ============ PAGO DEL PACIENTE (pendiente en CxC) ============
    if (accion === "pago_paciente") {
      const monto = Number(body.monto || 0);
      if (monto <= 0) return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
      const metodo = body.metodo || "efectivo";

      await crearAsiento(supabase, {
        descripcion: `${factura.numero_factura} — Pago de paciente`,
        referencia_tipo: "pago_paciente",
        referencia_id: factura.id,
        medico_id: factura.medico_id,
        creado_por: auth.id,
        fecha: hoy,
        partidas: [
          { cuenta_codigo: cuentaPorMetodo(metodo), debe: monto },
          { cuenta_codigo: CUENTAS.CXC_PACIENTES, haber: monto },
        ],
      });

      await supabase.from("movimientos_financieros").insert([{
        medico_id: factura.medico_id,
        especialidad: factura.especialidad || "general",
        paciente_id: factura.paciente_id,
        aseguradora_id: factura.aseguradora_id,
        tipo: factura.monto_ars > 0 ? "copago" : "consulta",
        concepto: `${factura.numero_factura} — Pago de paciente`,
        monto,
        metodo_pago: metodo,
        fuente: "paciente",
        fecha_movimiento: hoy,
        estado: "cobrado",
        comprobante: factura.numero_factura,
      }]);

      const pagadoPaciente = Number(factura.pagado_paciente) + monto;
      const totalPagado = pagadoPaciente + Number(factura.pagado_ars);
      const { data } = await supabase
        .from("facturas_clinica")
        .update({
          pagado_paciente: pagadoPaciente,
          metodo_pago_paciente: metodo,
          estado: totalPagado >= Number(factura.total) - 0.01 ? "pagada" : "parcial",
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .select()
        .single();

      await registrarAuditoria(supabase, {
        usuario_id: auth.id, usuario_email: auth.email,
        accion: "pago_paciente", entidad: "factura", entidad_id: params.id,
        detalles: { monto, metodo },
      });
      return NextResponse.json({ data, message: "Pago registrado con asiento contable" });
    }

    // ============ PAGO DE LA ARS ============
    if (accion === "pago_ars") {
      const monto = Number(body.monto || 0);
      if (monto <= 0) return NextResponse.json({ error: "Monto inválido" }, { status: 400 });

      await crearAsiento(supabase, {
        descripcion: `${factura.numero_factura} — Pago de ARS`,
        referencia_tipo: "pago_ars",
        referencia_id: factura.id,
        medico_id: factura.medico_id,
        creado_por: auth.id,
        fecha: hoy,
        partidas: [
          { cuenta_codigo: CUENTAS.BANCO, debe: monto },
          { cuenta_codigo: CUENTAS.CXC_ARS, haber: monto },
        ],
      });

      await supabase.from("movimientos_financieros").insert([{
        medico_id: factura.medico_id,
        especialidad: factura.especialidad || "general",
        paciente_id: factura.paciente_id,
        aseguradora_id: factura.aseguradora_id,
        tipo: "pago_ars",
        concepto: `${factura.numero_factura} — Pago de ARS`,
        monto,
        metodo_pago: "transferencia",
        fuente: "aseguradora",
        fecha_movimiento: hoy,
        estado: "cobrado",
        comprobante: factura.numero_factura,
      }]);

      // Actualizar reclamación vinculada
      if (factura.reclamacion_id) {
        const pagadoArsNuevo = Number(factura.pagado_ars) + monto;
        await supabase
          .from("reclamaciones_ars")
          .update({
            monto_pagado: pagadoArsNuevo,
            estado: pagadoArsNuevo >= Number(factura.monto_ars) - 0.01 ? "pagada" : "parcial",
            fecha_pago: hoy,
            updated_at: new Date().toISOString(),
          })
          .eq("id", factura.reclamacion_id);
      }

      const pagadoArs = Number(factura.pagado_ars) + monto;
      const totalPagado = pagadoArs + Number(factura.pagado_paciente);
      const { data } = await supabase
        .from("facturas_clinica")
        .update({
          pagado_ars: pagadoArs,
          estado: totalPagado >= Number(factura.total) - 0.01 ? "pagada" : "parcial",
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .select()
        .single();

      await registrarAuditoria(supabase, {
        usuario_id: auth.id, usuario_email: auth.email,
        accion: "pago_ars", entidad: "factura", entidad_id: params.id,
        detalles: { monto },
      });
      return NextResponse.json({ data, message: "Pago de ARS registrado: Banco / CxC-ARS" });
    }

    // ============ ANULAR ============
    if (accion === "anular") {
      // Asiento de reversa por lo registrado
      const partidas = [];
      if (Number(factura.pagado_paciente) > 0) {
        partidas.push(
          { cuenta_codigo: CUENTAS.INGRESOS_SERVICIOS, debe: Number(factura.pagado_paciente) },
          { cuenta_codigo: cuentaPorMetodo(factura.metodo_pago_paciente), haber: Number(factura.pagado_paciente) },
        );
      }
      if (Number(factura.monto_ars) > 0) {
        partidas.push(
          { cuenta_codigo: CUENTAS.INGRESOS_SERVICIOS, debe: Number(factura.monto_ars) - Number(factura.pagado_ars) },
          { cuenta_codigo: CUENTAS.CXC_ARS, haber: Number(factura.monto_ars) - Number(factura.pagado_ars) },
        );
      }
      if (partidas.length > 0) {
        await crearAsiento(supabase, {
          descripcion: `${factura.numero_factura} — ANULACIÓN`,
          referencia_tipo: "anulacion",
          referencia_id: factura.id,
          medico_id: factura.medico_id,
          creado_por: auth.id,
          fecha: hoy,
          partidas,
        });
      }
      if (factura.reclamacion_id) {
        await supabase.from("reclamaciones_ars").update({ estado: "rechazada", notas: "Factura anulada" }).eq("id", factura.reclamacion_id);
      }

      const { data } = await supabase
        .from("facturas_clinica")
        .update({ estado: "anulada", updated_at: new Date().toISOString() })
        .eq("id", params.id)
        .select()
        .single();

      await registrarAuditoria(supabase, {
        usuario_id: auth.id, usuario_email: auth.email,
        accion: "anular", entidad: "factura", entidad_id: params.id,
      });
      return NextResponse.json({ data, message: "Factura anulada con asiento de reversa" });
    }

    return NextResponse.json({ error: "Acción inválida (pago_paciente | pago_ars | anular)" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
