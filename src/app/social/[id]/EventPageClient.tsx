"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import polyline from "polyline";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { isNightEvent } from "@/lib/theme";
import { Activity, MapPin, Clock, BarChart3 } from "lucide-react";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { useSearchParams } from "next/navigation";

// Dynamic imports for better code splitting with Intersection Observer
const LazyStravaMap = dynamic(() => import("@/components/LazyStravaMap"), {
  loading: () => <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />,
  ssr: false,
});

const LazyMap = dynamic(() => import("@/components/LazyMap"), {
  loading: () => <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />,
  ssr: false,
});

// Para los modales fullscreen, cargar solo cuando se necesiten
const StravaMap = dynamic(() => import("@/components/StravaMap"), {
  loading: () => <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />,
  ssr: false,
});

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  loading: () => <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />,
  ssr: false,
});

const PaymentModal = dynamic(() => import("@/components/PaymentModal"), {
  ssr: false,
});

const LoginModal = dynamic(() => import("@/components/Modals/LoginModal"), {
  ssr: false,
});

const DescriptionMarkdown = dynamic(() => import("@/components/DescriptionMarkdown"), {
  loading: () => <Skeleton count={3} />,
});

interface PageProps {
  params: {
    id: string;
  };
  initialEvent?: EventData | null;
  initialMiembros?: Miembro[];
}

interface EventData {
  _id: string;
  nombre: string;
  ubicacion: string;
  deporte: string;
  fecha: string;
  hora: string;
  cupo: number;
  duracion: string;
  descripcion: string;
  imagen: string;
  localidad: string;
  telefonoOrganizador: string;
  whatsappLink: string;
  creador_id: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen: string;
    bio: string;
  };
  locationCoords?: {
    lat: number;
    lng: number;
  };
  precio: string;
  dificultad: string;
  stravaMap?: {
    id: string;
    summary_polyline: string;
    polyline: string;
    resource_state: number;
  };

  profesorId?: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen?: string;
    telnumber?: string;
    bio?: string;
    rol?: string;
  };

  sponsors?: Array<{
    _id: string;
    name: string;
    imagen?: string;
  }>;

  shortId: string;
  detalles: string;
  alias: string;
  cbu: string;
  url?: string;
}

interface Miembro {
  _id: string;
  firstname: string;
  lastname: string;
  imagen: string;
  estado: string;
  pago_id: {
    comprobanteUrl: string;
    estado: string;
    salidaId: string;
    userId: string;
    _id: string;
  };
  dni: string;
}

