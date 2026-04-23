import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este middleware es una estructura base para la protección de rutas.
// En producción, aquí se verificará el rol del usuario utilizando Supabase SSR
// Ejemplo: const { data: { session } } = await supabase.auth.getSession()
// const rol = session.user.user_metadata.rol;

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // RUTAS PROTEGIDAS: Si el usuario no está logueado, redirigir a /login
  // if (!session && (path.startsWith('/dashboard') || path.startsWith('/portal-paciente'))) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  // PROTECCIÓN DE ROLES (Ejemplo de Lógica)
  // 1. Un paciente no puede entrar al dashboard de médicos
  /*
  if (rol === 'paciente' && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/portal-paciente', request.url))
  }
  */

  // 2. Un médico no puede entrar al módulo de otro médico ni al admin
  /*
  if (rol === 'medico') {
    const modulo = session.user.user_metadata.modulo_asignado; // ej: 'urologia'
    
    // Bloquear acceso a Admin
    if (path.startsWith('/dashboard/admin')) {
      return NextResponse.redirect(new URL(`/dashboard/${modulo}`, request.url));
    }

    // Bloquear acceso a otros módulos
    const modulos = ['cardiologia', 'ginecologia', 'pediatria', 'urologia'];
    for (const mod of modulos) {
      if (mod !== modulo && path.startsWith(`/dashboard/${mod}`)) {
        return NextResponse.redirect(new URL(`/dashboard/${modulo}`, request.url));
      }
    }
  }
  */

  // 3. Un admin no debería ir al portal de pacientes
  /*
  if (rol === 'admin' && path.startsWith('/portal-paciente')) {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url))
  }
  */

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
