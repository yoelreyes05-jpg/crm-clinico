# Guía de Deploy — CRM Clínico

## Paso 1 — Subir a GitHub

```bash
# En la carpeta del proyecto (crm-clinico)
git init
git add .
git commit -m "feat: CRM Clínico v1.0 — sistema multi-especialidad"

# En GitHub: crear repo nuevo (sin README, sin .gitignore)
# Luego conectar:
git remote add origin https://github.com/TU_USUARIO/crm-clinico.git
git branch -M main
git push -u origin main
```

---

## Paso 2 — Deploy en Railway (recomendado para backend/DB)

1. Ir a **railway.app** → New Project → Deploy from GitHub repo
2. Seleccionar el repo `crm-clinico`
3. Railway detecta Next.js automáticamente
4. Ir a **Variables** y agregar todas las del `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET` (genera con: `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` = la URL que te dé Railway (ej. `https://crm-clinico-production.up.railway.app`)
5. Railway hace el build y deploy automático
6. En **Settings → Domains** puedes conectar tu dominio propio

---

## Paso 3 — Deploy en Vercel (alternativa, excelente para Next.js)

1. Ir a **vercel.com** → Add New Project → Import Git Repository
2. Seleccionar el repo `crm-clinico`
3. En **Environment Variables** agregar las mismas del `.env.example`
4. Click **Deploy**
5. Vercel asigna un dominio `.vercel.app` automáticamente

> ⚡ Vercel es ligeramente más rápido para Next.js por ser la empresa que lo creó.

---

## Variables de entorno requeridas

| Variable | Dónde obtenerla |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role |
| `JWT_SECRET` | Generar: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | La URL de Railway o Vercel |
| `RESEND_API_KEY` | resend.com (gratis, opcional para emails) |

---

## Checklist antes del deploy

- [ ] Ejecutar todos los SQL en Supabase: `fix_numeric_y_columnas.sql`, `fix_fk_historiales.sql`
- [ ] Verificar que `.env.local` NO está en el repo (ya está en `.gitignore`)
- [ ] Build local limpio: `rmdir /s /q .next && npm run build`
- [ ] El build no debe mostrar errores (warnings son OK)
