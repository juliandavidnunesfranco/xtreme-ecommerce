'use server'
import { google } from "googleapis";

const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const GOOGLE_SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE!;
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME!;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY!.replace(
  /\\n/g,
  "\n"
);

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  stock: number;
  price: number;
  brand: string;
  category: string;
  image: string;
  rowIndex: number;
}

class GoogleSheetsService {
  private sheets: any;
  private cachedProducts: Product[] = [];
  private lastCacheTime: number = 0;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

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

  async getProducts(): Promise<Product[]> {
    const now = Date.now();
    if (
      now - this.lastCacheTime < this.cacheDuration &&
      this.cachedProducts.length > 0
    ) {
      console.log("Returning products from cache.");
      return this.cachedProducts;
    }

    try {
      console.log("Connecting to Google Sheets...");
      console.log(
        "Spreadsheet ID:",
        GOOGLE_SPREADSHEET_ID?.substring(0, 10) + "..."
      );
      console.log("Sheet Name:", GOOGLE_SHEET_NAME);
      console.log("Range:", GOOGLE_SHEET_RANGE);

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: `${GOOGLE_SHEET_NAME}!${GOOGLE_SHEET_RANGE}`,
        valueRenderOption: "FORMATTED_VALUE",
        majorDimension: "ROWS",
      });

      console.log("Google Sheets response received");
      const rows = response.data.values || [];
      console.log("Total rows from sheets:", rows.length);

      if (rows.length === 0) {
        console.log("No data found in sheets");
        return [];
      }

      // Skip header row
      const dataRows = rows.slice(1);
      console.log("Data rows (excluding header):", dataRows.length);

      const products = dataRows.map((row: any[], index: number) => {
        const [id, code, name, description, stock, price, image] = row;
        
        return {
          id: id || "",
          code: code || "",
          name: name || "",
          description: description || "",
          stock: Number.parseInt(stock) || 0,
          price:
            Number.parseFloat(
              String(price).replace(/[^0-9.-]+/g, "")
            ) || 0,
          brand: this.extractBrand(name || ""),
          category: this.categorizeProduct(name || "", description || ""),
          image: image || "",
          rowIndex: index + 2,
        };
      });

      console.log("Products processed successfully:", products.length);
      this.cachedProducts = products;
      this.lastCacheTime = now;
      console.log(
        `Products cached. Cache will expire in ${ 
          this.cacheDuration / 60000 
        } minutes.`
      );
      return products;
    } catch (error) {
      console.error("Error fetching products from Google Sheets:", error);
      if (this.cachedProducts.length > 0) {
        console.log("Returning stale cache due to fetch error.");
        return this.cachedProducts;
      }
      return [];
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      // Step 1: Get all IDs from the ID column to find the row number.
      const idColumn = 'A:A'; // Assuming ID is in column A
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: `${GOOGLE_SHEET_NAME}!${idColumn}`,
      });

      const ids = response.data.values?.flat() || [];
      // rowIndex is 1-based. +1 because sheet arrays are 0-based.
      const rowIndex = ids.indexOf(id) + 1;

      if (rowIndex === 0) { // indexOf returns -1 if not found, so rowIndex will be 0
        console.log(`Product with ID ${id} not found.`);
        return null;
      }

      // Step 2: Get the specific row using the found rowIndex.
      // Corrected range to fetch columns A through G.
      const productRange = `A${rowIndex}:G${rowIndex}`; 
      const productResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: `${GOOGLE_SHEET_NAME}!${productRange}`,
        valueRenderOption: "FORMATTED_VALUE",
      });

      const row = productResponse.data.values?.[0];
      if (!row) {
        return null;
      }

      
      const [prodId, code, name, description, stock, price, image] = row;
      
      const product: Product = {
        id: prodId || "",
        code: code || "",
        name: name || "",
        description: description || "",
        stock: Number.parseInt(stock) || 0,
         price:
            Number.parseFloat(
              String(price).replace(/[^0-9.-]+/g, "")
            ) || 0,
        brand: this.extractBrand(name || ""),
        category: this.categorizeProduct(name || "", description || ""),
        image: image || "",
        rowIndex: rowIndex,
      };

      return product;

    } catch (error) {
      console.error(`Error fetching product by id: ${id}`, error);
      return null;
    }
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
      const status = "Pending"; // Changed from "Pending" to be more explicit

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
      
      this.lastCacheTime = 0;
      this.cachedProducts = [];
      console.log("Product stock updated, cache invalidated.");

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

const googleSheetsService = new GoogleSheetsService();

export const getProducts = googleSheetsService.getProducts.bind(googleSheetsService);
export const getProductById = googleSheetsService.getProductById.bind(googleSheetsService);
export const createOrder = googleSheetsService.createOrder.bind(googleSheetsService);
export const updateStock = googleSheetsService.updateStock.bind(googleSheetsService);
export const updateProductDescription = googleSheetsService.updateProductDescription.bind(googleSheetsService);
export const generateDescription = googleSheetsService.generateDescription.bind(googleSheetsService);