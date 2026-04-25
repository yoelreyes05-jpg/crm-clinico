-- ============================================================
-- MIGRACIÓN REQUERIDA: Agregar medico_id a tabla pacientes
-- Corre esto en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columna medico_id
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS medico_id UUID REFERENCES usuarios_clinica(id) ON DELETE SET NULL;

-- 2. Índice para filtrar rápidamente por médico
CREATE INDEX IF NOT EXISTS idx_pacientes_medico_id ON pacientes(medico_id);

-- 3. Verificar resultado
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pacientes'
  AND column_name = 'medico_id';
