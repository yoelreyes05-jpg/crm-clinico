import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Verificar sesión usando la cookie de Supabase
  const supabaseCookie = request.cookies.get('sb-axzdtgcouczgdxjopikn-auth-token');
  const hasSession = !!supabaseCookie;

  // Si no hay sesión y quiere entrar al dashboard → login
  if (!hasSession && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
