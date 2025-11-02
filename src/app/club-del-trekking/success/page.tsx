"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Mountain, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function ClubTrekkingSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Efecto de confeti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="bg-gradient-to-b from-[#C95100]/5 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen text-foreground w-[390px] mx-auto flex items-center justify-center p-5">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Success Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-6 shadow-2xl">
            <Check className="w-16 h-16 text-white" strokeWidth={3} />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-yellow-500 animate-bounce" fill="currentColor" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ¡Bienvenido al Club!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Tu suscripción al Club del Trekking se ha activado exitosamente
          </p>
        </div>

        {/* Benefits Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-[#C95100] to-[#A03D00] rounded-2xl">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold text-lg">Miembro Activo</h3>
              <p className="text-white/80 text-sm">Club del Trekking</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-xs font-semibold">BRONCE</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-left">
              <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Acceso ilimitado activado
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ya puedes reservar salidas del Club
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Salidas semanales
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Organiza tus aventuras cada semana
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Gana badges y recompensas
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completa salidas para subir de nivel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 text-left">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">
            Próximos pasos
          </h3>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#C95100] shrink-0">1.</span>
              <span>Explora el calendario de salidas disponibles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#C95100] shrink-0">2.</span>
              <span>Reserva tus salidas favoritas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#C95100] shrink-0">3.</span>
              <span>Haz check-in en el punto de encuentro</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#C95100] shrink-0">4.</span>
              <span>¡Disfruta de la aventura!</span>
            </li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => router.push("/club-del-trekking")}
            className="w-full h-12 text-base font-bold bg-[#C95100] hover:bg-[#A03D00] text-white rounded-full shadow-lg"
          >
            Ver calendario de salidas
          </Button>

          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full text-[#C95100] hover:text-[#A03D00] font-medium text-sm transition-colors"
          >
            Ir a mi perfil
          </button>
        </div>
      </div>
    </main>
  );
}
