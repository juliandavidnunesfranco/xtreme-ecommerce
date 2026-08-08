'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function DashboardSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlSearchTerm = searchParams.get('search') || ''

  const [searchTerm, setSearchTerm] = useState(urlSearchTerm)
  // Rastrea el último valor de la URL visto, para detectar cuando cambió
  // "por otros medios" (navegación, botón atrás) y re-sincronizar el input.
  const [prevUrlSearchTerm, setPrevUrlSearchTerm] = useState(urlSearchTerm)

  // Patrón oficial de React para "ajustar estado cuando cambia una prop":
  // se ajusta durante el render (no en un efecto), evitando un render extra.
  if (urlSearchTerm !== prevUrlSearchTerm) {
    setPrevUrlSearchTerm(urlSearchTerm)
    setSearchTerm(urlSearchTerm)
  }

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set('search', searchTerm)
    } else {
      params.delete('search')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getPlaceholder = () => {
    if (pathname.includes('/users')) return 'Buscar usuarios...'
    if (pathname.includes('/orders')) return 'Buscar órdenes...'
    if (pathname.includes('/clients')) return 'Buscar clientes...'
    return 'Buscar productos...' // Default para /main
  }

  return (
    <div className="relative w-full max-w-md">
      <Input
        placeholder={getPlaceholder()}
        className="pl-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  )
}
