'use server';

import userSheetService from "@/lib/google-user-sheet";
import bcrypt from "bcryptjs";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3),
  avatar: z.string().url().optional(),
  role: z.string().optional(),
  access: z.string().optional(),
  password: z.string().min(6).optional(),
});

/**
 * Server Action para crear o actualizar un usuario, manejando el hashing de la contraseña.
 */
export async function upsertUserAction(data: unknown) {

  console.log("upsertUserAction data:", data);
  const validation = userSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, message: "Datos de usuario inválidos.", errors: validation.error.flatten().fieldErrors };
  }

  try {
    const result = await userSheetService.upsertUser(validation.data);
    return result;
  } catch (error) {
    console.error("Error en upsertUserAction:", error);
    return { success: false, message: "Error interno al procesar el usuario." };
  }
}


/**
 * Verifica si un email está autorizado para iniciar sesión vía Google.
 * @param email El email del usuario.
 * @returns `true` si está autorizado, `false` si no.
 */
export async function isGoogleUserAuthorized(email: string): Promise<boolean> {
  if (!email) return false;

  try {
    const superUserEmail = process.env.VALID_EMAIL?.toLowerCase();
    if (email.toLowerCase() === superUserEmail) {
      return true; // El super admin siempre está autorizado
    }

    const userExistsInSheet = await userSheetService.findUserByEmail(email);
    return userExistsInSheet !== null; // Autorizado si ya existe en la hoja

  } catch (error) {
    console.error("Error en isGoogleUserAuthorized:", error);
    return false;
  }
}

/**
 * Verifica las credenciales de un usuario (email/password) contra Google Sheets.
 * @returns El objeto de usuario si es válido, de lo contrario null.
 */
export async function verifyCredentials(email: string, password: string): Promise<any | null> {
  try {
    const user = await userSheetService.findUserByEmail(email);
    if (!user || !user.passwordHash) return null;

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.avatar,
      role: user.role,
    };
  } catch (error) {
    console.error("Error en verifyCredentials:", error);
    return null;
  }
}

/**
 * Sincroniza un usuario desde un proveedor OAuth (Google) a la hoja de cálculo.
 */
export async function syncGoogleUser(user: { name?: string | null; email?: string | null; image?: string | null; }) {
  if (!user || !user.email) {
    throw new Error("Datos de usuario de Google incompletos.");
  }
  try {
    await userSheetService.upsertUser({
      name: user.name!,
      email: user.email!,
      avatar: user.image!,
    });
    return { success: true };
  } catch (error) {
    console.error("Error en syncGoogleUser:", error);
    return { success: false };
  }
}