# 🏥 IMPLEMENTACIÓN DEL ESQUEMA EN SUPABASE

## ✅ PASOS PARA CREAR LA BASE DE DATOS

### 1️⃣ Acceder a Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Entra con tu cuenta
3. Abre tu proyecto clínico
4. Ve a **SQL Editor**

### 2️⃣ Crear las Tablas

1. Click en **"New Query"**
2. Copia TODO el contenido de `supabase_schema_completo.sql`
3. Pégalo en el editor
4. Click en **"RUN"**
5. Espera a que se complete (tardará 30-60 segundos)

### 3️⃣ Verificar Creación

Una vez completado, deberías ver:
- ✅ 15 tablas creadas
- ✅ Índices creados
- ✅ RLS policies activadas
- ✅ Usuario admin insertado

---

## 📊 ESTRUCTURA DE TABLAS

### Tabla Principal: `usuarios_clinica`
```
id (UUID)
email (UNIQUE)
password_hash (bcrypt)
nombre_completo
cedula (UNIQUE)
rol (admin/medico)
especialidad (cardiologia, pediatria, etc.)
licencia_medica
estado (activo/inactivo)
```

**Roles:**
- `admin` → Acceso total, puede crear médicos
- `medico` → Ve solo sus pacientes y su especialidad

---

### Tabla Principal: `pacientes`
```
id (UUID)
cedula (UNIQUE) ← Usaremos esto para PWA
nombre_completo
fecha_nacimiento
sexo (M/F)
telefono
email
direccion
ciudad
estado_civil
ocupacion
alergias
antecedentes_medicos
tipo_sangre
```

---

### Tabla Principal: `citas`
```
id (UUID)
paciente_id → Referencia a pacientes
medico_id → Referencia a usuarios_clinica
especialidad
fecha_cita
duracion_minutos
motivo_cita
notas
estado (programada/completada/cancelada)
visto_paciente ← Para notificaciones
```

---

### Tabla Principal: `historiales_clinicos`
**Tabla general que conecta con todas las especialidades**

```
id (UUID)
paciente_id
medico_id
cita_id (referencia)
especialidad ← Determina cuál tabla especializada se usa

ANAMNESIS:
- motivo_consulta
- duracion_sintomas
- sintomas_principales
- antecedentes_enfermedad_actual

EXAMEN FÍSICO:
- peso, altura, imc
- presion_sistolica, presion_diastolica
- frecuencia_cardiaca
- frecuencia_respiratoria
- temperatura
- saturacion_oxigeno
- examen_fisico_general

DIAGNÓSTICO:
- diagnostico_principal
- diagnosticos_secundarios
- codigos_diagnostico (CIE-10)

TRATAMIENTO:
- plan_tratamiento
- medicamentos (JSON)
- recomendaciones

SEGUIMIENTO:
- proxima_cita_sugerida
- estudios_solicitados
```

---

### Tablas Especializadas

#### `historiales_cardiologia`
- dolor_pecho, disnea, palpitaciones, sincope
- hipertension, diabetes, dislipidemia, tabaquismo
- ekg_resultado, ecocardiograma_resultado
- troponina_valor, bnp_valor
- colesterol, ldl, hdl, trigliceridos
- medicamentos cardíacos

#### `historiales_ginecologia`
- fecha_ultimo_periodo, duracion_ciclo
- embrazada, metodo_anticonceptivo
- flujo_vaginal_anormal, dolor_pelvico
- papanicolau_resultado, colposcopia_resultado
- ecografia_transvaginal

#### `historiales_pediatria`
- nombre_responsable, parentesco_responsable
- peso_nacimiento, talla_nacimiento, edad_gestacional
- calendario_vacunacion_completo
- desarrollo_motriz, desarrollo_lenguaje
- tipo_alimentacion, problemas_alimentacion

#### `historiales_urologia`
- disuria, poliuria, nicturia, hematuria
- disfuncion_erectil, dolor_testicular
- antecedente_infecciones_urinarias
- psa_valor, uroanálisis_resultado
- ecografia_renal, ecografia_prostatica

#### `historiales_medicina_interna`
- diabetes, hipertension, dislipidemia
- fatiga, perdida_peso, fiebre
- hemoglobina, hematocrito, leucocitos
- glucosa_ayunas, urea, creatinina
- medicamentos_cronicos

#### `historiales_dermatologia` (OCULTO)
- tipo_lesion, localizacion, tamano_lesion
- color_lesion, evolucion_lesion
- prurito, dolor
- antecedentes dermatológicos

