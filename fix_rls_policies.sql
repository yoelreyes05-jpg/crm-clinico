-- ============================================================
-- FIX RLS - CRM Clínico
-- La seguridad está manejada por JWT en el API de Next.js,
-- no por el auth nativo de Supabase. Desactivamos RLS en las
-- tablas del CRM y usamos la service role key en el backend.
-- ============================================================

-- Desactivar RLS en todas las tablas del CRM
ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_clinica DISABLE ROW LEVEL SECURITY;
ALTER TABLE citas DISABLE ROW LEVEL SECURITY;
ALTER TABLE historiales_clinicos DISABLE ROW LEVEL SECURITY;

-- Si tienes estas tablas también:
ALTER TABLE IF EXISTS notificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recetas_medicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS estudios_diagnosticos DISABLE ROW LEVEL SECURITY;

-- Confirmar que quedaron desactivadas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
