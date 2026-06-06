-- ============================================================
-- SÓLIDO CRM CLÍNICO — Migración v8c
-- Antecedentes Patológicos Ampliados
-- Basado en: Protocolos MSP República Dominicana (2016),
--            CLAP/SMR OPS-OMS, Manual MSD (edición española)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

ALTER TABLE historiales_ginecologia

  -- ──────────────────────────────────────────────
  -- CATEGORÍA 1: ENFERMEDADES CRÓNICAS
  -- ──────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS ant_cardiopatia           BOOLEAN DEFAULT FALSE,
  -- Cardiopatía / Enfermedad cardíaca (congénita o adquirida)
  ADD COLUMN IF NOT EXISTS ant_asma                  BOOLEAN DEFAULT FALSE,
  -- Asma bronquial / EPOC
  ADD COLUMN IF NOT EXISTS ant_enfermedad_renal      BOOLEAN DEFAULT FALSE,
  -- Nefropatía / Insuficiencia renal / Enfermedad renal crónica
  ADD COLUMN IF NOT EXISTS ant_hipotiroidismo        BOOLEAN DEFAULT FALSE,
  -- Hipotiroidismo / Hipertiroidismo / Enfermedad tiroidea
  ADD COLUMN IF NOT EXISTS ant_epilepsia             BOOLEAN DEFAULT FALSE,
  -- Epilepsia / Trastorno convulsivo
  ADD COLUMN IF NOT EXISTS ant_lupus                 BOOLEAN DEFAULT FALSE,
  -- Lupus eritematoso sistémico (LES) / Enfermedad autoinmune
  ADD COLUMN IF NOT EXISTS ant_depresion             BOOLEAN DEFAULT FALSE,
  -- Depresión / Ansiedad / Trastorno de salud mental
  ADD COLUMN IF NOT EXISTS ant_anemia_cronica        BOOLEAN DEFAULT FALSE,
  -- Anemia crónica / Talasemia / Drepanocitosis
  ADD COLUMN IF NOT EXISTS ant_trombofilia           BOOLEAN DEFAULT FALSE,
  -- Trombofilia / Trastorno de coagulación / TVP previa
  ADD COLUMN IF NOT EXISTS ant_obesidad              BOOLEAN DEFAULT FALSE,
  -- Obesidad (IMC ≥ 30) o Sobrepeso significativo

  -- ──────────────────────────────────────────────
  -- CATEGORÍA 2: ANTECEDENTES INFECCIOSOS / ITS
  -- ──────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS ant_vih_sida              BOOLEAN DEFAULT FALSE,
  -- VIH / SIDA conocido previamente al embarazo actual
  ADD COLUMN IF NOT EXISTS ant_hepatitis_b_prev      BOOLEAN DEFAULT FALSE,
  -- Hepatitis B (antecedente previo, distinto del examen actual)
  ADD COLUMN IF NOT EXISTS ant_sifilis_previa        BOOLEAN DEFAULT FALSE,
  -- Sífilis tratada previamente
  ADD COLUMN IF NOT EXISTS ant_its                   BOOLEAN DEFAULT FALSE,
  -- Otras ITS previas (gonorrea, clamidia, herpes genital, VPH)

  -- ──────────────────────────────────────────────
  -- CATEGORÍA 3: ANTECEDENTES GINECOLÓGICOS
  -- ──────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS ant_mioma_miomectomia     BOOLEAN DEFAULT FALSE,
  -- Mioma uterino / Miomectomía previa
  ADD COLUMN IF NOT EXISTS ant_conizacion            BOOLEAN DEFAULT FALSE,
  -- Conización cervical / LEEP / Cirugía cervical
  ADD COLUMN IF NOT EXISTS ant_endometriosis         BOOLEAN DEFAULT FALSE,
  -- Endometriosis diagnosticada
  ADD COLUMN IF NOT EXISTS ant_sop                   BOOLEAN DEFAULT FALSE,
  -- Síndrome de ovario poliquístico (SOP)
  ADD COLUMN IF NOT EXISTS ant_cerclaje_previo       BOOLEAN DEFAULT FALSE,
  -- Cerclaje cervical en embarazo previo

  -- ──────────────────────────────────────────────
  -- CATEGORÍA 4: ANTECEDENTES OBSTÉTRICOS DE RIESGO
  -- ──────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS ant_parto_pretermino      BOOLEAN DEFAULT FALSE,
  -- Parto pretérmino previo (< 37 semanas)
  ADD COLUMN IF NOT EXISTS ant_cesarea_previa        BOOLEAN DEFAULT FALSE,
  -- Una o más cesáreas previas
  ADD COLUMN IF NOT EXISTS ant_rciu                  BOOLEAN DEFAULT FALSE,
  -- Restricción de crecimiento intrauterino (RCIU) previo
  ADD COLUMN IF NOT EXISTS ant_perdida_fetal         BOOLEAN DEFAULT FALSE,
  -- Pérdida fetal / Muerte fetal intrauterina previa
  ADD COLUMN IF NOT EXISTS ant_hemorragia_posparto   BOOLEAN DEFAULT FALSE,
  -- Hemorragia posparto en embarazo previo
  ADD COLUMN IF NOT EXISTS ant_diabetes_gestacional  BOOLEAN DEFAULT FALSE,
  -- Diabetes mellitus gestacional en embarazo previo
  ADD COLUMN IF NOT EXISTS ant_incomp_cervical       BOOLEAN DEFAULT FALSE,
  -- Incompetencia cervical / Abortos tardíos repetidos

  -- ──────────────────────────────────────────────
  -- CATEGORÍA 5: HÁBITOS Y FACTORES SOCIALES
  -- ──────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS ant_tabaquismo            BOOLEAN DEFAULT FALSE,
  -- Tabaquismo activo o en los 3 meses previos
  ADD COLUMN IF NOT EXISTS ant_alcoholismo           BOOLEAN DEFAULT FALSE,
  -- Consumo de alcohol (regular u ocasional frecuente)
  ADD COLUMN IF NOT EXISTS ant_drogas                BOOLEAN DEFAULT FALSE,
  -- Consumo de sustancias / Drogas ilícitas

  -- ──────────────────────────────────────────────
  -- TEXTO LIBRE ADICIONAL
  -- ──────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS antecedentes_personales_otros TEXT;
  -- Otros antecedentes personales relevantes no listados arriba

-- ──────────────────────────────────────
-- ÍNDICE PARA CONSULTAS DE RIESGO
-- ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gine_ant_riesgo_cardio
  ON historiales_ginecologia(ant_cardiopatia)
  WHERE ant_cardiopatia = TRUE;

CREATE INDEX IF NOT EXISTS idx_gine_ant_riesgo_vih
  ON historiales_ginecologia(ant_vih_sida)
  WHERE ant_vih_sida = TRUE;

-- ──────────────────────────────────────
-- VERIFICAR COLUMNAS NUEVAS
-- ──────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'historiales_ginecologia'
  AND column_name LIKE 'ant_%'
ORDER BY ordinal_position;
