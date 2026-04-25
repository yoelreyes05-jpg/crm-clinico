# 📁 ESTRUCTURA DEL PROYECTO CRM CLÍNICO

## 🏗️ ARQUITECTURA GENERAL

```
crm-clinico/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Layout principal
│   │   ├── page.tsx             # Página inicio
│   │   ├── login/
│   │   │   ├── page.tsx         # Login admin (fetch-based)
│   │   │   └── page.module.css
│   │   ├── dashboard/
│   │   │   ├── layout.tsx       # Layout del dashboard
│   │   │   ├── page.tsx         # Dashboard principal (admin)
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx     # Panel de administración
│   │   │   │   ├── layout.tsx
│   │   │   │   └── admin.module.css
│   │   │   ├── cardiologia/
│   │   │   │   ├── page.tsx     # Dashboard médico cardiología
│   │   │   │   ├── pacientes/
│   │   │   │   ├── citas/
│   │   │   │   ├── historiales/
│   │   │   │   └── cardiologia.module.css
│   │   │   ├── medicina-interna/
│   │   │   ├── urologia/
│   │   │   ├── ginecologia/
│   │   │   ├── pediatria/
│   │   │   ├── dermatologia/     # Oculto
│   │   │   ├── oftalmologia/     # Oculto
│   │   │   └── traumatologia/    # Oculto
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── session/route.ts
│   │   │   ├── usuarios/
│   │   │   │   ├── route.ts      # CRUD usuarios
│   │   │   │   └── [id]/route.ts
│   │   │   ├── pacientes/
│   │   │   │   ├── route.ts      # CRUD pacientes
│   │   │   │   └── [cedula]/route.ts
│   │   │   ├── citas/
│   │   │   │   ├── route.ts      # CRUD citas
│   │   │   │   └── [id]/route.ts
│   │   │   └── historiales/
│   │   │       ├── route.ts      # CRUD historiales
│   │   │       └── [id]/route.ts
│   │   ├── middleware.ts         # Protección de rutas
│   │   ├── globals.css           # Estilos globales
│   │   └── layout.module.css
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── common.module.css
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── auth.module.css
│   │   ├── admin/
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── UsuariosList.tsx
│   │   │   ├── CrearMedicoForm.tsx
│   │   │   └── admin.module.css
│   │   ├── especialidad/
│   │   │   ├── SpecialtyDashboard.tsx
│   │   │   ├── PacientesTab.tsx
│   │   │   ├── CitasTab.tsx
│   │   │   ├── HistorialesTab.tsx
│   │   │   └── specialty.module.css
│   │   └── print/
│   │       ├── HistorialPrintable.tsx
│   │       └── print.module.css
│   ├── lib/
│   │   ├── supabase.ts          # Cliente Supabase + helpers
│   │   ├── auth.ts              # Funciones autenticación
│   │   ├── fetch.ts             # Wrapper fetch personalizado
│   │   ├── hash.ts              # Funciones bcrypt
│   │   └── utils.ts             # Utilidades generales
│   ├── hooks/
│   │   ├── useAuth.ts           # Hook autenticación
│   │   ├── useSession.ts        # Hook sesión
│   │   ├── useFetch.ts          # Hook fetch
│   │   └── useLocalStorage.ts   # Hook localStorage
│   ├── types/
│   │   └── index.ts             # Tipos TypeScript
│   ├── styles/
│   │   ├── colors.css           # Variables de colores
│   │   ├── typography.css       # Tipografía
│   │   ├── spacing.css          # Espaciado
│   │   └── responsive.css       # Media queries
│   └── context/
│       └── AuthContext.tsx      # Contexto autenticación
├── public/
│   ├── icons/
│   ├── logos/
│   └── manifest.json            # PWA manifest
├── .env.local                   # Variables de entorno
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md

```

## 🔐 AUTENTICACIÓN (Método CRM Automotriz)

### Flujo de Login:
```
1. Usuario ingresa email + password
2. POST /api/auth/login
3. Backend valida contra Supabase
4. Si válido:
   - Crea token JWT
   - Guarda en localStorage: { user, token }
   - Redirige a /dashboard/[especialidad]
5. Si inválido:
   - Muestra error
```

### Estructura de Sesión:
```javascript
{
  user: {
    id: "uuid",
    email: "doctor@clinica.com",
    nombre_completo: "Dr. Nombre",
    rol: "medico",
    especialidad: "cardiologia",
    token: "jwt_token_aqui"
  },
  isAuthenticated: true,
  expiresAt: 1234567890
}
```

### Middleware Protection:
- Verifica presencia de token
- Valida que no esté expirado
- Si expira → redirige a /login
- Si no existe → redirige a /login

## 🎨 ESTILO Y DISEÑO

### Paleta de Colores:
```css
/* Primarios */
--primary: #0284c7;      /* Azul profesional */
--primary-dark: #0369a1;
--secondary: #38bdf8;    /* Azul claro */

/* Estados */
--success: #10b981;      /* Verde */
--warning: #f59e0b;      /* Naranja */
--danger: #ef4444;       /* Rojo */
--info: #06b6d4;         /* Cian */

/* Escala de grises */
--bg: #f8fafc;
--surface: #ffffff;
--text: #1e293b;
--text-muted: #64748b;
--border: #e2e8f0;
```

