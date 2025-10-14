import { google } from "googleapis";
import { unstable_cache as cache, revalidateTag } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const GOOGLE_SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE!;
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME!;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY!.replace(
  /\\n/g,
  "\n"
);

export interface Product {
  id: string; // Corresponds to UUID in Column A
  code: string;
  name: string;
  description?: string; // Optional field
  stock: number;
  price: number;
  brand: string; // Derived, not a column
  category: string; // Derived, not a column
  image?: string; // Optional field
  rowIndex: number;
}

class GoogleSheetsService {
  private sheets: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    this.sheets = google.sheets({ version: "v4", auth });
  }

  private async _fetchProductsFromSheet(): Promise<Product[]> {
    try {
      console.log("Connecting to Google Sheets to refresh product cache...");
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: `${GOOGLE_SHEET_NAME}!${GOOGLE_SHEET_RANGE}`,
        valueRenderOption: "FORMATTED_VALUE",
        majorDimension: "ROWS",
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        console.log("No data found in sheets");
        return [];
      }

      const dataRows = rows.slice(1);
      const products = dataRows.map((row: any[], index: number) => {
        const [id, code, name, description, stock, price, image] = row;
        return {
          id: id || "", // Column A: UUID
          code: code || "",
          name: name || "",
          description: description || "",
          stock: Number.parseInt(stock) || 0,
          price: Number.parseFloat(String(price).replace(/[^0-9.-]+/g, "")) || 0,
          brand: this.extractBrand(name || ""),
          category: this.categorizeProduct(name || "", description || ""),
          image: image || "",
          rowIndex: index + 2, // rowIndex is 1-based for sheets, +1 for header
        };
      });

      console.log("Products processed and cached successfully:", products.length);
      return products;
    } catch (error) {
      console.error("Error fetching products from Google Sheets:", error);
      return [];
    }
  }

  public getProducts(): Promise<Product[]> {
    const cachedFn = cache(
      this._fetchProductsFromSheet.bind(this),
      ['google-sheets-products'],
      {
        revalidate: 300, // 5 minutes
        tags: ['products'],
      }
    );
    return cachedFn();
  }

  public async getProductById(id: string): Promise<Product | null> {
    if (!id) return null;
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async createOrder(items: any[], total: number, customerInfo: any): Promise<string> {
    try {
      const GOOGLE_SHEET_ORDERS_NAME = process.env.GOOGLE_SHEET_ORDERS_NAME!;
      if (!GOOGLE_SHEET_ORDERS_NAME) {
        throw new Error("Missing GOOGLE_SHEET_ORDERS_NAME environment variable");
      }
      const timestamp = new Date().toISOString();
      const orderId = `ORD-${Date.now()}`;
      const itemsString = JSON.stringify(items.map(item => ({ id: item.id, code: item.code, name: item.name, quantity: item.quantity, price: item.price })));
      const customerInfoString = JSON.stringify(customerInfo);
      const status = "Pending";

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: `${GOOGLE_SHEET_ORDERS_NAME}!A1`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[orderId, timestamp, itemsString, total, customerInfoString, status]],
        },
      });
      return orderId;
    } catch (error) {
      console.error("Error creating order in Google Sheets:", error);
      throw new Error("Could not create order.");
    }
  }

  async updateStock(items: any[]): Promise<void> {
    try {
      const data = items.map(item => {
        return {
          range: `${GOOGLE_SHEET_NAME}!E${item.rowIndex}`,
          values: [[item.stock - item.quantity]],
        };
      });

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        resource: {
          valueInputOption: "USER_ENTERED",
          data: data,
        },
      });
      
      revalidateTag('products');
      console.log("Product stock updated, cache revalidated.");

    } catch (error) {
      console.error("Error updating stock in Google Sheets:", error);
      throw new Error("Could not update stock.");
    }
  }

  async updateProductDescription(
    rowIndex: number,
    description: string
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: `${GOOGLE_SHEET_NAME}!D${rowIndex}`,
        valueInputOption: "RAW",
        resource: {
          values: [[description]],
        },
      });
      revalidateTag('products');
    } catch (error) {
      console.error("Error updating product description:", error);
    }
  }

  private extractBrand(productName: string): string {
    const commonBrands = [
      "BOSCH", "MAKITA", "DEWALT", "BLACK+DECKER", "STANLEY", "TRUPER",
      "MILWAUKEE", "RYOBI", "CRAFTSMAN", "IRWIN", "KLEIN", "RIDGID",
      "PORTER-CABLE", "DELTA", "SKIL", "WORX", "KOBALT", "HUSKY", "HART",
      "BAUER", "CHICAGO", "HARBOR", "TEKTON", "GEARWRENCH", "SNAP-ON",
      "MAC", "MATCO", "CORNWELL", "PROTO", "FACOM", "GEDORE", "HAZET",
      "STAHLWILLE", "WERA", "WIHA", "FELO", "PB SWISS", "FESTOOL", "METABO",
      "HILTI", "SENCO", "DEWALT", "BOSTITCH", "SPAX", "SIMONIZ", "3M",
      "SCOTCH", "TITAN", "GRACO", "WAGNER", "SIKA", "ARGOS", "SAN MARCOS",
      "CEMEX", "HOLCIM", "LAFARGE", "QUIMEX", "PINTURAS OSEL",
      "PINTURAS BEREL", "PINTURAS COMEX", "PINTURAS SHERWIN-WILLIAMS",
      "PINTURAS DULUX", "PINTURAS MONTANA", "PINTURAS VALENTINE",
      "PINTURAS BEHR", "PINTURAS VELVET", "PINTURAS PPG", "PINTURAS PRISMA",
      "PINTURAS PINTUCO",
    ];

    const upperName = productName.toUpperCase();

    for (const brand of commonBrands) {
      if (upperName.includes(brand)) {
        return brand;
      }
    }

    const firstWord = productName.split(" ")[0]?.toUpperCase();
    if (firstWord && firstWord.length > 2 && firstWord.length < 15) {
      return firstWord;
    }

    return "GENÉRICO";
  }

  private categorizeProduct(name: string, description: string): string {
    const text = `${name} ${description}`.toLowerCase();

    const categories = {
      "Herramientas Eléctricas": ["taladro", "sierra", "amoladora", "lijadora", "router", "caladora", "martillo", "rotomartillo"],
      "Herramientas Manuales": ["destornillador", "llave", "alicate", "martillo", "cincel", "lima", "serrucho", "nivel"],
      "Ferretería": ["tornillo", "tuerca", "arandela", "perno", "clavo", "remache", "bisagra", "cerradura"],
      "Eléctrico": ["cable", "interruptor", "enchufe", "lámpara", "bombilla", "fusible", "breaker", "contacto"],
      "Plomería": ["tubería", "codo", "válvula", "llave", "sifón", "grifo", "manguera", "conexión"],
      "Construcción": ["cemento", "arena", "grava", "ladrillo", "block", "varilla", "alambre", "malla"],
      "Pintura": ["pintura", "brocha", "rodillo", "thinner", "barniz", "esmalte", "primer", "sellador"],
      "Seguridad": ["casco", "guante", "lente", "mascarilla", "arnés", "chaleco", "bota", "protección"],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category;
      }
    }

    return "General";
  }

  async createProduct(productData: Omit<Product, 'rowIndex' | 'id' | 'brand' | 'category'>): Promise<void> {
    try {
      const newUuid = uuidv4();
      const values = [
        newUuid, // Column A: UUID
        productData.code,
        productData.name,
        productData.description || '', // Ensure empty string if undefined
        productData.stock,
        productData.price,
        productData.image || '', // Ensure empty string if undefined
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: `${GOOGLE_SHEET_NAME}!A1`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [values],
        },
      });
      revalidateTag('products');
    } catch (error) {
      console.error("Error creating product in Google Sheets:", error);
      throw new Error("Could not create product.");
    }
  }

  async updateProduct(rowIndex: number, productData: Partial<Omit<Product, 'brand' | 'category'>>): Promise<void> {
    try {
      const values = [
        productData.id,       // Column A: UUID
        productData.code,
        productData.name,
        productData.description || '',
        productData.stock,
        productData.price,
        productData.image || '',
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: `${GOOGLE_SHEET_NAME}!A${rowIndex}:G${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [values],
        },
      });
      revalidateTag('products');
    } catch (error) {
      console.error("Error updating product in Google Sheets:", error);
      throw new Error("Could not update product.");
    }
  }

  async deleteProduct(rowIndex: number): Promise<void> {
    try {
      const sheetId = await this._getSheetId(GOOGLE_SHEET_NAME);
      if (sheetId === null) {
        throw new Error(`Sheet with name ${GOOGLE_SHEET_NAME} not found`);
      }

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex,
                },
              },
            },
          ],
        },
      });
      revalidateTag('products');
    } catch (error) {
      console.error("Error deleting product from Google Sheets:", error);
      throw new Error("Could not delete product.");
    }
  }

  // Helper para obtener el ID de una hoja por su nombre
  private async _getSheetId(sheetName: string): Promise<number | null> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
      });
      const sheet = response.data.sheets?.find(
        (s: any) => s.properties?.title === sheetName
      );
      return sheet?.properties?.sheetId ?? null;
    } catch (error) {
      console.error("Error fetching sheet ID:", error);
      return null;
    }
  }

  async generateDescription(productName: string): Promise<string> {
    const name = productName.toLowerCase();

    if (name.includes("taladro")) return `Taladro profesional ideal para perforación en diversos materiales. Diseño ergonómico y alta durabilidad para uso intensivo.`;
    if (name.includes("sierra")) return `Sierra de alta precisión para cortes profesionales. Construcción robusta y fácil manejo para trabajos exigentes.`;
    if (name.includes("martillo")) return `Martillo de construcción con mango ergonómico. Cabeza balanceada para mayor precisión y menos fatiga.`;
    if (name.includes("destornillador")) return `Destornillador de precisión con punta magnética. Mango antideslizante para mayor control y comodidad.`;
    if (name.includes("llave")) return `Llave de alta calidad fabricada en acero resistente. Diseño profesional para uso industrial y doméstico.`;

    return `Producto de ferretería de alta calidad. Fabricado con materiales resistentes para garantizar durabilidad y rendimiento óptimo.`;
  }
}

export const googleSheetsService = new GoogleSheetsService();

export const getProducts = googleSheetsService.getProducts.bind(googleSheetsService);
export const getProductById = googleSheetsService.getProductById.bind(googleSheetsService);
export const createOrder = googleSheetsService.createOrder.bind(googleSheetsService);
export const updateStock = googleSheetsService.updateStock.bind(googleSheetsService);
export const updateProductDescription = googleSheetsService.updateProductDescription.bind(googleSheetsService);
export const generateDescription = googleSheetsService.generateDescription.bind(googleSheetsService);