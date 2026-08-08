"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Loader2 } from "lucide-react";
import { Product } from "@/lib/google-sheets";

export function ProductList() {
  const searchParams = useSearchParams();

  const filtersFromUrl = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "all",
    brand: searchParams.get("brand") || "all",
  };

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filters, setFilters] = useState(filtersFromUrl);
  // Último valor de searchParams ya sincronizado a `filters`, para detectar
  // cambios y ajustar el estado durante el render (patrón oficial de React),
  // en vez de con un efecto.
  const [prevFiltersFromUrl, setPrevFiltersFromUrl] = useState(filtersFromUrl);

  if (
    filtersFromUrl.search !== prevFiltersFromUrl.search ||
    filtersFromUrl.category !== prevFiltersFromUrl.category ||
    filtersFromUrl.brand !== prevFiltersFromUrl.brand
  ) {
    setPrevFiltersFromUrl(filtersFromUrl);
    setFilters(filtersFromUrl);
    setPage(1);
  }

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

  // Función pura de red: no toca estado de React, solo obtiene datos.
  const fetchProductsPage = useCallback(
    async (currentPage: number) => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "24",
        search: filters.search,
        category: filters.category,
        brand: filters.brand,
      });
      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json() as Promise<{
        success: boolean;
        products: Product[];
        hasMore: boolean;
      }>;
    },
    [filters]
  );

  // Efecto para cargar productos cuando cambian los filtros. `run` se declara
  // dentro del propio efecto (guard `ignore`) para evitar condiciones de
  // carrera si los filtros cambian antes de que responda una petición anterior.
  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      try {
        const data = await fetchProductsPage(1);
        if (!ignore && data.success) {
          setProducts(data.products);
          setHasMore(data.hasMore);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        if (!ignore) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [filters, fetchProductsPage]);

  // Efecto para scroll infinito (páginas siguientes).
  useEffect(() => {
    if (page <= 1) return;
    let ignore = false;
    async function run() {
      setLoading(true);
      try {
        const data = await fetchProductsPage(page);
        if (!ignore && data.success) {
          setProducts((prev) => [...prev, ...data.products]);
          setHasMore(data.hasMore);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [page, fetchProductsPage]);

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
