import { type NextRequest, NextResponse } from "next/server"
import { getProductById } from "@/lib/google-sheets"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = id ?? "";
    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    }

    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    // You can still create specifications or other derived data here if needed
    const specifications = {
      Código: product.code,
      Marca: product.brand,
      Categoría: product.category,
      "Stock disponible": product.stock.toString(),
      Estado: product.stock > 0 ? "Disponible" : "Agotado",
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        uuid: product.id, // For compatibility with existing components
        specifications,
      },
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ success: false, error: "Error fetching product" }, { status: 500 })
  }
}
