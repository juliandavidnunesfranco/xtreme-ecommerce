import { type NextRequest, NextResponse } from "next/server"
import { getProducts, generateDescription, updateProductDescription } from "@/lib/google-sheets"

export async function POST(request: NextRequest) {
  try {
    const products = await getProducts()
    let updatedCount = 0

    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      // Only generate description if it's empty or very short
      if (!product.description || product.description.length < 10) {
        const newDescription = await generateDescription(product.name)
        await updateProductDescription(i, newDescription)
        updatedCount++

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated descriptions for ${updatedCount} products`,
      updatedCount,
    })
  } catch (error) {
    console.error("Error generating descriptions:", error)
    return NextResponse.json({ success: false, error: "Error generating descriptions" }, { status: 500 })
  }
}
