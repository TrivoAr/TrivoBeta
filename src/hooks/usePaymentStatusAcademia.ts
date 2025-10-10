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
  suscripcion: {
    id: string;
    estado: string;
    trial?: {
      estaEnTrial: boolean;
      clasesAsistidas: number;
      fechaFin: string;
    };
    mercadoPago?: {
      preapprovalId: string;
      initPoint: string;
      status: string;
      payerEmail: string;
    };
  } | null;
  isApproved: boolean;
  isPending: boolean;
  tipoSistema?: "suscripcion" | "viejo";
}

export function usePaymentStatusAcademia(academiaId: string, enabled = true) {
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-status-academia", academiaId],
    queryFn: async (): Promise<PaymentStatus> => {
      const response = await fetch(`/api/pagos/academia/${academiaId}`, {
        cache: 'no-store', // Forzar a no usar cache del navegador
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error("Error obteniendo estado de pago de academia");
      }
      return response.json();
    },
    enabled,
    staleTime: 0, // Siempre considerar datos como stale
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

  // Logging para debug
  useEffect(() => {
    if (data) {
      console.log("[usePaymentStatusAcademia] Estado actual:", {
        isPending: data.isPending,
        isApproved: data.isApproved,
        suscripcionEstado: data.suscripcion?.estado,
        miembroEstado: data.miembro?.estado,
        pagoEstado: data.pago?.estado,
      });
    }
  }, [data]);

  // Detectar cambios de estado y mostrar notificaciones
  useEffect(() => {
    if (data?.pago?.estado && data.pago.estado !== lastStatus) {
      if (lastStatus !== null) {
        // No mostrar en la primera carga
        switch (data.pago.estado) {
          case "aprobado":
            // Verificar si el miembro también fue aprobado automáticamente
            if (data.miembro?.estado === "aceptado") {
              toast.success("¡Pago exitoso! Ya estás inscrito en la academia.");
            } else {
              toast.success(
                "¡Pago aprobado! Espera la confirmación del dueño de la academia."
              );
            }
            // Invalidar queries relacionadas para actualizar la UI
            queryClient.invalidateQueries({
              queryKey: ["academia", academiaId],
            });
            queryClient.invalidateQueries({ queryKey: ["user-academias"] });
            queryClient.invalidateQueries({
              queryKey: ["miembro-academia", academiaId],
            });
            queryClient.invalidateQueries({
              queryKey: ["miembros-academia", academiaId],
            });
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
  }, [data?.pago?.estado, lastStatus, queryClient, academiaId]);

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
