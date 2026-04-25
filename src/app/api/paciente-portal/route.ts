export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Extrae IDs únicos y no nulos de un array de objetos */
function uniqueIds(rows: any[], field: string): string[] {
  const seen = new Set<string>();
  for (const r of rows) {
    if (r[field]) seen.add(String(r[field]));
  }
  return Array.from(seen);
}

/** Construye un mapa id → { nombre_completo, especialidad } */
async function buildMedicosMap(
  ids: string[]
): Promise<Record<string, { nombre_completo: string; especialidad: string }>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("usuarios_clinica")
    .select("id, nombre_completo, especialidad")
    .in("id", ids);
  const map: Record<string, { nombre_completo: string; especialidad: string }> = {};
  if (data) {
    for (const m of data) {
      map[String(m.id)] = { nombre_completo: m.nombre_completo, especialidad: m.especialidad };
    }
  }
  return map;
}

// ============================================================
// GET /api/paciente-portal?cedula=XXXXXXXX
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get("cedula")?.trim();

    if (!cedula || cedula.length < 4) {
      return NextResponse.json({ error: "Ingresa tu número de cédula" }, { status: 400 });
    }

    // 1. Buscar paciente
    const { data: pacienteData, error: pacienteError } = await supabase
      .from("pacientes")
      .select(
        "id, cedula, nombre_completo, fecha_nacimiento, sexo, " +
        "telefono, email, ciudad, tipo_sangre, alergias, antecedentes_medicos, estado"
      )
      .eq("cedula", cedula)
      .eq("estado", true)
      .maybeSingle();

    if (pacienteError) {
      console.error("Error buscando paciente:", pacienteError.message);
      return NextResponse.json({ error: "Error buscando paciente" }, { status: 500 });
    }
    if (!pacienteData) {
      return NextResponse.json(
        { error: "No se encontró ningún paciente con esa cédula en el sistema" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paciente = pacienteData as any;
    const pacienteId: string = String(paciente.id);

    // 2. Citas
    const { data: citasRawData, error: citasError } = await supabase
      .from("citas")
      .select("id, especialidad, fecha_cita, duracion_minutos, motivo_cita, estado, notas, medico_id")
      .eq("paciente_id", pacienteId)
      .order("fecha_cita", { ascending: false })
      .limit(30);

    if (citasError) console.error("Error citas:", citasError.message);
    const citasRaw = (citasRawData ?? []) as any[];

    let citas: any[] = [];
    if (citasRaw.length > 0) {
      const medicosMap = await buildMedicosMap(uniqueIds(citasRaw, "medico_id"));
      citas = citasRaw.map((c: any) => ({
        ...c,
        usuarios_clinica: c.medico_id ? (medicosMap[String(c.medico_id)] ?? null) : null,
      }));
    }

    // 3. Historiales generales (excluye ginecología)
    const { data: historialesRawData, error: histError } = await supabase
      .from("historiales_clinicos")
      .select(
        "id, especialidad, created_at, motivo_consulta, " +
        "diagnostico_principal, diagnosticos_secundarios, " +
        "plan_tratamiento, medicamentos, recomendaciones, estudios_solicitados, " +
        "peso, altura, presion_sistolica, presion_diastolica, " +
        "frecuencia_cardiaca, frecuencia_respiratoria, temperatura, saturacion_oxigeno, " +
        "examen_fisico_general, sintomas_principales, antecedentes_enfermedad_actual, " +
        "medico_id"
      )
      .eq("paciente_id", pacienteId)
      .eq("estado", "activo")
      .neq("especialidad", "ginecologia")
      .order("created_at", { ascending: false })
      .limit(50);

    if (histError) console.error("Error historiales:", histError.message);
    const historialesRaw = (historialesRawData ?? []) as any[];

    let historiales: any[] = [];
    if (historialesRaw.length > 0) {
      const medicosMap = await buildMedicosMap(uniqueIds(historialesRaw, "medico_id"));
      historiales = historialesRaw.map((h: any) => ({
        ...h,
        usuarios_clinica: h.medico_id ? (medicosMap[String(h.medico_id)] ?? null) : null,
      }));
    }

    // 4. Fichas ginecológicas
    const { data: gineHistRawData, error: gineError } = await supabase
      .from("historiales_clinicos")
      .select(
        "id, created_at, motivo_consulta, diagnostico_principal, plan_tratamiento, " +
        "medicamentos, recomendaciones, peso, presion_sistolica, presion_diastolica, medico_id"
      )
      .eq("paciente_id", pacienteId)
      .eq("especialidad", "ginecologia")
      .eq("estado", "activo")
      .order("created_at", { ascending: false })
      .limit(20);

    if (gineError) console.error("Error fichas ginecología:", gineError.message);
    const gineHistRaw = (gineHistRawData ?? []) as any[];

    let fichas_ginecologicas: any[] = [];
    if (gineHistRaw.length > 0) {
      const histIds: string[] = gineHistRaw.map((h: any) => String(h.id));
      const medicosMap = await buildMedicosMap(uniqueIds(gineHistRaw, "medico_id"));

      // Datos de la tabla historiales_ginecologia
      const { data: gineDataRaw } = await supabase
        .from("historiales_ginecologia")
        .select(
          "id, historial_id, embarazo, tbc_pulmonar, hipertension, gemelares, " +
          "diabetes, hipertension_cronica, cirugia_pelvico_uterina, infertilidad, " +
          "antecedentes_familiares, ta_inicial, vdrl, hb, fum, fpp, " +
          "dudas, antitetanicas, controles_prenatales"
        )
        .in("historial_id", histIds);
      const gineData = (gineDataRaw ?? []) as any[];

      const gineMap: Record<string, any[]> = {};
      for (const g of gineData) {
          const key = String(g.historial_id);
          if (!gineMap[key]) gineMap[key] = [];
          gineMap[key].push(g);
      }

      fichas_ginecologicas = gineHistRaw.map((h: any) => ({
        ...h,
        usuarios_clinica: h.medico_id ? (medicosMap[String(h.medico_id)] ?? null) : null,
        historiales_ginecologia: gineMap[String(h.id)] ?? [],
      }));
    }

    return NextResponse.json({ paciente, citas, historiales, fichas_ginecologicas });
  } catch (error: unknown) {
    console.error("Error en paciente-portal:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
