# Arquitectura HIS/ERP — CRM Clínico

Sistema integrado donde **Agenda, Historia Clínica, Facturación, Aseguradoras (ARS) y Contabilidad** trabajan como un solo sistema.

## Módulos y rutas

| Módulo | Ruta | Quién lo ve |
|---|---|---|
| CITAS (flujo clínico) | `/dashboard/mis-citas` | Médico (las suyas), Secretaria y Admin (todas) |
| Agregar Consulta | `/dashboard/crear-cita` | Médico, Secretaria, Admin |
| Pacientes | `/dashboard/pacientes`, `/dashboard/crear-paciente` | Médico, Secretaria, Admin |
| ARS (configuración) | `/dashboard/ars` | Solo Admin |
| Seguros/Autorizaciones | `/dashboard/seguros` | Médico (con permiso) |
| Facturación | `/dashboard/facturacion` | Médico, Secretaria, Admin |
| Contabilidad (movimientos) | `/dashboard/contabilidad` | Médico (lo suyo), Secretaria/Admin (todo) |
| Cuentas por Cobrar ARS | `/dashboard/cxc` | Admin + quien tenga permiso |
| Libros Contables | `/dashboard/libros` | Admin + quien tenga permiso |
| Dashboard Financiero | `/dashboard/finanzas` | Admin + quien tenga permiso |
| Permisos (control total) | `/dashboard/permisos` | Solo Admin |

## Flujo operativo completo

```
1. CITA        Secretaria/médico agenda (busca paciente por cédula; si no existe
               lo registra en la misma pantalla con su ARS y No. de afiliado).
2. VALIDACIÓN  Botón "Validar Cobertura" → adapter de la ARS → guarda copago,
               monto autorizado, No. de autorización y fecha de validación.
3. FLUJO       Pendiente → En Espera → En Consulta → Finalizada
               (o Cancelada / No Asistió).
4. FACTURA     Al facturar, el monto se divide automáticamente:
               copago del paciente + monto por cobrar a la ARS.
5. CONTABLE    Asientos automáticos (partida doble):
               · Paciente paga en caja:  Debe Caja/Banco  / Haber Ingresos (4101)
               · Porción ARS:            Debe CxC-ARS (1202) / Haber Ingresos
               · Cuando la ARS paga:     Debe Banco (1102) / Haber CxC-ARS
6. LIBROS      Diario, Mayor, Balance General y Estado de Resultados se generan
               solos desde los asientos. Sin intervención manual.
7. CxC         Módulo con antigüedad de saldos (0-30/31-60/61-90/+90),
               pagos parciales y conciliación por aseguradora.
```

## Arquitectura desacoplada de ARS (Adapters)

`src/lib/ars-adapters.ts` define la interfaz `ArsAdapter`. Cada ARS tiene su implementación sin afectar el resto del sistema:

- **manual** (defecto): calcula cobertura con el tarifario/plan configurado en `/dashboard/ars`. Sin API.
- **api_generico**: API REST con `api_base_url`, token/API key y mapeo de campos configurable en el JSON `config` de la aseguradora. Si la API falla, cae al cálculo manual.
- **Futuras** (`senasa`, `humano`, `universal`...): crear el adapter en el mismo archivo, registrarlo en `ADAPTERS` y asignarlo a la aseguradora. Nada más cambia.

Las credenciales (URL, usuario, key, token, catálogos de planes y tarifarios) se administran por aseguradora en el módulo ARS.

## Eventos automáticos (efectos encadenados)

| Evento | Efectos automáticos |
|---|---|
| Emitir factura | Asientos contables + movimiento del médico + reclamación ARS + cita → finalizada |
| Pago de ARS | Asiento Banco/CxC-ARS + movimiento `pago_ars` + reclamación → pagada |
| Pago de paciente | Asiento Caja/CxC-Pacientes + movimiento |
| Anular factura | Asiento de reversa + reclamación rechazada |
| Validar cobertura | Registro en `validaciones_cobertura` + cita.seguro_validado |
| Toda operación | Registro en tabla `auditoria` (usuario, acción, entidad, detalles) |

## Roles

- **Admin (Yoel)**: todo + módulo ARS + Permisos (control total por usuario).
- **Médico**: sus citas, pacientes, historia clínica, contabilidad, seguros, facturación. Módulos extra (CxC, Finanzas, Libros) se activan en Permisos.
- **Secretaria**: citas, pacientes, contabilidad y facturación de toda la clínica. **Nunca ve historiales clínicos** (bloqueado por rol en API y menú).

## Plan de cuentas base

1101 Caja · 1102 Banco · 1201 CxC Pacientes · 1202 CxC ARS · 2101 ITBIS por Pagar · 3101 Capital · 4101 Ingresos por Servicios Médicos · 5101 Gastos Generales · 5102 Gastos de Personal

## Migraciones (ejecutar en orden en Supabase)

1. `migracion_contabilidad_seguros_permisos.sql`
2. `migracion_tipo_paciente_citas.sql`
3. `migracion_his_erp.sql`

## Preparado para futuras integraciones

La arquitectura de adapters + eventos + auditoría permite integrar sin tocar los módulos existentes: laboratorios, farmacias, imágenes diagnósticas, expediente electrónico nacional y facturación electrónica DGII (e-CF) — el campo `ncf` ya existe en `facturas_clinica`.

## ⚠️ Base de datos compartida

Este Supabase se comparte con el **CRM automotriz**. Por eso la tabla de facturas del clínico se llama **`facturas_clinica`** (la tabla `facturas` pertenece al taller). Al crear tablas nuevas para el clínico, verificar antes que el nombre no exista (usar `diagnostico_his_erp.sql`) y preferir el sufijo `_clinica` en nombres genéricos.
