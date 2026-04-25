-- ============================================================
-- DIAGNÓSTICO FK — Corre en Supabase SQL Editor
-- Esto muestra el estado real de la constraint y los médicos
-- ============================================================

-- 1. Ver qué constraint existe y a qué apunta
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name  AS tabla_referenciada,
  ccu.column_name AS columna_referenciada
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'pacientes';

-- 2. Ver los médicos que existen (sus IDs reales)
SELECT id, email, nombre_completo, rol
FROM usuarios_clinica
WHERE rol = 'medico';

-- 3. Ver si la columna medico_id existe en pacientes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pacientes'
  AND column_name = 'medico_id';
