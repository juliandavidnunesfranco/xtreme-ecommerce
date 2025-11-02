"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@/lib/google-sheets";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      code: product.code,
      stock: product.stock,
      image: product.image || "/Logo-Xtreme-Construction.png",
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
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={
              product.image ||
              `/Logo-Xtreme-Construction.png?height=200&width=300&query=${encodeURIComponent(
                product.name + " hardware tool ferreteria"
              )}`
            }
            alt={product.name}
            className="w-full h-48 object-contain rounded-t-lg p-2"
          />
          {product.stock < 5 && product.stock > 0 && (
            <Badge className="absolute top-2 right-2 bg-destructive">
              Pocas unidades
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge className="absolute top-2 right-2 bg-slate-600">Agotado</Badge>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Link href={`/products/${product.id}`}>
              <Button size="sm" variant="secondary">
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalles
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Código: {product.code}
            </p>
            {product.brand && product.brand !== "GENÉRICO" && (
              <Badge variant="outline" className="text-xs">
                {product.brand}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description || "Producto de ferretería de alta calidad"}
          </p>

          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-lg text-primary">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-muted-foreground">
              Stock: {product.stock}
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 0 ? "Agotado" : "Agregar al Carrito"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
