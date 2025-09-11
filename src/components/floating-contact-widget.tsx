"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Clock, MapPin, Sun, Moon, User, Truck, Shield, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface Advisor {
  id: string
  name: string
  role: string
  avatar?: string
  isOnline: boolean
  whatsappNumber: string
}

export function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showButton, setShowButton] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const advisors: Advisor[] = [
    {
      id: "1",
      name: "María González",
      role: "Asesora de Ventas",
      isOnline: true,
      whatsappNumber: "573138780455",
    },
    {
      id: "2",
      name: "Carlos Rodríguez",
      role: "Especialista Técnico",
      isOnline: true,
      whatsappNumber: "573138780455",
    },
    {
      id: "3",
      name: "Mauren Nuñez",
      role: "Gerente",
      isOnline: false,
      whatsappNumber: "573138780455",
    },
    {
      id: "4",
      name: "Luis Pérez",
      role: "Domiciliario",
      isOnline: true,
      whatsappNumber: "573138780455",
    },
  ]

  const storeHours = [
    { day: "Lunes - Viernes", hours: "7:00 AM - 12:00 M / 1:30 pm - 5:00 PM" },
    { day: "Sábados", hours: "7:30 AM - 12:00 M / 1:30 pm - 5:00 PM" },
    { day: "Domingos", hours: "7:30 AM - 12:00 M" },
  ]

  const storeLocation = {
    address: "Cra. 7 #6-32, La Victoria, Valle del Cauca, Colombia",
    coordinates: "4.4113543,-76.155454",
    googleMapsUrl: "https://www.google.com/maps/place/Xtreme+Construction+SAS/@4.4113596,-76.1580289,17z/data=!3m1!4b1!4m17!1m10!4m9!1m0!1m6!1m2!1s0x8e383778e26ad24f:0x19794cab7d194c9d!2sCra.+7+%236-32,+La+Victoria,+Roldanillo,+Valle+del+Cauca!2m2!1d-76.155454!2d4.4113543!3e2!3m5!1s0x8e383778e26ad24f:0x19794cab7d194c9d!8m2!3d4.4113543!4d-76.155454!16s%2Fg%2F11tdpb0qj2?entry=ttu",
  }

  const handleWhatsAppContact = (advisor: Advisor) => {
    const message = encodeURIComponent(`Hola ${advisor.name}, necesito ayuda con productos de ferretería.`)
    const whatsappUrl = `https://wa.me/${advisor.whatsappNumber}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const getRoleIcon = (role: string) => {
    if (role.includes("Gerente")) return <Shield className="w-4 h-4" />
    if (role.includes("Domiciliario")) return <Truck className="w-4 h-4" />
    return <User className="w-4 h-4" />
  }

  // Show/Hide button on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close panel on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {showButton && (
        <>
          {/* Floating Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary dark:bg-primary-foreground/10 text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/70 dark:shadow-primary/50 animate-appear transform hover:scale-110 motion-safe:animate-bounce"
            aria-label="Open contact widget"
          >
            <div className="relative flex items-center justify-center h-full w-full">
              <img 
                src="/Logo-Xtreme-Construction.png" 
                alt="Xtreme Construction Logo" 
                className={`w-12 h-12 transition-transform duration-300`}
              />
            </div>
          </button>

          {/* Widget Panel */}
          {isOpen && (
            <Card ref={panelRef} className="fixed bottom-24 right-6 z-40 w-80 max-h-[70vh] overflow-y-auto shadow-2xl border-2 animate-appear">
              <CardHeader className="pb-3 bg-muted/50">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Centro de Ayuda</span>
                  <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-8 w-8 p-0">
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Advisors Section */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Habla con un Asesor
                  </h3>
                  <div className="space-y-2">
                    {advisors.map((advisor) => (
                      <div
                        key={advisor.id}
                        className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={advisor.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {advisor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                                advisor.isOnline ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{advisor.name}</p>
                            <div className="flex items-center space-x-1">
                              {getRoleIcon(advisor.role)}
                              <p className="text-xs text-muted-foreground truncate">{advisor.role}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={advisor.isOnline ? "default" : "secondary"}
                          onClick={() => handleWhatsAppContact(advisor)}
                          className="h-7 px-2 text-xs"
                          disabled={!advisor.isOnline}
                        >
                          Chat
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Store Hours */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Horarios de Atención
                  </h3>
                  <div className="space-y-1">
                    {storeHours.map((schedule, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{schedule.day}</span>
                        <span className="font-medium">{schedule.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Store Location */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Nuestra Ubicación
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{storeLocation.address}</p>

                    {/* Mini Map Placeholder */}
                    <div className="relative h-24 bg-muted rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-primary" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(storeLocation.googleMapsUrl, "_blank")}
                          className="w-full h-6 text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver en Google Maps
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <style jsx>{`
        @keyframes appear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        .animate-appear {
          animation: appear 0.3s ease-out;
        }
        .animate-ripple {
          animation: ripple 1s linear infinite;
        }
      `}</style>
    </>
  )
}
