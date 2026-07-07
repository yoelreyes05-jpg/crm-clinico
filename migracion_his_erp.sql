-- ============================================================
-- MIGRACIÓN HIS/ERP — CRM CLÍNICO → SISTEMA INTEGRADO
-- ============================================================
-- Creado: 2026-07-06
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de:
--   1. migracion_contabilidad_seguros_permisos.sql
--   2. migracion_tipo_paciente_citas.sql
--
-- Contiene:
--   1. Estados ampliados y campos financieros en CITAS
--   2. Rol SECRETARIA en usuarios
--   3. Configuración API/adapters en ASEGURADORAS
--   4. Planes y tarifarios por ARS
--   5. Validaciones de cobertura
--   6. FACTURACIÓN (facturas + items)
--   7. CONTABILIDAD (plan de cuentas, asientos, partidas)
--   8. AUDITORÍA (registro histórico de operaciones)
--   9. Permisos ampliados (control total por usuario)
-- ============================================================

-- ============================================================
-- 1. CITAS: estados de flujo clínico + datos financieros
-- Flujo: programada → en_espera → en_consulta → finalizada
--        (o cancelada / no_asistio)
-- ============================================================
ALTER TABLE citas ADD COLUMN IF NOT EXISTS monto_estimado NUMERIC(12,2) DEFAULT 0;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS seguro_validado VARCHAR(20) DEFAULT 'no_aplica';
-- seguro_validado: 'no_aplica' (privado), 'pendiente', 'validado', 'rechazado'

-- Ampliar estados permitidos (se elimina restricción previa si existe)
ALTER TABLE citas DROP CONSTRAINT IF EXISTS citas_estado_check;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_estado_cita') THEN
    ALTER TABLE citas ADD CONSTRAINT valid_estado_cita CHECK (
      estado IN ('programada','en_espera','en_consulta','finalizada','completada','cancelada','no_asistio')
    );
  END IF;
END $$;

-- ============================================================
-- 2. USUARIOS: rol secretaria
-- ============================================================
ALTER TABLE usuarios_clinica DROP CONSTRAINT IF EXISTS valid_rol;
ALTER TABLE usuarios_clinica ADD CONSTRAINT valid_rol CHECK (rol IN ('admin','medico','secretaria'));

-- ============================================================
-- 3. ASEGURADORAS: configuración de integración (adapters)
-- Cada ARS tiene su adapter; 'manual' = sin API (registro manual)
-- ============================================================
ALTER TABLE aseguradoras ADD COLUMN IF NOT EXISTS adapter VARCHAR(50) DEFAULT 'manual';
ALTER TABLE aseguradoras ADD COLUMN IF NOT EXISTS api_base_url TEXT;
ALTER TABLE aseguradoras ADD COLUMN IF NOT EXISTS api_usuario TEXT;
ALTER TABLE aseguradoras ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE aseguradoras ADD COLUMN IF NOT EXISTS api_token TEXT;
ALTER TABLE aseguradoras ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- 4. PLANES Y TARIFARIOS POR ARS
-- ============================================================
CREATE TABLE IF NOT EXISTS planes_ars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aseguradora_id UUID NOT NULL REFERENCES aseguradoras(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  copago_defecto NUMERIC(12,2) DEFAULT 0,
  cobertura_pct NUMERIC(5,2) DEFAULT 80,     -- % que cubre la ARS
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tarifarios_ars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aseguradora_id UUID NOT NULL REFERENCES aseguradoras(id) ON DELETE CASCADE,
  codigo VARCHAR(50),                        -- Código del servicio/procedimiento
  descripcion TEXT NOT NULL,
  tarifa NUMERIC(12,2) NOT NULL DEFAULT 0,   -- Lo que paga la ARS
  copago NUMERIC(12,2) DEFAULT 0,            -- Copago del paciente
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. VALIDACIONES DE COBERTURA
-- Resultado de consultar la cobertura (por API o manual)
-- ============================================================
CREATE TABLE IF NOT EXISTS validaciones_cobertura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  seguro_paciente_id UUID REFERENCES seguros_pacientes(id) ON DELETE SET NULL,
  aseguradora_id UUID NOT NULL REFERENCES aseguradoras(id) ON DELETE RESTRICT,
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  validado_por UUID REFERENCES usuarios_clinica(id) ON DELETE SET NULL,

  estado VARCHAR(20) DEFAULT 'pendiente',    -- pendiente, validado, rechazado, error
  cobertura_aprobada BOOLEAN DEFAULT false,
  copago NUMERIC(12,2) DEFAULT 0,
  deducible NUMERIC(12,2) DEFAULT 0,
  monto_autorizado NUMERIC(12,2) DEFAULT 0,
  numero_autorizacion TEXT,
  fecha_validacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  via VARCHAR(20) DEFAULT 'manual',          -- api, manual
  respuesta_raw JSONB,                       -- Respuesta completa de la API
  notas TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. FACTURACIÓN (facturas_clinica)
-- NOTA: se llama "facturas_clinica" porque este Supabase se
-- comparte con el CRM automotriz, que ya tiene una tabla
-- "facturas" con otra estructura.
-- Trazabilidad: cita → consulta → factura → asientos contables
-- ============================================================
CREATE TABLE IF NOT EXISTS facturas_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura TEXT UNIQUE NOT NULL,        -- FACT-000001
  ncf TEXT,                                   -- Comprobante fiscal (B01/B02/e-CF)
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  historial_id UUID REFERENCES historiales_clinicos(id) ON DELETE SET NULL,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
  medico_id UUID NOT NULL REFERENCES usuarios_clinica(id) ON DELETE RESTRICT,
  aseguradora_id UUID REFERENCES aseguradoras(id) ON DELETE SET NULL,
  validacion_id UUID REFERENCES validaciones_cobertura(id) ON DELETE SET NULL,
  reclamacion_id UUID REFERENCES reclamaciones_ars(id) ON DELETE SET NULL,
  especialidad VARCHAR(100),

  descripcion TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(12,2) DEFAULT 0,
  itbis NUMERIC(12,2) DEFAULT 0,              -- Servicios médicos usualmente exentos
  total NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- División automática del monto
  monto_paciente NUMERIC(12,2) DEFAULT 0,     -- Copago / consulta privada
  monto_ars NUMERIC(12,2) DEFAULT 0,          -- Por cobrar a la ARS
  pagado_paciente NUMERIC(12,2) DEFAULT 0,
  pagado_ars NUMERIC(12,2) DEFAULT 0,

  metodo_pago_paciente VARCHAR(50),           -- efectivo, tarjeta, transferencia
  estado VARCHAR(20) DEFAULT 'emitida',       -- emitida, parcial, pagada, anulada
  fecha_emision DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_estado_factura CHECK (estado IN ('emitida','parcial','pagada','anulada'))
);

