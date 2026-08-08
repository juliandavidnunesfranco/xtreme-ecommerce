'use client'

import { useState, useRef, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import type { Product } from "@/lib/google-sheets"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { ProductDialog } from "./product-dialog"
import { ProductRow } from "./product-row"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products: initialProducts }: ProductsTableProps) {
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get('search')

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialProducts.length > 0)
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  // Último valor de búsqueda (URL) ya visto, para resetear la paginación
  // durante el render cuando cambia (patrón oficial de React), sin efecto.
  const [prevSearch, setPrevSearch] = useState(currentSearch)

  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch)
    setPage(1)
  }

  const observer = useRef<IntersectionObserver | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const lastProductElementRef = useCallback(
    (node: HTMLTableRowElement) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      }, { root: scrollContainerRef.current });

      if (node) observer.current.observe(node)
    },
    [loading, hasMore]
  )

  const fetchProductsPage = useCallback(async (currentPage: number) => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "50",
    })
    if (currentSearch) {
      params.set('search', currentSearch)
    }
    const response = await fetch(`/api/products?${params.toString()}`)
    return response.json() as Promise<{ success: boolean; products: Product[]; hasMore: boolean }>
  }, [currentSearch])

  // Uso desde manejadores de eventos (crear/editar/eliminar producto): fuera
  // de un efecto, por lo que llamar setState directamente es correcto.
  const fetchProducts = useCallback(async (currentPage: number, isNewSearch = false) => {
    setLoading(true)
    try {
      const data = await fetchProductsPage(currentPage)
      if (data.success) {
        setProducts((prev) => isNewSearch ? data.products : [...prev, ...data.products])
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error("Error fetching more products:", error)
    } finally {
      setLoading(false)
    }
  }, [fetchProductsPage])

  // Efecto para el scroll infinito. La función `run` se declara dentro del
  // propio efecto (no se delega a una función externa) para que React pueda
  // garantizar que el setState solo aplica si el efecto sigue vigente
  // (guard `ignore`), evitando condiciones de carrera entre páginas.
  useEffect(() => {
    if (page <= 1) return
    let ignore = false
    async function run() {
      setLoading(true)
      try {
        const data = await fetchProductsPage(page)
        if (!ignore && data.success) {
          setProducts((prev) => [...prev, ...data.products])
          setHasMore(data.hasMore)
        }
      } catch (error) {
        console.error("Error fetching more products:", error)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => {
      ignore = true
    }
  }, [page, fetchProductsPage])

  // Efecto para reiniciar la tabla cuando cambia la búsqueda.
  useEffect(() => {
    let ignore = false
    async function run() {
      setLoading(true)
      try {
        const data = await fetchProductsPage(1)
        if (!ignore && data.success) {
          setProducts(data.products)
          setHasMore(data.hasMore)
        }
      } catch (error) {
        console.error("Error fetching more products:", error)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => {
      ignore = true
    }
  }, [currentSearch, fetchProductsPage])


  const handleCreate = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    // Esta es una mejor alternativa a window.location.reload()
    // Re-dispara la búsqueda para obtener los datos más frescos
    fetchProducts(1, true)
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto rounded-lg border bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => {
              const isLastElement = products.length === index + 1
              return (
                <ProductRow
                  key={product.id || index} 
                  ref={isLastElement ? lastProductElementRef : null}
                  product={product}
                  onEdit={handleEdit}
                  onSuccess={handleSuccess}
                />
              )
            })}
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!hasMore && products.length > 0 && (
               <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                  Fin de los resultados.
                </TableCell>
              </TableRow>
            )}
             {products.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
