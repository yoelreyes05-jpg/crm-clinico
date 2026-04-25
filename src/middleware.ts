import { NextRequest, NextResponse } from "next/server";

// ============================================================
// MIDDLEWARE - Protección de rutas
// ============================================================

const publicRoutes = ["/login", "/"];
const protectedRoutes = ["/dashboard"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rutas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Rutas API de autenticación
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Rutas protegidas
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // En el cliente se verifica si hay sesión con obtenerSesion()
    // Aquí solo permitimos el acceso
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
