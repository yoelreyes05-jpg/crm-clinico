-- ============================================================
-- FIX COMPLETO: Numeric overflow + columnas faltantes + FK
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Corregir numeric overflow en historiales_clinicos
--    NUMERIC(4,2) = max 99.99 → overflow con altura en cm o peso > 999
ALTER TABLE historiales_clinicos
  ALTER COLUMN peso            TYPE NUMERIC(7,2),  -- hasta 99999.99 kg
  ALTER COLUMN altura          TYPE NUMERIC(7,2),  -- funciona tanto en m (1.75) como cm (175)
  ALTER COLUMN imc             TYPE NUMERIC(7,2),
  ALTER COLUMN temperatura     TYPE NUMERIC(6,2),
  ALTER COLUMN saturacion_oxigeno TYPE NUMERIC(6,2);

-- 2. Agregar columnas que faltan (las que el formulario historial-nuevo envía)
ALTER TABLE historiales_clinicos
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activo';

-- 3. Corregir FK de historiales_clinicos → usuarios_clinica (no medicos)
ALTER TABLE historiales_clinicos
  DROP CONSTRAINT IF EXISTS fk_historiales_medico,
  DROP CONSTRAINT IF EXISTS historiales_clinicos_medico_id_fkey;

-- Nota: el schema ya tiene la FK correcta a usuarios_clinica
-- Solo recrear si fue alterada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'historiales_clinicos_medico_id_fkey'
      AND conrelid = 'historiales_clinicos'::regclass
  ) THEN
    ALTER TABLE historiales_clinicos
      ADD CONSTRAINT historiales_clinicos_medico_id_fkey
      FOREIGN KEY (medico_id) REFERENCES usuarios_clinica(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 4. Verificar columnas numéricas corregidas
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'historiales_clinicos'
  AND data_type IN ('numeric', 'integer')
ORDER BY ordinal_position;
