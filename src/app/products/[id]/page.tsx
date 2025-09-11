import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/product-detail-client";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getProductById(params.id);

  if (!product) {
    return {
      title: "Producto no encontrado",
      description: "Este producto no existe o no está disponible.",
    };
  }

  return {
    title: `${product.name}`,
    description: `${product.name} - Xtreme Construction E-commerce, Ferreteria, Eléctricos y Materiales de construcción al mejor precio.`,
    openGraph: {
      title: product.name,
      description: `${product.name} - Xtreme Construction E-commerce, Ferreteria, Eléctricos y Materiales de construcción al mejor precio.`,
      images: [{ url: product.image, alt: product.name }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (!id || id.length === 0) {
    notFound();
  }

  // Fetch the product using the first id in the array
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <ProductDetailClient product={product} />
    </div>
  );
}
