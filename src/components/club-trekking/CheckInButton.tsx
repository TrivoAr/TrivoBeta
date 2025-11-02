"use client";

import React, { useState } from "react";
import { MapPin, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface CheckInButtonProps {
  salidaId: string;
  locationCoords?: {
    lat: number;
    lng: number;
  };
  requiereCheckIn?: boolean;
  onCheckInSuccess?: () => void;
  className?: string;
}

export function CheckInButton({
  salidaId,
  locationCoords,
  requiereCheckIn = false,
  onCheckInSuccess,
  className = "",
}: CheckInButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [checkInRealizado, setCheckInRealizado] = useState(false);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  };

  const handleCheckIn = async () => {
    if (!session?.user?.id) {
      toast.error("Debes iniciar sesión para hacer check-in");
      return;
    }

    if (!locationCoords) {
      toast.error("Esta salida no tiene coordenadas configuradas");
      return;
    }

    setLoading(true);

    try {
      // Solicitar ubicación del usuario
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Tu navegador no soporta geolocalización"));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Calcular distancia
      const distancia = calculateDistance(
        userLat,
        userLng,
        locationCoords.lat,
        locationCoords.lng
      );

      // Validación del lado del cliente (100m)
      if (distancia > 100) {
        toast.error(
          `Estás a ${Math.round(distancia)}m del punto de encuentro. Debes estar a menos de 100m para hacer check-in.`,
          { duration: 5000 }
        );
        setLoading(false);
        return;
      }

      // Enviar check-in al servidor
      const res = await fetch("/api/club-trekking/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salidaId,
          ubicacion: {
            lat: userLat,
            lng: userLng,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCheckInRealizado(true);
        toast.success(
          <div className="space-y-1">
            <p className="font-bold">¡Check-in exitoso!</p>
            <p className="text-sm">Tu asistencia ha sido registrada</p>
            {data.stats && (
              <p className="text-xs text-gray-600">
                Llevas {data.stats.totalSalidas} salidas completadas
              </p>
            )}
          </div>,
          { duration: 5000 }
        );

        if (onCheckInSuccess) {
          onCheckInSuccess();
        }
      } else {
        toast.error(data.error || "Error al realizar check-in");
      }
    } catch (error: any) {
      console.error("Error en check-in:", error);

      if (error.code === 1) {
        // PERMISSION_DENIED
        toast.error(
          "Necesitas activar los permisos de ubicación para hacer check-in",
          { duration: 5000 }
        );
      } else if (error.code === 2) {
        // POSITION_UNAVAILABLE
        toast.error("No se pudo obtener tu ubicación. Intenta de nuevo");
      } else if (error.code === 3) {
        // TIMEOUT
        toast.error("Tiempo de espera agotado. Intenta de nuevo");
      } else {
        toast.error(error.message || "Error al obtener ubicación");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!requiereCheckIn) {
    return null;
  }

  if (checkInRealizado) {
    return (
      <div
        className={`flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl ${className}`}
      >
        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
        <span className="font-semibold text-green-700 dark:text-green-300">
          Check-in realizado
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Info Alert */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-300">
          Debes hacer check-in en el punto de encuentro (dentro de 100m) entre 30 minutos antes
          y 15 minutos después de la hora de inicio.
        </p>
      </div>

      {/* Check-in Button */}
      <Button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full h-12 rounded-full bg-[#C95100] hover:bg-[#A03D00] text-white font-semibold"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verificando ubicación...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>Hacer Check-in</span>
          </div>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        Asegúrate de estar en el punto de encuentro
      </p>
    </div>
  );
}