### Especialidades (Colores por módulo):
- 🔴 Cardiología: #ef4444 (Rojo)
- 🏥 Medicina Interna: #3b82f6 (Azul)
- 🟣 Urología: #8b5cf6 (Púrpura)
- 🟡 Ginecología: #ec4899 (Rosa)
- 🟠 Pediatría: #f59e0b (Naranja)
- 🔵 Dermatología: #06b6d4 (Cian)
- 💚 Oftalmología: #10b981 (Verde)
- 🟣 Traumatología: #d946ef (Púrpura claro)

### Componentes Base:
- Button: Estilos primario, secundario, danger
- Input: Campos de texto, email, password
- Modal: Diálogos modales reutilizables
- Card: Tarjetas de contenido
- Table: Tablas de datos
- Alert: Notificaciones y errores

## 📱 MÓDULOS FUNCIONALES

### 1️⃣ ADMINISTRACIÓN
- **Crear médicos**: Formulario para agregar nuevos doctores
- **Gestionar usuarios**: Listar, editar, activar/desactivar
- **Asignar especialidades**: Asignar áreas a médicos
- **Ver reportes globales**: Estadísticas del sistema

### 2️⃣ MÓDULOS DE ESPECIALIDADES (Cardiología, etc.)
Cada módulo contiene:
- **Dashboard**: Estadísticas del módulo
- **Pacientes**: Lista y gestión de pacientes
  - Ver datos demográficos
  - Editar información
  - Historial completo
  - Notificaciones de citas
- **Citas**: Agenda de citas
  - Crear cita
  - Ver próximas citas
  - Marcar completadas
  - Notificar paciente
- **Historiales**: Registros clínicos
  - Crear historial
  - Editar información clínica
  - Campos especializados por módulo
  - Imprimir histórico

### 3️⃣ PACIENTES (PWA)
- **Login**: Cedula sin guiones
- **Ver citas**: Próximas citas programadas
- **Ver historial**: Registros clínicos propios
- **Imprimir**: Descargar historial en PDF
- **Notificaciones**: Nuevas citas

## 🔄 FLUJOS PRINCIPALES

### Crear Paciente (Admin/Médico):
```
1. Ir a Pacientes tab
2. Click "Nuevo Paciente"
3. Llenar formulario (datos demográficos)
4. Click "Guardar"
5. Sistema:
   - Inserta en tabla pacientes
   - Limpia formulario
   - Muestra confirmación
   - Actualiza lista
```

### Crear Historial Clínico:
```
1. Abrir paciente
2. Click "Nuevo Historial"
3. Seleccionar especialidad
4. Llenar campos generales:
   - Motivo consulta
   - Síntomas
   - Examen físico
   - Diagnóstico
   - Tratamiento
5. Llenar campos especializados:
   - Según especialidad (cardio, gine, etc.)
6. Click "Guardar"
7. Sistema:
   - Inserta historial general
   - Inserta tabla especializada
   - Genera notificación para paciente
   - Limpia formulario
```

### Imprimir Historial:
```
1. Abrir historial
2. Click "Imprimir"
3. PDF generado con:
   - Datos del paciente
   - Fecha actual y hora
   - Datos de la consulta
   - Examen físico
   - Diagnóstico
   - Tratamiento
   - Firma del médico (área)
4. Click "Descargar" o "Imprimir"
```

## 🔒 SEGURIDAD (RLS Policies)

### Admin (yoelreyes05@gmail.com):
- Ve todos los usuarios
- Ve todos los pacientes
- Ve todos los historiales
- Puede CRUD en usuarios

### Médico Cardiología:
- Ve solo médicos de cardiología
- Ve solo pacientes de cardiología
- Ve solo historiales de cardiología
- ❌ NO ve otros módulos

### Médico Pediatría:
- Ve solo médicos de pediatría
- Ve solo pacientes de pediatría
- Ve solo historiales de pediatría
- ❌ NO ve cardiología, urología, etc.

### Paciente (PWA):
- Ve solo su propio historial
- Ve solo sus propias citas
- ❌ NO ve datos de otros pacientes

## 📊 ESTADÍSTICAS Y REPORTES

### Dashboard Principal (Admin):
- Total de médicos por especialidad
- Total de pacientes por especialidad
- Total de citas programadas
- Citas completadas vs pendientes
- Pacientes nuevos (últimos 30 días)

### Dashboard Especialidad (Médico):
- Mis pacientes (cantidad)
- Mis citas del mes
- Historiales creados
- Pacientes con citas próximas

### Dashboard Paciente (PWA):
- Próximas citas
- Últimos historiales
- Notificaciones de citas

## 🚀 DEPLOYMENT (PWA)

### Manifest.json:
```json
{
  "name": "CRM Clínico",
  "short_name": "Clínica",
  "description": "Sistema de gestión clínica",
  "start_url": "/",
  "display": "standalone",
  "scope": "/",
  "orientation": "portrait-primary",
  "icons": [...]
}
```

### Service Worker:
- Cachea archivos estáticos
- Funciona offline
- Sincronización en background
- Notificaciones push

### Instalación:
1. Acceso en navegador
2. Click "Instalar"
3. Se guarda en pantalla inicio
4. Funciona como app nativa

## 📋 SIGUIENTES PASOS

1. ✅ Esquema SQL (HECHO)
2. ✅ Tipos TypeScript (HECHO)
3. ✅ Cliente Supabase (HECHO)
4. ⏳ Funciones de autenticación
5. ⏳ Componentes comunes
6. ⏳ Páginas del dashboard
7. ⏳ APIs de CRUD
8. ⏳ Middleware de protección
9. ⏳ PWA para pacientes
10. ⏳ Estilos finales

---

¡La arquitectura está completa! 🎉
