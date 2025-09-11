"use client";
import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterOptions {
  categories: string[];
  brands: string[];
}

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filterType, setFilterType] = useState<"category" | "brand">(
    "category"
  );
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    brands: [],
  });
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch("/api/products?limit=1", {
          credentials: "include"
        }); // Fetch a small payload just for filters
        const data = await response.json();
        if (data.success && data.filters) {
          setFilters(data.filters);
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  const performFilter = () => {
    const params = new URLSearchParams();
    if (selectedFilter !== "all") {
      params.set(filterType, selectedFilter);
    }
    // A filter action resets the search term for a clean filter
    setSearchTerm("");
    const queryString = params.toString();
    router.push(`/products?${queryString}`);
  };

  const performSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    // A search action resets the filters for a clean search
    setSelectedFilter("all");
    const queryString = params.toString();
    router.push(`/products?${queryString}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const currentFilterOptions =
    filterType === "category" ? filters.categories : filters.brands;
  const filterLabel = filterType === "category" ? "Categorías" : "Marcas";

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4 gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                X
              </span>
            </div>
            <span className="font-playfair font-bold text-xl text-foreground">
              Xtreme Construction
            </span>
          </Link>

          {/* Desktop Search and Filters */}
          <div className="hidden md:flex flex-1 items-center justify-center md:justify-end gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="px-3 bg-transparent">
                    {filterLabel}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType("category")}>
                    Categorías
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("brand")}>
                    Marcas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="px-3 min-w-[120px] justify-between bg-transparent"
                  >
                    {selectedFilter === "all" ? "Todos" : selectedFilter}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedFilter("all")}>
                    Todos
                  </DropdownMenuItem>
                  {currentFilterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => setSelectedFilter(option)}
                    >
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={performFilter}>Filtrar</Button>
            </div>

            <div className="relative w-full max-w-xs">
              <Input
                placeholder="Buscar productos..."
                className="pl-3 pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={performSearch}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <Button
                variant="outline"
                size="sm"
                className="relative bg-transparent"
              >
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation & Mobile Search */}
        <div className={`${isMenuOpen ? "block" : "hidden"} lg:block pb-4`}>
          <nav className="hidden md:block  pb-4 md:pb-0">
            <ul className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
              {filters.categories.slice(0, 9).map((category) => {
                const isActive =
                  searchParams.get("category")?.toLowerCase() ===
                  category.toLowerCase();
                return (
                  <li
                    key={category}
                    className="group relative transition-all duration-200"
                  >
                    <Link
                      href={`/products?category=${encodeURIComponent(
                        category.toLowerCase()
                      )}`}
                      className={`px-3 py-2 rounded-md font-semibold text-base transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-foreground hover:bg-primary/10 hover:text-primary"
                      } before:absolute before:left-0 before:bottom-0 before:h-[3px] before:bg-primary before:rounded-b before:w-0 group-hover:before:w-full group-hover:before:transition-all group-hover:before:duration-300 ${
                        isActive ? "before:w-full" : ""
                      }`}
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      {category}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile Search and Filters */}
          <div className="md:hidden pt-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Filtros
                </p>
                <div className="flex space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                      >
                        {filterLabel}
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => setFilterType("category")}
                      >
                        Categorías
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType("brand")}>
                        Marcas
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                      >
                        {selectedFilter === "all" ? "Todos" : selectedFilter}
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => setSelectedFilter("all")}
                      >
                        Todos
                      </DropdownMenuItem>
                      {currentFilterOptions.map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setSelectedFilter(option)}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button onClick={performFilter} className="w-full">
                  Filtrar
                </Button>
              </div>

              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Búsqueda
                </p>
                <div className="relative">
                  <Input
                    placeholder="Buscar productos..."
                    className="pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={performSearch}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
