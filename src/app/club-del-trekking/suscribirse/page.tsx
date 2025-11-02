"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  Check,
  Mountain,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { useClubMembership } from "@/hooks/useClubMembership";

export default function SuscribirseClubTrekking() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [salidasIncluidas, setSalidasIncluidas] = useState(0);
  const { membership, loading: membershipLoading, isActive } = useClubMembership();

  useEffect(() => {
    // Obtener número de salidas incluidas
    const fetchSalidasIncluidas = async () => {
      try {
        const res = await fetch("/api/social");
        const data = await res.json();
        const incluidas = data.filter((salida: any) => {
          const precio = parseFloat(salida.precio || "0");
          return precio > 0 && precio <= 10000;
        });
        setSalidasIncluidas(incluidas.length);
      } catch (error) {
        console.error("Error al obtener salidas:", error);
      }
    };

    fetchSalidasIncluidas();
  }, []);

  const handleSubscribe = async () => {
    if (status === "unauthenticated") {
      toast.error("Debes iniciar sesión para suscribirte");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/club-trekking/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.devMode) {
          // Modo desarrollo: membresía creada directamente
          toast.success(data.message || "¡Membresía activada en modo desarrollo!");
          router.push("/club-del-trekking");
        } else if (data.initPoint) {
          // Producción: redirigir a MercadoPago
          window.location.href = data.initPoint;
        } else {
          toast.success("Suscripción creada exitosamente");
          router.push("/club-del-trekking");
        }
      } else {
        toast.error(data.error || "Error al crear suscripción");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la suscripción");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: <Mountain className="w-5 h-5" />,
      title: "Acceso ilimitado",
      description: "Todas las salidas low cost del mes",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Salidas semanales",
      description: "Organiza tus aventuras cada semana",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Check-in geolocalizado",
      description: "Sistema de asistencia automático",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Comunidad exclusiva",
      description: "Únete a otros aventureros del Club",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Badges y recompensas",
      description: "Gana insignias por tus logros",
    },
  ];

  return (
    <>
      <Toaster position="top-center" />
      <main className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen text-foreground w-[390px] mx-auto pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <div className="px-5 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Unirme al Club
            </h1>
          </div>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* Mensaje de carga */}
          {membershipLoading && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            </div>
          )}

          {/* SI TIENE MEMBRESÍA ACTIVA: Solo mostrar banner verde */}
          {!membershipLoading && isActive && membership ? (
            <div className="space-y-6">
              {/* Banner de Membresía Activa */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl border-2 border-green-400/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-full shrink-0">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-xl mb-2">
                      ¡Ya tienes una membresía activa!
                    </h3>
                    <p className="text-white/90 text-base mb-4">
                      Disfruta de acceso ilimitado a todas las salidas low cost del Club del Trekking
                    </p>

                    {/* Stats */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm">Salidas este mes:</span>
                        <span className="text-white font-bold text-lg">
                          {membership.usoMensual?.salidasRealizadas || 0}
                        </span>
                      </div>
                      <div className="h-px bg-white/20"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm">Próximo pago:</span>
                        <span className="text-white font-bold text-lg">
                          {new Date(membership.proximaFechaPago).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push('/club-del-trekking/mi-membresia')}
                      className="w-full bg-white hover:bg-white/90 text-green-600 font-bold py-3 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Ver mi membresía</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensaje informativo */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full shrink-0">
                    <Mountain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Ya eres parte del Club
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Explora el calendario de salidas y reserva tus próximas aventuras.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/club-del-trekking')}
                  className="py-3 px-4 bg-[#C95100] hover:bg-[#A03D00] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Ver salidas</span>
                </button>
                <button
                  onClick={() => router.push('/club-del-trekking/mi-membresia')}
                  className="py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Mi perfil</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SI NO TIENE MEMBRESÍA: Mostrar todo el contenido de suscripción */}
              {/* Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C95100] via-[#A03D00] to-[#7A2D00] p-8 shadow-xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                <path
                  d="M0,200 L0,150 L50,120 L100,140 L150,100 L200,130 L250,90 L300,110 L350,80 L400,100 L400,200 Z"
                  fill="white"
                />
                <path
                  d="M0,200 L0,170 L60,145 L120,165 L180,130 L240,160 L300,120 L360,140 L400,110 L400,200 Z"
                  fill="white"
                  opacity="0.6"
                />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <Mountain className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-semibold">
                  Club del Trekking
                </span>
              </div>

              <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                Aventuras ilimitadas
              </h2>
              <p className="text-white/90 text-base mb-6">
                Únete a la comunidad de trekking más activa de Tucumán
              </p>

              {/* Price */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">$25.000</span>
                  <span className="text-white/80 text-lg">/mes</span>
                </div>
                <p className="text-white/70 text-sm">
                  Pago mensual recurrente • Cancela cuando quieras
                </p>
              </div>

              {/* Quick Stats */}
              {salidasIncluidas > 0 && (
                <div className="mt-4 flex items-center gap-2 text-white/90 text-sm">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">
                    {salidasIncluidas} salidas disponibles este mes
                  </span>
                </div>
              )}
            </div>

            {/* Glow Effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              ¿Qué incluye?
            </h3>

            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-[#C95100]/10 rounded-xl text-[#C95100] shrink-0">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {benefit.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {benefit.description}
                      </p>
                    </div>
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              ¿Cómo funciona?
            </h3>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#C95100] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    Suscríbete
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Paga $25.000/mes y accede a todas las salidas low cost
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#C95100] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    Reserva tus salidas
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Elige tus salidas del calendario
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#C95100] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    Haz check-in y disfruta
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Registra tu asistencia en el punto de encuentro y vive la aventura
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Información importante
                </p>
                <ul className="space-y-1 text-amber-800 dark:text-amber-300">
                  <li>• Solo salidas con precio ≤ $10.000</li>
                  <li>• Check-in obligatorio para validar asistencia</li>
                  <li>• Renovación automática mensual</li>
                  <li>• Puedes pausar o cancelar cuando quieras</li>
                </ul>
              </div>
            </div>
          </div>

              {/* CTA Button */}
              <div className="sticky bottom-4 pt-4">
                <Button
                  onClick={handleSubscribe}
                  disabled={loading || status === "loading" || membershipLoading}
                  className="w-full h-14 text-lg font-bold bg-[#C95100] hover:bg-[#A03D00] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Suscribirme ahora</span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Al suscribirte aceptas los{" "}
                  <button className="underline hover:text-[#C95100]">
                    términos y condiciones
                  </button>
                </p>
              </div>

              {/* Bottom spacing */}
              <div className="h-4"></div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
