-- ========================================
-- FIX PARA POLÍTICAS DE ADMIN EN SUPABASE
-- ========================================
-- Este script SOLO agrega/actualiza las políticas RLS
-- para que los administradores tengan acceso total
--
-- NOTA: Si ya corriste supabase_setup.sql completo,
-- este archivo NO es necesario. Solo úsalo si necesitas
-- agregar permisos de admin después del hecho.
-- ========================================

-- 1. POLÍTICA DE ADMIN PARA UROLOGÍA
CREATE POLICY "Admin acceso total Urologia" ON public.clinico_pacientes_urologia
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Historias Urologia Admin" ON public.clinico_historias_urologia
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

-- 2. POLÍTICA DE ADMIN PARA GINECOLOGÍA
CREATE POLICY "Admin acceso total Ginecologia" ON public.clinico_pacientes_ginecologia
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Historias Ginecologia Admin" ON public.clinico_historias_ginecologia
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

-- 3. POLÍTICA DE ADMIN PARA PEDIATRÍA
CREATE POLICY "Admin acceso total Pediatria" ON public.clinico_pacientes_pediatria
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Historias Pediatria Admin" ON public.clinico_historias_pediatria
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

-- 4. POLÍTICA DE ADMIN PARA CARDIOLOGÍA
CREATE POLICY "Admin acceso total Cardiologia" ON public.clinico_pacientes_cardiologia
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Historias Cardiologia Admin" ON public.clinico_historias_cardiologia
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

-- 5. POLÍTICA DE ADMIN PARA CITAS
CREATE POLICY "Admin acceso total citas" ON public.clinico_citas
FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

-- ========================================
-- ✅ LISTO
-- Las políticas anteriores ahora permiten que los admins:
-- - Vean todos los pacientes de todos los módulos
-- - Editen y eliminen datos de pacientes
-- - Vean y gestionen todas las historias clínicas
-- - Vean y gestionen todas las citas
-- ========================================
