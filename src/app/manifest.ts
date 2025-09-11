import { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
    return {
      name: "Xtreme Construction Ecommerce",
      short_name: "Xtreme - Ecommerce",
      description:
        "Tu tienda online para productos de ferreteria, eléctricos y materiales para la construcción.",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000",
      icons: [
        {
          src: "/Logo-Xtreme-Construction.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/Logo-Xtreme-Construction.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };

}