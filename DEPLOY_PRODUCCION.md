# 🚀 DEPLOY A PRODUCCIÓN - VERCEL + GITHUB

## ✅ ESTADO ACTUAL

Tu proyecto está completamente configurado para:
- ✅ GitHub (Git control)
- ✅ Vercel (Deploy automático)
- ✅ Variables de entorno producción
- ✅ Next.js optimizado para producción
- ✅ JWT tokens seguros
- ✅ Base de datos Supabase

---

## 🔑 PASO 1: CONFIGURAR VARIABLES SEGURAS

### 1.1 Generar JWT_SECRET Seguro

```bash
# En Windows PowerShell:
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

O en Linux/Mac:
```bash
openssl rand -base64 32
```

Copia el resultado. Será tu `JWT_SECRET`.

### 1.2 Actualizar .env.production

```bash
# Edita el archivo .env.production
NEXT_PUBLIC_SUPABASE_URL=https://axzdtgcouczgdxjopikn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5l7HQ20jqodbowaI9RAJ4A_7Vqnu7tA
JWT_SECRET=YOUR_GENERATED_SECRET_HERE_32_CHARS_MIN
NEXT_PUBLIC_APP_URL=https://tu-dominio-vercel.vercel.app
NODE_ENV=production
```

### 1.3 NO GUARDES .env.local en Git

El archivo `.gitignore` ya está configurado para ignorar:
- `.env.local`
- `.env`
- `node_modules/`

---

## 🐙 PASO 2: SETUP EN GITHUB

### 2.1 Crear Repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `crm-clinico`
3. Descripción: `Sistema de Gestión Clínica Multi-especialidad`
4. Privado ✅
5. Click "Create Repository"

### 2.2 Subir Código a GitHub

```bash
cd D:\SOLIDO\ AUTO\ SERVICIO\DOCUMENTOS\PROCESO\ Y\ PROCEDIMIENTOS\crm-clinico

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit: CRM Clínico v1.0.0 - Sistema de gestión clínica"

# Agregar origen remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/crm-clinico.git

# Push a main
git branch -M main
git push -u origin main
```

### 2.3 Verificar en GitHub

Abre [github.com/tu-usuario/crm-clinico](https://github.com) y verifica que todo está subido.

---

## 🚀 PASO 3: DEPLOY EN VERCEL

### 3.1 Conectar Vercel a GitHub

1. Ve a [vercel.com](https://vercel.com)
2. Click "New Project"
3. Click "Import Git Repository"
4. Autoriza GitHub
5. Selecciona `crm-clinico`
6. Click "Import"

### 3.2 Configurar Variables de Entorno

En la página de Vercel:
1. Ve a "Environment Variables"
2. Agrega estos valores:

```
NEXT_PUBLIC_SUPABASE_URL = https://axzdtgcouczgdxjopikn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_5l7HQ20jqodbowaI9RAJ4A_7Vqnu7tA
JWT_SECRET = YOUR_GENERATED_SECRET
NEXT_PUBLIC_APP_URL = (Se auto-genera)
NODE_ENV = production
```

### 3.3 Deploy

1. Click "Deploy"
2. Espera 2-3 minutos
3. Tu app estará en vivo en: `https://crm-clinico.vercel.app`

---

## ✅ VERIFICAR DEPLOY

### 4.1 Probar Login

Abre tu URL de Vercel y prueba:
- Email: `yoelreyes05@gmail.com`
- Password: `yoel2024`

### 4.2 Verificar Variables

En Vercel, ve a "Settings" → "Environment Variables" para confirmar.

### 4.3 Ver Logs

Si hay errores:
1. Ve a "Deployments"
2. Click el último deploy
3. Click "View Logs"

---

## 🔄 WORKFLOW: CAMBIOS Y ACTUALIZACIONES

### Hacer cambios locales:

```bash
# 1. Edita archivos localmente
# 2. Verifica que funciona:
npm run dev

# 3. Commit y push a GitHub
git add .
git commit -m "Descripción del cambio"
git push origin main
```

### Vercel deployará automáticamente

- GitHub webhook → Vercel
- Construye automáticamente
- Deploy en vivo en 2-3 minutos
- Sin necesidad de hacer nada más

