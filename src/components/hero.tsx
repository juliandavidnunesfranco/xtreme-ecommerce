"use client";

import React, { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

const slides = [
  {
    type: "video",
    source: "/construccion.mp4",
    poster: "/Logo-Xtreme-Construction.png",
    headline: "Xtreme",
    subheadline:
      "Socios en la construcción. Encuentra las mejores marcas y herramientas profesionales con garantía certificada.",
    cta: "Construyamos ya!",
    link: "/products",
  },
  {
    type: "video",
    source: "/chispas.mp4",
    poster: "/Logo-Xtreme-Construction.png",
    headline: "Construction",
    subheadline:
      "Equipamiento profesional y asesoría experta para tus proyectos. Más de 1000 productos especializados a tu alcance.",
    cta: "Explorar Catálogo",
    link: "/products",
  },
  {
    type: "video",
    source: "/Xtreme-Construction.mp4",
    poster: "/xtreme-construction-1.jpg",
    headline: "E-commerce",
    subheadline: "La forma más rápida y segura de comprar.",
    cta: "Comienza a Comprar",
    link: "/products?category=herramientas%20el%C3%A9ctricas",
  },
];

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.3, duration: 0.5 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);

  const setVideoRef = React.useCallback(
    (index: number) => (el: HTMLVideoElement | null) => {
      videoRefs.current[index] = el;
    },
    []
  );

  useEffect(() => {
    const handleSlideChange = () => {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === emblaApi?.selectedScrollSnap()) {
            video.play();
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    };
    if (emblaApi) {
      emblaApi.on("select", handleSlideChange);
      const firstVideo = videoRefs.current[0];
      if (firstVideo) firstVideo.play();
    }
    return () => {
      if (emblaApi) emblaApi.off("select", handleSlideChange);
    };
  }, [emblaApi]);

  const scrollPrev = React.useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = React.useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  return (
    <section className="relative w-full h-[85vh] md:h-[95vh] text-white">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div className="flex-[0_0_100%] relative h-full" key={index}>
              {slide.type === "video" && (
                <video
                  ref={setVideoRef(index)}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                  loop
                  poster={slide.poster}
                >
                  <source src={slide.source} type="video/mp4" />
                </video>
              )}
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-start">
                <motion.div
                  className="max-w-2xl space-y-6"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={textVariants}
                >
                  <motion.h1
                    className="font-playfair font-bold text-4xl md:text-6xl leading-tight"
                    variants={itemVariants}
                  >
                    {slide.headline}
                  </motion.h1>
                  <motion.p
                    className="text-lg text-gray-200 leading-relaxed"
                    variants={itemVariants}
                  >
                    {slide.subheadline}
                  </motion.p>
                  <motion.div variants={itemVariants}>
                    <Button asChild size="lg" className="font-semibold">
                      <Link href={slide.link}>{slide.cta}</Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/20 border-white/30 hover:bg-white/30"
        onClick={scrollPrev}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/20 border-white/30 hover:bg-white/30"
        onClick={scrollNext}
      >
        <ArrowRight className="h-6 w-6" />
      </Button>
    </section>
  );
}
