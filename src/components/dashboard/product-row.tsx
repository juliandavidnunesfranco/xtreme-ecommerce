import { useState, forwardRef } from "react"
import Image from "next/image"
import type { Product } from "@/lib/google-sheets"
import { deleteProductAction } from "@/lib/actions/product.actions"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface ProductRowProps {
  product: Product
  onEdit: (product: Product) => void
  onSuccess: () => void
}

export const ProductRow = forwardRef<HTMLTableRowElement, ProductRowProps>(
  ({ product, onEdit, onSuccess }, ref) => {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const handleDelete = async () => {
      setIsDeleting(true)
      const result = await deleteProductAction(product.rowIndex)
      setIsDeleting(false)

      if (result.success) {
        toast.success(result.message)
        onSuccess() // Esto debería refrescar la lista
      } else {
        toast.error(result.message)
      }
      setShowDeleteDialog(false)
    }

    return (
      <>
        <TableRow ref={ref}>
          <TableCell>
            {product.image ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-md">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                Sin imagen
              </div>
            )}
          </TableCell>
          <TableCell className="font-medium">{product.code}</TableCell>
          <TableCell>{product.name}</TableCell>
          <TableCell className="max-w-xs truncate">{product.description || "-"}</TableCell>
          <TableCell className="text-right">{product.stock}</TableCell>
          <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </TableCell>
        </TableRow>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El producto 👉{product.name}👈 será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }
)

ProductRow.displayName = "ProductRow"
