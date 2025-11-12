"use client";

import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface PaymentStatus {
  pago: {
    id: string;
    estado: string;
    status: string;
    statusDetail: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
  } | null;
  miembro: {
    id: string;
    estado: string;
  } | null;
  isApproved: boolean;
  isPending: boolean;
}

export function usePaymentStatus(salidaId: string, enabled = true) {
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-status", salidaId],
    queryFn: async (): Promise<PaymentStatus> => {
      const response = await fetch(`/api/pagos/status/${salidaId}`);
      if (!response.ok) {
        throw new Error("Error obteniendo estado de pago");
      }
      return response.json();
    },
    enabled,
    refetchInterval: (query) => {
      // Si está pendiente, consultar cada 5 segundos (antes 3s - reducir carga)
      if (query.state.data?.isPending) return 5000;
      // Si está aprobado, dejar de consultar
      if (query.state.data?.isApproved) return false;
      // En otros casos, consultar cada 30 segundos (antes 10s - reducir carga)
      return 30000;
    },
    refetchIntervalInBackground: false, // No hacer polling en background
  });

  // Detectar cambios de estado y mostrar notificaciones
  useEffect(() => {
    if (data?.pago?.estado && data.pago.estado !== lastStatus) {
      if (lastStatus !== null) {
        // No mostrar en la primera carga
        switch (data.pago.estado) {
          case "aprobado":
            // Verificar si el miembro también fue aprobado automáticamente
            if (data.miembro?.estado === "aprobado") {
              toast.success("¡Pago exitoso! Ya estás inscrito en el evento.");
            } else {
              toast.success(
                "¡Pago aprobado! Espera la confirmación del organizador."
              );
            }
            // Invalidar queries relacionadas para actualizar la UI
            queryClient.invalidateQueries({ queryKey: ["event", salidaId] });
            queryClient.invalidateQueries({ queryKey: ["user-events"] });
            queryClient.invalidateQueries({ queryKey: ["unido", salidaId] });
            queryClient.invalidateQueries({ queryKey: ["miembros", salidaId] });
            break;
          case "rechazado":
            toast.error("Pago rechazado. Intenta con otro método de pago.");
            break;
          case "pendiente":
            if (lastStatus === null) break; // No mostrar en primera carga
            toast.info(
              "Pago en proceso. Te notificaremos cuando sea aprobado."
            );
            break;
        }
      }
      setLastStatus(data.pago.estado);
    }
  }, [data?.pago?.estado, lastStatus, queryClient, salidaId]);

  return {
    paymentStatus: data,
    isLoading,
    error,
    isApproved: data?.isApproved || false,
    isPending: data?.isPending || false,
    // Agregar información adicional para el estado del miembro
    memberStatus: data?.miembro?.estado || "no",
    paymentApproved: data?.pago?.estado === "aprobado",
  };
}
