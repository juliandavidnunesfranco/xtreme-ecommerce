import { type NextRequest, NextResponse } from "next/server"
import { getProducts } from "@/lib/google-sheets"

export const dynamic = "force-dynamic"

// --- cache en memoria ---
let cachedProducts: any[] = []
let lastFetch = 0
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos

export async function GET(request: NextRequest) {
  try {
    const now = Date.now()
    if (cachedProducts.length === 0 || now - lastFetch > CACHE_TTL) {
      console.log("Cache vencido, leyendo de Google Sheets...")
      cachedProducts = await getProducts()
      lastFetch = now
    } else {
      console.log("Usando cache en memoria...")
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "20", 10)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const brand = searchParams.get("brand")

    // lista completa
    const allProducts = cachedProducts
    console.log(`API: Fetched ${allProducts.length} products from cache`)

    // filtros
    const categories = [...new Set(allProducts.map((p) => p.category))].sort()
    const brands = [...new Set(allProducts.map((p) => p.brand))].sort()

    let filteredProducts = allProducts
    if (search) {
      const term = search.toLowerCase()
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term)
      )
    }
    if (category && category !== "all") {
      filteredProducts = filteredProducts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      )
    }
    if (brand && brand !== "all") {
      filteredProducts = filteredProducts.filter(
        (p) => p.brand.toLowerCase() === brand.toLowerCase()
      )
    }

    // paginación
    const totalFiltered = filteredProducts.length
    const offset = (page - 1) * limit
    const paginatedProducts = filteredProducts.slice(offset, offset + limit)
    const hasMore = offset + limit < totalFiltered

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      total: totalFiltered,
      page,
      limit,
      hasMore,
      filters: { categories, brands },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { success: false, error: "Error fetching products" },
      { status: 500 }
    )
  }
}
