"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import polyline from "polyline";
import StravaMap from "@/components/StravaMap";
import MapComponent from "@/components/MapComponent";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import PaymentModal from "@/components/PaymentModal";
import "leaflet/dist/leaflet.css";
import Skeleton from "react-loading-skeleton";
import LoginModal from "@/components/Modals/LoginModal";
import "react-loading-skeleton/dist/skeleton.css";
import DescriptionMarkdown from "@/components/DescriptionMarkdown";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { isNightEvent } from "@/lib/theme";
import { Activity, MapPin, Clock, BarChart3 } from "lucide-react";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { useSearchParams } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
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

export default function EventPage({ params }: PageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [showFullMap, setShowFullMap] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFullMapPuntoDeEncuntro, setShowFullMapPuntoDeEncuntro] =
    useState(false);

  // Hook para monitorear el estado del pago en tiempo real
  const { paymentStatus, isApproved, isPending } = usePaymentStatus(
    params.id,
    !!session?.user?.id
  );

  // Manejar parámetros de retorno de MercadoPago
  useEffect(() => {
    const paymentParam = searchParams.get('payment');
    if (paymentParam && session?.user?.id) {
      switch (paymentParam) {
        case 'success':
          toast.success('¡Pago exitoso! Tu solicitud ha sido enviada.');
          // Invalidar queries para actualizar estado
          queryClient.invalidateQueries({ queryKey: ["payment-status", params.id] });
          queryClient.invalidateQueries({ queryKey: ["unido", params.id, session.user.id] });
          queryClient.invalidateQueries({ queryKey: ["miembros", params.id] });
          break;
        case 'failure':
          toast.error('Pago fallido. Intenta nuevamente.');
          break;
        case 'pending':
          toast.info('Pago pendiente. Te notificaremos cuando sea procesado.');
          break;
      }
      // Limpiar el parámetro de la URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment');
      router.replace(newUrl.pathname, { scroll: false });
    }
  }, [searchParams, session?.user?.id, queryClient, params.id, router]);
  let decodedCoords: [number, number][] = [];
  let routeCoords: [number, number][] = [];

  // 📌 Evento
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
  });

  if (event?.stravaMap?.summary_polyline) {
    decodedCoords = polyline
      .decode(event.stravaMap.summary_polyline)
      .map(([lat, lng]) => [lng, lat]);
    routeCoords = decodedCoords;
  }

  // 📌 Miembros aprobados
  const { data: miembros = [], isLoading: loadingMiembros } = useQuery({
    queryKey: ["miembros", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/social/miembros?salidaId=${params.id}`);
      if (!res.ok) throw new Error("Error cargando miembros");
      const data = await res.json();
      return data.filter((m: any) => m.pago_id?.estado === "aprobado");
    },
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
    if (isApproved) return "si";
    if (isPending || paymentStatus?.isPending) return "pendiente";
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
      <main className="bg-background min-h-screen px-4 py-6 w-[390px] mx-auto">
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
      className={`min-h-screen w-[390px] mx-auto transition-colors ${
        isNight ? "theme-text-primary" : "text-foreground bg-background"
      }`}
      style={isNight ? { backgroundColor: "#2d3748" } : {}}
      data-theme={isNight ? "night" : undefined}
    >
      <div className="relative w-full h-[176px] ">
        <div
          style={{
            backgroundImage: `url(${event.imagen})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
          // width={375}
          // height={176}
          className="w-full object-cover h-[176px]"
        />

        {/* Botón volver */}
        <button
          onClick={() => router.back()}
          className="absolute top-2 left-3 btnFondo shadow-md rounded-full w-9 h-9 flex justify-center items-center"
        >
          <img
            src="/assets/icons/Collapse Arrow.svg"
            alt="callback"
            className="h-[20px] w-[20px]"
          />
        </button>

        <button
          onClick={() => toggleFavoritoMutation.mutate()}
          className="absolute top-2 right-[55px] btnFondo shadow-md rounded-full p-2 flex justify-center items-center"
        >
          {favorito ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="red"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.5 4 5.5 4c1.54 0 3.04.99 3.57 2.36h1.87C13.46 4.99 14.96 4 16.5 4 18.5 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="black"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                d="M12.1 21.35l-1.1-1.05C5.14 15.24 2 12.32 2 8.5 2 6 3.98 4 6.5 4c1.74 0 3.41 1.01 4.13 2.44h1.74C14.09 5.01 15.76 4 17.5 4 20.02 4 22 6 22 8.5c0 3.82-3.14 6.74-8.9 11.8l-1 1.05z"
                strokeWidth="2"
              />
            </svg>
          )}
        </button>
        <button
          onClick={() => {
            const url = event.shortId
              ? `${window.location.origin}/s/${event.shortId}`
              : window.location.href;

            if (navigator.share) {
              navigator.share({ title: event.nombre, url }).catch(() => {});
            } else {
              navigator.clipboard
                .writeText(url)
                .then(() => toast.success("¡Link copiado al portapapeles!"))
                .catch((err) => console.error("Error al copiar el link:", err));
            }
          }}
          className="btnFondo absolute top-2 right-2 text-white p-2 rounded-full shadow-md"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M20 13L20 18C20 19.1046 19.1046 20 18 20L6 20C4.89543 20 4 19.1046 4 18L4 13"
                stroke="#000000"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M16 8L12 4M12 4L8 8M12 4L12 16"
                stroke="#000000"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </g>
          </svg>
        </button>
      </div>
      <div className="px-4 py-2">
        <h1
          className={`text-xl font-semibold text-center ${
            isNight ? "theme-text-primary" : "text-foreground"
          }`}
        >
          {event.nombre}
        </h1>
        <div
          className={`text-sm flex flex-col w-full gap-1 justify-center items-center ${
            isNight ? "theme-text-secondary" : "text-[#808488]"
          }`}
        >
          <div className="flex items-center justify-center">
            <svg
              height="13px"
              width="13px"
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="#FF3D00"
              stroke="#FF3D00"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                  style={{ fill: "#FF3D00" }}
                  d="M255.999,0C166.683,0,94.278,72.405,94.278,161.722c0,81.26,62.972,235.206,161.722,350.278 c98.75-115.071,161.722-269.018,161.722-350.278C417.722,72.405,345.316,0,255.999,0z"
                ></path>{" "}
                <g style={{ opacity: "0.1" }}>
                  {" "}
                  <path d="M168.207,125.87c15.735-64.065,67.63-109.741,128.634-120.664C283.794,1.811,270.109,0,255.999,0 C166.683,0,94.277,72.405,94.277,161.722c0,73.715,51.824,207.247,135.167,317.311C170.39,349.158,150.032,199.872,168.207,125.87z "></path>{" "}
                </g>{" "}
                <path
                  style={{ fill: "#FFFF" }}
                  d="M255.999,235.715c-40.81,0-74.014-33.203-74.019-74.014c0.005-40.795,33.209-73.998,74.019-73.998 s74.014,33.203,74.019,74.014C330.015,202.513,296.809,235.715,255.999,235.715z"
                ></path>{" "}
              </g>
            </svg>
            <span>{event.localidad}</span>
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-4"></div>
        </div>

        <div className="w-full flex items-center flex-col mt-6">
          <div className="flex items-center justify-start gap-2 w-[90%]">
            <div className="h-[80px] w-[80px] bg-card shadow-md rounded-full flex justify-center items-center border">
              <img
                src={event.creador_id.imagen}
                alt="Organizador"
                className="h-[70px] w-[70px] rounded-full object-cover border"
              />
            </div>

            <span
              className={`text-sm pr-[20px] font-light ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              Organizado por {event.creador_id.firstname}{" "}
              {event.creador_id.lastname}
            </span>
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-6"></div>
        </div>

        <div className="w-full flex flex-col items-center mt-6">
          <div className="w-[80%] flex flex-col items-center gap-3">
            <div
              className={`text-sm flex items-center w-full font-light gap-1 ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              <Activity
                size={20}
                style={{
                  color: isNight ? "var(--theme-text-primary)" : "currentColor",
                }}
              />
              {event.deporte}
            </div>
            <div
              className={`text-sm flex items-center w-full font-light gap-1 ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              <MapPin
                size={20}
                style={{
                  color: isNight ? "var(--theme-text-primary)" : "currentColor",
                }}
              />
              {event.localidad}
            </div>
            <div
              className={`text-sm flex items-center w-full font-light gap-1 ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              <Clock
                size={18}
                style={{
                  color: isNight ? "var(--theme-text-primary)" : "currentColor",
                }}
              />
              {event.duracion} de duración de la salida
            </div>
            <div
              className={`text-sm flex items-center w-full font-light gap-1 capitalize ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              <BarChart3
                size={18}
                style={{
                  color: isNight ? "var(--theme-text-primary)" : "currentColor",
                }}
              />
              {event.dificultad}
            </div>
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-7"></div>
        </div>
        <div className="w-full flex flex-col items-center mt-6">
          <div className="w-[90%]">
            <DescriptionMarkdown text={event.descripcion} isNight={isNight} />
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-7"></div>
        </div>

        <div className="w-full flex flex-col items-center mt-6">
          <div className="w-[90%]">
            <p className="mb-2">
              <span
                className={`text-lg font-normal ${
                  isNight ? "theme-text-primary" : "text-foreground"
                }`}
              >
                Punto de encuentro
              </span>
              <br />
              <span
                className={`text-sm mb-2 font-extralight ${
                  isNight ? "theme-text-secondary" : "text-muted-foreground"
                }`}
              >
                {event.ubicacion}
              </span>
            </p>
            {event.locationCoords ? (
              <div className="w-full relative h-[300px] rounded-xl overflow-hidden border z-0">
                <MapComponent
                  position={{
                    lat: event.locationCoords.lat,
                    lng: event.locationCoords.lng,
                  }}
                  onChange={() => {}}
                  editable={false}
                  showControls={false} // callback vacío si no quieres actualizar nada
                />
                <div
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded"
                  onClick={() => setShowFullMapPuntoDeEncuntro(true)}
                >
                  Tocar para ampliar
                </div>
              </div>
            ) : (
              <p
                className={`text-sm ${
                  isNight ? "theme-text-secondary" : "text-muted-foreground"
                }`}
              >
                No hay coordenadas disponibles.
              </p>
            )}
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-7"></div>
        </div>

        {event.stravaMap?.id ? (
          <>
            {" "}
            <div className="mt-10 w-full flex flex-col items-center">
              <div className="flex flex-col w-[90%] gap-2">
                <span
                  className={`text-lg font-normal ${
                    isNight ? "theme-text-primary" : "text-foreground"
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
                      <StravaMap coords={routeCoords} />
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
                className={`text-lg font-normal mb-1 w-[90%] ${
                  isNight ? "theme-text-primary" : "text-foreground"
                }`}
              >
                ¿Que incluye la inscripción?
              </div>
              <div
                className={`w-[90%] font-extralight text-justify break-words ${
                  isNight ? "theme-text-primary" : "text-foreground"
                }`}
              >
                {event.detalles}
              </div>
              <div className="w-[90%] border-b borderb-[#808488] mt-6"></div>
            </div>
          </>
        ) : null}

        {event.profesorId ? (
          <div className="w-full flex flex-col items-center mt-8">
            <div className="flex justify-center flex-col items-center gap-3">
              <div
                className="bg-card p-3 w-[300px] rounded-[20px] flex flex-col shadow-md border self-center items-center gap-3"
                onClick={() => router.push(`/profile/${event.profesorId._id}`)}
              >
                <div
                  className="rounded-full h-[100px] w-[100px] shadow-md"
                  style={{
                    backgroundImage: `url(${event.profesorId?.imagen})`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                ></div>
                <div className="flex flex-col items-center">
                  <h2
                    className={`text-xl font-normal ${
                      isNight ? "theme-text-primary" : "text-foreground"
                    }`}
                  >
                    {event.profesorId?.firstname} {event.profesorId?.lastname}
                  </h2>
                  <p
                    className={`text-sm font-light mb-1 ${
                      isNight ? "theme-text-secondary" : "text-muted-foreground"
                    }`}
                  >
                    Profesor
                  </p>
                  <a
                    href={`https://wa.me/${event.profesorId?.telnumber?.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white z-50 font-medium border  bg-[#C95100] px-[20px] py-[3px] rounded-[20px]"
                  >
                    Contacto
                  </a>
                </div>
              </div>
              <div
                className={`w-[90%] font-extralight text-justify ${
                  isNight ? "theme-text-primary" : "text-foreground"
                }`}
              >
                {event.profesorId.bio}
              </div>
            </div>
            <div className="w-[90%] border-b borderb-[#808488] mt-8"></div>
          </div>
        ) : null}

        <div className="flex flex-col items-center mt-8">
          <div className="w-[90%]">
            <h2
              className={`text-lg font-normal mb-1 ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              Grupo de Whatsapp
            </h2>
            {event.whatsappLink && (
              <div className="flex justify-center mt-2">
                <a
                  href={event.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border w-full py-1 rounded-[10px] font-light bg-card shadow-md justify-center"
                >
                  Unirse{" "}
                </a>
              </div>
            )}
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-8"></div>
        </div>

        <div className="flex w-full justify-center items-center mt-6">
          <div className="w-[90%]">
            <p
              className={`text-lg font-normal mb-1 ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              Participantes
            </p>
            <div className="flex space-x-2 mt-1 flex-wrap gap-2 justify-center items-center">
              {miembros.length > 0 ? (
                <>
                  {miembros.slice(0, 4).map((m) => (
                    <img
                      key={m._id}
                      src={m.imagen}
                      alt={m.firstname}
                      className="h-24 w-24 rounded-full object-cover border shadow-md"
                      // title={m.}
                      onError={(e) =>
                        ((e.target as HTMLImageElement).src =
                          "/assets/icons/person_24dp_E8EAED.svg")
                      }
                    />
                  ))}
                  {miembros.length > 4 && (
                    <div
                      className="h-24 w-24 rounded-full bg-card text-lg flex items-center justify-center border text-orange-500 font-semibold shadow-md"
                      onClick={() =>
                        router.push(`/social/miembros/${event._id}`)
                      }
                    >
                      +{miembros.length - 4}
                    </div>
                  )}
                </>
              ) : (
                <span
                  className={
                    isNight ? "theme-text-secondary" : "text-muted-foreground"
                  }
                >
                  Nadie se ha unido aún
                </span>
              )}
            </div>
            <div className="w-[90%] border-b borderb-[#808488] mt-8"></div>
          </div>
        </div>

        {/* Sección de Sponsors */}
        {event.sponsors && event.sponsors.length > 0 && (
          <div className="flex flex-col items-center mt-8">
            <div className="w-[90%]">
              <h2
                className={`text-lg font-normal mb-3 text-center ${
                  isNight ? "theme-text-primary" : "text-foreground"
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
                        className={`text-sm font-medium text-center ${
                          isNight ? "theme-text-primary" : "text-gray-800"
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

        <div
          className={`fixed w-[100%] left-1/2 -translate-x-1/2 z-50
    ${session ? "bottom-[80px]" : "bottom-[1px]"}`}
        >
          <div
            className={`shadow-md h-[120px] border flex justify-between items-center ${
              isNight
                ? "theme-bg-secondary border-gray-600"
                : "bg-card border-border"
            }`}
          >
            <div className="w-[50%] flex flex-col pl-4">
              <p
                className={`font-semibold text-xl underline ${
                  isNight ? "theme-text-primary" : "text-foreground"
                }`}
              >
                {event.precio == 0 || event.precio === "0"
                  ? "Gratis"
                  : `$${Number(event.precio).toLocaleString("es-AR")}`}
              </p>
              <p
                className={`text-xs ${
                  isNight ? "theme-text-secondary" : "text-muted-foreground"
                }`}
              >
                {parseLocalDate(event.fecha)}, {event.hora} hs
              </p>
              <div className="flex w-full justify-between">
                <p
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                    (event.cupo - miembros.length) / event.cupo > 0.5
                      ? "bg-green-100 text-green-800"
                      : (event.cupo - miembros.length) / event.cupo > 0.2
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  Cupos: {event.cupo - miembros.length}/{event.cupo}
                </p>
              </div>
            </div>

            <div className="flex h-[60px] w-[50%] justify-center items-center">
              {session?.user?.id === event.creador_id._id ? (
                // Si es el creador, mostrar botón editar
                <button
                  onClick={() => router.push(`/social/editar/${event._id}`)}
                  className={`h-[30px] shadow-md text-sm rounded-[10px] flex items-center justify-center border w-[90px] font-semibold ${
                    isNight
                      ? "theme-bg-primary border-gray-600 theme-text-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  Editar
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleAccion();
                  }}
                  disabled={estadoFinal === "pendiente" || estadoFinal === "si"} // deshabilitar si está pendiente o ya unido
                  className={`rounded-[20px] w-auto px-4 flex justify-center items-center font-semibold text-lg
        ${estadoFinal === "no" ? (isNight ? "seasonal-gradient text-white" : "bg-[#C95100] text-white") : ""}
        ${estadoFinal === "pendiente" ? "bg-gray-400 text-white opacity-50" : ""}
        ${estadoFinal === "rechazado" ? "bg-red-500 text-white" : ""}
        ${estadoFinal === "si" ? (isNight ? "theme-accent-bg-primary text-white" : "bg-[#001A46] text-white") : ""}
      `}
                >
                  {estadoFinal === "no" && "Unirse"}
                  {estadoFinal === "pendiente" && (isPending ? "Procesando pago..." : "Solicitud enviada")}
                  {estadoFinal === "rechazado" && "Reenviar"}
                  {estadoFinal === "si" && "Miembro"}
                </button>
              )}
            </div>
          </div>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />

        <div className="pb-[200px]" />
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        salidaId={params.id}
        precio={event.precio}
        cbu={event.cbu}
        alias={event.alias}
        userId={session?.user.id}
        eventName={event.nombre}
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
