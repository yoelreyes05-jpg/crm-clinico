-- ============================================================
-- DIAGNÓSTICO — ejecutar en el SQL Editor de Supabase
-- y pegar el resultado completo en el chat
-- ============================================================

-- 1. ¿Qué tablas del HIS/ERP existen ya?
SELECT table_name,
       (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
        FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'facturas', 'validaciones_cobertura', 'seguros_pacientes', 'aseguradoras',
    'movimientos_financieros', 'reclamaciones_ars', 'permisos_especialidades',
    'planes_ars', 'tarifarios_ars', 'cuentas_contables', 'asientos_contables',
    'partidas_contables', 'auditoria', 'citas', 'pacientes'
  )
ORDER BY table_name;
