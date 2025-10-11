import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Playfair_Display, Source_Sans_3, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { CartProvider } from "@/hooks/use-cart";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import PreLoader from "@/components/preloader";
import { FloatingContactWidget } from "@/components/floating-contact-widget";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "500", "600"],
});

const SITE_NAME = "Xtreme-Construction";
const SITE_DESCRIPTION =
  "Xtreme-Construction, tu ferretería de confianza. Amplio surtido en herramientas y materiales para construcción y remodelación, con entrega a domicilio. Los mejores precios en herramientas eléctricas y manuales. Ubicados en La Victoria Valle, atendemos a todo el Valle del Cauca.";
const SITE_URL = "https://xtreme-ecommerce.vercel.app";
const BUSINESS_LOCATION = "La Victoria, Valle del Cauca, Colombia";
const BUSINESS_CATEGORY = "Ferretería, Eléctricos y materiales de construcción";
const SITE_PHONE = "+57 3138780455";

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME}`,
    absolute: `${SITE_NAME} E-commerce`,
  },
  description: `${SITE_DESCRIPTION}`,
  category: `${BUSINESS_CATEGORY}`,
  generator: "Next.js",
  applicationName: `${SITE_NAME} - Ecommerce `,
  referrer: "origin-when-cross-origin",
  keywords: [
    "ferretería",
    "tienda de materiales",
    "tienda ferretera",
    "tienda ferro eléctricos",
    "ferretería de confianza",
    "ferretería en la victoria",
    "ferretería en valle del cauca",
    "ferretería en la victoria valle del cauca",
    "precios bajos",
    "mejores precios",
    "surtido en materiales",
    "surtido en herramientas",
    "maestros de construccion",
    "maestros de obra",
    "construcción",
    "obras",
    "contrucción y remodelación",
    "remodelación de hogares",
    "remodelación de oficinas",
    "remodelación de locales comerciales",
    "remodelación de espacios",
    "materiales",
    "herramientas de obra",
    "entrega a domicilio",
    "venta de materiales",
    "venta de herramientas",
    "venta de ferretería",
    "venta de ferro eléctricos",
    "herramientas",
    "materiales de construcción",
    "alquiler de andamios",
    "alquiler de herramientas",
    "proyectos de construcción",
    "remodelación",
    "entrega a domicilio",
    "Xtreme Construction",
    "La Victoria Valle",
    "Valle del Cauca",
    "herramientas eléctricas",
    "herramientas manuales",
    "precios más bajos en herramientas",
    "atención todos los días",
    "Xtreme-Construction",
    "E-commerce",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
  },
  creator: "Xtreme-Construction",
  publisher: "Xtreme-Construction",
  authors: [
    {
      name: "Xtreme-Construction",
      url: `${SITE_URL}`,
    },
    {
      name: "Juan David Nuñez Franco",
      url: "https://github.com/juliandavidnunesfranco",
    },
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "es-CO": "/es-CO",
    },
  },

  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: `${SITE_NAME}`,
    description: `${SITE_DESCRIPTION}`,
    url: `${SITE_URL}`,
    siteName: `${SITE_NAME}`,
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/Logo-Xtreme-Construction.png", 
        width: 1200,
        height: 630,
        alt: "Logo de Xtreme Construction , Ferreteria, Eléctricos y Materiales para la construcción al mejor precio.",
      },
    ],
  },
  //Metadatos para PWA
  manifest: "/manifest.json",

  appleWebApp: {
    title: `${SITE_NAME}`,
    statusBarStyle: "black-translucent",
    capable: true,
    startupImage: [
      {
        url: "/Logo-Xtreme-Construction.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
};

// Datos estructurados para SEO (Schema.org)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  telephone: `${SITE_PHONE}`, // Agrega tu teléfono
  address: {
    "@type": "PostalAddress",
    streetAddress: "Carrera 7 # 5-68", // Agrega tu dirección
    addressLocality: BUSINESS_LOCATION,
    addressCountry: "CO",
  },
  openingHours: [
    "Mo-Su 07:00-18:00", // Ajusta según tus horarios
  ],
  priceRange: "$$",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${playfair.variable} ${sourceSans.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <PreLoader />
            <Header />
            <main>{children}
              <FloatingContactWidget/>
              <SpeedInsights />
            </main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
