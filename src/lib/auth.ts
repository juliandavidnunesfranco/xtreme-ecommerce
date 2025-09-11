'use server'
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const secretKey = process.env.INTERNAL_API_KEY;
const encodedKey = new TextEncoder().encode(secretKey);

const TOKEN_COOKIE_NAME = process.env.TOKEN_COOKIE_NAME!;

/**
 * Genera un JWT para un nuevo visitante.
 * El token contiene la IP y el User-Agent para validación posterior.
 */
export const generateToken = async (request: NextRequest) => {
  const ip = request.ip ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';

  if (!secretKey) {
    throw new Error('INTERNAL_API_KEY is not defined in environment variables');
  }

  const token = await new SignJWT({ ip, userAgent })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // El token es válido por 1 día
    .sign(encodedKey);

  return token;
};

/**
 * Verifica la validez de un JWT extraído del header de autorización.
 * Comprueba que la firma es correcta y que la IP y User-Agent coinciden con la petición actual.
 */
export const verifyToken = async (request: NextRequest) => {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  if (!secretKey) {
    // Esto no debería pasar si el middleware se ejecuta correctamente
    console.error('INTERNAL_API_KEY not defined for verification');
    return { valid: false, error: 'Server configuration error' };
  }

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });

    // Verificación de consistencia: el token solo es válido para la misma IP y User-Agent
    const currentIp = request.ip ?? 'unknown';
    const currentUserAgent = request.headers.get('user-agent') ?? 'unknown';

    if (payload.ip !== currentIp || payload.userAgent !== currentUserAgent) {
      console.warn(`Token-Request mismatch. Token IP: ${payload.ip}, Req IP: ${currentIp}`);
      return { valid: false, error: 'Token-request mismatch' };
    }

    return { valid: true, error: null };
  } catch (err: any) {
    // Manejo de errores específicos de JWT (expirado, firma inválida, etc.)
    return { valid: false, error: err.code || 'Token invalid' };
  }
};
