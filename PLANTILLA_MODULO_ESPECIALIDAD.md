# Plantilla para crear un módulo de especialidad

Guía completa para agregar una nueva especialidad al CRM Clínico con **contabilidad**, **seguros/autorizaciones ARS** y **permisos** ya integrados. Sigue estos pasos en orden cada vez que toque crear un módulo nuevo (ej: cardiología, pediatría, urología).

> Las tablas de contabilidad (`movimientos_financieros`), seguros (`autorizaciones_seguro`, `reclamaciones_ars`, `seguros_pacientes`, `aseguradoras`), facturación (`facturas_clinica`) y permisos (`permisos_especialidades`) son **compartidas entre todas las especialidades** — se filtran por `medico_id` y `especialidad`. NO hay que crear tablas financieras nuevas por especialidad; solo la tabla clínica específica.

> **⚠️ REGLA DE AISLAMIENTO POR MÉDICO:** puede haber varios médicos en la misma especialidad (ej. dos ginecólogos). Cada uno tiene su propio `id` (UUID) y **NUNCA ve la información del otro**: todas las APIs filtran por `medico_id = auth.id` (pacientes, citas, historiales, contabilidad, facturas, reclamaciones, autorizaciones, seguros de pacientes, finanzas). Al crear un módulo o API nuevo, SIEMPRE filtrar por `medico_id`, jamás por `especialidad` sola. Al crear el médico desde el panel admin, sus módulos (permisos, contabilidad, seguros, facturación, citas, Mi Secretaria) se generan automáticamente con su propio ID.

---

## Paso 1 — Base de datos (Supabase)

La tabla especializada ya existe en `supabase_schema_completo.sql` para: cardiología, ginecología, pediatría, urología, medicina interna, dermatología, oftalmología y traumatología. Si es una de estas, no crees nada.

Si es una especialidad NUEVA, crea la tabla siguiendo el patrón:

```sql
CREATE TABLE IF NOT EXISTS historiales_NOMBRE_ESPECIALIDAD (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historial_id UUID NOT NULL REFERENCES historiales_clinicos(id) ON DELETE CASCADE,
  -- ... campos clínicos específicos de la especialidad ...
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Paso 2 — Tipos (`src/types/index.ts`)

1. Agregar la especialidad a `ESPECIALIDADES` y `ESPECIALIDADES_PUBLICAS` (o `ESPECIALIDADES_OCULTAS`).
2. Agregar etiqueta en `ESPECIALIDADES_ETIQUETAS` (label, icono, color).
3. Crear la interface del historial especializado (ej: `HistorialCardiologia`).

## Paso 3 — API del historial especializado

Crear `src/app/api/historiales/NOMBRE_ESPECIALIDAD/route.ts` copiando el patrón de `src/app/api/historiales/ginecologia/route.ts`:
- `verifyAuth` desde `@/lib/api-auth` (helper compartido).
- GET: filtrar por `medico_id` del token (el admin ve todo).
- POST: crear el registro en `historiales_clinicos` + tabla especializada.

## Paso 4 — Página de la ficha clínica

Crear `src/app/dashboard/historial-NOMBRE_ESPECIALIDAD/page.tsx` + su `.module.css`, copiando el patrón de `historial-ginecologia`.

## Paso 5 — Menú con permisos (`src/app/dashboard/layout.tsx`)

Agregar el ítem del menú DENTRO del bloque de `especialidadItems`, condicionado por especialidad y por `permisos.acceso_modulo`:

```tsx
if (usuario.rol === "medico" && usuario.especialidad === "NOMBRE_ESPECIALIDAD" && permisos.acceso_modulo) {
  especialidadItems.push({
    href: "/dashboard/historial-NOMBRE_ESPECIALIDAD",
    label: "Ficha de X",
    icon: <IconoElegido size={20} />,
    key: "historial-NOMBRE_ESPECIALIDAD",
  });
}
```

**NO agregues manualmente Contabilidad ni Seguros** — ya se agregan automáticamente para todo médico según sus permisos (`acceso_contabilidad`, `acceso_seguros`).

## Paso 6 — Lo que ya funciona automáticamente (no requiere código)

Al crear el médico de la nueva especialidad desde el panel admin (`/dashboard/medicos`):

| Función | Cómo funciona |
|---|---|
| **Pestaña Contabilidad** | `/dashboard/contabilidad` filtra por `medico_id` del token. El médico registra consultas, procedimientos, copagos y gastos en RD$, y ve lo que le deben las ARS. |
| **Seguros / Autorizaciones** | `/dashboard/seguros` — solicitudes de autorización a la ARS (No. de autorización, montos, copago), seguros de pacientes (NSS, plan, régimen) y directorio de ARS con enlaces a sus portales. |
| **Reclamaciones (cobrar a la ARS)** | Desde una autorización aprobada → botón "Crear reclamación". Al marcarla pagada, el ingreso `pago_ars` se registra automáticamente en la contabilidad. |
| **Permisos** | El admin en `/dashboard/permisos` activa/desactiva módulo, contabilidad, seguros y reportes por médico. Sin registro en BD = acceso permitido por defecto. |

## Paso 7 — Checklist final

- [ ] Tabla especializada creada en Supabase (si es especialidad nueva)
- [ ] Tipos actualizados en `src/types/index.ts`
- [ ] API `historiales/NOMBRE_ESPECIALIDAD` creada
- [ ] Página `historial-NOMBRE_ESPECIALIDAD` creada
- [ ] Ítem del menú agregado en `layout.tsx` con condición de permisos
- [ ] Médico creado desde el panel admin con la especialidad correcta
- [ ] Verificar en `/dashboard/permisos` que aparece el médico y sus toggles
- [ ] Probar: registrar un movimiento en Contabilidad y una autorización en Seguros

---

## Flujo de dinero con seguros (referencia)

Este es el procedimiento estándar en República Dominicana que implementa el sistema:

1. **Verificar seguro** del paciente (ARS, NSS, vigencia) → pestaña Seguros de pacientes.
2. **Solicitar autorización** a la ARS (portal, teléfono o presencial) con la indicación médica y diagnóstico CIE-10 → módulo Seguros, estado `pendiente`.
3. La ARS responde con **No. de autorización** y monto autorizado → marcar `aprobada`.
4. Se presta el servicio. El paciente paga su **copago/diferencia** → registrarlo en Contabilidad (tipo `copago` o `diferencia`).
5. **Reclamar a la ARS** el monto autorizado → crear reclamación (estado `enviada`). Esto aparece en Contabilidad → "Por cobrar ARS".
6. La ARS paga (usualmente 30-60 días, puede glosar parte) → marcar reclamación `pagada`/`parcial`; el ingreso `pago_ars` se registra solo.

## Portales de las principales ARS

Precargados en la tabla `aseguradoras` (editables por el admin vía API):
ARS SeNaSa, ARS Humano, ARS Universal, ARS Palic Salud, Mapfre Salud ARS, ARS Futuro, ARS Reservas, ARS Semma, ARS Monumental, ARS CMD, y "Privado / Sin seguro".
