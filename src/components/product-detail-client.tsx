"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, Package, Barcode, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@/lib/google-sheets";
import Link from "next/link";

export function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      code: product.code,
      stock: product.stock,
      image: product.image,
      rowIndex: product.rowIndex,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Productos
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div>
          <div className="bg-card rounded-lg overflow-hidden aspect-square">
            <img
              src={
                product.image ||
                `/Logo-Xtreme-Construction.png?height=600&width=600&query=${encodeURIComponent(
                  product.name + " hardware tool ferreteria"
                )}`
              }
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-center">
          <h1 className="font-playfair font-bold text-3xl lg:text-4xl text-foreground mb-3">
            {product.name}
          </h1>

          <div className="flex items-center space-x-4 mb-4">
            <Badge variant="secondary">{product.category}</Badge>
            {product.brand && product.brand !== "GENÉRICO" && (
              <Badge variant="outline">{product.brand}</Badge>
            )}
          </div>

          <p className="text-muted-foreground mb-6">{product.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center">
              <Barcode className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>
                Código: <strong>{product.code}</strong>
              </span>
            </div>
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>
                Stock: <strong>{product.stock} unidades</strong>
              </span>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 flex items-center justify-between mb-6">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {product.stock === 0 ? "Agotado" : "Agregar al Carrito"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
