import type { User } from "next-auth"
import { Package } from "lucide-react"
import { DashboardSearch } from "./dashboard-search"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <span className="hidden sm:inline-block text-lg font-semibold">Panel Admin</span>
        </div>
        
        <div className="flex-1 flex justify-center">
          <DashboardSearch />
        </div>

        <div className="hidden md:flex items-center gap-2 text-right">
          <div className="text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
