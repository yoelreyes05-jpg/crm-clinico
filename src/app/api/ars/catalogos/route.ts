export const dynamic = "force-dynamic";

// ============================================================
// API CATÁLOGOS ARS — planes y tarifarios por aseguradora
// GET    /api/ars/catalogos?aseguradora_id=&tipo=planes|tarifas
// POST   /api/ars/catalogos  { tipo, aseguradora_id, ... }   (admin)
// DELETE /api/ars/catalogos  { tipo, id }                    (admin)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, supabaseAdmin as supabase } from "@/lib/api-auth";

const TABLAS: Record<string, string> = { planes: "planes_ars", tarifas: "tarifarios_ars" };

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const aseguradoraId = searchParams.get("aseguradora_id");
    const tipo = searchParams.get("tipo") || "planes";
    const tabla = TABLAS[tipo];
    if (!tabla) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

    let query = supabase.from(tabla).select("*").eq("estado", true).order("created_at", { ascending: false });
    if (aseguradoraId) query = query.eq("aseguradora_id", aseguradoraId);

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
      return NextResponse.json({ error: "Solo el administrador puede editar catálogos" }, { status: 401 });
    }

    const body = await request.json();
    const tabla = TABLAS[body.tipo];
    if (!tabla || !body.aseguradora_id) {
      return NextResponse.json({ error: "tipo y aseguradora_id son requeridos" }, { status: 400 });
    }

    if (body.tipo === "planes" && !body.nombre) {
      return NextResponse.json({ error: "El nombre del plan es requerido" }, { status: 400 });
    }
    if (body.tipo === "tarifas" && !body.descripcion) {
      return NextResponse.json({ error: "La descripción de la tarifa es requerida" }, { status: 400 });
    }

    const registro =
      body.tipo === "planes"
        ? {
            aseguradora_id: body.aseguradora_id,
            nombre: body.nombre,
            descripcion: body.descripcion || null,
            copago_defecto: Number(body.copago_defecto || 0),
            cobertura_pct: Number(body.cobertura_pct || 80),
          }
        : {
            aseguradora_id: body.aseguradora_id,
            codigo: body.codigo || null,
            descripcion: body.descripcion,
            tarifa: Number(body.tarifa || 0),
            copago: Number(body.copago || 0),
          };

    const { data, error } = await supabase.from(tabla).insert([registro]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const body = await request.json();
    const tabla = TABLAS[body.tipo];
    if (!tabla || !body.id) return NextResponse.json({ error: "tipo e id requeridos" }, { status: 400 });

    const { error } = await supabase.from(tabla).update({ estado: false }).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Eliminado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
