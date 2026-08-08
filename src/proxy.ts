import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateToken, verifyToken, getClientIp } from './lib/auth';

// --- Configuración de Seguridad ---
const TOKEN_COOKIE_NAME = 'auth_token'; // process.env.TOKEN_COOKIE_NAME!;
const BLOCKED_USER_AGENTS = ['AhrefsBot', 'YandexBot', 'SemrushBot', 'BLEXBot', 'PetalBot'];

// --- Lógica de Rate Limiting en Memoria ---
const ipRequestCounts = new Map<string, number>();
const ipBlockUntil = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 30;    // 30 peticiones por minuto por IP
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueo

/**
 * Proxy principal de seguridad (antes "middleware", renombrado en Next.js 16).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // 1. Bloqueo de User-Agents maliciosos
  const userAgent = request.headers.get('user-agent') ?? '';
  if (BLOCKED_USER_AGENTS.some(agent => userAgent.includes(agent))) {
    console.log(`User-Agent bloqueado: ${userAgent} (IP: ${ip})`);
    return new NextResponse('Acceso denegado', { status: 403 });
  }

  // 2. Verificación de bloqueo de IP por Rate Limit
  if (ipBlockUntil.has(ip) && ipBlockUntil.get(ip)! > Date.now()) {
    return new NextResponse('IP bloqueada temporalmente', { status: 429 });
  }

  // 3. Lógica para rutas API
  if (pathname.includes('/api/')) {
    // 3.1. Aplicar Rate Limiting a TODAS las rutas /api/* (excepto /api/auth)
    const now = Date.now();
    const requestCount = ipRequestCounts.get(ip) ?? 0;

    if (requestCount >= RATE_LIMIT_MAX_REQUESTS) {
      ipBlockUntil.set(ip, now + BLOCK_DURATION_MS);
      ipRequestCounts.delete(ip);
      console.warn(`Rate limit excedido para IP: ${ip}. Bloqueada por 5 minutos.`);
      return new NextResponse('Demasiadas peticiones', { status: 429 });
    }
    ipRequestCounts.set(ip, requestCount + 1);
    setTimeout(() => ipRequestCounts.delete(ip), RATE_LIMIT_WINDOW_MS);

    // 3.2. Validar Token JWT solo para rutas sensibles
    const isPublicProductRead = request.method === 'GET' && pathname.startsWith('/api/products');
    const isAllowedAuthRoute = pathname.startsWith('/api/auth');
    
    if (!isPublicProductRead && !isAllowedAuthRoute) {
      const { valid, error } = await verifyToken(request);
      if (!valid) {
        console.warn(`Validación de token fallida para IP ${ip}. Razón: ${error}`);
        return new NextResponse(`No autorizado: ${error}`, { status: 401 });
      }
    }
  }

  // 4. Protección de Assets (Hotlinking)
   if (pathname.startsWith('/_next/image') || pathname.endsWith('.jpg') || pathname.endsWith('.mp4') || pathname.endsWith('.png')|| pathname.endsWith('.svg')|| pathname.endsWith('.json')|| pathname.endsWith('.js')|| pathname.endsWith('.txt')) {
    const referer = request.headers.get('referer');
    const validDomain = process.env.NEXT_PUBLIC_BASE_URL!;
    //const isAllowed = process.env.NODE_ENV !== 'production' || !referer || (validDomain && referer.startsWith(validDomain));
    const isAllowed = !validDomain || (referer && referer.startsWith(validDomain));
    if (!isAllowed) {
      console.log(`Intento de hotlinking. Referer: ${referer}, IP: ${ip}`);
      return new NextResponse('Acceso denegado', { status: 403 });
    }
  }

  // 5. Asignación de Token para nuevos visitantes
  const response = NextResponse.next();
  const hasToken = request.cookies.has(TOKEN_COOKIE_NAME);
  if (!hasToken) {
    try {
      const token = await generateToken(request);
      response.cookies.set(TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: !!process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.startsWith('https'), // Deriva si es producción de la URL
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 día
      });
    } catch (e) {
      console.error("Error al generar el token:", e);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico).+)',
    '/',
  ],
};