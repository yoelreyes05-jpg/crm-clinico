-- ============================================================
-- CRM CLÍNICO - ESQUEMA COMPLETO SUPABASE
-- ============================================================
-- Creado: 2026-04-23
-- Base de datos profesional para sistema clínico multi-especialidad
-- ============================================================

-- ============================================================
-- 1. TABLA DE USUARIOS (Admin + Médicos)
-- Usuarios del sistema: administrador y médicos por especialidad
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  cedula TEXT UNIQUE,
  rol VARCHAR(50) NOT NULL DEFAULT 'medico', -- 'admin' o 'medico'
  especialidad VARCHAR(100), -- cardiologia, medicina_interna, urologia, etc.
  licencia_medica TEXT,
  telefono TEXT,
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_rol CHECK (rol IN ('admin', 'medico'))
);

-- ============================================================
-- 2. TABLA DE PACIENTES (Información demográfica)
-- Datos básicos de todos los pacientes del sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo VARCHAR(1) NOT NULL, -- 'M' o 'F'
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  ciudad TEXT,
  estado_civil VARCHAR(50),
  ocupacion TEXT,
  alergias TEXT,
  antecedentes_medicos TEXT,
  tipo_sangre VARCHAR(3),
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. TABLA DE CITAS
-- Gestión de citas médicas
-- ============================================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE RESTRICT,
  especialidad VARCHAR(100) NOT NULL,
  fecha_cita TIMESTAMP WITH TIME ZONE NOT NULL,
  duracion_minutos INTEGER DEFAULT 30,
  motivo_cita TEXT,
  notas TEXT,
  estado VARCHAR(50) DEFAULT 'programada', -- 'programada', 'completada', 'cancelada'
  visto_paciente BOOLEAN DEFAULT false, -- Notificación de cita nueva
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. TABLA GENERAL DE HISTORIALES CLÍNICOS
-- Compatriota con todas las especialidades
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_clinicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE RESTRICT,
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  especialidad VARCHAR(100) NOT NULL,

  -- ANAMNESIS (Síntomas actuales)
  motivo_consulta TEXT NOT NULL,
  duracion_sintomas TEXT,
  sintomas_principales TEXT,
  antecedentes_enfermedad_actual TEXT,

  -- REVISIÓN POR SISTEMAS
  revision_general TEXT,

  -- EXAMEN FÍSICO
  peso NUMERIC(5,2),
  altura NUMERIC(4,2),
  imc NUMERIC(5,2),
  presion_sistolica INTEGER,
  presion_diastolica INTEGER,
  frecuencia_cardiaca INTEGER,
  frecuencia_respiratoria INTEGER,
  temperatura NUMERIC(5,2),
  saturacion_oxigeno NUMERIC(5,2),
  examen_fisico_general TEXT,

  -- DIAGNÓSTICOS
  diagnostico_principal TEXT NOT NULL,
  diagnosticos_secundarios TEXT,
  codigos_diagnostico TEXT, -- CIE-10 codes

  -- TRATAMIENTO Y PRESCRIPCIÓN
  plan_tratamiento TEXT NOT NULL,
  medicamentos TEXT, -- JSON con medicamentos prescritos
  recomendaciones TEXT,

  -- SEGUIMIENTO
  proxima_cita_sugerida DATE,
  estudios_solicitados TEXT,

  -- DATOS GENERALES
  estado VARCHAR(50) DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. TABLA ESPECIALIZADA: CARDIOLOGÍA
-- Campos específicos para cardiología
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_cardiologia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,

  -- Síntomas cardíacos específicos
  dolor_pecho BOOLEAN,
  tipo_dolor_pecho VARCHAR(100),
  disnea BOOLEAN, -- Dificultad para respirar
  palpitaciones BOOLEAN,
  sincope BOOLEAN, -- Desmayos
  edema_periférico BOOLEAN,

  -- Factores de riesgo
  hipertension BOOLEAN,
  diabetes BOOLEAN,
  dislipidemia BOOLEAN,
  tabaquismo BOOLEAN,
  antecedente_infarto BOOLEAN,
  antecedente_arritmia BOOLEAN,

  -- Pruebas diagnósticas
  ekg_resultado TEXT,
  ecocardiograma_resultado TEXT,
  troponina_valor NUMERIC(8,3),
  bnp_valor NUMERIC(8,3),
  colesterol_total NUMERIC(7,2),
  ldl NUMERIC(7,2),
  hdl NUMERIC(7,2),
  trigliceridos NUMERIC(7,2),

  -- Medicamentos cardíacos
  anticoagulantes TEXT,
  antiarritmicos TEXT,
  betabloqueantes TEXT,
  inhibidores_eca TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. TABLA ESPECIALIZADA: GINECOLOGÍA
