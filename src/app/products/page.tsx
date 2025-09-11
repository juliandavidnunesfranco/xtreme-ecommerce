import { Metadata } from "next";
import { ProductList } from "@/components/product-list";

export const metadata: Metadata = {
  title: "Catalogo",
  description:
    "Xtreme Construction, catalogo de herramientas y materiales para la construccion, alquiler de andamios, ferreteria y electricos. ",
};

export default function ProductsPage() {
  return <ProductList />;
}
