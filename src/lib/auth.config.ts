import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { verifyCredentials, syncGoogleUser, isGoogleUserAuthorized } from "@/lib/actions/user.actions";

import userSheetService from "@/lib/google-user-sheet";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;
        const { email, password } = validatedFields.data;
        
        // Llama a la Server Action limpia
        const user = await verifyCredentials(email, password);
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // 1. Llama a la Server Action para autorizar
        const authorized = await isGoogleUserAuthorized(user.email!)
        if (!authorized) {
          console.warn(`Acceso denegado para el usuario de Google no autorizado: ${user.email}`);
          return false; // Bloquear login
        }

        // 2. Si está autorizado, llama a la Server Action para sincronizar
        const syncResult = await syncGoogleUser(user);
        if (!syncResult.success) {
          // Opcional: decidir si bloquear el login si la escritura en la BD falla
          console.error("Falló la sincronización del usuario, pero se permite el login.");
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Si el objeto `user` existe, es un inicio de sesión.
      if (user) {
        // Intenta obtener el rol directamente del objeto user (para Credentials)
        let userRole = (user as any).role;

        // Si no hay rol (p.ej. en un login con Google), búscalo en la base de datos.
        if (!userRole && user.email) {
          const dbUser = await userSheetService.findUserByEmail(user.email);
          if (dbUser) {
            userRole = dbUser.role;
          }
        }
        // Asigna el rol al token. Si no se encuentra, se puede poner un rol por defecto.
        token.role = userRole || 'user';
      }
      // En peticiones subsecuentes, el rol ya estará en el token.
      return token;
    },
    session({ session, token }) {
      // Asigna el rol del token a la sesión del cliente.
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET!,
};