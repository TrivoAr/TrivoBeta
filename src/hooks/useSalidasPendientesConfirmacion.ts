"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface SalidaPendiente {
  _id: string;
  titulo: string;
  fecha: string;
  locationName: string;
  imagen: string | null;
}

interface SalidasPendientesData {
  salidasPendientes: SalidaPendiente[];
  tienePenalizacion: boolean;
  diasPenalizacion: number;
  inasistenciasConsecutivas: number;
}

export function useSalidasPendientesConfirmacion() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<SalidasPendientesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalidasPendientes = async () => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/club-trekking/salidas-pendientes");

      if (!res.ok) {
        throw new Error("Error al obtener salidas pendientes");
      }

      const data = await res.json();
      setData(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching salidas pendientes:", err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalidasPendientes();
  }, [session?.user?.id, status]);

  const confirmarAsistencia = async (salidaId: string, asistio: boolean) => {
    const res = await fetch("/api/club-trekking/confirmar-asistencia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        salidaId,
        asistio,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al confirmar asistencia");
    }

    const result = await res.json();

    // Refetch salidas pendientes
    await fetchSalidasPendientes();

    return result;
  };

  return {
    salidasPendientes: data?.salidasPendientes || [],
    tienePenalizacion: data?.tienePenalizacion || false,
    diasPenalizacion: data?.diasPenalizacion || 0,
    inasistenciasConsecutivas: data?.inasistenciasConsecutivas || 0,
    loading,
    error,
    confirmarAsistencia,
    refetch: fetchSalidasPendientes,
  };
}