-- Campos específicos para ginecología
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_ginecologia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,

  -- Ciclo menstrual
  fecha_ultimo_periodo DATE,
  duracion_ciclo INTEGER,
  flujo_menstrual VARCHAR(50),
  irregularidades_menstruales TEXT,
  dismenorrea BOOLEAN,

  -- Gestación (si aplica)
  embrazada BOOLEAN,
  fecha_ultimo_parto DATE,
  numero_gestaciones INTEGER,
  numero_partos INTEGER,
  metodo_anticonceptivo VARCHAR(100),

  -- Síntomas ginecológicos
  flujo_vaginal_anormal BOOLEAN,
  picazon_vaginal BOOLEAN,
  dolor_pelvico BOOLEAN,
  sangrado_anormal BOOLEAN,

  -- Pruebas diagnósticas
  papanicolau_resultado TEXT,
  papanicolau_fecha DATE,
  colposcopia_resultado TEXT,
  ecografia_transvaginal TEXT,

  -- Antecedentes ginecológicos
  antecedente_cancer_mama BOOLEAN,
  antecedente_cancer_cuello TEXT,
  terapia_hormonal BOOLEAN,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. TABLA ESPECIALIZADA: PEDIATRÍA
-- Campos específicos para pediatría
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_pediatria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,

  -- Datos del responsable
  nombre_responsable TEXT,
  parentesco_responsable VARCHAR(50),
  telefono_responsable TEXT,

  -- Historial perinatal
  peso_nacimiento INTEGER, -- en gramos
  talla_nacimiento INTEGER, -- en cm
  edad_gestacional INTEGER,
  complicaciones_parto TEXT,
  apgar_score INTEGER,

  -- Vacunaciones
  calendario_vacunacion_completo BOOLEAN,
  proximas_vacunas TEXT,
  reacciones_vacunas TEXT,

  -- Desarrollo psicomotor
  edad_control_meses INTEGER,
  desarrollo_motriz TEXT,
  desarrollo_lenguaje TEXT,
  desarrollo_cognitivo TEXT,

  -- Nutrición
  tipo_alimentacion VARCHAR(50), -- 'lactancia', 'formula', 'mixta'
  alimentos_introducidos TEXT,
  problemas_alimentacion TEXT,

  -- Problemas específicos pediátricos
  asma BOOLEAN,
  alergias_alimentos TEXT,
  problemas_sueno TEXT,
  enuresis BOOLEAN,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. TABLA ESPECIALIZADA: UROLOGÍA
