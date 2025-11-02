import { getProducts } from "@/lib/google-sheets"
import { ProductsTable } from "@/components/dashboard/products-table"

export default async function Page() {
  
  const products = await getProducts()
  return (
    <div className="flex h-full flex-col">
  
      <div className="flex-1 overflow-hidden p-4 sm:p-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestión de Productos</h1>
            <p className="text-muted-foreground mb-4">Administra el catálogo de productos de tu tienda.</p>
          </div>
          <ProductsTable products={products} />
      </div>
    </div>
  )
}
