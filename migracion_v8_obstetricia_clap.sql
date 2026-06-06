-- ============================================================
-- SÓLIDO CRM CLÍNICO — Migración v8
-- Módulo Obstetricia — Estándar CLAP/SMR (OPS/OMS)
-- Amplía historiales_ginecologia con campos perinatales completos
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

ALTER TABLE historiales_ginecologia

  -- ──────────────────────────────────────
  -- FÓRMULA OBSTÉTRICA (G P A C V)
  -- ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS formula_g                  SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS formula_p                  SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS formula_a                  SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS formula_c                  SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS formula_v                  SMALLINT DEFAULT 0,

  -- ──────────────────────────────────────
  -- HISTORIAL OBSTÉTRICO PREVIO
  -- ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS partos_vaginales           SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_parto_fecha         DATE,
  ADD COLUMN IF NOT EXISTS ultimo_rn_peso_gr          INTEGER,
  -- Factores de riesgo del historial previo
  ADD COLUMN IF NOT EXISTS antec_rn_macrosomico       BOOLEAN DEFAULT FALSE,   -- > 4000 g
  ADD COLUMN IF NOT EXISTS antec_rn_bajo_peso         BOOLEAN DEFAULT FALSE,   -- < 2500 g
  ADD COLUMN IF NOT EXISTS antec_mortalidad_perinatal BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS antec_preeclampsia         BOOLEAN DEFAULT FALSE,

  -- ──────────────────────────────────────
  -- DATOS DEL EMBARAZO ACTUAL
  -- ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS tipo_embarazo              VARCHAR(20) DEFAULT 'unico',
  -- Valores: unico, gemelar, triple
  ADD COLUMN IF NOT EXISTS planificado                BOOLEAN,
  ADD COLUMN IF NOT EXISTS edad_gestacional_ingreso   VARCHAR(20),
  -- EG calculada en la primera consulta (ej: "10 sem 3 días")

  -- ──────────────────────────────────────
  -- EXÁMENES DE LABORATORIO INICIALES
  -- (Estándar CLAP/SMR OPS-OMS)
  -- ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS grupo_rh                   VARCHAR(10),   -- O+, A-, etc.
  ADD COLUMN IF NOT EXISTS hiv                        VARCHAR(50),   -- NR, R, Pendiente
  ADD COLUMN IF NOT EXISTS glucemia_ayunas            VARCHAR(20),   -- mg/dL
  ADD COLUMN IF NOT EXISTS hepatitis_b                VARCHAR(50),   -- Negativo / Positivo / Pendiente
  ADD COLUMN IF NOT EXISTS toxoplasma                 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS urocultivo                 VARCHAR(100),  -- Negativo / Positivo + germen
  ADD COLUMN IF NOT EXISTS estreptococo_b             VARCHAR(50),   -- SGB 35-37 semanas
  ADD COLUMN IF NOT EXISTS hematocrito                VARCHAR(20),   -- % Hematocrito
  ADD COLUMN IF NOT EXISTS plaquetas                  VARCHAR(20),   -- 10³/µL

  -- ──────────────────────────────────────
  -- DATOS DEL PARTO
  -- ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS parto_fecha                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parto_tipo                 VARCHAR(30),
  -- Valores: vaginal_espontaneo, vaginal_instrumentado, cesarea_electiva, cesarea_urgente
  ADD COLUMN IF NOT EXISTS parto_inicio               VARCHAR(20),
  -- Valores: espontaneo, inducido, cesarea_programada
  ADD COLUMN IF NOT EXISTS parto_semanas              SMALLINT,
  -- Semanas de gestación al momento del parto
  ADD COLUMN IF NOT EXISTS ruptura_membranas          VARCHAR(50),
  -- ej: "Espontánea — 14:20 h, líquido claro"
  ADD COLUMN IF NOT EXISTS parto_duracion_horas       DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS anestesia                  VARCHAR(50),
  -- Valores: ninguna, local, regional_epidural, regional_espinal, general
  ADD COLUMN IF NOT EXISTS episiotomia                BOOLEAN,
  ADD COLUMN IF NOT EXISTS desgarro                   VARCHAR(50),
  -- Valores: ninguno, grado_1, grado_2, grado_3, grado_4
  ADD COLUMN IF NOT EXISTS hemorragia_postparto       BOOLEAN,
  ADD COLUMN IF NOT EXISTS parto_indicacion_cesarea   TEXT,
  -- Justificación si fue cesárea
  ADD COLUMN IF NOT EXISTS parto_complicaciones       TEXT,

  -- ──────────────────────────────────────
  -- DATOS DEL RECIÉN NACIDO
  -- ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS rn_sexo                    VARCHAR(1),    -- M / F
  ADD COLUMN IF NOT EXISTS rn_peso_gr                 INTEGER,       -- Peso en gramos
  ADD COLUMN IF NOT EXISTS rn_talla_cm                DECIMAL(4,1),  -- Talla en cm
  ADD COLUMN IF NOT EXISTS rn_perimetro_cefalico      DECIMAL(4,1),  -- Perímetro cefálico cm
  ADD COLUMN IF NOT EXISTS rn_apgar_1                 SMALLINT,      -- Apgar al minuto (0-10)
  ADD COLUMN IF NOT EXISTS rn_apgar_5                 SMALLINT,      -- Apgar a los 5 min (0-10)
  ADD COLUMN IF NOT EXISTS rn_reanimacion             BOOLEAN,
  ADD COLUMN IF NOT EXISTS rn_malformaciones          TEXT,
  ADD COLUMN IF NOT EXISTS rn_lactancia_materna       BOOLEAN,
  ADD COLUMN IF NOT EXISTS rn_ingreso_uci             BOOLEAN,
  ADD COLUMN IF NOT EXISTS rn_observaciones           TEXT,

  -- ──────────────────────────────────────
  -- PUERPERIO
  -- ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS puerperio_estado           VARCHAR(30),
  -- Valores: normal, complicado
  ADD COLUMN IF NOT EXISTS puerperio_complicaciones   TEXT,
  ADD COLUMN IF NOT EXISTS puerperio_anticonceptivo   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS alta_fecha                 DATE,
  ADD COLUMN IF NOT EXISTS alta_observaciones         TEXT;

