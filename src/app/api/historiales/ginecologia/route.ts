
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
      // Antecedentes patológicos — clásicos
      embarazo, tbc_pulmonar, hipertension, gemelares,
      diabetes, hipertension_cronica, cirugia_pelvico_uterina, infertilidad,
      antecedentes_familiares,
      // Antecedentes patológicos — ampliados (v8c)
      ant_cardiopatia, ant_asma, ant_enfermedad_renal, ant_hipotiroidismo,
      ant_epilepsia, ant_lupus, ant_depresion, ant_anemia_cronica,
      ant_trombofilia, ant_obesidad,
      ant_vih_sida, ant_hepatitis_b_prev, ant_sifilis_previa, ant_its,
      ant_mioma_miomectomia, ant_conizacion, ant_endometriosis, ant_sop, ant_cerclaje_previo,
      ant_parto_pretermino, ant_cesarea_previa, ant_rciu, ant_perdida_fetal,
      ant_hemorragia_posparto, ant_diabetes_gestacional, ant_incomp_cervical,
      ant_tabaquismo, ant_alcoholismo, ant_drogas,
      antecedentes_personales_otros,
      // Fórmula obstétrica
      formula_g, formula_p, formula_a, formula_c, formula_v,
      // Historial obstétrico previo
      partos_vaginales, ultimo_parto_fecha, ultimo_rn_peso_gr,
      antec_rn_macrosomico, antec_rn_bajo_peso,
      antec_mortalidad_perinatal, antec_preeclampsia,
      // Datos del embarazo actual
      tipo_embarazo, planificado, edad_gestacional_ingreso,
      // Exámenes iniciales clásicos
      ta_inicial, vdrl, hb, tipo_sangre, fum, fpp, antitetanicas, dudas,
      // Exámenes CLAP adicionales
      grupo_rh, hiv, glucemia_ayunas, hepatitis_b, toxoplasma,
      urocultivo, estreptococo_b, hematocrito, plaquetas,
      // Controles prenatales (JSONB)
      controles_prenatales,
      // Datos del parto
      parto_fecha, parto_tipo, parto_inicio, parto_semanas,
      ruptura_membranas, parto_duracion_horas, anestesia,
      episiotomia, desgarro, hemorragia_postparto,
      parto_indicacion_cesarea, parto_complicaciones,
      // Datos del recién nacido
      rn_sexo, rn_peso_gr, rn_talla_cm, rn_perimetro_cefalico,
      rn_apgar_1, rn_apgar_5, rn_reanimacion, rn_malformaciones,
      rn_lactancia_materna, rn_ingreso_uci, rn_observaciones,
      // Puerperio
      puerperio_estado, puerperio_complicaciones, puerperio_anticonceptivo,
      alta_fecha, alta_observaciones,
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
        motivo_consulta: motivo_consulta || "Consulta ginecológica obstétrica",
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

    // Helper para valores vacíos → null
    const n = (v: any) => (v === "" || v === undefined ? null : v);
    const nb = (v: any) => (v === undefined ? false : v ?? false);
    const ni = (v: any) => (v === "" || v === undefined || v === null ? null : parseInt(v));
    const nf = (v: any) => (v === "" || v === undefined || v === null ? null : parseFloat(v));

    // 2. Crear registro especializado en historiales_ginecologia
    const { data: histGine, error: errGine } = await supabase
      .from("historiales_ginecologia")
      .insert([{
        historial_id: historialBase.id,
        // Antecedentes — clásicos
        embarazo: nb(embarazo),
        tbc_pulmonar: nb(tbc_pulmonar),
        hipertension: nb(hipertension),
        gemelares: nb(gemelares),
        diabetes: nb(diabetes),
        hipertension_cronica: nb(hipertension_cronica),
        cirugia_pelvico_uterina: nb(cirugia_pelvico_uterina),
        infertilidad: nb(infertilidad),
        antecedentes_familiares: n(antecedentes_familiares),
        // Antecedentes — ampliados (v8c)
        ant_cardiopatia: nb(ant_cardiopatia),
        ant_asma: nb(ant_asma),
        ant_enfermedad_renal: nb(ant_enfermedad_renal),
        ant_hipotiroidismo: nb(ant_hipotiroidismo),
        ant_epilepsia: nb(ant_epilepsia),
        ant_lupus: nb(ant_lupus),
        ant_depresion: nb(ant_depresion),
        ant_anemia_cronica: nb(ant_anemia_cronica),
        ant_trombofilia: nb(ant_trombofilia),
        ant_obesidad: nb(ant_obesidad),
        ant_vih_sida: nb(ant_vih_sida),
        ant_hepatitis_b_prev: nb(ant_hepatitis_b_prev),
        ant_sifilis_previa: nb(ant_sifilis_previa),
        ant_its: nb(ant_its),
        ant_mioma_miomectomia: nb(ant_mioma_miomectomia),
        ant_conizacion: nb(ant_conizacion),
        ant_endometriosis: nb(ant_endometriosis),
        ant_sop: nb(ant_sop),
        ant_cerclaje_previo: nb(ant_cerclaje_previo),
        ant_parto_pretermino: nb(ant_parto_pretermino),
        ant_cesarea_previa: nb(ant_cesarea_previa),
        ant_rciu: nb(ant_rciu),
        ant_perdida_fetal: nb(ant_perdida_fetal),
        ant_hemorragia_posparto: nb(ant_hemorragia_posparto),
        ant_diabetes_gestacional: nb(ant_diabetes_gestacional),
        ant_incomp_cervical: nb(ant_incomp_cervical),
        ant_tabaquismo: nb(ant_tabaquismo),
        ant_alcoholismo: nb(ant_alcoholismo),
        ant_drogas: nb(ant_drogas),
        antecedentes_personales_otros: n(antecedentes_personales_otros),
        // Fórmula obstétrica
        formula_g: ni(formula_g),
        formula_p: ni(formula_p),
        formula_a: ni(formula_a),
        formula_c: ni(formula_c),
        formula_v: ni(formula_v),
        // Historial obstétrico previo
        partos_vaginales: ni(partos_vaginales) ?? 0,
        ultimo_parto_fecha: n(ultimo_parto_fecha),
        ultimo_rn_peso_gr: ni(ultimo_rn_peso_gr),
        antec_rn_macrosomico: nb(antec_rn_macrosomico),
        antec_rn_bajo_peso: nb(antec_rn_bajo_peso),
        antec_mortalidad_perinatal: nb(antec_mortalidad_perinatal),
        antec_preeclampsia: nb(antec_preeclampsia),
        // Datos del embarazo actual
        tipo_embarazo: n(tipo_embarazo) || "unico",
        planificado: planificado ?? null,
        edad_gestacional_ingreso: n(edad_gestacional_ingreso),
        // Exámenes clásicos
        ta_inicial: n(ta_inicial),
        vdrl: n(vdrl),
        hb: n(hb),
        fum: n(fum),
        fpp: n(fpp),
        dudas: n(dudas) || n(observaciones),
        antitetanicas: n(antitetanicas),
        // Exámenes CLAP adicionales
        grupo_rh: n(grupo_rh) || n(tipo_sangre),
        hiv: n(hiv),
        glucemia_ayunas: n(glucemia_ayunas),
        hepatitis_b: n(hepatitis_b),
        toxoplasma: n(toxoplasma),
        urocultivo: n(urocultivo),
        estreptococo_b: n(estreptococo_b),
        hematocrito: n(hematocrito),
        plaquetas: n(plaquetas),
        // Controles prenatales (JSONB)
        controles_prenatales: controles_prenatales || [],
        // Datos del parto
        parto_fecha: n(parto_fecha),
        parto_tipo: n(parto_tipo),
        parto_inicio: n(parto_inicio),
        parto_semanas: ni(parto_semanas),
        ruptura_membranas: n(ruptura_membranas),
        parto_duracion_horas: nf(parto_duracion_horas),
        anestesia: n(anestesia),
        episiotomia: planificado !== undefined ? nb(episiotomia) : null,
        desgarro: n(desgarro),
        hemorragia_postparto: nb(hemorragia_postparto),
        parto_indicacion_cesarea: n(parto_indicacion_cesarea),
        parto_complicaciones: n(parto_complicaciones),
        // Recién nacido
        rn_sexo: n(rn_sexo),
        rn_peso_gr: ni(rn_peso_gr),
        rn_talla_cm: nf(rn_talla_cm),
        rn_perimetro_cefalico: nf(rn_perimetro_cefalico),
        rn_apgar_1: ni(rn_apgar_1),
        rn_apgar_5: ni(rn_apgar_5),
        rn_reanimacion: nb(rn_reanimacion),
        rn_malformaciones: n(rn_malformaciones),
        rn_lactancia_materna: nb(rn_lactancia_materna),
        rn_ingreso_uci: nb(rn_ingreso_uci),
        rn_observaciones: n(rn_observaciones),
        // Puerperio
        puerperio_estado: n(puerperio_estado),
        puerperio_complicaciones: n(puerperio_complicaciones),
        puerperio_anticonceptivo: n(puerperio_anticonceptivo),
        alta_fecha: n(alta_fecha),
        alta_observaciones: n(alta_observaciones),
        // Campos legacy (compatibilidad)
        embrazada: nb(embarazo),
        fecha_ultimo_periodo: n(fum),
      }])
      .select("id")
      .single();

    if (errGine) {
      console.error("Error creando historial ginecología:", errGine.message);
      await supabase.from("historiales_clinicos").delete().eq("id", historialBase.id);
      return NextResponse.json({ error: `Error al guardar ficha: ${errGine.message}` }, { status: 500 });
    }

    return NextResponse.json({
      data: { historial_id: historialBase.id, ginecologia_id: histGine.id },
      message: "Ficha ginecológica obstétrica guardada exitosamente",
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
          id,
          embarazo, tbc_pulmonar, hipertension, gemelares,
          diabetes, hipertension_cronica, cirugia_pelvico_uterina, infertilidad,
          antecedentes_familiares,
          ant_cardiopatia, ant_asma, ant_enfermedad_renal, ant_hipotiroidismo,
          ant_epilepsia, ant_lupus, ant_depresion, ant_anemia_cronica,
          ant_trombofilia, ant_obesidad,
          ant_vih_sida, ant_hepatitis_b_prev, ant_sifilis_previa, ant_its,
          ant_mioma_miomectomia, ant_conizacion, ant_endometriosis, ant_sop, ant_cerclaje_previo,
          ant_parto_pretermino, ant_cesarea_previa, ant_rciu, ant_perdida_fetal,
          ant_hemorragia_posparto, ant_diabetes_gestacional, ant_incomp_cervical,
          ant_tabaquismo, ant_alcoholismo, ant_drogas,
          antecedentes_personales_otros,
          formula_g, formula_p, formula_a, formula_c, formula_v,
          partos_vaginales, ultimo_parto_fecha, ultimo_rn_peso_gr,
          antec_rn_macrosomico, antec_rn_bajo_peso,
          antec_mortalidad_perinatal, antec_preeclampsia,
          tipo_embarazo, planificado, edad_gestacional_ingreso,
          ta_inicial, vdrl, hb, fum, fpp, dudas, antitetanicas,
          grupo_rh, hiv, glucemia_ayunas, hepatitis_b, toxoplasma,
          urocultivo, estreptococo_b, hematocrito, plaquetas,
          controles_prenatales,
          parto_fecha, parto_tipo, parto_inicio, parto_semanas,
          ruptura_membranas, parto_duracion_horas, anestesia,
          episiotomia, desgarro, hemorragia_postparto,
          parto_indicacion_cesarea, parto_complicaciones,
          rn_sexo, rn_peso_gr, rn_talla_cm, rn_perimetro_cefalico,
          rn_apgar_1, rn_apgar_5, rn_reanimacion, rn_malformaciones,
          rn_lactancia_materna, rn_ingreso_uci, rn_observaciones,
          puerperio_estado, puerperio_complicaciones, puerperio_anticonceptivo,
          alta_fecha, alta_observaciones
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
