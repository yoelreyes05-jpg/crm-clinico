-- =================================================================================
-- SCRIPT DE BASE DE DATOS PARA CRM CLÍNICO (SUPABASE)
-- =================================================================================

-- 1. TABLA MAESTRA DE USUARIOS Y ROLES (Vinculada a auth.users de Supabase)
CREATE TABLE public.clinico_usuarios (
  id uuid references auth.users not null primary key,
  email text not null,
  rol text not null check (rol in ('admin', 'medico', 'paciente')),
  modulo_asignado text, -- 'urologia', 'ginecologia', 'pediatria', 'cardiologia', o nulo si no es médico
  nombre_completo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas RLS para clinico_usuarios
ALTER TABLE public.clinico_usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.clinico_usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins pueden ver todos los perfiles" ON public.clinico_usuarios FOR SELECT USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins pueden insertar y actualizar perfiles" ON public.clinico_usuarios FOR ALL USING (
  (SELECT rol FROM public.clinico_usuarios WHERE id = auth.uid()) = 'admin'
);

-- =================================================================================
-- 2. TABLAS DE PACIENTES POR MÓDULO (AISLAMIENTO TOTAL)
-- =================================================================================

-- UROLOGÍA
CREATE TABLE public.clinico_pacientes_urologia (
  id uuid default uuid_generate_v4() primary key,
  auth_id uuid references public.clinico_usuarios(id), -- Solo si el paciente decide crear cuenta en la PWA
  identidad text,
  nombre text not null,
  fecha_nacimiento date,
  sexo text,
  telefono text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE TABLE public.clinico_historias_urologia (
  id uuid default uuid_generate_v4() primary key,
  paciente_id uuid references public.clinico_pacientes_urologia(id) on delete cascade not null,
  medico_id uuid references public.clinico_usuarios(id),
  motivo_consulta text,
  sintomas_stui jsonb, -- Guardar los checkboxes como JSON
  examen_fisico text,
  psa numeric,
  plan_tratamiento text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- GINECOLOGÍA
CREATE TABLE public.clinico_pacientes_ginecologia (
  id uuid default uuid_generate_v4() primary key,
  auth_id uuid references public.clinico_usuarios(id),
  identidad text,
  nombre text not null,
  fecha_nacimiento date,
  sexo text default 'F',
  telefono text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE TABLE public.clinico_historias_ginecologia (
  id uuid default uuid_generate_v4() primary key,
  paciente_id uuid references public.clinico_pacientes_ginecologia(id) on delete cascade not null,
  medico_id uuid references public.clinico_usuarios(id),
  motivo_consulta text,
  menarquia numeric,
  fur date,
  gestaciones int,
  partos int,
  abortos int,
  cesareas int,
  metodo_anticonceptivo text,
  examen_fisico text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PEDIATRÍA
CREATE TABLE public.clinico_pacientes_pediatria (
  id uuid default uuid_generate_v4() primary key,
  auth_id uuid references public.clinico_usuarios(id),
  identidad_tutor text,
  nombre text not null,
  fecha_nacimiento date,
  sexo text,
  telefono_tutor text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE TABLE public.clinico_historias_pediatria (
  id uuid default uuid_generate_v4() primary key,
  paciente_id uuid references public.clinico_pacientes_pediatria(id) on delete cascade not null,
  medico_id uuid references public.clinico_usuarios(id),
  motivo_consulta text,
  semanas_gestacion numeric,
  peso_nacer numeric,
  apgar text,
  inmunizaciones jsonb,
  desarrollo_psicomotor jsonb,
  peso_actual numeric,
  talla_actual numeric,
  observaciones text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CARDIOLOGÍA
CREATE TABLE public.clinico_pacientes_cardiologia (
  id uuid default uuid_generate_v4() primary key,
  auth_id uuid references public.clinico_usuarios(id),
  identidad text,
  nombre text not null,
  fecha_nacimiento date,
  sexo text,
  telefono text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE TABLE public.clinico_historias_cardiologia (
  id uuid default uuid_generate_v4() primary key,
  paciente_id uuid references public.clinico_pacientes_cardiologia(id) on delete cascade not null,
  medico_id uuid references public.clinico_usuarios(id),
  motivo_consulta text,
  factores_riesgo jsonb,
  presion_arterial text,
  frecuencia_cardiaca numeric,
  observaciones text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =================================================================================
-- 3. POLÍTICAS RLS PARA LAS TABLAS CLÍNICAS (AISLAMIENTO TOTAL)
-- =================================================================================

-- ACTIVAR RLS
ALTER TABLE public.clinico_pacientes_urologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinico_historias_urologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinico_pacientes_ginecologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinico_historias_ginecologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinico_pacientes_pediatria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinico_historias_pediatria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinico_pacientes_cardiologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinico_historias_cardiologia ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS UROLOGÍA (Solo el médico de urología o el propio paciente logueado en la PWA)
CREATE POLICY "Medicos Urologia y propio paciente" ON public.clinico_pacientes_urologia FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = 'urologia'
  OR auth_id = auth.uid()
);
CREATE POLICY "Historias Urologia" ON public.clinico_historias_urologia FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = 'urologia'
  OR (SELECT auth_id FROM public.clinico_pacientes_urologia WHERE id = paciente_id) = auth.uid()
);

-- POLÍTICAS GINECOLOGÍA
CREATE POLICY "Medicos Ginecologia y propio paciente" ON public.clinico_pacientes_ginecologia FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = 'ginecologia'
  OR auth_id = auth.uid()
);
CREATE POLICY "Historias Ginecologia" ON public.clinico_historias_ginecologia FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = 'ginecologia'
  OR (SELECT auth_id FROM public.clinico_pacientes_ginecologia WHERE id = paciente_id) = auth.uid()
);

-- POLÍTICAS PEDIATRÍA
CREATE POLICY "Medicos Pediatria y propio paciente" ON public.clinico_pacientes_pediatria FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = 'pediatria'
  OR auth_id = auth.uid()
);
CREATE POLICY "Historias Pediatria" ON public.clinico_historias_pediatria FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = 'pediatria'
  OR (SELECT auth_id FROM public.clinico_pacientes_pediatria WHERE id = paciente_id) = auth.uid()
);

-- POLÍTICAS CARDIOLOGÍA
CREATE POLICY "Medicos Cardiologia y propio paciente" ON public.clinico_pacientes_cardiologia FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = 'cardiologia'
  OR auth_id = auth.uid()
);
CREATE POLICY "Historias Cardiologia" ON public.clinico_historias_cardiologia FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = 'cardiologia'
  OR (SELECT auth_id FROM public.clinico_pacientes_cardiologia WHERE id = paciente_id) = auth.uid()
);

-- =================================================================================
-- 4. GESTIÓN DE CITAS (VISIBLES PARA EL PACIENTE EN LA APP)
-- =================================================================================
CREATE TABLE public.clinico_citas (
  id uuid default uuid_generate_v4() primary key,
  paciente_auth_id uuid references public.clinico_usuarios(id) not null, -- ID del paciente logueado en la PWA
  medico_id uuid references public.clinico_usuarios(id) not null,
  modulo text not null, -- 'urologia', 'cardiologia', etc.
  motivo_cita text not null,
  fecha_hora timestamp with time zone not null,
  estado text default 'pendiente' check (estado in ('pendiente', 'confirmada', 'completada', 'cancelada')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS PARA CITAS
ALTER TABLE public.clinico_citas ENABLE ROW LEVEL SECURITY;

-- Un médico solo puede ver y crear citas de su propio módulo
CREATE POLICY "Medicos ven citas de su modulo" ON public.clinico_citas FOR ALL USING (
  (SELECT modulo_asignado FROM public.clinico_usuarios WHERE id = auth.uid()) = modulo
);

-- Un paciente puede ver sus propias citas sin importar de qué módulo sean
CREATE POLICY "Pacientes ven sus propias citas" ON public.clinico_citas FOR SELECT USING (
  paciente_auth_id = auth.uid()
);
