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
import {
  Activity,
  MapPin,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { useSearchParams } from "next/navigation";
import { getImagenesToShow } from "@/utils/imageFallbacks";
import ImageCarousel from "@/components/ImageCarousel";

// Dynamic imports for better code splitting with Intersection Observer
const LazyStravaMap = dynamic(() => import("@/components/LazyStravaMap"), {
  loading: () => <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />,
  ssr: false,
});

const LazyMap = dynamic(() => import("@/components/LazyMap"), {
  loading: () => <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />,
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
  imagenes?: string[];
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    staleTime: 2 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000,
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
      const pagoRes = await fetch("/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salidaId: params.id,
          userId: session?.user?.id,
          comprobanteUrl: "EVENTO_GRATUITO",
        }),
      });

      if (!pagoRes.ok) throw new Error("No se pudo crear el registro de pago");
      const pagoData = await pagoRes.json();
      const pago = pagoData.pago;

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
      queryClient.invalidateQueries({
        queryKey: ["unido", params.id, session?.user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["miembros", params.id] });
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
      if (typeof window !== "undefined") {
        sessionStorage.setItem("returnUrl", window.location.pathname);
      }
      router.push("/dashboard/profile/editar");
      return;
    }
    if (event.cupo - miembros.length === 0) {
      toast.error("Cupo completo. No puedes unirte.");
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
    if (yaUnido === "si") return "si";
    if (yaUnido === "rechazado") return "rechazado";
    if (isApproved) return "si";
    if (isPending || paymentStatus?.isPending || yaUnido === "pendiente")
      return "pendiente";
    return yaUnido;
  })();

  const parseLocalDate = (isoDateString: string): string => {
    const [year, month, day] = isoDateString.split("-");
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return localDate.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "facil":
        return "text-green-600 bg-green-50";
      case "media":
        return "text-yellow-600 bg-yellow-50";
      case "dificil":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "facil":
        return "Fácil";
      case "media":
        return "Moderado";
      case "dificil":
        return "Difícil";
      default:
        return difficulty;
    }
  };

  if (loadingEvent || loadingMiembros)
    return (
      <main className="bg-background min-h-screen w-full max-w-app mx-auto">
        <Skeleton height={300} className="mb-4" />
        <div className="px-4">
          <Skeleton height={24} width={200} className="mb-2" />
          <Skeleton height={16} width={140} className="mb-4" />
          <Skeleton count={3} height={16} className="mb-4" />
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

  const isNight = isNightEvent({
    _id: event._id,
    fecha: event.fecha,
    hora: event.hora,
    nombre: event.nombre,
  });

  // Preparar imágenes para el carrusel usando la lógica de getImagenesToShow
  const eventImages = getImagenesToShow(
    event.imagenes,
    event.imagen,
    event.deporte
  );

  return (
    <main className="min-h-screen w-full max-w-app mx-auto bg-background">
      {/* Image Carousel */}
      <ImageCarousel
        images={eventImages}
        alt={event.nombre}
        onBack={() => router.back()}
        onShare={() => {
          const url = event.shortId
            ? `${window.location.origin}/s/${event.shortId}`
            : window.location.href;

          if (navigator.share) {
            navigator.share({ title: event.nombre, url }).catch(() => {});
          } else {
            navigator.clipboard
              .writeText(url)
              .then(() => toast.success("¡Link copiado al portapapeles!"))
              .catch(() => {});
          }
        }}
        onFavorite={() => toggleFavoritoMutation.mutate()}
        isFavorite={favorito}
      />

      {/* Content */}
      <div className="px-5 py-6">
        {/* Title Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground flex-1">
              {event.nombre}
            </h1>
            {event.dificultad && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                  event.dificultad
                )}`}
              >
                {getDifficultyLabel(event.dificultad)}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
            <MapPin size={16} className="text-[#C95100]" />
            <span className="text-sm">{event.localidad}</span>
          </div>
        </div>

        {/* Stats - Solo Tiempo */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center inline-block">
            <div className="text-2xl font-bold text-foreground mb-1">
              {event.duracion?.replace("hrs", "h") || "—"}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              hrs
            </div>
            <div className="text-xs text-muted-foreground mt-1">Tiempo estimado</div>
          </div>
        </div>

        {/* Route Type Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
            <TrendingUp size={14} className="text-[#C95100]" />
            <span className="text-sm font-medium text-foreground">Ida y vuelta</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Activity size={14} className="text-[#C95100]" />
            <span className="text-sm font-medium text-foreground capitalize">
              {event.deporte}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-foreground leading-relaxed">
            <DescriptionMarkdown text={event.descripcion} isNight={isNight} />
          </p>
        </div>

        {/* Event Details */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-foreground mb-4">Detalles del evento</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Calendar size={18} className="text-[#C95100]" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {parseLocalDate(event.fecha)}
                </div>
                <div className="text-xs text-muted-foreground">{event.hora} hs</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Users size={18} className="text-[#C95100]" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {miembros.length}/{event.cupo} participantes
                </div>
                <div className="text-xs text-muted-foreground">
                  {event.cupo - miembros.length} cupos disponibles
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <DollarSign size={18} className="text-[#C95100]" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {event.precio == 0 || event.precio === "0"
                    ? "Gratis"
                    : `$${Number(event.precio).toLocaleString("es-AR")}`}
                </div>
                <div className="text-xs text-muted-foreground">Precio por persona</div>
              </div>
            </div>
          </div>
        </div>

        {/* Organized By */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-foreground mb-4">Organizado por</h2>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push(`/profile/${event.creador_id._id}`)}
          >
            <img
              src={event.creador_id.imagen}
              alt={event.creador_id.firstname}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {event.creador_id.firstname} {event.creador_id.lastname}
              </div>
              <div className="text-xs text-muted-foreground">Organizador</div>
            </div>
          </div>
        </div>

        {/* Meeting Point */}
        {event.locationCoords && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-foreground mb-2">Punto de encuentro</h2>
            <p className="text-sm text-muted-foreground mb-4">{event.ubicacion}</p>
            <div
              className="w-full h-[200px] rounded-xl overflow-hidden cursor-pointer relative"
              onClick={() => setShowFullMapPuntoDeEncuntro(true)}
            >
              <LazyMap
                position={{
                  lat: event.locationCoords.lat,
                  lng: event.locationCoords.lng,
                }}
                onChange={() => {}}
                editable={false}
                showControls={false}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-transparent" />
            </div>
          </div>
        )}

        {/* Route Map */}
        {event.stravaMap?.id && decodedCoords.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-foreground mb-4">Mapa del recorrido</h2>
            <div
              className="w-full h-[250px] rounded-xl overflow-hidden cursor-pointer relative"
              onClick={() => setShowFullMap(true)}
            >
              <LazyStravaMap coords={routeCoords} className="w-full h-full" />
              <div className="absolute inset-0 bg-transparent" />
            </div>
          </div>
        )}

        {/* What's Included */}
        {event.detalles && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-foreground mb-4">
              ¿Qué incluye la inscripción?
            </h2>
            <p className="text-sm text-foreground leading-relaxed">{event.detalles}</p>
          </div>
        )}

        {/* Participants */}
        {miembros.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Participantes</h2>
              {miembros.length > 4 && (
                <button
                  onClick={() => router.push(`/social/miembros/${event._id}`)}
                  className="text-sm text-[#C95100] font-medium"
                >
                  Ver todos
                </button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {miembros.slice(0, 8).map((m) => (
                <div key={m._id} className="flex-shrink-0">
                  <img
                    src={m.imagen}
                    alt={m.firstname}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "/assets/icons/person_24dp_E8EAED.svg")
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Group */}
        {event.whatsappLink && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-foreground mb-4">Grupo de WhatsApp</h2>
            <a
              href={event.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              Unirse al grupo
            </a>
          </div>
        )}

        {/* Bottom Padding for Fixed Button */}
        <div className="pb-32" />
      </div>

      {/* Fixed Bottom CTA */}
      <div
        className="fixed left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4"
        style={{
          bottom: session ? "90px" : "0",
          maxWidth: "640px",
          margin: "0 auto",
          zIndex: 40
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-foreground">
              {event.precio == 0 || event.precio === "0"
                ? "Gratis"
                : `$${Number(event.precio).toLocaleString("es-AR")}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {parseLocalDate(event.fecha)} • {event.hora} hs
            </div>
          </div>

          {session?.user?.id === event.creador_id._id ? (
            <button
              onClick={() => router.push(`/social/editar/${event._id}`)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-foreground font-semibold rounded-xl transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Editar
            </button>
          ) : (
            <button
              onClick={handleAccion}
              disabled={estadoFinal === "pendiente" || estadoFinal === "si"}
              className={`px-6 py-3 font-semibold rounded-xl transition-all ${
                estadoFinal === "no"
                  ? "bg-[#C95100] hover:bg-[#A03D00] text-white"
                  : estadoFinal === "pendiente"
                    ? "bg-gray-400 text-white opacity-50 cursor-not-allowed"
                    : estadoFinal === "rechazado"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-green-600 text-white cursor-not-allowed"
              }`}
            >
              {estadoFinal === "no" && "Unirse"}
              {estadoFinal === "pendiente" &&
                (isProcessingPayment || joinFreeMutation.isPending
                  ? "Procesando..."
                  : "Solicitud enviada")}
              {estadoFinal === "rechazado" && "Reenviar"}
              {estadoFinal === "si" && "Ya eres miembro"}
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        isNight={isNight}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setIsProcessingPayment(false);
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
            className="absolute top-4 right-4 z-50 rounded-full bg-white text-gray-900 font-bold w-10 h-10 shadow-lg"
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
            className="absolute top-4 right-4 z-50 rounded-full bg-white text-gray-900 font-bold w-10 h-10 shadow-lg"
            onClick={() => setShowFullMapPuntoDeEncuntro(false)}
          >
            ✕
          </button>
          <div className="w-full h-full">
            <MapComponent
              position={{
                lat: event.locationCoords!.lat,
                lng: event.locationCoords!.lng,
              }}
              onChange={() => {}}
              editable={false}
              showControls={false}
            />
          </div>
        </div>
      )}
    </main>
  );
}
