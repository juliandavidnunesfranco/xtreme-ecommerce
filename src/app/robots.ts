import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/cart", "/api"],
      },
      {
        userAgent: [
          "Applebot",
          "Bingbot",
          "Slurp",
          "DuckDuckBot",
          "YandexBot",
          "Sogou",
          "Exabot",
          "ia_archiver",
        ],
        disallow: ["/", "/cart", "/api"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
