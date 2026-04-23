# 🎯 CRM Clínico - Panel de Admin Premium

## 📍 ACCESO RÁPIDO

```
URL: http://localhost:3000/dashboard/admin
Requiere: Rol "admin" en la base de datos
```

---

## 🚀 PRIMEROS PASOS

### 1. Aplicar cambios de Supabase (¡IMPORTANTE!)

```bash
# En tu consola de Supabase:
1. Ve a SQL Editor
2. Abre: supabase_setup.sql
3. Ejecuta el script completo
4. Verifica que no hay errores
```

### 2. Reinicia el servidor

```bash
npm run dev
```

### 3. Accede al panel

```
http://localhost:3000/dashboard/admin
```

---

## ✨ CARACTERÍSTICAS

### 📊 Estadísticas en Vivo
- **Usuarios Totales**: Número total en el sistema
- **Médicos**: Cantidad de usuarios con rol "médico"
- **Pacientes**: Cantidad de usuarios con rol "paciente"

### 👥 Crear Médicos
- Nombre completo
- Email único
- Contraseña temporal (mínimo 6 caracteres)
- Especialidad (Urología, Ginecología, Cardiología, Pediatría)

### 📋 Gestionar Usuarios
- Ver todos los usuarios registrados
- Editar rol de cada usuario
- Asignar/cambiar especialidad
- Guardar cambios al instante
- Ver fecha de registro

---

## 🎨 DISEÑO

### Colores Premium
- **Azul Médico**: #0284c7 (Primario)
- **Cyan Vibrante**: #38bdf8 (Secundario)
- **Verde Éxito**: #10b981 (Validaciones)
- **Fondo Claro**: #f1f5f9

### Componentes
- Header con gradiente
- Tarjetas de estadísticas con hover
- Formulario con iconos
- Tabla profesional con avatares
- Mensajes de éxito animados
- Responsive design (móvil, tablet, desktop)

---

## 📝 GUÍAS

### Crear un Médico

```
1. Llena el formulario:
   - Nombre: Dr. Juan Pérez Sánchez
   - Email: juan.perez@clinica.com
   - Contraseña: TemporalSegura123
   - Especialidad: Cardiología

2. Haz clic en "➕ Crear Médico"

3. Verás: "✅ Médico creado exitosamente"

4. El médico aparecerá en la tabla
```

### Editar un Usuario

```
1. Localiza el usuario en la tabla

2. Haz clic en el botón ✏️ (Editar)

3. Cambia:
   - Rol (Admin/Médico/Paciente)
   - Especialidad (o "Sin módulo")

4. Haz clic en ✔️ (Guardar - botón verde)

5. Verás: "✅ Usuario actualizado correctamente"
```

### Ver Detalles

```
Avatar [JP] = Juan Pérez
Email: juan@clinica.com (mostrado debajo del nombre)
Rol: Médico (con color)
Especialidad: 🔬 Urología (con emoji)
Fecha: 23/04/2026
```

---

## 🔐 PERMISOS RLS

Tu admin ahora tiene permiso total en:
- ✅ Ver todos los pacientes (todos los módulos)
- ✅ Ver todas las historias clínicas
- ✅ Ver todas las citas
- ✅ Editar usuarios
- ✅ Crear nuevos médicos

Los médicos solo ven su módulo asignado.
Los pacientes solo ven sus propios datos.

---

## ❓ PREGUNTAS FRECUENTES

### P: ¿Por qué no veo el nuevo diseño?
**R**: Limpia caché (Ctrl+Shift+Del) y recarga la página

### P: ¿Puedo cambiar la especialidad de un médico?
**R**: Sí, haz clic en ✏️, selecciona nueva especialidad, guarda

### P: ¿Qué pasa si uso un email que ya existe?
**R**: El sistema te mostrará un error. Usa un email único

### P: ¿Los médicos pueden crear otros médicos?
**R**: No, solo los admins. Los médicos no ven este panel

### P: ¿Cuál es la contraseña mínima?
**R**: 6 caracteres (el médico debe cambiarla al primer login)

---

## 🐛 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| Panel sin estilos nuevos | Limpia caché (Ctrl+Shift+Del) |
| "Error al cargar usuarios" | Ejecuta supabase_setup.sql en Supabase |
| No puedo crear médicos | Verifica email único y password 6+ caracteres |
| "No tienes permisos" | Verifica que tu usuario es admin en BD |
| Cambios no se guardan | Haz clic en ✔️ (verde) para confirmar |

---

## 📊 ESTRUCTURA DE DATOS

```
Rol: 'admin' | 'medico' | 'paciente'
Módulo: 'urologia' | 'ginecologia' | 'cardiologia' | 'pediatria' | null

Ejemplo usuario médico:
{
  nombre_completo: "Dr. Juan Pérez",
  email: "juan@clinica.com",
  rol: "medico",
  modulo_asignado: "cardiologia",
  created_at: "2026-04-23T10:30:00Z"
}
```

---

## 🎓 TIPS PROFESIONALES

1. **Nombres consistentes**: Usa formato "Dr./Dra. Nombre Apellido"

2. **Emails únicos**: Usa formato username@clinica.com

3. **Contraseña temporal**: El médico debe cambiarla al primer login
   - Hazlo seguro pero fácil de recordar temporalmente

4. **Módulos claros**: Asigna claramente cada médico a su especialidad

5. **Mantenimiento**: Revisa regularmente la lista de usuarios

---

## 🔗 ARCHIVOS MODIFICADOS

```
src/app/dashboard/admin/
├── page.tsx              (Componente completamente reescrito)
└── admin.module.css      (Nuevos estilos premium)

supabase_setup.sql        (Políticas RLS actualizadas)
```

---

## 📞 DOCUMENTACIÓN COMPLETA

Para más detalles, consulta:

- **INSTRUCCIONES_SUPABASE_ADMIN.md** - Guía paso a paso
- **RESUMEN_CAMBIOS.md** - Qué cambió exactamente
- **VERIFICACION_FINAL.md** - Cómo verificar que todo funciona
- **supabase_admin_policies_fix.sql** - Solo políticas (alternativo)

---

## 🎉 ¡LISTO!

Tu panel de admin está configurado y listo para:

✅ Gestionar usuarios
✅ Crear médicos
✅ Asignar especialidades
✅ Ver estadísticas
✅ Mantener el sistema

**Bienvenido al Centro de Administración Premium** 🚀

---

*Última actualización: 23 de Abril de 2026*
*Versión: 2.0 (Premium Admin Panel)*
