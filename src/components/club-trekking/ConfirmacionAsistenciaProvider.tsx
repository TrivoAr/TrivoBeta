"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ConfirmacionAsistenciaModal } from "./ConfirmacionAsistenciaModal";
import { useSalidasPendientesConfirmacion } from "@/hooks/useSalidasPendientesConfirmacion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

/**
 * Provider que se coloca en el layout principal
 * Detecta automáticamente si hay salidas pendientes de confirmar
 * y muestra un modal bloqueante hasta que el usuario confirme
 */
export function ConfirmacionAsistenciaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const {
    salidasPendientes,
    inasistenciasConsecutivas,
    tienePenalizacion,
    diasPenalizacion,
    confirmarAsistencia,
    loading,
  } = useSalidasPendientesConfirmacion();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Detectar cuando hay salidas pendientes
  useEffect(() => {
    if (!loading && salidasPendientes.length > 0) {
      setMostrarModal(true);
    } else {
      setMostrarModal(false);
    }
  }, [loading, salidasPendientes]);

  const handleConfirmar = async (asistio: boolean) => {
    const salidaActual = salidasPendientes[currentIndex];

    try {
      const result = await confirmarAsistencia(salidaActual._id, asistio);

      // Mostrar mensaje apropiado
      if (result.penalizacionAplicada) {
        toast.error(
          `⚠️ Has sido penalizado por ${result.diasPenalizacion} días por 2 inasistencias consecutivas`,
          { duration: 6000 }
        );
      } else if (asistio) {
        toast.success("¡Gracias por confirmar tu asistencia! 🎉");
        // Confetti para celebrar
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        if (inasistenciasConsecutivas === 0) {
          toast(
            "Entendido. Recuerda que 2 inasistencias consecutivas resultan en penalización.",
            { icon: "ℹ️", duration: 5000 }
          );
        } else {
          toast.error(
            "⚠️ Ya tienes 1 inasistencia. La próxima resultará en penalización de 3 días.",
            { duration: 5000 }
          );
        }
      }

      // Si hay más salidas pendientes, pasar a la siguiente
      if (currentIndex < salidasPendientes.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Ya no hay más salidas pendientes
        setMostrarModal(false);
        setCurrentIndex(0);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al confirmar asistencia");
      throw error;
    }
  };

  // Solo mostrar modal si está autenticado y hay salidas pendientes
  if (status !== "authenticated" || !mostrarModal || salidasPendientes.length === 0) {
    return <>{children}</>;
  }

  const salidaActual = salidasPendientes[currentIndex];

  return (
    <>
      {children}
      <ConfirmacionAsistenciaModal
        salida={salidaActual}
        inasistenciasConsecutivas={inasistenciasConsecutivas}
        onConfirmar={handleConfirmar}
      />
    </>
  );
}
