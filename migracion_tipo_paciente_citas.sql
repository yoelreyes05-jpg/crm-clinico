-- ============================================================
-- MIGRACIÓN: TIPO DE PACIENTE EN CITAS
-- ============================================================
-- Creado: 2026-07-06
-- Ejecutar en el SQL Editor de Supabase
-- Reemplaza el uso de "duración" en el formulario de citas
-- por el tipo de paciente: asegurado (ARS) o privado.
-- ============================================================

ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS tipo_paciente VARCHAR(20) DEFAULT 'privado';

-- Validación de valores permitidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_tipo_paciente'
  ) THEN
    ALTER TABLE citas
      ADD CONSTRAINT valid_tipo_paciente CHECK (tipo_paciente IN ('asegurado', 'privado'));
  END IF;
END $$;