export default function EventPageClient({ params, initialEvent, initialMiembros = [] }: PageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [showFullMap, setShowFullMap] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFullMapPuntoDeEncuntro, setShowFullMapPuntoDeEncuntro] =
    useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Hook para monitorear el estado del pago en tiempo real
  const { paymentStatus, isApproved, isPending } = usePaymentStatus(
    params.id,
    !!session?.user?.id
  );

  // Manejar parámetros de retorno de MercadoPago
  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    if (paymentParam && session?.user?.id) {
      switch (paymentParam) {
        case "success":
          toast.success("¡Pago exitoso! Tu solicitud ha sido enviada.");
          // Invalidar queries para actualizar estado
          queryClient.invalidateQueries({
            queryKey: ["payment-status", params.id],
          });
          queryClient.invalidateQueries({
            queryKey: ["unido", params.id, session.user.id],
          });
          queryClient.invalidateQueries({ queryKey: ["miembros", params.id] });
          break;
        case "failure":
          toast.error("Pago fallido. Intenta nuevamente.");
          break;
        case "pending":
          toast.info("Pago pendiente. Te notificaremos cuando sea procesado.");
          break;
      }
      // Limpiar el parámetro de la URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment");
      router.replace(newUrl.pathname, { scroll: false });
    }
  }, [searchParams, session?.user?.id, queryClient, params.id, router]);
  let decodedCoords: [number, number][] = [];
  let routeCoords: [number, number][] = [];

  // 📌 Evento - usar datos iniciales del servidor
  const {
    data: event,
    isLoading: loadingEvent,
    error: errorEvent,
  } = useQuery({
    queryKey: ["event", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/social/${params.id}`);
      if (!res.ok) throw new Error("Error cargando evento");
      return res.json();
    },
    initialData: initialEvent || undefined,
    staleTime: 2 * 60 * 1000, // 2 minutos - los datos del servidor son bastante frescos
  });

  if (event?.stravaMap?.summary_polyline) {
    decodedCoords = polyline
      .decode(event.stravaMap.summary_polyline)
      .map(([lat, lng]) => [lng, lat]);
    routeCoords = decodedCoords;
  }

  // 📌 Miembros aprobados - usar datos iniciales del servidor
  const { data: miembros = [], isLoading: loadingMiembros } = useQuery({
    queryKey: ["miembros", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/social/miembros?salidaId=${params.id}`);
      if (!res.ok) throw new Error("Error cargando miembros");
      const data = await res.json();
      return data.filter((m: any) => m.pago_id?.estado === "aprobado");
    },
    initialData: initialMiembros,
    staleTime: 1 * 60 * 1000, // 1 minuto - los miembros pueden cambiar más frecuentemente
  });

  // 📌 Favorito
  const { data: favorito = false } = useQuery({
    queryKey: ["favorito", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/favoritos/sociales/${params.id}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.favorito;
    },
  });

  const toggleFavoritoMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        toast.error("Debes iniciar sesión");
        setShowLoginModal(true);
        return;
      }
      const res = await fetch(`/api/favoritos/sociales/${params.id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("No se pudo cambiar favorito");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["favorito", params.id], data.favorito);
      toast.success(
        data.favorito
          ? "Salida agregada a favoritos"
          : "Salida eliminada de favoritos"
      );
    },
  });

  const joinFreeMutation = useMutation({
    mutationFn: async () => {
      // Primero crear el pago para eventos gratuitos
      const pagoRes = await fetch("/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salidaId: params.id,
          userId: session?.user?.id,
          comprobanteUrl: "EVENTO_GRATUITO", // Marcador para eventos gratuitos
        }),
      });

      if (!pagoRes.ok) throw new Error("No se pudo crear el registro de pago");
      const pagoData = await pagoRes.json();
      const pago = pagoData.pago;

      // Luego unirse usando el pago_id creado
      const res = await fetch(`/api/social/unirse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salidaId: params.id,
          pago_id: pago._id,
        }),
      });
      if (!res.ok) throw new Error("No se pudo enviar la solicitud");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both queries that might need updating
      queryClient.invalidateQueries({
        queryKey: ["unido", params.id, session?.user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["miembros", params.id] });
      // Optimistically update the status to show immediate feedback
      queryClient.setQueryData(
        ["unido", params.id, session?.user?.id],
        "pendiente"
      );
      toast.success("Solicitud enviada. Espera la aprobación del organizador.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al enviar la solicitud");
    },
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("No se pudo cargar el perfil");
      return res.json();
    },
  });

  const handleAccion = () => {
    if (event.url) {
      window.open(event.url, "_blank");
      return;
    }

    if (!session) {
      toast.error("Debes iniciar sesión");
      setShowLoginModal(true);
      return;
    }

    if (loadingProfile) {
      toast.loading("Cargando perfil...");
      return;
    }
    if (!profile?.dni || !profile?.telnumber) {
      toast.error("Completa tu perfil con DNI y teléfono");
      // Guardar la URL actual para volver después de completar el perfil
      if (typeof window !== "undefined") {
        sessionStorage.setItem("returnUrl", window.location.pathname);
      }
      router.push("/dashboard/profile/editar");
      return;
    }

    if (event.precio == 0 || event.precio === "0") {
      joinFreeMutation.mutate();
      return;
    }
    setShowPaymentModal(true);
  };

  // 📌 Estado de unión del usuario
  const { data: yaUnido = "no" } = useQuery({
    queryKey: ["unido", params.id, session?.user?.id],
    enabled: !!session?.user?.id && !!event?._id,
    queryFn: async () => {
      const res = await fetch(`/api/social/miembros/${params.id}`);
      if (!res.ok) return "no";
      const data = await res.json();
      const miMiembro = data.find(
        (m: any) => m.usuario_id?._id === session?.user?.id
      );

      if (!miMiembro) return "no";
      if (miMiembro.pago_id?.estado === "pendiente") return "pendiente";
      if (miMiembro.pago_id?.estado === "rechazado") return "rechazado";
      if (miMiembro.pago_id?.estado === "aprobado") return "si";
      return "no";
    },
  });

  // Determinar el estado final considerando tanto el miembro como el pago de MercadoPago
  const estadoFinal = (() => {
    // Priorizar el estado real del miembro sobre el hook de payment status
    if (yaUnido === "si") return "si";
    if (yaUnido === "rechazado") return "rechazado";

    // Solo usar el hook de payment status si no hay información del miembro
    if (isApproved) return "si";
    if (isPending || paymentStatus?.isPending || yaUnido === "pendiente")
      return "pendiente";

    return yaUnido;
  })();

  // 📌 Perfil del usuario (para validar DNI/tel)
  // const { data: profile } = useQuery({
  //   queryKey: ["profile", session?.user?.id],
  //   enabled: !!session?.user?.id,
  //   queryFn: async () => {
  //     const res = await fetch("/api/profile");
  //     if (!res.ok) throw new Error("No se pudo cargar el perfil");
  //     return res.json();
  //   },
  // });

  const parseLocalDate = (isoDateString: string): string => {
    const [year, month, day] = isoDateString.split("-");
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return localDate.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  if (loadingEvent || loadingMiembros)
    return (
      <main className="bg-background min-h-screen px-4 py-6 w-full max-w-app mx-auto">
        {/* Back button */}
        <Skeleton circle height={32} width={32} className="mb-4" />
        {/* Título */}
        <Skeleton height={24} width={200} className="mb-4" />
        {/* Imagen */}
        <Skeleton height={180} borderRadius={12} className="mb-4" />
        {/* Ubicación y categoría */}
        <div className="flex flex-col space-y-2 mb-4">
          <Skeleton height={16} width={140} />
          <Skeleton height={16} width={80} />
        </div>
        {/* Participantes y Organiza */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <Skeleton height={14} width={80} className="mb-1" />
            <Skeleton circle height={32} width={32} />
          </div>
          <div>
            <Skeleton height={14} width={60} className="mb-1" />
            <Skeleton circle height={32} width={32} />
          </div>
        </div>
        {/* Descripción */}
        <Skeleton height={20} width={100} className="mb-2" />{" "}
        {/* "Descripción" */}
        <Skeleton count={1} height={170} className="mb-2" />
        {/* Precio y botones */}
        <div className="flex justify-between items-center mt-4">
          <Skeleton height={24} width={80} /> {/* precio */}
          <div className="flex space-x-2">
            <Skeleton height={32} width={100} borderRadius={12} />{" "}
            {/* Participantes btn */}
            <Skeleton height={32} width={80} borderRadius={12} />{" "}
            {/* Matchear btn */}
          </div>
        </div>
      </main>
    );

  if (errorEvent || !event) {
    return (
      <main className="py-20 text-center">
        {errorEvent ? "Error cargando evento" : "Evento no encontrado"}
      </main>
    );
  }

  // Verificar si es evento nocturno
  const eventForNightCheck = {
    _id: event._id,
    fecha: event.fecha,
    hora: event.hora,
    nombre: event.nombre,
  };
  const isNight = isNightEvent(eventForNightCheck);

  return (
    <main
      className={`min-h-screen w-full max-w-app mx-auto transition-colors ${isNight ? "theme-text-primary" : "text-foreground bg-background"
        }`}
      style={isNight ? { backgroundColor: "#2d3748" } : {}}
      data-theme={isNight ? "night" : undefined}
    >
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] lg:max-h-[400px]">
        <div
          style={{
            backgroundImage: `url(${event.imagen})`,
          }}
          className="w-full h-full bg-cover bg-center"
        />

        {/* Header Overlay Buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-black"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const url = event.shortId
                  ? `${window.location.origin}/s/${event.shortId}`
                  : window.location.href;

                if (navigator.share) {
                  navigator.share({ title: event.nombre, url }).catch(() => { });
                } else {
                  navigator.clipboard
                    .writeText(url)
                    .then(() => toast.success("Link copiado"))
                    .catch(() => { });
                }
              }}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>

            <button
              onClick={() => toggleFavoritoMutation.mutate()}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            >
              {favorito ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C95100" className="w-6 h-6">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-8">
        {/* Title and Badge Section */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-4">
            <h1 className={`text-2xl font-bold leading-tight ${isNight ? "theme-text-primary" : "text-gray-900"}`}>
              {event.nombre}
            </h1>
            {event.dificultad && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF9C4] text-[#FBC02D] capitalize shrink-0`}>
                {event.dificultad}
              </span>
            )}
          </div>

          <div className={`flex items-center gap-1.5 text-sm font-medium ${isNight ? "theme-text-secondary" : "text-gray-500"}`}>
            <MapPin size={16} className="text-[#C95100]" />
            <span>{event.localidad}, {event.ubicacion.split(',')[1]?.trim() || 'Argentina'}</span>
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="flex flex-wrap gap-3">
          {/* Duration Card */}
          <div className={`flex flex-col items-center justify-center p-4 rounded-[20px] min-w-[100px] ${isNight ? "bg-gray-800" : "bg-gray-50"}`}>
            <span className={`text-xl font-bold ${isNight ? "theme-text-primary" : "text-gray-900"}`}>
              {event.duracion.split(' ')[0]}
            </span>
            <span className={`text-xs uppercase mt-1 ${isNight ? "theme-text-secondary" : "text-gray-500"}`}>
              {event.duracion.split(' ')[1] || 'HS'}
            </span>
            <span className={`text-[10px] mt-1 ${isNight ? "theme-text-secondary" : "text-gray-400"}`}>
              Tiempo estimado
            </span>
          </div>

          {/* Tags Chips - Simulated for visual match */}
          <div className="flex gap-2 items-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${isNight ? "bg-gray-800 theme-text-primary" : "bg-gray-100 text-gray-700"}`}>
              <Activity size={16} className="text-[#C95100]" />
              {event.deporte}
            </span>
            {/* Optional: 'Ida y vuelta' badge if applicable, hardcoded/simulated for now based on image, or removed if no data */}
          </div>
        </div>

        <div className="w-full border-b border-gray-100 dark:border-gray-700"></div>

        {/* Details Section */}
        <div>
          <h2 className={`text-lg font-bold mb-3 ${isNight ? "theme-text-primary" : "text-gray-900"}`}>
            Detalles del evento
          </h2>
          <div className={`prose prose-sm max-w-none ${isNight ? "text-gray-300" : "text-gray-600"}`}>
            <DescriptionMarkdown text={event.descripcion} isNight={isNight} />
          </div>

          {/* Add Date/Time/Participants minimal list if needed, or stick to removed as requested? 
               Image shows "02 de septiembre...", "0/10 participantes", "$Price".
               User said: "sacar los detalles del profesor participatnes, cupo".
               So I will add ONLY the Date/Time here if not in footer?
               Actually footer has date/time. So I can skip it here to be cleaner, or add just date as "Detalle". 
               Let's keep it clean as per image "Detalles del evento" text block.
           */}
        </div>

        {/* Organizer Section (Minimal) */}
        <div>
          <h2 className={`text-lg font-bold mb-4 ${isNight ? "theme-text-primary" : "text-gray-900"}`}>
            Organizado por
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
              <img src={event.creador_id.imagen} alt={event.creador_id.firstname} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className={`font-medium ${isNight ? "theme-text-primary" : "text-gray-900"}`}>
                {event.creador_id.firstname} {event.creador_id.lastname}
              </p>
              <p className={`text-sm ${isNight ? "theme-text-secondary" : "text-gray-500"}`}>
                Organizador
              </p>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div>
          <h2 className={`text-lg font-bold mb-3 ${isNight ? "theme-text-primary" : "text-gray-900"}`}>
            Punto de encuentro
          </h2>
          <p className={`text-sm mb-4 leading-relaxed ${isNight ? "theme-text-secondary" : "text-gray-500"}`}>
            {event.ubicacion}
          </p>

          {event.locationCoords && (
            <div className="w-full h-[180px] rounded-[20px] overflow-hidden relative shadow-sm border border-gray-100 dark:border-gray-700">
              <LazyMap
                position={{
                  lat: event.locationCoords.lat,
                  lng: event.locationCoords.lng,
                }}
                onChange={() => { }}
                editable={false}
                showControls={false}
                className="w-full h-full"
              />
              {/* Map overlay interaction hint */}
              <div
                className="absolute inset-0 bg-transparent cursor-pointer"
                onClick={() => setShowFullMapPuntoDeEncuntro(true)}
              />
              <button
                className="absolute bottom-3 right-3 bg-white text-black text-xs font-bold p-2 rounded-full shadow-md z-10 hover:bg-gray-50 uppercase tracking-wide"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullMapPuntoDeEncuntro(true);
                }}
              >
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  Ver mapa
                </span>
              </button>
            </div>
          )}
        </div>

        {event.stravaMap?.id ? (
          <>
            {" "}
            <div className="mt-10 w-full flex flex-col items-center">
              <div className="flex flex-col w-[90%] gap-2">
                <span
                  className={`text-lg font-normal ${isNight ? "theme-text-primary" : "text-foreground"
                    }`}
                >
                  Recorrido
                </span>
                <div
                  className="w-full h-64 rounded-xl overflow-hidden cursor-pointer relative"
                  style={{ width: "100%", height: "300px" }}
                >
                  {decodedCoords.length > 0 && (
                    <>
                      <LazyStravaMap coords={routeCoords} className="w-full h-full" />
                      <div
                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded"
                        onClick={() => setShowFullMap(true)}
                      >
                        Tocar para ampliar
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="w-[90%] border-b borderb-[#808488] mt-10"></div>
            </div>
            <div className="w-full flex flex-col items-center mt-6">
              <div
                className={`text-lg font-normal mb-1 w-[90%] ${isNight ? "theme-text-primary" : "text-foreground"
                  }`}
              >
                ¿Que incluye la inscripción?
              </div>
              <div
                className={`w-[90%] font-extralight text-justify break-words ${isNight ? "theme-text-primary" : "text-foreground"
                  }`}
              >
                {event.detalles}
              </div>
              <div className="w-[90%] border-b borderb-[#808488] mt-6"></div>
            </div>
          </>
        ) : null}



        {/* WhatsApp Group */}
        {event.whatsappLink && (
          <div>
            <h2 className={`text-lg font-bold mb-3 ${isNight ? "theme-text-primary" : "text-gray-900"}`}>
              Grupo de WhatsApp
            </h2>
            <a
              href={event.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-[20px] font-bold text-center flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              Unirse al grupo
            </a>
          </div>
        )}



        {/* Sección de Sponsors */}
        {event.sponsors && event.sponsors.length > 0 && (
          <div className="flex flex-col items-center mt-8">
            <div className="w-[90%]">
              <h2
                className={`text-lg font-normal mb-3 text-center ${isNight ? "theme-text-primary" : "text-foreground"
                  }`}
              >
                {event.sponsors.length === 1
                  ? "Sponsor oficial"
                  : "Sponsors oficiales"}
              </h2>

              {event.sponsors.length === 1 ? (
                // Vista para un solo sponsor (más prominente)
                <div className="flex justify-center">
                  {event.sponsors[0].imagen && (
                    <img
                      src={event.sponsors[0].imagen}
                      alt={event.sponsors[0].name}
                      className="w-24 h-24 object-cover rounded-full border shadow-sm"
                    />
                  )}
                </div>
              ) : (
                // Vista para múltiples sponsors (grid)
                <div className="grid grid-cols-2 gap-4">
                  {event.sponsors.map((sponsor, index) => (
                    <div
                      key={sponsor._id}
                      className="bg-card p-3 rounded-[15px] shadow-md border flex flex-col items-center gap-2"
                    >
                      {sponsor.imagen && (
                        <img
                          src={sponsor.imagen}
                          alt={sponsor.name}
                          className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                        />
                      )}
                      <span
                        className={`text-sm font-medium text-center ${isNight ? "theme-text-primary" : "text-gray-800"
                          }`}
                      >
                        {sponsor.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-[90%] border-b borderb-[#808488] mt-8"></div>
          </div>
        )}

        {/* Sticky Footer */}
        <div
          className={`fixed bottom-0 left-0 right-0 p-4 border-t z-50 transition-colors
            ${isNight ? "bg-[#1a202c] border-gray-700" : "bg-white border-gray-100"}
          `}
        >
          <div className="max-w-app mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className={`text-xl font-bold leading-none ${isNight ? "text-white" : "text-black"}`}>
                {event.precio == 0 || event.precio === "0"
                  ? "Gratis"
                  : `$${Number(event.precio).toLocaleString("es-AR")}`}
              </span>
              <span className={`text-xs mt-1 ${isNight ? "text-gray-400" : "text-gray-500"}`}>
                {parseLocalDate(event.fecha)} • {event.hora} hs
              </span>
            </div>

            {session?.user?.id === event.creador_id._id ? (
              <button
                onClick={() => router.push(`/social/editar/${event._id}`)}
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-[15px] transition-colors"
              >
                Editar
              </button>
            ) : (
              <button
                onClick={handleAccion}
                disabled={estadoFinal === "pendiente" || estadoFinal === "si"}
                className={`px-8 py-3 rounded-[15px] font-bold text-white transition-all shadow-md
                    ${estadoFinal === "no" ? "bg-[#C95100] hover:bg-[#A04100]" : ""}
                    ${estadoFinal === "pendiente" ? "bg-gray-400 cursor-not-allowed" : ""}
                    ${estadoFinal === "rechazado" ? "bg-red-500 hover:bg-red-600" : ""}
                    ${estadoFinal === "si" ? "bg-green-600 hover:bg-green-700" : ""}
                  `}
              >
                {estadoFinal === "no" && "Unirse"}
                {estadoFinal === "pendiente" && "Solicitud enviada"}
                {estadoFinal === "rechazado" && "Reenviar"}
                {estadoFinal === "si" && "Ya sos miembro"}
              </button>
            )}
          </div>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          isNight={isNight}
        />

        <div className="pb-[200px]" />
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setIsProcessingPayment(false); // Resetear estado cuando se cierra
        }}
        salidaId={params.id}
        precio={event.precio}
        cbu={event.cbu}
        alias={event.alias}
        userId={session?.user.id}
        eventName={event.nombre}
        onProcessingChange={setIsProcessingPayment}
        isNight={isNight}
      />

      {showFullMap && (
        <div className="fixed inset-0 bg-black z-[99999999] flex items-center justify-center">
          <button
            className="absolute top-4 right-4 z-50 rounded-full bg-card text-foreground font-bold w-[35px] h-[35px] shadow"
            onClick={() => setShowFullMap(false)}
          >
            ✕
          </button>
          <div className="w-full h-full">
            <StravaMap coords={routeCoords} />
          </div>
        </div>
      )}
      {showFullMapPuntoDeEncuntro && (
        <div className="fixed inset-0 bg-black z-[99999999] flex items-center justify-center">
          <button
            className="absolute top-4 right-4 z-50 rounded-full bg-card text-foreground font-bold w-[35px] h-[35px] shadow"
            onClick={() => setShowFullMapPuntoDeEncuntro(false)}
          >
            ✕
          </button>
          <div className="w-full h-full">
            <MapComponent
              position={{
                lat: event.locationCoords.lat,
                lng: event.locationCoords.lng,
              }}
              onChange={() => { }}
              editable={false}
              showControls={false}
            />
          </div>
        </div>
      )}
    </main>
  );
}