-- ──────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gine_tipo_embarazo
  ON historiales_ginecologia(tipo_embarazo);

CREATE INDEX IF NOT EXISTS idx_gine_parto_fecha
  ON historiales_ginecologia(parto_fecha);

-- ──────────────────────────────────────
-- NOTA SOBRE controles_prenatales JSONB
-- ──────────────────────────────────────
-- La columna controles_prenatales ya existe como JSONB.
-- El nuevo esquema extendido por control es:
-- {
--   "id":                  number,
--   "fecha":               "YYYY-MM-DD",
--   "edad_gestacional":    "10 sem 3 días",
--   "peso":                "62.5",
--   "ta":                  "120/80",
--   "altura_uterina":      "10",
--   "presentacion":        "cefalica|podalica|transversa|indefinida",
--   "fcc_mov":             "160/+",       -- frecuencia cardíaca fetal / movimientos
--   "edema":               false,
--   "varice":              false,
--   "proteinuria":         "negativo|trazas|1+|2+|3+",
--   "hemoglobina_ctrl":    "12.5",        -- Hb en este control
--   "glucemia_ctrl":       "95",          -- glucemia en este control
--   "proximo_control":     "YYYY-MM-DD",
--   "observaciones":       "texto libre"
-- }
-- Los controles existentes con el esquema viejo siguen siendo válidos
-- (campos nuevos son opcionales/undefined).
-- ──────────────────────────────────────

-- Verificar columnas actuales
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'historiales_ginecologia'
ORDER BY ordinal_position;
