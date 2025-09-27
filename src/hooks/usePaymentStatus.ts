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

export function usePaymentStatus(salidaId: string, enabled: boolean = true) {
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
      // Si está pendiente, consultar cada 3 segundos
      if (query.state.data?.isPending) return 3000;
      // Si está aprobado, dejar de consultar
      if (query.state.data?.isApproved) return false;
      // En otros casos, consultar cada 10 segundos
      return 10000;
    },
    refetchIntervalInBackground: true,
  });

  // Detectar cambios de estado y mostrar notificaciones
  useEffect(() => {
    if (data?.pago?.estado && data.pago.estado !== lastStatus) {
      if (lastStatus !== null) { // No mostrar en la primera carga
        switch (data.pago.estado) {
          case "aprobado":
            toast.success("¡Pago aprobado! Ya estás inscrito en el evento.");
            // Invalidar queries relacionadas para actualizar la UI
            queryClient.invalidateQueries({ queryKey: ["event", salidaId] });
            queryClient.invalidateQueries({ queryKey: ["user-events"] });
            break;
          case "rechazado":
            toast.error("Pago rechazado. Intenta con otro método de pago.");
            break;
          case "pendiente":
            if (lastStatus === null) break; // No mostrar en primera carga
            toast.info("Pago en proceso. Te notificaremos cuando sea aprobado.");
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
  };
}