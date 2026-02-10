// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Función para verificar autenticación
function isAuthenticated(request: NextRequest): boolean {
  try {
    const authStorageCookie = request.cookies.get('auth-storage')?.value;
    if (authStorageCookie) {
      const parsedStorage = JSON.parse(authStorageCookie);
      return !!parsedStorage?.state?.token;
    }
    return false;
  } catch (error) {
    console.error("Error parsing auth cookie:", error);
    return false;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuth = isAuthenticated(request);
  
  console.log(`Middleware - Ruta: ${pathname}, Autenticado: ${isAuth}`);
  
  // Definir rutas públicas (accesibles sin autenticación)
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth', // Rutas de API de autenticación
    '/_next', // Archivos de Next.js
    '/favicon.ico',
    '/public', // Archivos públicos
  ];
  
  // Verificar si la ruta actual es pública
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Redirección para ruta raíz
  if (pathname === '/') {
    const redirectUrl = isAuth 
      ? new URL('/dashboard', request.url)
      : new URL('/auth/login', request.url);
    
    console.log(`Redirigiendo ${pathname} a ${redirectUrl.pathname}`);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Lógica de protección de rutas
  if (!isPublicPath && !isAuth) {
    // Si no es ruta pública y no está autenticado → redirigir a login
    console.log(`Acceso denegado a ${pathname}, redirigiendo a login`);
    const loginUrl = new URL('/auth/login', request.url);
    // Agregar la ruta original como parámetro para redireccionar después del login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Si está en login y ya está autenticado → redirigir a dashboard
  if (pathname.startsWith('/auth/login') && isAuth) {
    console.log(`Ya autenticado, redirigiendo de ${pathname} a dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match todas las rutas excepto:
     * 1. /_next/static (archivos estáticos)
     * 2. /_next/image (optimización de imágenes)
     * 3. /favicon.ico
     * 4. Rutas que terminan con extensiones de archivo
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};