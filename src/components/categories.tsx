"use client"

import React, { useCallback, useSyncExternalStore } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { motion, type Variants } from "framer-motion"
import Link from "next/link"
import {
  Hammer,
  Zap,
  Droplets,
  ShieldPlus,
  Drill,
  SprayCan,
  HardHat,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"

const categories = [
  {
    name: "Herramientas Eléctricas",
    icon: Drill,
    href: `/products?category=${encodeURIComponent(
      "herramientas eléctricas".toLowerCase()
    )}`,
  },
  {
    name: "Herramientas Manuales",
    icon: Hammer,
    href: `/products?category=${encodeURIComponent(
      "herramientas manuales".toLowerCase()
    )}`,
  },
  {
    name: "Eléctrico",
    icon: Zap,
    href: `/products?category=${encodeURIComponent("eléctrico".toLowerCase())}`,
  },
  {
    name: "Plomería",
    icon: Droplets,
    href: `/products?category=${encodeURIComponent("plomería".toLowerCase())}`,
  },
  {
    name: "Construcción",
    icon: HardHat,
    href: `/products?category=${encodeURIComponent(
      "construcción".toLowerCase()
    )}`,
  },
  {
    name: "Pintura",
    icon: SprayCan,
    href: `/products?category=${encodeURIComponent("pintura".toLowerCase())}`,
  },
  {
    name: "Seguridad",
    icon: ShieldPlus,
    href: `/products?category=${encodeURIComponent("seguridad".toLowerCase())}`,
  },
]

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
}

export function Categories() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  )

  // Suscripción al estado de scroll de Embla (sistema externo) vía
  // useSyncExternalStore, en vez de duplicarlo en useState + efecto.
  const subscribeToEmbla = useCallback(
    (callback: () => void) => {
      if (!emblaApi) return () => {}
      emblaApi.on("select", callback)
      return () => {
        emblaApi.off("select", callback)
      }
    },
    [emblaApi]
  )
  const getServerFalse = useCallback(() => false, [])
  const canScrollPrev = useSyncExternalStore(
    subscribeToEmbla,
    () => emblaApi?.canScrollPrev() ?? false,
    getServerFalse
  )
  const canScrollNext = useSyncExternalStore(
    subscribeToEmbla,
    () => emblaApi?.canScrollNext() ?? false,
    getServerFalse
  )

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <section className="py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="font-playfair font-bold text-3xl md:text-4xl text-foreground mb-2">
              Nuestras Categorías
            </h2>
            <p className="text-muted-foreground text-lg">
              Explora nuestra amplia gama de productos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollPrev}
              className="p-2 rounded-full bg-card hover:bg-muted transition-colors disabled:opacity-50"
              disabled={!canScrollPrev}
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <button
              onClick={scrollNext}
              className="p-2 rounded-full bg-card hover:bg-muted transition-colors disabled:opacity-50"
              disabled={!canScrollNext}
            >
              <ArrowRight className="w-6 h-6 text-foreground" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <motion.div
                  key={category.name}
                  className="flex-[0_0_50%] sm:flex-[0_0_33.33%] md:flex-[0_0_25%] lg:flex-[0_0_16.66%] p-2"
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={cardVariants}
                >
                  <Link href={category.href} className="block group">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors duration-300 shadow-md group-hover:shadow-lg">
                        <Icon className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
