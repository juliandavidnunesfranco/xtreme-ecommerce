import { type NextRequest, NextResponse } from "next/server"
import { createOrder } from "@/lib/google-sheets";

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  code: string
}

interface CheckoutData {
  items: CartItem[]
  total: number
  customerInfo: {
    name: string
    phone: string
    email?: string
    address?: string
    notes?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CheckoutData = await request.json()

    // Validate required fields
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ success: false, error: "No items in cart" }, { status: 400 })
    }

    if (!data.customerInfo.name || !data.customerInfo.phone) {
      return NextResponse.json({ success: false, error: "Customer name and phone are required" }, { status: 400 })
    }

    // Format WhatsApp message
    const message = formatWhatsAppMessage(data)

    // Generate WhatsApp URL
    const whatsappNumber = process.env.WHATSAPP_BUSINESS_NUMBER || "3138780455"
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

    // 1. Save the order to Google Sheets with "Pending" status
    const orderId = await createOrder(data.items, data.total, data.customerInfo);

    // 2. Inventory is NOT updated here. This is now a manual step or handled by the admin panel.

    // 3. Send notification to your bot
    const botWebhookUrl = process.env.BOT_WEBHOOK_URL;
    if (botWebhookUrl) {
      try {
        await fetch(botWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            text: `New Pending Order: ${orderId}
Total: ${formatPrice(data.total)}
Customer: ${data.customerInfo.name} (${data.customerInfo.phone})`,
          }),
        });
      } catch (error) {
        console.error("Failed to send bot notification:", error);
      }
    }

    return NextResponse.json({
      success: true,
      whatsappUrl,
      orderId: orderId,
      message: "Order prepared for WhatsApp checkout",
    })
  } catch (error) {
    console.error("Error processing checkout:", error)
    return NextResponse.json({ success: false, error: "Error processing checkout" }, { status: 500 })
  }
}

function formatWhatsAppMessage(data: CheckoutData): string {
  const { items, total, customerInfo } = data

  let message = `🛒 *NUEVA ORDEN - XTREME CONSTRUCTION*\n\n`
  message += `👤 *Cliente:* ${customerInfo.name}\n`
  message += `📱 *Teléfono:* ${customerInfo.phone}\n`

  if (customerInfo.email) {
    message += `📧 *Email:* ${customerInfo.email}\n`
  }

  if (customerInfo.address) {
    message += `📍 *Dirección:* ${customerInfo.address}\n`
  }

  message += `\n📦 *PRODUCTOS:*\n`
  message += `${"─".repeat(30)}\n`

  items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity
    message += `${index + 1}. *${item.name}*\n`
    message += `   Código: ${item.code}\n`
    message += `   Cantidad: ${item.quantity}\n`
    message += `   Precio unit: ${formatPrice(item.price)}\n`
    message += `   Subtotal: ${formatPrice(itemTotal)}\n\n`
  })

  message += `${"─".repeat(30)}\n`
  message += `💰 *TOTAL: ${formatPrice(total)}*\n\n`

  if (customerInfo.notes) {
    message += `📝 *Notas adicionales:*\n${customerInfo.notes}\n\n`
  }

  message += `✅ Por favor confirma tu pedido y te enviaremos los detalles de pago y entrega.\n\n`
  message += `🚚 *Entregas disponibles en los municipios del norte del valle del cauca y alrededores*`

  return message
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price)
}

function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `ORD-${timestamp}-${random}`.toUpperCase()
}