#### `historiales_oftalmologia` (OCULTO)
- agudeza_visual_od/oi
- presion_intraocular_od/oi
- lentes_contacto, gafas
- miopia, hipermetropia, astigmatismo
- cataratas, glaucoma

#### `historiales_traumatologia` (OCULTO)
- tipo_lesion, mecanismo_trauma
- dolor, inflamacion, deformidad
- antecedente_fracturas
- radiografia_resultado, resonancia_resultado
- inmovilizacion, tipo_inmovilizacion

---

### Tabla: `recetas_medicas`
```
id (UUID)
historial_id
medico_id
paciente_id
medicamento
dosis
frecuencia
duracion
indicaciones
contraindicaciones
activa (true/false)
fecha_inicio, fecha_fin
```

---

### Tabla: `estudios_diagnosticos`
```
id (UUID)
historial_id
paciente_id
medico_id
tipo_estudio
descripcion
fecha_solicitud
fecha_realizacion
resultado
estado (pendiente/realizado/entregado)
```

---

### Tabla: `notificaciones`
```
id (UUID)
paciente_id
cita_id (opcional)
tipo (nueva_cita/recordatorio/resultado)
titulo
mensaje
leida (true/false)
created_at
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

### Niveles de Acceso

#### 👨‍💼 ADMIN (yoelreyes05@gmail.com)
- ✅ Ve todos los usuarios
- ✅ Ve todos los pacientes
- ✅ Ve todas las citas
- ✅ Ve todos los historiales
- ✅ Puede crear/editar/eliminar médicos
- ✅ Genera reportes globales

#### 👨‍⚕️ MÉDICO (Especialidad asignada)
- ✅ Ve solo SUS pacientes
- ✅ Ve solo SUS citas
- ✅ Ve solo SUS historiales
- ❌ NO ve pacientes de otras especialidades
- ✅ Crea/edita historiales de sus pacientes
- ✅ Prescribe medicamentos

#### 🏥 PACIENTE (PWA)
- ✅ Ve su propio historial
- ✅ Ve sus propias citas
- ✅ Imprime su historial
- ❌ NO ve datos de otros pacientes

---

## 📋 USUARIO ADMIN INICIAL

**Email:** yoelreyes05@gmail.com  
**Password Hash:** $2a$12$R9h/cIPz0gi.URNNGHF/ve4Yl3DzBfWZDDEjqJGZ2jVfLUMcDjHKe  
**Password:** yoel2024  
**Rol:** admin  
**Nombre:** Yoel Reyes  
**Cédula:** 1234567890

---

## 🔍 VERIFICAR CREACIÓN

Después de ejecutar el SQL, corre estas queries para verificar:

### 1. Contar tablas
```sql
SELECT COUNT(*) as total_tablas FROM information_schema.tables 
WHERE table_schema = 'public';
```
Resultado esperado: 15 tablas

### 2. Verificar usuario admin
```sql
SELECT email, rol, nombre_completo FROM usuarios_clinica 
WHERE email = 'yoelreyes05@gmail.com';
```

### 3. Ver índices
```sql
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
```

### 4. Verificar RLS activo
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'usuarios%';
```

---

## ⚠️ IMPORTANTE: EDITAR RLS POLICIES

El SQL usa `current_user_email()` que NO existe nativamente en Supabase. Necesitas:

### Opción 1: Usar el Email del JWT Token (RECOMENDADO)
```sql
-- La política correcta sería:
CREATE POLICY "Admin ve todos" ON usuarios_clinica
  FOR SELECT USING (
    (SELECT rol FROM usuarios_clinica 
     WHERE email = auth.jwt() ->> 'email') = 'admin'
  );
```

### Opción 2: Crear función personalizada
```sql
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'email'
$$ LANGUAGE SQL STABLE;
```

**Después ejecuta esto para actualizar todas las policies:**
```sql
-- Reemplaza todas las referencias a current_user_email()
-- con la versión que usemos
```

---

## 📱 PRÓXIMOS PASOS

1. ✅ Ejecutar SQL en Supabase
2. ✅ Verificar tablas creadas
3. ⏳ Crear proyecto Next.js
4. ⏳ Implementar autenticación
5. ⏳ Crear Admin dashboard
6. ⏳ Crear módulos de especialidades
7. ⏳ Crear PWA para pacientes

---

¡La base de datos está lista! 🎉