---

## 🆘 TROUBLESHOOTING

### Error: "Module not found"
```bash
# Limpia dependencies y reinstala
rm -r node_modules package-lock.json
npm install
npm run build
```

### Error: "JWT_SECRET is undefined"
```
Asegúrate que agregaste JWT_SECRET en Environment Variables en Vercel
```

### Error: "Supabase connection failed"
```
Verifica que NEXT_PUBLIC_SUPABASE_URL y ANON_KEY son correctos en .env.production
```

### App lenta en Vercel
```bash
# Optimiza build
npm run build
# Verifica tamaño
du -sh .next
```

---

## 🎯 DOMINIO PERSONALIZADO

### Agregar tu propio dominio:

1. En Vercel, ve a "Settings" → "Domains"
2. Agrega tu dominio (ej: clinica.com)
3. Actualiza records DNS según Vercel indica
4. Espera validación (5-30 minutos)

---

## 📊 MONITOREO Y ANALYTICS

### En Vercel Dashboard puedes ver:

- ✅ Visits (visitantes)
- ✅ Response time (velocidad)
- ✅ Error rate (errores)
- ✅ Build time (tiempo de compilación)
- ✅ Bandwidth (ancho de banda)

### Todo es GRATIS en plan Hobby

---

## 🔐 SEGURIDAD PARA PRODUCCIÓN

### Checklist de Seguridad:

- [ ] JWT_SECRET es único y seguro (32+ caracteres)
- [ ] `.env.local` NO está en GitHub (.gitignore presente)
- [ ] Repositorio es PRIVADO en GitHub
- [ ] Variables de entorno son SECRETAS en Vercel
- [ ] HTTPS está habilitado (automático en Vercel)
- [ ] Supabase URL es pública (es RLS quien protege)
- [ ] RLS policies están activas en Supabase

---

## 📈 ESCALAR A PRODUCCIÓN REAL

Si necesitas más rendimiento:

1. **Upgrade a Plan Pro** en Vercel ($20/mes)
   - Edge Middleware
   - Priority support
   - Aumenta limits

2. **Upgrade Supabase** si crece mucho
   - Plan Pro: $25/mes
   - Más Storage, Bandwidth

3. **Agregar CDN**
   - Vercel lo incluye automáticamente
   - Distribute globalmente

4. **Agregar base de datos secundaria**
   - Para backup
   - Replicación automática

---

## 📋 RESUMEN DEPLOY

```
┌─────────────────────────────────────┐
│     WORKFLOW DE DEPLOYMENT          │
├─────────────────────────────────────┤
│                                     │
│  Código Local → Git Commit          │
│       ↓                             │
│  GitHub (push origin main)          │
│       ↓                             │
│  Vercel (webhook trigger)           │
│       ↓                             │
│  Build & Deploy (2-3 min)           │
│       ↓                             │
│  Live en Producción 🎉              │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 URL FINAL EN VIVO

Una vez completado todo:

**Tu CRM Clínico estará en vivo en:**
```
https://crm-clinico.vercel.app
```

O tu dominio personalizado:
```
https://tu-dominio.com
```

---

## 💾 BACKUP Y RECOVERY

### Supabase (BD) está protegida:
- Backups automáticos
- Recovery point objectives (RPO): Diario
- En Supabase settings → Backups

### GitHub es tu control de versiones:
- Todos los cambios versionados
- Puedes revertir a cualquier commit
- History completo preservado

---

## ✨ SIGUIENTE FASE

Una vez en vivo:

1. ✅ Monitorear en Vercel Dashboard
2. ✅ Agregar dominio personalizado
3. ✅ Crear más médicos y pacientes
4. ✅ Implementar módulos restantes
5. ✅ Agregar PWA para pacientes
6. ✅ Configurar email automático
7. ✅ Implementar reportes

---

## 📞 LINKS ÚTILES

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Production Checklist](https://nextjs.org/learn-pages-router/basics/deploying-nextjs-app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [GitHub Pages](https://pages.github.com)

---

**¡Tu CRM Clínico está listo para producción! 🚀**

Aproximadamente 5-10 minutos para tener todo en vivo.
