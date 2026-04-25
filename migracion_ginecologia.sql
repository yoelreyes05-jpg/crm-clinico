-- ============================================================
-- MIGRACIÓN: Extender historiales_ginecologia con ficha prenatal
-- Corre en Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE historiales_ginecologia
  -- Antecedentes patológicos
  ADD COLUMN IF NOT EXISTS embarazo               BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tbc_pulmonar           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hipertension           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gemelares              BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS antecedentes_familiares TEXT,
  ADD COLUMN IF NOT EXISTS diabetes               BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hipertension_cronica   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cirugia_pelvico_uterina BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS infertilidad           BOOLEAN DEFAULT false,

  -- Exámenes iniciales
  ADD COLUMN IF NOT EXISTS ta_inicial             VARCHAR(20),
  ADD COLUMN IF NOT EXISTS vdrl                   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS hb                     VARCHAR(20),

  -- Fechas obstétricas
  ADD COLUMN IF NOT EXISTS fum                    DATE,
  ADD COLUMN IF NOT EXISTS fpp                    DATE,

  -- Otros
  ADD COLUMN IF NOT EXISTS dudas                  TEXT,
  ADD COLUMN IF NOT EXISTS antitetanicas          VARCHAR(100),

  -- Tabla de controles prenatales (hasta 12 controles)
  -- Estructura JSON por control:
  -- { fecha, edad_gestacional, peso, ta, altura_uterina, fcc_mov, edema, varice }
  ADD COLUMN IF NOT EXISTS controles_prenatales   JSONB DEFAULT '[]'::jsonb;

-- Índice para búsqueda por FUM y FPP
CREATE INDEX IF NOT EXISTS idx_gine_fum ON historiales_ginecologia(fum);
CREATE INDEX IF NOT EXISTS idx_gine_fpp ON historiales_ginecologia(fpp);

-- Verificar columnas agregadas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'historiales_ginecologia'
ORDER BY ordinal_position;
