'use server'

import { z } from 'zod'
import { googleSheetsService } from '@/lib/google-sheets' // Importar la instancia
import { revalidatePath } from 'next/cache'
import { type Product } from '@/lib/google-sheets'
import { v2 as cloudinary } from 'cloudinary'

// --- Helper para subir imagen ---
async function uploadImage(file: File): Promise<string> {
  // Configura Cloudinary justo a tiempo, dentro del contexto de la acción
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

  try {
    const fileBuffer = await file.arrayBuffer();
    const mime = file.type;
    const encoding = 'base64';
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    const fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data;

    const result = await cloudinary.uploader.upload(fileUri, {}); // Sin carpeta

    return result.secure_url;
  } catch (error) {
    console.error('Error al subir a Cloudinary:', error);
    throw new Error('Error al subir la imagen a Cloudinary.');
  }
}

// Esquema de Zod solo para los campos de texto
const productSchema = z.object({
  id: z.string().optional(),
  rowIndex: z.coerce.number().optional(),
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo'),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
})

export type FormState = {
  success: boolean
  message: string
  errors?: Record<string, string[]> | null
}

// Server Action para CREAR un producto
export async function createProductAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = productSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Error de validación.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    let imageUrl = '';
    const imageFile = formData.get('image') as File;

    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile);
    }

    const productDataForService = {
      ...validatedFields.data,
      image: imageUrl,
    }

    await googleSheetsService.createProduct(productDataForService)
    revalidatePath('/main')
    return { success: true, message: 'Producto creado con éxito.' }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Error en el servidor al crear el producto.' }
  }
}

// Server Action para ACTUALIZAR un producto
export async function updateProductAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = productSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Error de validación.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { rowIndex, ...productData } = validatedFields.data

  if (typeof rowIndex !== 'number') {
    return { success: false, message: 'Falta el identificador de la fila (rowIndex).' }
  }

  try {
    let imageUrl = formData.get('existingImageUrl') as string || '';
    const imageFile = formData.get('image') as File;

    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile);
    }

    const finalProductData = {
      ...productData,
      image: imageUrl,
    }

    await googleSheetsService.updateProduct(rowIndex, finalProductData as Partial<Product>)
    revalidatePath('/main')
    return { success: true, message: 'Producto actualizado con éxito.' }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Error en el servidor al actualizar el producto.' }
  }
}

// Server Action para ELIMINAR un producto
export async function deleteProductAction(rowIndex: number): Promise<FormState> {
    if (!rowIndex) {
        return { success: false, message: 'Falta el identificador de la fila (rowIndex).' };
    }

    try {
        await googleSheetsService.deleteProduct(rowIndex);
        revalidatePath('/main');
        return { success: true, message: 'Producto eliminado con éxito.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error en el servidor al eliminar el producto.' };
    }
}