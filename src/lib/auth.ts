
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT, DefaultJWT } from "next-auth/jwt";

// Augment the default types for NextAuth
declare module "next-auth" {
  interface Session {
    user: { role: string; } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    role: string;
  }
}
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
  }
}

// --- Lógica de Tokens con JOSE (para visitantes) ---
const secretKey = process.env.INTERNAL_API_KEY;
const encodedKey = new TextEncoder().encode(secretKey!);
const TOKEN_COOKIE_NAME = process.env.TOKEN_COOKIE_NAME!;

export const generateToken = async (request: NextRequest) => {
  if (!secretKey) throw new Error('INTERNAL_API_KEY is not defined');
  const ip = request.ip ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const token = await new SignJWT({ ip, userAgent })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(encodedKey);
  return token;
};

export const verifyToken = async (request: NextRequest) => {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return { valid: false, error: 'No token provided' };
  if (!secretKey) return { valid: false, error: 'Server configuration error' };
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
    const currentIp = request.ip ?? 'unknown';
    const currentUserAgent = request.headers.get('user-agent') ?? 'unknown';
    if (payload.ip !== currentIp || payload.userAgent !== currentUserAgent) {
      return { valid: false, error: 'Token-request mismatch' };
    }
    return { valid: true, error: null };
  } catch (err: any) {
    return { valid: false, error: err.code || 'Token invalid' };
  }
};
