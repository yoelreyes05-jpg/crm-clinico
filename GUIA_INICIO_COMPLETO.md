# 🚀 GUÍA COMPLETA: CREAR CRM CLÍNICO DESDE CERO

## FASE 1: PREPARAR SUPABASE ⏱️ 15 MIN

### Paso 1.1: Crear Proyecto Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea nuevo proyecto o usa uno existente
3. Copia tus credenciales:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Paso 1.2: Crear Tablas
1. En Supabase, ve a **SQL Editor**
2. Click **"New Query"**
3. Copia todo el contenido de `supabase_schema_completo.sql`
4. Pégalo y click **"RUN"**
5. Espera a que complete (30-60 segundos)

### Paso 1.3: Verificar Creación
```sql
-- En Supabase SQL Editor, ejecuta esto:
SELECT COUNT(*) as total_tablas FROM information_schema.tables 
WHERE table_schema = 'public';
```
Resultado esperado: **15 tablas**

---

## FASE 2: CREAR PROYECTO NEXT.JS ⏱️ 10 MIN

### Paso 2.1: Crear Proyecto
```bash
cd D:\SOLIDO\ AUTO\ SERVICIO\DOCUMENTOS\PROCESO\ Y\ PROCEDIMIENTOS\
npx create-next-app@latest crm-clinico --typescript
```

**Responde así:**
```
✔ Would you like to use TypeScript? › Yes
✔ Would you like to use ESLint? › Yes
✔ Would you like to use Tailwind CSS? › No
✔ Would you like your code inside a `src/` directory? › Yes
✔ Would you like to use App Router? › Yes
✔ Would you like to use Turbopack? › Yes
✔ Would you like to customize the import alias? › No
```

### Paso 2.2: Instalar Dependencias
```bash
cd crm-clinico

# Supabase
npm install @supabase/supabase-js

# Autenticación
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken

# Utilidades
npm install axios

# Opcional: para imprimir
npm install html2pdf
```

### Paso 2.3: Crear Variables de Entorno
Crea archivo `.env.local` en la raíz:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# JWT (genera una clave secreta aleatoria)
JWT_SECRET=tu_clave_secreta_aqui_minimo_32_caracteres

# Admin
ADMIN_EMAIL=yoelreyes05@gmail.com
ADMIN_PASSWORD=yoel2024
```

---

## FASE 3: ESTRUCTURA DE CARPETAS Y ARCHIVOS ⏱️ 10 MIN

### Paso 3.1: Crear Estructura
```bash
# Dentro de la carpeta crm-clinico
mkdir -p src/lib src/components src/types src/hooks src/context src/styles
```

### Paso 3.2: Copiar Archivos
Copia estos archivos del proyecto:
- ✅ `src/lib/supabase.ts`
- ✅ `src/lib/auth.ts`
- ✅ `src/types/index.ts`
- ✅ `src/app/api/auth/login/route.ts`
- ✅ `.env.local`

Luego crea los archivos que necesitas:
- `src/app/layout.tsx` - Layout principal
- `src/app/page.tsx` - Página inicio (redirect a login)
- `src/app/login/page.tsx` - Login
- `src/app/middleware.ts` - Protección de rutas
- `src/app/dashboard/layout.tsx` - Layout dashboard
- `src/app/dashboard/page.tsx` - Dashboard admin
- Y todos los módulos...

### Paso 3.3: Código Base
Aquí hay archivos mínimos para empezar:

---

## FASE 4: CREAR ARCHIVO LAYOUT PRINCIPAL

**src/app/layout.tsx:**
```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Clínico - Sistema de Gestión Médica",
  description: "Sistema integral de gestión clínica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

**src/app/globals.css:**
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #f8fafc;
  color: #1e293b;
}

a {
  color: #0284c7;
  text-decoration: none;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

button.primary {
  background: #0284c7;
  color: white;
}

button.primary:hover {
  background: #0369a1;
}

input, textarea, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
}
```

---

## FASE 5: CREAR PÁGINA DE LOGIN

**src/app/login/page.tsx:**
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Mail, Lock, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("yoelreyes05@gmail.com");
  const [password, setPassword] = useState("yoel2024");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.success) {
      // Redirigir según rol
      router.push("/dashboard");
    } else {
      setError(result.error || "Error al iniciar sesión");
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "2rem",
        background: "white",
        borderRadius: "1rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
            CRM Clínico
          </h1>
          <p style={{ color: "#64748b" }}>Sistema de Gestión Médica</p>
        </div>

        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            fontSize: "0.875rem"
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>
              <Mail size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>
              <Lock size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary"
            style={{ width: "100%", marginTop: "1rem" }}
          >
            <LogIn size={18} style={{ display: "inline", marginRight: "0.5rem" }} />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p style={{
          textAlign: "center",
          marginTop: "1rem",
          fontSize: "0.875rem",
          color: "#64748b"
        }}>
          Demo: yoelreyes05@gmail.com / yoel2024
        </p>
      </div>
    </div>
  );
}
```

