"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const {
    items,
    total,
    updateQuantity,
    removeItem,
    setOrder,
    orderId,
    clearOrder,
  } = useCart();
  const { toast } = useToast();

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleWhatsAppCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: "Faltan datos",
        description: "Por favor completa tu nombre y teléfono.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/whatsapp/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },        
        body: JSON.stringify({
          items,
          total,
          customerInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Pedido Registrado",
          description: `Tu pedido #${data.orderId} ha sido registrado. Serás redirigido a WhatsApp para continuar.`,
        });
        
        // Transition from cart to order state
        setOrder(data.orderId, "Pendiente");

        // Open WhatsApp
        window.open(data.whatsappUrl, "_blank");
        
        // Reset form
        setCustomerInfo({
          name: "",
          phone: "",
          email: "",
          address: "",
          notes: "",
        });
      } else {
        toast({
          title: "Error en el Pedido",
          description: data.error || "No se pudo procesar el pedido.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al procesar tu pedido.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // If there is a pending order, show its status
  if (orderId) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="font-playfair font-bold text-3xl text-foreground mb-4">
              Seguimiento de tu Pedido
            </h1>
            <p className="text-muted-foreground mb-2">
              Tu pedido <span className="font-bold text-primary">#{orderId}</span> ha sido registrado.
            </p>
            <p className="text-muted-foreground mb-8">
              Nos pondremos en contacto contigo a través de WhatsApp para coordinar el pago y la entrega.
            </p>
            <div className="text-6xl py-4">🛒</div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => clearOrder()} size="lg">
                Crear un Nuevo Pedido
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/products">Seguir Viendo Productos</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If cart is empty and there is no pending order, show empty cart message
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="font-playfair font-bold text-3xl text-foreground mb-4">
              Tu Carrito está Vacío
            </h1>
              <div className="text-6xl py-4">🛒</div>
            <p className="text-muted-foreground mb-8">
              Agrega algunos productos para comenzar tu compra
            </p>
            <Button asChild size="lg">
              <Link href="/products">Ver Productos</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="font-playfair font-bold text-3xl text-foreground mb-8">
          Carrito de Compras
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={
                        item.image ||
                        `/Logo-Xtreme-Construction.png?height=80&width=80&query=${encodeURIComponent(
                          item.name
                        )}`
                      }
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Código: {item.code}
                      </p>
                      <p className="font-bold text-primary">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                       {formatPrice(item.price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">{formatPrice(total)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono/WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="address">
                    Dirección de Entrega (opcional)
                  </Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        address: e.target.value,
                      })
                    }
                    placeholder="Dirección completa"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Instrucciones especiales, horarios de entrega, etc."
                  />
                </div>

                <Button
                  onClick={handleWhatsAppCheckout}
                  disabled={
                    isProcessing || !customerInfo.name || !customerInfo.phone
                  }
                  className="w-full"
                  size="lg"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Procesando..." : "Continuar por WhatsApp"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Al continuar, se abrirá WhatsApp con tu pedido listo para
                  enviar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}