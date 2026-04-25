-- ============================================================
-- FIX: Corregir FK de historiales_clinicos.medico_id
-- Corre en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Eliminar constraint antigua (apunta a tabla "medicos" inexistente)
ALTER TABLE historiales_clinicos
  DROP CONSTRAINT IF EXISTS fk_historiales_medico;

ALTER TABLE historiales_clinicos
  DROP CONSTRAINT IF EXISTS historiales_clinicos_medico_id_fkey;

-- 2. Crear nueva FK apuntando a usuarios_clinica
ALTER TABLE historiales_clinicos
  ADD CONSTRAINT fk_historiales_medico
  FOREIGN KEY (medico_id)
  REFERENCES usuarios_clinica(id)
  ON DELETE SET NULL;

-- 3. Verificar
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'historiales_clinicos'::regclass
  AND conname LIKE '%medico%';