---

## FASE 6: PROBAR LOGIN ⏱️ 5 MIN

### Paso 6.1: Iniciar Servidor
```bash
npm run dev
```

### Paso 6.2: Acceder
Abre [http://localhost:3000/login](http://localhost:3000/login)

### Paso 6.3: Probar Credenciales
- Email: `yoelreyes05@gmail.com`
- Password: `yoel2024`

**Resultado esperado:** ✅ Redirige a /dashboard

---

## FASE 7: CREAR DASHBOARD ADMIN

**src/app/dashboard/page.tsx:**
```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { obtenerUsuarioActual, logout } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const usuario = obtenerUsuarioActual();

  useEffect(() => {
    if (!usuario) {
      router.push("/login");
    }
  }, [usuario, router]);

  if (!usuario) return null;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem"
      }}>
        <div>
          <h1>Bienvenido, {usuario.nombre_completo}</h1>
          <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
            Rol: <strong>{usuario.rol === "admin" ? "Administrador" : "Médico"}</strong>
            {usuario.especialidad && ` • Especialidad: ${usuario.especialidad}`}
          </p>
        </div>
        <button
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
          style={{ background: "#ef4444", color: "white" }}
        >
          Cerrar Sesión
        </button>
      </div>

      {usuario.rol === "admin" && (
        <div>
          <h2>Panel de Administración</h2>
          <p>Aquí irán las opciones de admin...</p>
        </div>
      )}

      {usuario.rol === "medico" && (
        <div>
          <h2>Dashboard Médico</h2>
          <p>Aquí irán tus pacientes y citas...</p>
        </div>
      )}
    </div>
  );
}
```

---

## FASE 8: DATOS DE PRUEBA

Para agregar médicos de prueba, en Supabase SQL Editor:

```sql
-- Crear médicos de prueba
INSERT INTO usuarios_clinica (email, password_hash, nombre_completo, cedula, rol, especialidad, telefono, estado) VALUES
(
  'cardiologia@clinica.com',
  '$2a$12$R9h/cIPz0gi.URNNGHF/ve4Yl3DzBfWZDDEjqJGZ2jVfLUMcDjHKe', -- yoel2024
  'Dr. Cardiólogo',
  '1111111111',
  'medico',
  'cardiologia',
  '+1234567890',
  true
),
(
  'pediatria@clinica.com',
  '$2a$12$R9h/cIPz0gi.URNNGHF/ve4Yl3DzBfWZDDEjqJGZ2jVfLUMcDjHKe', -- yoel2024
  'Dra. Pediatra',
  '2222222222',
  'medico',
  'pediatria',
  '+1234567890',
  true
),
(
  'urologia@clinica.com',
  '$2a$12$R9h/cIPz0gi.URNNGHF/ve4Yl3DzBfWZDDEjqJGZ2jVfLUMcDjHKe', -- yoel2024
  'Dr. Urólogo',
  '3333333333',
  'medico',
  'urologia',
  '+1234567890',
  true
);

-- Crear pacientes de prueba
INSERT INTO pacientes (cedula, nombre_completo, fecha_nacimiento, sexo, telefono, email, ciudad, tipo_sangre) VALUES
('12345678', 'Juan Pérez', '1980-01-15', 'M', '+1234567890', 'juan@gmail.com', 'Ciudad', 'O+'),
('87654321', 'María García', '1990-05-20', 'F', '+0987654321', 'maria@gmail.com', 'Ciudad', 'A+');
```

---

## ✅ CHECKLIST BÁSICO

- [ ] Supabase preparado con 15 tablas
- [ ] Proyecto Next.js creado
- [ ] Dependencias instaladas
- [ ] .env.local configurado
- [ ] Archivos creados (lib, types, api)
- [ ] Login funcionando
- [ ] Dashboard accesible
- [ ] Datos de prueba en Supabase

---

## 📋 PRÓXIMOS PASOS

1. ✅ Fase 1-8: COMPLETADO (Arriba)
2. ⏳ Crear componentes comunes
3. ⏳ Implementar panel admin
4. ⏳ Crear módulos de especialidades
5. ⏳ Sistema de citas
6. ⏳ Historial de pacientes
7. ⏳ Impresión de historial
8. ⏳ PWA para pacientes
9. ⏳ Estilos finales
10. ⏳ Deploy a producción

---

## 🆘 TROUBLESHOOTING

### "Módulo no encontrado"
```bash
# Limpia node_modules y reinstala
rm -rf node_modules
npm install
```

### "Error de Supabase"
- Verifica que `.env.local` tenga las credenciales correctas
- Comprueba que las tablas existan en Supabase

### "Login no funciona"
- Verifica que el usuario admin existe en Supabase
- Comprueba que el password_hash es correcto

### "TypeScript errors"
```bash
# Actualiza tipos
npm install @types/node @types/react -D
```

---

¡Listo! Ahora tienes la base para continuar construyendo el CRM clínico. 🎉
