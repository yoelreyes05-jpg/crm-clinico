-- ============================================================
-- MIGRACIÓN: CONTABILIDAD + SEGUROS/AUTORIZACIONES + PERMISOS
-- ============================================================
-- Creado: 2026-07-06
-- Ejecutar en el SQL Editor de Supabase
--
-- Contiene:
--   1. aseguradoras            → Catálogo de ARS (República Dominicana)
--   2. seguros_pacientes       → Seguro/afiliación de cada paciente
--   3. autorizaciones_seguro   → Solicitudes de autorización a la ARS
--   4. movimientos_financieros → Contabilidad por médico/especialidad
--   5. reclamaciones_ars       → Facturación/reclamación a la ARS (lo que debe la aseguradora)
--   6. permisos_especialidades → Control de acceso por médico (admin)
-- ============================================================

-- ============================================================
-- 1. CATÁLOGO DE ASEGURADORAS (ARS)
-- ============================================================
CREATE TABLE IF NOT EXISTS aseguradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  codigo VARCHAR(50),                 -- Código de la ARS ante SISALRIL
  telefono TEXT,
  telefono_autorizaciones TEXT,       -- Línea directa para autorizaciones
  email_autorizaciones TEXT,
  portal_web TEXT,                    -- Portal de prestadores/autorizaciones
  requiere_autorizacion_previa BOOLEAN DEFAULT true,
  dias_pago_promedio INTEGER DEFAULT 30, -- Días promedio en que paga reclamaciones
  notas TEXT,
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed: principales ARS de República Dominicana
INSERT INTO aseguradoras (nombre, portal_web, telefono, requiere_autorizacion_previa) VALUES
  ('ARS SeNaSa', 'https://www.arssenasa.gob.do', '809-541-4141', true),
  ('ARS Humano', 'https://www.humano.com.do', '809-476-3535', true),
  ('ARS Universal', 'https://www.arsuniversal.com.do', '809-544-7111', true),
  ('ARS Palic Salud', 'https://www.arspalic.com.do', '809-544-2002', true),
  ('Mapfre Salud ARS', 'https://www.mapfresaludars.com.do', '809-227-3838', true),
  ('ARS Futuro', 'https://www.arsfuturo.com.do', '809-565-4433', true),
  ('ARS Reservas', 'https://www.arsreservas.com.do', '809-960-2000', true),
  ('ARS Semma', 'https://www.arssemma.gob.do', '809-686-1667', true),
  ('ARS Monumental', 'https://www.arsmonumental.com.do', '809-586-4441', true),
  ('ARS CMD', NULL, NULL, true),
  ('Privado / Sin seguro', NULL, NULL, false)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- 2. SEGURO DE CADA PACIENTE (afiliación)
-- ============================================================
CREATE TABLE IF NOT EXISTS seguros_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  aseguradora_id UUID NOT NULL REFERENCES aseguradoras(id) ON DELETE RESTRICT,
  numero_afiliado TEXT NOT NULL,       -- NSS / No. de afiliado o contrato
  plan VARCHAR(100),                   -- Básico, Complementario, Máximo, etc.
  regimen VARCHAR(50) DEFAULT 'contributivo', -- contributivo, subsidiado, pensionado, privado
  titular BOOLEAN DEFAULT true,        -- true = titular, false = dependiente
  nombre_titular TEXT,                 -- Si es dependiente
  vigente_desde DATE,
  vigente_hasta DATE,
  verificado BOOLEAN DEFAULT false,    -- Se verificó la vigencia con la ARS
  fecha_verificacion DATE,
  notas TEXT,
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. AUTORIZACIONES DE SEGURO
-- Flujo RD: indicación médica → solicitud a la ARS →
-- No. de autorización → aprobada/rechazada → servicio → reclamación
-- ============================================================
CREATE TABLE IF NOT EXISTS autorizaciones_seguro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE RESTRICT,
  aseguradora_id UUID NOT NULL REFERENCES aseguradoras(id) ON DELETE RESTRICT,
  seguro_paciente_id UUID REFERENCES seguros_pacientes(id) ON DELETE SET NULL,
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  historial_id UUID REFERENCES historiales_clinicos(id) ON DELETE SET NULL,
  especialidad VARCHAR(100) NOT NULL,

  -- Servicio solicitado
  tipo_servicio VARCHAR(100) NOT NULL, -- consulta, procedimiento, cirugia, estudio, laboratorio, medicamento, terapia
  descripcion_servicio TEXT NOT NULL,
  codigo_procedimiento TEXT,           -- Código del procedimiento (si aplica)
  diagnostico_cie10 TEXT,              -- Diagnóstico CIE-10 que justifica

  -- Datos de la autorización
  numero_autorizacion TEXT,            -- Número emitido por la ARS
  fecha_solicitud DATE DEFAULT CURRENT_DATE,
  fecha_respuesta DATE,
  fecha_vencimiento DATE,              -- Las autorizaciones vencen (usualmente 30 días)
  via_solicitud VARCHAR(50) DEFAULT 'portal', -- portal, telefono, presencial, email

  -- Montos
  monto_solicitado NUMERIC(12,2) DEFAULT 0,
  monto_autorizado NUMERIC(12,2) DEFAULT 0,
  monto_diferencia NUMERIC(12,2) DEFAULT 0,  -- Diferencia que paga el paciente
  copago_paciente NUMERIC(12,2) DEFAULT 0,

  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, aprobada, rechazada, vencida, utilizada
  motivo_rechazo TEXT,
  notas TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_estado_autorizacion CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'vencida', 'utilizada'))
);