-- Campos específicos para urología
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_urologia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,

  -- Síntomas urinarios
  disuria BOOLEAN, -- Dolor al orinar
  poliuria BOOLEAN, -- Orina frecuente
  nicturia BOOLEAN, -- Orina nocturna
  hematuria BOOLEAN, -- Sangre en orina
  incontinencia BOOLEAN,
  retension_urinaria BOOLEAN,

  -- Síntomas específicos hombres
  disfuncion_erectil BOOLEAN,
  dolor_testicular BOOLEAN,
  problemas_eyaculacion TEXT,

  -- Antecedentes
  antecedente_infecciones_urinarias INTEGER,
  antecedente_calculos_renales BOOLEAN,
  antecedente_cancer_prostata BOOLEAN,
  antecedente_prostatitis BOOLEAN,

  -- Pruebas diagnósticas
  psa_valor NUMERIC(8,3),
  psa_fecha DATE,
  uroanálisis_resultado TEXT,
  ecografia_renal TEXT,
  ecografia_prostatica TEXT,

  -- Signos vitales específicos
  volumen_residual_post_miccional INTEGER,
  flujo_maximo NUMERIC(8,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. TABLA ESPECIALIZADA: MEDICINA INTERNA
-- Campos específicos para medicina interna
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_medicina_interna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,

  -- Patologías crónicas
  diabetes BOOLEAN,
  hipertension BOOLEAN,
  dislipidemia BOOLEAN,
  hipotiroidismo BOOLEAN,
  asma BOOLEAN,
  epoc BOOLEAN,

  -- Síntomas generales
  fatiga BOOLEAN,
  perdida_peso BOOLEAN,
  fiebre BOOLEAN,
  sudoracion_nocturna BOOLEAN,

  -- Laboratorios generales
  hemoglobina NUMERIC(5,2),
  hematocrito NUMERIC(5,2),
  leucocitos NUMERIC(6,2),
  glucosa_ayunas NUMERIC(6,2),
  urea NUMERIC(7,2),
  creatinina NUMERIC(5,2),
  bilirrubina NUMERIC(5,2),
  proteinas_totales NUMERIC(5,2),
  albumina NUMERIC(5,2),

  -- Medicamentos crónicos
  medicamentos_cronicos TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. TABLA ESPECIALIZADA: DERMATOLOGÍA (Oculto)
-- Campos específicos para dermatología
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_dermatologia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,

  -- Lesiones dermatológicas
  tipo_lesion VARCHAR(100),
  localizacion TEXT,
  tamano_lesion TEXT,
  color_lesion VARCHAR(50),
  evolucion_lesion TEXT,
  prurito BOOLEAN,
  dolor BOOLEAN,

  -- Antecedentes dermatológicos
  antecedente_psoriasis BOOLEAN,
  antecedente_dermatitis BOOLEAN,
  antecedente_acne BOOLEAN,
  antecedente_vitiligo BOOLEAN,

  -- Historial familiar
  familiares_problemas_piel TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. TABLA ESPECIALIZADA: OFTALMOLOGÍA (Oculto)
-- Campos específicos para oftalmología
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_oftalmologia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,

  -- Visión
  agudeza_visual_od VARCHAR(20),
  agudeza_visual_oi VARCHAR(20),
  presion_intraocular_od NUMERIC(5,2),
  presion_intraocular_oi NUMERIC(5,2),

  -- Corrección óptica
  lentes_contacto BOOLEAN,
  gafas BOOLEAN,
  refraccion TEXT,

  -- Problemas oftalmológicos
  miopia BOOLEAN,
  hipermetropia BOOLEAN,
  astigmatismo BOOLEAN,
  presbicia BOOLEAN,
  cataratas BOOLEAN,
  glaucoma BOOLEAN,
  degeneracion_macular BOOLEAN,

  -- Hallazgos
  campo_visual TEXT,
  fondoscopia_resultado TEXT,
  biomicroscopia_resultado TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. TABLA ESPECIALIZADA: TRAUMATOLOGÍA (Oculto)
-- Campos específicos para traumatología
-- ============================================================
CREATE TABLE IF NOT EXISTS historiales_traumatologia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,

  -- Tipo de lesión
  tipo_lesion VARCHAR(100),
  mecanismo_trauma TEXT,
  fecha_lesion DATE,
  sitio_lesion TEXT,

  -- Síntomas traumatológicos
  dolor BOOLEAN,
  inflamacion BOOLEAN,
  deformidad BOOLEAN,
  limitacion_movimiento BOOLEAN,
  inestabilidad BOOLEAN,

  -- Antecedentes
  antecedente_fracturas BOOLEAN,
  antecedente_cirugia_ortopedica BOOLEAN,
  artrosis BOOLEAN,
  osteoporosis BOOLEAN,

  -- Pruebas diagnósticas
  radiografia_resultado TEXT,
  resonancia_resultado TEXT,
  tomografia_resultado TEXT,
  ecografia_musculoesqueletica TEXT,

  -- Tratamiento
  inmovilizacion BOOLEAN,
  tipo_inmovilizacion VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. TABLA DE RECETAS MÉDICAS
-- Prescripciones y medicamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS recetas_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE RESTRICT,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,

  medicamento TEXT NOT NULL,
  dosis TEXT NOT NULL,
  frecuencia TEXT NOT NULL, -- Cada 8 horas, diario, etc.
  duracion TEXT,
  indicaciones TEXT,
  contraindicaciones TEXT,
  efectos_adversos_reportados TEXT,

  activa BOOLEAN DEFAULT true,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. TABLA DE ESTUDIOS Y PRUEBAS DIAGNÓSTICAS
-- Solicitud y resultados de pruebas
-- ============================================================
CREATE TABLE IF NOT EXISTS estudios_diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE RESTRICT,

  tipo_estudio VARCHAR(150) NOT NULL,
  descripcion TEXT,
  fecha_solicitud DATE DEFAULT CURRENT_DATE,
  fecha_realizacion DATE,
  resultado TEXT,
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, realizado, entregado

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 15. TABLA DE NOTIFICACIONES
-- Notificaciones de citas para pacientes
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  cita_id UUID REFERENCES citas(id) ON DELETE CASCADE,

  tipo VARCHAR(50) NOT NULL, -- 'nueva_cita', 'recordatorio', 'resultado'
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================
CREATE INDEX idx_usuarios_email ON usuarios_clinica(email);
CREATE INDEX idx_usuarios_especialidad ON usuarios_clinica(especialidad);
CREATE INDEX idx_pacientes_cedula ON pacientes(cedula);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_medico ON citas(medico_id);
CREATE INDEX idx_citas_especialidad ON citas(especialidad);
CREATE INDEX idx_citas_fecha ON citas(fecha_cita);
CREATE INDEX idx_historiales_paciente ON historiales_clinicos(paciente_id);
CREATE INDEX idx_historiales_medico ON historiales_clinicos(medico_id);
CREATE INDEX idx_historiales_especialidad ON historiales_clinicos(especialidad);
CREATE INDEX idx_recetas_historial ON recetas_medicas(historial_id);
CREATE INDEX idx_recetas_paciente ON recetas_medicas(paciente_id);
CREATE INDEX idx_estudios_paciente ON estudios_diagnosticos(paciente_id);
CREATE INDEX idx_notificaciones_paciente ON notificaciones(paciente_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURIDAD
-- ============================================================

-- USUARIOS_CLINICA - Solo el admin y el propio usuario pueden verlo
ALTER TABLE usuarios_clinica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve todos los usuarios" ON usuarios_clinica
  FOR SELECT USING (
    (SELECT rol FROM usuarios_clinica WHERE email = current_user_email()) = 'admin'
  );

CREATE POLICY "Usuario ve su propio perfil" ON usuarios_clinica
  FOR SELECT USING (email = current_user_email());

CREATE POLICY "Admin puede actualizar usuarios" ON usuarios_clinica
  FOR UPDATE USING (
    (SELECT rol FROM usuarios_clinica WHERE email = current_user_email()) = 'admin'
  );

-- PACIENTES - Médico ve pacientes de su especialidad, Admin ve todos
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos ven sus pacientes" ON pacientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM historiales_clinicos hc
      WHERE hc.paciente_id = pacientes.id
      AND hc.medico_id = (SELECT id FROM usuarios_clinica WHERE email = current_user_email())
    )
  );

