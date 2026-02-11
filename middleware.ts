// middleware.ts
import { NextResponse } from "next/server";

// Función simple para verificar si ya está autenticado
function isAuthenticated(request: any): boolean {
  try {
    const authStorageCookie = request.cookies.get('auth-storage')?.value;
    if (authStorageCookie) {
      const parsedStorage = JSON.parse(authStorageCookie);
      return !!parsedStorage?.state?.token;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function middleware(request: any) {
  const pathname = request.nextUrl.pathname;
  const isAuth = isAuthenticated(request);
  // 🔥 REDIRECCIÓN PARA RUTA RAÍZ /
  if (pathname === '/') {
    if (isAuth) {
      return NextResponse.redirect(new URL('/en/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/en/auth/login', request.url));
    }
  }

  // 🔄 SI ESTÁ EN LOGIN Y YA ESTÁ AUTENTICADO → REDIRIGIR A DASHBOARD
  if (pathname === '/en/auth/login' || pathname.startsWith('/en/auth/login/')) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/en/dashboard', request.url));
    } else {
      return NextResponse.next();
    }
  }

  // 🔥 AGREGAR LOCALE 'en' A RUTAS SIN LOCALE (como /usuarios, /dashboard, etc.)
  const isMissingLocale = !pathname.startsWith('/en/') && pathname !== '/en';
  if (isMissingLocale && pathname !== '/') {
    return NextResponse.redirect(new URL(`/en${pathname}`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|assets|docs|.*\\..*|_next).*)",
  ],
};
