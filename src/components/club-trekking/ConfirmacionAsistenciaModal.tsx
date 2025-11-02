"use client";

import React, { useState } from "react";
import { AlertCircle, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface SalidaPendiente {
  _id: string;
  titulo: string;
  fecha: string;
  locationName: string;
  imagen: string | null;
}

interface ConfirmacionAsistenciaModalProps {
  salida: SalidaPendiente;
  inasistenciasConsecutivas: number;
  onConfirmar: (asistio: boolean) => Promise<void>;
}

export function ConfirmacionAsistenciaModal({
  salida,
  inasistenciasConsecutivas,
  onConfirmar,
}: ConfirmacionAsistenciaModalProps) {
  const [loading, setLoading] = useState(false);
  const [mostrandoAdvertencia, setMostrandoAdvertencia] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const handleConfirmar = async (asistio: boolean) => {
    // Si va a decir que NO asistió y ya tiene 1 inasistencia, mostrar advertencia
    if (!asistio && inasistenciasConsecutivas === 1 && !mostrandoAdvertencia) {
      setMostrandoAdvertencia(true);
      return;
    }

    setLoading(true);
    try {
      await onConfirmar(asistio);
    } catch (error) {
      toast.error("Error al confirmar asistencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[360px] mx-5 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header con imagen o color de fondo */}
        <div className="relative h-32 bg-gradient-to-br from-[#C95100] to-[#A03D00]">
          {salida.imagen ? (
            <img
              src={salida.imagen}
              alt={salida.titulo}
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <AlertCircle className="w-16 h-16 text-white/80" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {mostrandoAdvertencia ? (
            // Vista de advertencia
            <>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  ⚠️ Última advertencia
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Ya tienes <strong>1 inasistencia</strong> registrada. Si confirmas que no
                  asististe a esta salida, serás <strong>penalizado por 3 días</strong> y no
                  podrás reservar nuevas salidas durante ese período.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    ¿Estás seguro de que no asististe? Si tuviste un imprevisto, por favor
                    confírmalo para que podamos mejorar el servicio.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => setMostrandoAdvertencia(false)}
                  variant="outline"
                  className="w-full h-12 rounded-full border-gray-300"
                  disabled={loading}
                >
                  Volver atrás
                </Button>
                <Button
                  onClick={() => handleConfirmar(false)}
                  className="w-full h-12 rounded-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Confirmar que NO asistí"}
                </Button>
              </div>
            </>
          ) : (
            // Vista normal
            <>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  ¿Asististe a esta salida?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Para continuar usando la app, necesitamos confirmar tu asistencia
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {salida.titulo}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(salida.fecha)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span>📍</span>
                  {salida.locationName}
                </p>
              </div>

              {inasistenciasConsecutivas > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Atención:</strong> Ya tienes {inasistenciasConsecutivas}{" "}
                    inasistencia registrada. Si no asististe a esta salida, serás penalizado
                    por 3 días.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={() => handleConfirmar(true)}
                  className="w-full h-12 rounded-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  <Check className="w-5 h-5 mr-2" />
                  {loading ? "Confirmando..." : "Sí, asistí"}
                </Button>

                <Button
                  onClick={() => handleConfirmar(false)}
                  variant="outline"
                  className="w-full h-12 rounded-full border-gray-300 dark:border-gray-600"
                  disabled={loading}
                >
                  <X className="w-5 h-5 mr-2" />
                  No asistí
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Esta confirmación es importante para mejorar el servicio del Club del Trekking
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
