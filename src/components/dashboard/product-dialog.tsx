'use client'

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import Image from "next/image"
import { type Product } from "@/lib/google-sheets"
import { createProductAction, updateProductAction, type FormState } from "@/lib/actions/product.actions"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

const initialState: FormState = { success: false, message: "" }

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Guardando...
        </>
      ) : isEdit ? (
        "Actualizar"
      ) : (
        "Crear"
      )}
    </Button>
  )
}

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const action = product ? updateProductAction : createProductAction
  const [state, formAction] = useFormState(action, initialState)

  const [imagePreview, setImagePreview] = useState<string | null>(
    open ? product?.image || null : null
  )
  // Rastrea el (open, imagen) que ya sincronizamos, para detectar cambios
  // y ajustar `imagePreview` durante el render (patrón oficial de React
  // para "resetear estado cuando cambia una prop"), sin usar un efecto.
  const [prevSyncKey, setPrevSyncKey] = useState({ open, image: product?.image ?? null })
  const nextSyncKey = { open, image: product?.image ?? null }
  if (nextSyncKey.open !== prevSyncKey.open || nextSyncKey.image !== prevSyncKey.image) {
    setPrevSyncKey(nextSyncKey)
    setImagePreview(nextSyncKey.open ? nextSyncKey.image : null)
  }

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onOpenChange(false)
      onSuccess()
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, onOpenChange, onSuccess])

  // Efecto legítimo: resetea el <form> nativo (un sistema externo al estado
  // de React) cuando el diálogo se cierra. No toca estado de React.
  useEffect(() => {
    if (!open) {
      formRef.current?.reset()
    }
  }, [open])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(product?.image || null)
    }
  }

  const removeImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          <DialogDescription>
            {product ? "Modifica los datos del producto." : "Completa los datos para crear un nuevo producto."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} encType="multipart/form-data" className="space-y-4">
          {product?.id && <input type="hidden" name="id" value={product.id} />}
          {product?.rowIndex && <input type="hidden" name="rowIndex" value={product.rowIndex} />}
          {product?.image && <input type="hidden" name="existingImageUrl" value={product.image} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" name="code" defaultValue={product?.code} />
              {state.errors?.code && <p className="text-sm text-destructive">{state.errors.code[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={product?.name} />
              {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={product?.description} rows={3} />
            {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" name="stock" type="number" defaultValue={product?.stock} />
              {state.errors?.stock && <p className="text-sm text-destructive">{state.errors.stock[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} />
              {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price[0]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagen</Label>
            <Input id="image-upload" name="image" type="file" className="hidden" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
            {imagePreview ? (
              <div className="relative">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  </div>
                </label>
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 z-10" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click para subir</span> o arrastra una imagen
                  </p>
                </div>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <SubmitButton isEdit={!!product} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
