import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();

  // Crear cliente Supabase con cookies (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Si no hay sesión y quiere entrar al dashboard o portal → login
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/portal-paciente'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si no hay usuario autenticado, dejar pasar (páginas públicas)
  if (!user) return response;

  // Obtener rol del usuario
  const { data: perfil } = await supabase
    .from('clinico_usuarios')
    .select('rol, modulo_asignado')
    .eq('id', user.id)
    .single();

  const rol = perfil?.rol;
  const modulo = perfil?.modulo_asignado;

  // 2. Paciente no puede entrar al dashboard de médicos
  if (rol === 'paciente' && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/portal-paciente', request.url));
  }

  // 3. Médico no puede entrar al admin ni a módulos de otros médicos
  if (rol === 'medico') {
    if (path.startsWith('/dashboard/admin')) {
      return NextResponse.redirect(new URL(`/dashboard/${modulo || ''}`, request.url));
    }

    const modulos = ['cardiologia', 'ginecologia', 'pediatria', 'urologia'];
    for (const mod of modulos) {
      if (mod !== modulo && path.startsWith(`/dashboard/${mod}`)) {
        return NextResponse.redirect(new URL(`/dashboard/${modulo || ''}`, request.url));
      }
    }
  }

  // 4. Admin no debe ir al portal de pacientes
  if (rol === 'admin' && path.startsWith('/portal-paciente')) {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
