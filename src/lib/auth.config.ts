import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { verifyCredentials, syncGoogleUser, isGoogleUserAuthorized } from "@/lib/actions/user.actions";

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
    jwt({ token, user }) {
      if (user) { token.role = (user as any).role; }
      return token;
    },
    session({ session, token }) {
      if (session.user) { session.user.role = token.role; }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET!,
};