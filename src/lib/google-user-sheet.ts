import { google } from "googleapis";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export type SheetUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  access: string;
  passwordHash: string;
  rowIndex: number;
};

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const SPREADSHEET_USERS_RANGE = process.env.GOOGLE_SHEET_USERS_RANGE!;
const SPREADSHEET_USERS_NAME = process.env.GOOGLE_SHEET_USERS_NAME!

class UserSheetService {
  private sheets: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file"
      ],
    });
    this.sheets = google.sheets({ version: "v4", auth });
  }

  async findUserByEmail(email: string): Promise<SheetUser | null> {
    if (!email) return null;
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SPREADSHEET_USERS_NAME}!${SPREADSHEET_USERS_RANGE}`,
        valueRenderOption: "FORMATTED_VALUE",
        majorDimension: "ROWS",
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        console.log("No data found in users sheet");
        return null;
      }

      const userRowIndex: number = rows.findIndex((row: string[]) => row[2] && row[2].toLowerCase() === email.toLowerCase());
      if (userRowIndex === -1) return null;

      const userData = rows[userRowIndex];
      return {
        rowIndex: userRowIndex + 1,
        id: userData[0],
        name: userData[1],
        email: userData[2],
        avatar: userData[3],
        role: userData[4],
        access: userData[5],
        passwordHash: userData[6],
      };
    } catch (error) {
      console.error("Error en findUserByEmail:", error);
      return null;
    }
  }

  async listUsers(): Promise<Omit<SheetUser, 'passwordHash'>[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SPREADSHEET_USERS_NAME}!${SPREADSHEET_USERS_RANGE}`,
        valueRenderOption: "FORMATTED_VALUE",
        majorDimension: "ROWS",
      });
      const rows = response.data.values || [];
      if (!rows || rows.length <= 1) return [];

      const users = rows.slice(1).map((row: any[], index: number) => ({
        rowIndex: index + 2,
        id: row[0],
        name: row[1],
        email: row[2],
        avatar: row[3],
        role: row[4],
        access: row[5],
      }));
      return users;
    } catch (error) {
      console.error("Error en listUsers:", error);
      return [];
    }
  }

  async upsertUser(data: Partial<Omit<SheetUser, 'rowIndex' | 'id'>> & { email: string; password?: string; passwordHash?: string }) {
    try {
      const sheetName = SPREADSHEET_USERS_NAME;

      // Hashear la contraseña si se proporciona una en texto plano
      let finalPasswordHash = data.passwordHash;
      if (data.password) {
        finalPasswordHash = await bcrypt.hash(data.password, 10);
      }

      const existingUser = await this.findUserByEmail(data.email);

      if (existingUser) {
        const updatedValues = [
          existingUser.id,
          data.name ?? existingUser.name,
          data.email ?? existingUser.email,
          data.avatar ?? existingUser.avatar,
          'admin', // Forzar rol a admin en la actualización
          data.access ?? existingUser.access,
          finalPasswordHash ?? existingUser.passwordHash, // Usar el nuevo hash o mantener el anterior
        ];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A${existingUser.rowIndex}:G${existingUser.rowIndex}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [updatedValues] },
        });
        return { success: true, message: "Usuario actualizado correctamente." };
      } else {
        if (!data.name) {
          throw new Error("El nombre es requerido para crear un nuevo usuario.");
        }
        const newValues = [
          randomUUID(),
          data.name,
          data.email,
          data.avatar ?? 'https://avatar.vercel.sh/default.png',
          'admin', // Forzar rol a admin en la creación
          data.access ?? 'basic',
          finalPasswordHash ?? '', // Usar el nuevo hash o un string vacío
        ];

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: sheetName, // Para append, solo se necesita el nombre de la hoja
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [newValues] },
        });
        return { success: true, message: "Usuario creado correctamente." };
      }
    } catch (error) {
      console.error("Error en upsertUser:", error);
      return { success: false, message: "Error al procesar el usuario." };
    }
  }
}

const userSheetService = new UserSheetService();
export default userSheetService;