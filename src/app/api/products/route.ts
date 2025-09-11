import { type NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page") as string, 10)
      : 1;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string, 10)
      : 20;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    // 1. Fetch all products (will be cached after first call)
    const allProducts = await getProducts();
    console.log(`API: Fetched ${allProducts.length} products from service`);

    // 2. Get filters from the complete, unfiltered list
    const categories = [...new Set(allProducts.map((p) => p.category))].sort();
    const brands = [...new Set(allProducts.map((p) => p.brand))].sort();

    // 3. Apply filters
    let filteredProducts = allProducts;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.code.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm)
      );
    }
    if (category && category !== "all") {
      filteredProducts = filteredProducts.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (brand && brand !== "all") {
      filteredProducts = filteredProducts.filter(
        (product) => product.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    // 4. Apply pagination
    const totalFiltered = filteredProducts.length;
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
    const hasMore = offset + limit < totalFiltered;

    console.log(
      `API: Returning ${paginatedProducts.length} products for page ${page}`
    );
    
    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      total: totalFiltered,
      page,
      limit,
      hasMore,
      filters: {
        categories,
        brands,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching products" },
      { status: 500 }
    );
  }
}
