import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { Categories } from "@/components/categories";
import { FeaturedProducts } from "@/components/featured-products";

export const metadata: Metadata = {
  title: "Xtreme-Construction E-commerce",
  description:
    "La tienda para comprar los materiales para la construccion, remodelacion del hogar. Tenemos amplia gama de herramientas eléctricas y herramientas manuales, alquiler de andamios y todo en ferreteria al mejor precio.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div>
        <Hero />
        <Categories />
        <FeaturedProducts />
      </div>
    </div>
  );
}
