import { NextResponse, type NextRequest } from 'next/server'

// Rutas que requieren estar autenticado
const PROTECTED_PREFIXES = ['/dashboard']

// Rutas solo para no-autenticados
const AUTH_ONLY_ROUTES = ['/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // El token de sesión de Firebase se guarda en cookie tras el login
  // (lo seteamos en AuthContext con una cookie httpOnly ligera)
  const sessionCookie = request.cookies.get('session')?.value
  const isAuthenticated = Boolean(sessionCookie)

  // Redirigir a login si intenta acceder a ruta protegida sin sesión
  if (PROTECTED_PREFIXES.some(p => pathname.startsWith(p)) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir al dashboard si ya está logueado e intenta ir a /login
  if (AUTH_ONLY_ROUTES.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/pending',
  ],
}
