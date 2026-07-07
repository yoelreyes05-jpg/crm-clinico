-- ============================================================
-- MIGRACIÓN: SECRETARIAS ASIGNADAS POR MÉDICO
-- ============================================================
-- Creado: 2026-07-06
-- Ejecutar en el SQL Editor de Supabase
--
-- Cada secretaria puede estar asignada a UN médico (asignado_a).
-- - Secretaria con asignado_a → solo ve los datos de ese médico
--   (citas, contabilidad, facturas, pacientes).
-- - Secretaria sin asignar (creada por el admin para toda la
--   clínica) → ve los datos de todos.
-- ============================================================

ALTER TABLE usuarios_clinica
  ADD COLUMN IF NOT EXISTS asignado_a UUID REFERENCES usuarios_clinica(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_asignado ON usuarios_clinica(asignado_a);
