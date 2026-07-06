export const dynamic = "force-dynamic";

// ============================================================
// API ASEGURADORAS — Catálogo de ARS
// GET  /api/aseguradoras → lista (cualquier usuario autenticado)
// POST /api/aseguradoras → crear (solo admin)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data, error } = await supabase
      .from("aseguradoras")
      .select("*")
      .eq("estado", true)
      .order("nombre", { ascending: true });

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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("aseguradoras")
      .insert([{
        nombre: body.nombre,
        codigo: body.codigo || null,
        telefono: body.telefono || null,
        telefono_autorizaciones: body.telefono_autorizaciones || null,
        email_autorizaciones: body.email_autorizaciones || null,
        portal_web: body.portal_web || null,
        requiere_autorizacion_previa: body.requiere_autorizacion_previa ?? true,
        dias_pago_promedio: body.dias_pago_promedio || 30,
        notas: body.notas || null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, message: "Aseguradora creada" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
