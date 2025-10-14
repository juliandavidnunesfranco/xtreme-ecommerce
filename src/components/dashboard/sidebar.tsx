"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Package, Users, ShoppingCart, UserSquare, LogOut } from "lucide-react"

const links = [
  { name: "Productos", href: "/main", icon: Package },
  { name: "Usuarios", href: "/users", icon: Users },
  { name: "Órdenes", href: "/orders", icon: ShoppingCart },
  { name: "Clientes", href: "/clients", icon: UserSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background">
      <div className="flex h-full flex-col justify-between p-4">
        <nav className="flex flex-col gap-2">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">Navegación</h2>
          {links.map((link) => {
            const isActive = pathname.endsWith(link.href)
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.name}
              </Link>
            )
          })}
        </nav>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  )
}