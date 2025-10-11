"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Loader2 } from "lucide-react";
import { Product } from "@/lib/google-sheets";

export function ProductList() {
  const searchParams = useSearchParams();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "all",
    brand: searchParams.get("brand") || "all",
  });

  // Infinite scroll observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Data fetching function
  const fetchProducts = useCallback(
    async (currentPage: number, isNewFilter = false) => {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "24",
        search: filters.search,
        category: filters.category,
        brand: filters.brand,
      });

      try {
        const response = await fetch(`/api/products?${params.toString()}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })
        const data = await response.json();

        if (data.success) {
          setProducts((prev) =>
            isNewFilter ? data.products : [...prev, ...data.products]
          );
          setHasMore(data.hasMore);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
        if (initialLoading) setInitialLoading(false);
      }
    },
    [filters, initialLoading]
  );

  // Effect for when search params change from header
  useEffect(() => {
    setPage(1);
    setFilters({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "all",
      brand: searchParams.get("brand") || "all",
    });
  }, [searchParams]);

  // Effect to fetch products when filters change
  useEffect(() => {
    fetchProducts(1, true); // Fetch page 1 with new filters
  }, [filters, fetchProducts]);

  // Effect for infinite scroll
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page);
    }
  }, [page, fetchProducts]);

  return (
    <>
      {initialLoading ? (
        <div className="min-h-screen bg-background">
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                  <div className="bg-muted h-48 rounded-lg mb-4"></div>
                  <div className="bg-muted h-4 rounded mb-2"></div>
                  <div className="bg-muted h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </main>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="font-playfair font-bold text-3xl text-foreground mb-4">
                {(() => {
                  if (filters.search)
                    return `Resultados para: "${filters.search}"`;
                  if (filters.category && filters.category !== "all")
                    return `Categoría: ${filters.category}`;
                  if (filters.brand && filters.brand !== "all")
                    return `Marca: ${filters.brand}`;
                  return "Todos los Productos";
                })()}
              </h1>
              <p className="text-muted-foreground">
                Encuentra las mejores herramientas y materiales para tus
                proyectos
              </p>
            </div>

            <div className="lg:col-span-3">
              {products.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No se encontraron productos que coincidan con tu búsqueda
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product, index) => {
                    if (products.length === index + 1) {
                      return (
                        <div ref={lastProductElementRef} key={product.id}>
                          <ProductCard product={product} />
                        </div>
                      );
                    } else {
                      return <ProductCard key={product.id} product={product} />;
                    }
                  })}
                </div>
              )}

              {loading && !initialLoading && (
                <div className="text-center py-8 flex justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
