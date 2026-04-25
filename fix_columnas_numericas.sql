-- ============================================================
-- EJECUTAR EN: Supabase → SQL Editor
-- PROPÓSITO: Ampliar columnas numéricas para evitar overflow
-- ============================================================

-- Tabla historiales_clinicos
ALTER TABLE historiales_clinicos
  ALTER COLUMN peso TYPE NUMERIC(7,2),
  ALTER COLUMN altura TYPE NUMERIC(6,2),
  ALTER COLUMN temperatura TYPE NUMERIC(5,2),
  ALTER COLUMN presion_sistolica TYPE INTEGER,
  ALTER COLUMN presion_diastolica TYPE INTEGER,
  ALTER COLUMN frecuencia_cardiaca TYPE INTEGER,
  ALTER COLUMN frecuencia_respiratoria TYPE INTEGER,
  ALTER COLUMN saturacion_oxigeno TYPE INTEGER;

-- Tabla historiales_ginecologicos (si tiene columnas numéricas)
ALTER TABLE historiales_ginecologicos
  ALTER COLUMN peso TYPE NUMERIC(7,2);

-- Verificar que se aplicó correctamente
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'historiales_clinicos'
  AND column_name IN ('peso','altura','temperatura','presion_sistolica','presion_diastolica');
