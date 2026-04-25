-- ============================================================
-- FIX COMPLETO: Unificar médicos en usuarios_clinica
-- Corre este SQL en Supabase Dashboard → SQL Editor
-- ============================================================

-- PASO 1: Quitar el FK incorrecto en pacientes (apuntaba a tabla 'medicos')
ALTER TABLE pacientes
  DROP CONSTRAINT IF EXISTS fk_pacientes_medico;

-- Si tiene otro nombre automático, quitar también:
ALTER TABLE pacientes
  DROP CONSTRAINT IF EXISTS pacientes_medico_id_fkey;

-- PASO 2: Volver a crear el FK apuntando a usuarios_clinica (correcto)
ALTER TABLE pacientes
  ADD CONSTRAINT fk_pacientes_medico_correcto
  FOREIGN KEY (medico_id)
  REFERENCES usuarios_clinica(id)
  ON DELETE SET NULL;

-- PASO 3: Corregir el FK duplicado/incorrecto en historiales_clinicos
ALTER TABLE historiales_clinicos
  DROP CONSTRAINT IF EXISTS fk_historiales_medico;

ALTER TABLE historiales_clinicos
  DROP CONSTRAINT IF EXISTS historiales_clinicos_medico_id_fkey;

-- Asegurarse de que apunte a usuarios_clinica
-- (puede que ya exista uno correcto; el IF NOT EXISTS evita errores)

-- PASO 4: Migrar médicos de tabla 'medicos' a 'usuarios_clinica'
-- (solo si aún no existen allá — evita duplicados)
INSERT INTO usuarios_clinica (
  email,
  password_hash,
  nombre_completo,
  rol,
  especialidad,
  licencia_medica,
  telefono,
  estado,
  created_at
)
SELECT
  m.email,
  m.contrasena,          -- la contraseña ya estaba hasheada con bcrypt
  m.nombre_completo,
  'medico',
  m.especialidad,
  m.licencia_medica,
  m.telefono,
  m.estado,
  m.created_at
FROM medicos m
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_clinica uc WHERE uc.email = m.email
);

-- PASO 5: Verificar que todo quedó bien
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name  AS referencia_tabla,
  ccu.column_name AS referencia_columna
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('pacientes', 'historiales_clinicos')
ORDER BY tc.table_name, kcu.column_name;
