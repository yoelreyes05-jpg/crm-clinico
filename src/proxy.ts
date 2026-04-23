import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Solo proteger rutas del dashboard
  if (!path.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Buscar cualquier cookie de Supabase (auth token)
  const allCookies = request.cookies.getAll();
  const hasSession = allCookies.some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