-- ============================================================
-- 4. MOVIMIENTOS FINANCIEROS (Contabilidad del médico)
-- Cada médico registra lo que cobra, copagos y gastos.
-- ============================================================
CREATE TABLE IF NOT EXISTS movimientos_financieros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE RESTRICT,
  especialidad VARCHAR(100) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  historial_id UUID REFERENCES historiales_clinicos(id) ON DELETE SET NULL,
  autorizacion_id UUID REFERENCES autorizaciones_seguro(id) ON DELETE SET NULL,
  aseguradora_id UUID REFERENCES aseguradoras(id) ON DELETE SET NULL,

  tipo VARCHAR(50) NOT NULL,           -- consulta, procedimiento, copago, diferencia, pago_ars, gasto, otro
  concepto TEXT NOT NULL,              -- Descripción del movimiento
  monto NUMERIC(12,2) NOT NULL,        -- Positivo = ingreso, gasto se registra positivo con tipo 'gasto'
  metodo_pago VARCHAR(50) DEFAULT 'efectivo', -- efectivo, tarjeta, transferencia, cheque, seguro
  fuente VARCHAR(50) DEFAULT 'paciente',      -- paciente, aseguradora, otro

  fecha_movimiento DATE DEFAULT CURRENT_DATE,
  estado VARCHAR(50) DEFAULT 'cobrado', -- cobrado, pendiente, anulado
  comprobante TEXT,                     -- No. de recibo/factura/NCF
  notas TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_tipo_movimiento CHECK (tipo IN ('consulta', 'procedimiento', 'copago', 'diferencia', 'pago_ars', 'gasto', 'otro')),
  CONSTRAINT valid_estado_movimiento CHECK (estado IN ('cobrado', 'pendiente', 'anulado'))
);

-- ============================================================
-- 5. RECLAMACIONES A LA ARS
-- Lo que la aseguradora le debe al médico. Flujo:
-- preparando → enviada → pagada / parcial / rechazada / glosada
-- ============================================================
CREATE TABLE IF NOT EXISTS reclamaciones_ars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE RESTRICT,
  aseguradora_id UUID NOT NULL REFERENCES aseguradoras(id) ON DELETE RESTRICT,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  autorizacion_id UUID REFERENCES autorizaciones_seguro(id) ON DELETE SET NULL,
  especialidad VARCHAR(100) NOT NULL,

  numero_reclamacion TEXT,             -- No. de factura/reclamación enviada
  descripcion TEXT NOT NULL,
  fecha_servicio DATE,
  fecha_envio DATE,
  fecha_pago DATE,

  monto_reclamado NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_glosado NUMERIC(12,2) DEFAULT 0,   -- Monto objetado por la ARS
  monto_pagado NUMERIC(12,2) DEFAULT 0,

  estado VARCHAR(50) DEFAULT 'preparando', -- preparando, enviada, pagada, parcial, rechazada, glosada
  motivo_glosa TEXT,
  notas TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_estado_reclamacion CHECK (estado IN ('preparando', 'enviada', 'pagada', 'parcial', 'rechazada', 'glosada'))
);

-- ============================================================
-- 6. PERMISOS DE ESPECIALIDADES (Control del admin)
-- El admin habilita/deshabilita módulos por médico.
-- Si no existe registro, el médico tiene acceso por defecto.
-- ============================================================
CREATE TABLE IF NOT EXISTS permisos_especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE CASCADE,
  especialidad VARCHAR(100) NOT NULL,

  acceso_modulo BOOLEAN DEFAULT true,       -- Módulo de especialidad (ficha clínica)
  acceso_contabilidad BOOLEAN DEFAULT true, -- Pestaña de contabilidad
  acceso_seguros BOOLEAN DEFAULT true,      -- Módulo de seguros/autorizaciones
  acceso_reportes BOOLEAN DEFAULT false,    -- Reportes avanzados (opcional)

  otorgado_por UUID REFERENCES usuarios_clinica(id) ON DELETE SET NULL,
  notas TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_medico_especialidad UNIQUE (medico_id, especialidad)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_seguros_paciente ON seguros_pacientes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_seguros_aseguradora ON seguros_pacientes(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_autorizaciones_paciente ON autorizaciones_seguro(paciente_id);
CREATE INDEX IF NOT EXISTS idx_autorizaciones_medico ON autorizaciones_seguro(medico_id);
CREATE INDEX IF NOT EXISTS idx_autorizaciones_estado ON autorizaciones_seguro(estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_medico ON movimientos_financieros(medico_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_financieros(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_financieros(tipo);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_medico ON reclamaciones_ars(medico_id);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_estado ON reclamaciones_ars(estado);
CREATE INDEX IF NOT EXISTS idx_permisos_medico ON permisos_especialidades(medico_id);

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
