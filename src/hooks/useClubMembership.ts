import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ClubMembership {
  _id: string;
  estado: "activa" | "vencida" | "cancelada";
  fechaInicio: string;
  fechaFin: string;
  proximaFechaPago: string;
  usoMensual: {
    salidasRealizadas: number;
    limiteSemanal: number;
    ultimaResetFecha: string;
  };
  historialSalidas: Array<{
    salidaId: string;
    fecha: string;
    checkInRealizado: boolean;
  }>;
}

interface UseClubMembershipReturn {
  membership: ClubMembership | null;
  loading: boolean;
  error: string | null;
  isActive: boolean;
  salidasRestantes: number;
  puedeReservar: boolean;
  refetch: () => Promise<void>;
}

export function useClubMembership(): UseClubMembershipReturn {
  const { data: session, status } = useSession();
  const [membership, setMembership] = useState<ClubMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/club-trekking/membership/${session.user.id}`);

      if (res.status === 404) {
        setMembership(null);
        setError(null);
        return;
      }

      if (!res.ok) {
        throw new Error("Error al obtener membresía");
      }

      const data = await res.json();
      setMembership(data.membership);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchMembership();
    } else if (status === "unauthenticated") {
      setLoading(false);
      setMembership(null);
    }
  }, [session?.user?.id, status]);

  const isActive = membership?.estado === "activa" && new Date(membership.fechaFin) > new Date();

  const salidasRestantes = isActive
    ? membership.usoMensual.limiteSemanal - membership.usoMensual.salidasRealizadas
    : 0;

  const puedeReservar = isActive && salidasRestantes > 0;

  return {
    membership,
    loading,
    error,
    isActive,
    salidasRestantes,
    puedeReservar,
    refetch: fetchMembership,
  };
}