CREATE POLICY "Admin ve todos los pacientes" ON pacientes
  FOR SELECT USING (
    (SELECT rol FROM usuarios_clinica WHERE email = current_user_email()) = 'admin'
  );

-- CITAS - Médico ve sus citas, Admin ve todas
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos ven sus citas" ON citas
  FOR SELECT USING (
    medico_id = (SELECT id FROM usuarios_clinica WHERE email = current_user_email())
  );

CREATE POLICY "Admin ve todas las citas" ON citas
  FOR SELECT USING (
    (SELECT rol FROM usuarios_clinica WHERE email = current_user_email()) = 'admin'
  );

-- HISTORIALES_CLINICOS - Médico ve historiales de sus pacientes
ALTER TABLE historiales_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos ven sus historiales" ON historiales_clinicos
  FOR SELECT USING (
    medico_id = (SELECT id FROM usuarios_clinica WHERE email = current_user_email())
  );

CREATE POLICY "Admin ve todos los historiales" ON historiales_clinicos
  FOR SELECT USING (
    (SELECT rol FROM usuarios_clinica WHERE email = current_user_email()) = 'admin'
  );

-- RECETAS_MEDICAS
ALTER TABLE recetas_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos ven sus recetas" ON recetas_medicas
  FOR SELECT USING (
    medico_id = (SELECT id FROM usuarios_clinica WHERE email = current_user_email())
  );

CREATE POLICY "Admin ve todas las recetas" ON recetas_medicas
  FOR SELECT USING (
    (SELECT rol FROM usuarios_clinica WHERE email = current_user_email()) = 'admin'
  );

-- ============================================================
-- INSERTAR USUARIO ADMIN INICIAL
-- ============================================================
INSERT INTO usuarios_clinica (
  email,
  password_hash,
  nombre_completo,
  cedula,
  rol,
  especialidad,
  telefono
) VALUES (
  'yoelreyes05@gmail.com',
  '$2a$12$R9h/cIPz0gi.URNNGHF/ve4Yl3DzBfWZDDEjqJGZ2jVfLUMcDjHKe', -- yoel2024 (hash bcrypt)
  'Yoel Reyes',
  '1234567890',
  'admin',
  NULL,
  '+1234567890'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
