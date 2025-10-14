'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function DashboardSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  useEffect(() => {
    // Sincroniza el estado si la URL cambia por otros medios
    setSearchTerm(searchParams.get('search') || '')
  }, [searchParams])

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