-- ============================================================
-- 7. CONTABILIDAD: plan de cuentas + asientos + partidas
-- ============================================================
CREATE TABLE IF NOT EXISTS cuentas_contables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL,                  -- activo, pasivo, capital, ingreso, gasto
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_tipo_cuenta CHECK (tipo IN ('activo','pasivo','capital','ingreso','gasto'))
);

-- Plan de cuentas base
INSERT INTO cuentas_contables (codigo, nombre, tipo) VALUES
  ('1101', 'Caja', 'activo'),
  ('1102', 'Banco', 'activo'),
  ('1201', 'Cuentas por Cobrar - Pacientes', 'activo'),
  ('1202', 'Cuentas por Cobrar - ARS', 'activo'),
  ('2101', 'ITBIS por Pagar', 'pasivo'),
  ('2102', 'Cuentas por Pagar', 'pasivo'),
  ('3101', 'Capital', 'capital'),
  ('4101', 'Ingresos por Servicios Médicos', 'ingreso'),
  ('4102', 'Otros Ingresos', 'ingreso'),
  ('5101', 'Gastos Generales', 'gasto'),
  ('5102', 'Gastos de Personal', 'gasto')
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS asientos_contables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_asiento SERIAL,
  fecha DATE DEFAULT CURRENT_DATE,
  descripcion TEXT NOT NULL,
  referencia_tipo VARCHAR(50),                -- factura, pago_paciente, pago_ars, gasto, manual
  referencia_id UUID,                         -- id de la factura/pago que lo generó
  medico_id UUID REFERENCES usuarios_clinica(id) ON DELETE SET NULL,
  creado_por UUID REFERENCES usuarios_clinica(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partidas_contables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asiento_id UUID NOT NULL REFERENCES asientos_contables(id) ON DELETE CASCADE,
  cuenta_codigo VARCHAR(20) NOT NULL REFERENCES cuentas_contables(codigo),
  debe NUMERIC(12,2) DEFAULT 0,
  haber NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. AUDITORÍA — registro histórico de todas las operaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios_clinica(id) ON DELETE SET NULL,
  usuario_email TEXT,
  accion VARCHAR(50) NOT NULL,                -- crear, actualizar, anular, validar, pagar...
  entidad VARCHAR(50) NOT NULL,               -- cita, paciente, factura, asiento...
  entidad_id UUID,
  detalles JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. PERMISOS AMPLIADOS — control total por usuario
-- ============================================================
ALTER TABLE permisos_especialidades ADD COLUMN IF NOT EXISTS acceso_citas BOOLEAN DEFAULT true;
ALTER TABLE permisos_especialidades ADD COLUMN IF NOT EXISTS acceso_pacientes BOOLEAN DEFAULT true;
ALTER TABLE permisos_especialidades ADD COLUMN IF NOT EXISTS acceso_facturacion BOOLEAN DEFAULT true;
ALTER TABLE permisos_especialidades ADD COLUMN IF NOT EXISTS acceso_cxc BOOLEAN DEFAULT false;
ALTER TABLE permisos_especialidades ADD COLUMN IF NOT EXISTS acceso_finanzas BOOLEAN DEFAULT false;
ALTER TABLE permisos_especialidades ADD COLUMN IF NOT EXISTS acceso_libros BOOLEAN DEFAULT false;

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_planes_aseguradora ON planes_ars(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_tarifarios_aseguradora ON tarifarios_ars(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_validaciones_paciente ON validaciones_cobertura(paciente_id);
CREATE INDEX IF NOT EXISTS idx_validaciones_cita ON validaciones_cobertura(cita_id);
CREATE INDEX IF NOT EXISTS idx_fact_clinica_paciente ON facturas_clinica(paciente_id);
CREATE INDEX IF NOT EXISTS idx_fact_clinica_medico ON facturas_clinica(medico_id);
CREATE INDEX IF NOT EXISTS idx_fact_clinica_estado ON facturas_clinica(estado);
CREATE INDEX IF NOT EXISTS idx_fact_clinica_fecha ON facturas_clinica(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_asientos_fecha ON asientos_contables(fecha);
CREATE INDEX IF NOT EXISTS idx_partidas_asiento ON partidas_contables(asiento_id);
CREATE INDEX IF NOT EXISTS idx_partidas_cuenta ON partidas_contables(cuenta_codigo);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);

-- ============================================================
-- FIN DE LA MIGRACIÓN HIS/ERP
-- ============================================================
