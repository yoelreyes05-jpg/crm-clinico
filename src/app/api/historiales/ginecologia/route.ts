
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface JwtPayload { id: string; rol: string; email: string; especialidad?: string; }

function verifyAuth(request: NextRequest): JwtPayload | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const jwtSecret = process.env.JWT_SECRET || "dev_secret_jwt_key_change_in_production_min_32_chars";
    return jwt.verify(auth.slice(7), jwtSecret) as JwtPayload;
  } catch { return null; }
}

// ============================================================
// POST /api/historiales/ginecologia — Guardar ficha completa
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.rol !== "medico") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      paciente_id,
      // Clínico general
      motivo_consulta,
      diagnostico_principal,
      plan_tratamiento,
      observaciones,
      peso,
      presion_sistolica,
      presion_diastolica,
      // Antecedentes
      embarazo, tbc_pulmonar, hipertension, gemelares,
      diabetes, hipertension_cronica, cirugia_pelvico_uterina, infertilidad,
      antecedentes_familiares,
      // Exámenes
      ta_inicial, vdrl, hb, tipo_sangre, fum, fpp, antitetanicas, dudas,
      // Controles prenatales
      controles_prenatales,
    } = body;

    if (!paciente_id || !diagnostico_principal) {
      return NextResponse.json({ error: "Paciente y diagnóstico son requeridos" }, { status: 400 });
    }

    // 1. Crear registro base en historiales_clinicos
    const { data: historialBase, error: errBase } = await supabase
      .from("historiales_clinicos")
      .insert([{
        paciente_id,
        medico_id: auth.id,
        especialidad: "ginecologia",
        motivo_consulta: motivo_consulta || "Consulta ginecológica",
        diagnostico_principal,
        plan_tratamiento: plan_tratamiento || "",
        peso: peso ? parseFloat(peso) : null,
        presion_sistolica: presion_sistolica ? parseInt(presion_sistolica) : null,
        presion_diastolica: presion_diastolica ? parseInt(presion_diastolica) : null,
        estado: "activo",
      }])
      .select("id")
      .single();

    if (errBase) {
      console.error("Error creando historial base:", errBase.message);
      return NextResponse.json({ error: `Error al crear historial: ${errBase.message}` }, { status: 500 });
    }

    // 2. Crear registro especializado en historiales_ginecologia
    const { data: histGine, error: errGine } = await supabase
      .from("historiales_ginecologia")
      .insert([{
        historial_id: historialBase.id,
        // Antecedentes
        embarazo: embarazo ?? false,
        tbc_pulmonar: tbc_pulmonar ?? false,
        hipertension: hipertension ?? false,
        gemelares: gemelares ?? false,
        diabetes: diabetes ?? false,
        hipertension_cronica: hipertension_cronica ?? false,
        cirugia_pelvico_uterina: cirugia_pelvico_uterina ?? false,
        infertilidad: infertilidad ?? false,
        antecedentes_familiares: antecedentes_familiares || null,
        // Exámenes
        ta_inicial: ta_inicial || null,
        vdrl: vdrl || null,
        hb: hb || null,
        // Fechas
        fum: fum || null,
        fpp: fpp || null,
        // Otros
        dudas: dudas || observaciones || null,
        antitetanicas: antitetanicas || null,
        // Controles prenatales (JSONB)
        controles_prenatales: controles_prenatales || [],
        // Campos originales del schema
        embrazada: embarazo ?? false,
        fecha_ultimo_periodo: fum || null,
      }])
      .select("id")
      .single();

    if (errGine) {
      console.error("Error creando historial ginecología:", errGine.message);
      // Revertir el historial base si falla el especializado
      await supabase.from("historiales_clinicos").delete().eq("id", historialBase.id);
      return NextResponse.json({ error: `Error al guardar ficha ginecológica: ${errGine.message}` }, { status: 500 });
    }

    return NextResponse.json({
      data: { historial_id: historialBase.id, ginecologia_id: histGine.id },
      message: "Ficha ginecológica guardada exitosamente",
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}

// ============================================================
// GET /api/historiales/ginecologia?paciente_id=xxx
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");

    let query = supabase
      .from("historiales_clinicos")
      .select(`
        id, motivo_consulta, diagnostico_principal, plan_tratamiento,
        peso, presion_sistolica, presion_diastolica, created_at,
        historiales_ginecologia (
          id, embarazo, tbc_pulmonar, hipertension, gemelares,
          diabetes, hipertension_cronica, cirugia_pelvico_uterina, infertilidad,
          antecedentes_familiares, ta_inicial, vdrl, hb, fum, fpp,
          dudas, antitetanicas, controles_prenatales
        )
      `)
      .eq("especialidad", "ginecologia")
      .order("created_at", { ascending: false });

    if (pacienteId) query = query.eq("paciente_id", pacienteId);
    if (auth.rol === "medico") query = query.eq("medico_id", auth.id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
