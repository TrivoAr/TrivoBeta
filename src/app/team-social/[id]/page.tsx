"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import LoginModal from "@/components/Modals/LoginModal";
import MapComponent from "@/components/MapComponent";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { se } from "date-fns/locale";
import PaymentModal from "@/components/PaymentModal";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface EventData {
  _id: string;
  nombre: string;
  ubicacion: string;
  precio: string;
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
  creadorId: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen: string;
  };
  locationCoords?: {
    lat: number;
    lng: number;
  };
  shortId: string;
  detalles: string;
  alias: string;
  cbu: string;
  dificultad: string;
  bar?: {
    _id: string;
    name: string;
    direccion: string;
    logo: string;
    imagenesCarrusel: string[];
  };
  sponsors?: Array<{
    _id: string;
    name: string;
    imagen: string;
  }>;
}

interface Miembro {
  _id: string;
  nombre: string;
  imagen: string;
}

export default function TeamEventPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const router = useRouter();
  const [favorito, setFavorito] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [profile, setProfile] = useState({
    fullname: "",
    email: "",
    telnumber: "",
    rol: "",
    instagram: "",
    facebook: "",
    twitter: "",
    bio: "",
    dni: "",
  });
  const [yaUnido, setYaUnido] = useState<
    "no" | "pendiente" | "rechazado" | "si"
  >("no");
  const [showFullMapPuntoDeEncuntro, setShowFullMapPuntoDeEncuntro] =
    useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  useEffect(() => {
    if (session?.user) {
      const fetchProfile = async () => {
        try {
          const res = await fetch("/api/profile");
          const data = await res.json();
          if (res.ok) {
            setProfile({
              fullname: `${data.firstname} ${data.lastname}`,
              email: data.email || "",
              telnumber: data.telnumber || "",
              rol: data.role || "",
              instagram: data.instagram || "",
              facebook: data.facebook || "",
              twitter: data.twitter || "",
              bio: data.bio || "",
              dni: data.dni || "",
            });
          }
        } catch (error) {
        }
      };

      fetchProfile();
    }
  }, [session]);
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/team-social/${id}`);
        setEvent(response.data);
      } catch (err) {
        setError("Error al cargar el evento");
      } finally {
        setLoading(false);
      }
    };

    const fetchMiembros = async () => {
      try {
        const res = await fetch(
          `/api/team-social/miembros?teamSocialId=${id}`
        );
        const data = await res.json();
        setMiembros(data);
      } catch (err) {
        // Error al cargar miembros
      }
    };

    const checkUnido = async () => {
      try {
        const res = await fetch(`/api/social/miembros/${event._id}`);
        const data = await res.json();

        const miMiembro = data.find(
          (m: any) => m.usuario_id?._id === session?.user?.id
        );

        if (!miMiembro) {
          setYaUnido("no");
        } else if (miMiembro.pago_id?.estado === "pendiente") {
          setYaUnido("pendiente");
        } else if (miMiembro.pago_id?.estado === "rechazado") {
          setYaUnido("rechazado");
        } else if (miMiembro.pago_id?.estado === "aprobado") {
          setYaUnido("si");
        }
      } catch (err) {
        // Error en checkUnido
      }
    };

    fetchEvent();
    fetchMiembros();
    if (session) checkUnido();
    checkFavorito();
  }, [id, session]);

  const handleAccion = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    if (!profile.dni || !profile.telnumber) {
      toast.error(
        "Debes completar tu perfil con DNI y teléfono antes de enviar el comprobante"
      );
      router.push("/dashboard/profile/editar");
      return;
    }

    if (event.cupo - miembros.length === 0) {
      toast.error("Cupo completo. No puedes unirte.");
      return;
    }

    // Si no está unido, enviamos solicitud
    if (yaUnido === "no") {
      const res = await fetch(`/api/social/miembros/${event._id}`);
      const data = await res.json();
      if (data.length === event.cupo) {
        toast.error("Cupo completo. No puedes unirte.");
        return;
      }
      setShowPaymentModal(true);
    }
  };

  const checkFavorito = async () => {
    try {
      const res = await fetch(`/api/favoritos/teamsocial/${id}`);
      const data = await res.json();
      setFavorito(data.favorito);
    } catch (err) {
      // Error al verificar favorito
    }
  };

  const toggleFavorito = async () => {
    if (!session) {
      toast.error("Debes iniciar sesión para agregar a favoritos.");
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`/api/favoritos/teamsocial/${id}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("No se pudo cambiar favorito");

      const data = await res.json();
      setFavorito(data.favorito);
      toast.success(
        data.favorito
          ? "Academia agregada a favoritos"
          : "Academia eliminada de favoritos"
      );
    } catch (err) {
      // Error al hacer toggle de favorito
    }
  };

  if (loading)
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
  if (error || !event)
    return (
      <main className="py-20 text-center">
        {error || "Evento no encontrado"}
      </main>
    );

  const parseLocalDate = (isoDateString: string): string => {
    const [year, month, day] = isoDateString.split("-");
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return localDate.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <main className="bg-background min-h-screen text-foreground  w-[390px] mx-auto">
      <div className="relative w-full h-[176px] ">
        <Image
          src={event.imagen}
          alt="Evento"
          width={375}
          height={176}
          className="w-full h-full object-cover"
        />

        {/* Botón volver */}
        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 btnFondo shadow-md rounded-full w-9 h-9 flex justify-center items-center"
        >
          <img
            src="/assets/icons/Collapse Arrow.svg"
            alt="callback"
            className="h-[20px] w-[20px]"
          />
        </button>

        <button
          onClick={toggleFavorito}
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
          )}{" "}
        </button>

        {/* Botón compartir */}
        <button
          onClick={() => {
            navigator.clipboard
              .writeText(window.location.href)
              .then(() => {
                toast.success("¡Link copiado al portapapeles!");
              })
              .catch((err) => {
                // Error al copiar el link
              });
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
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Título */}
        <h1 className="text-xl font-semibold text-center">{event.nombre}</h1>

        {/* Localidad */}
        <div className="text-sm text-[#808488] flex flex-col items-center gap-1 mt-2">
          <div className="flex items-center justify-center gap-1">
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
          <div className="w-[90%] border-b border-border mt-4"></div>
        </div>

        {/* Organizador */}
        <div className="w-full flex flex-col items-center mt-6">
          <div className="flex items-center gap-3 w-[90%]">
            <div className="h-20 w-20 bg-card shadow-md rounded-full flex justify-center items-center border">
              <img
                src={
                  event.creadorId.imagen ||
                  "/assets/icons/person_24dp_E8EAED.svg"
                }
                alt="Organizador"
                className="h-16 w-16 rounded-full object-cover"
              />
            </div>
            <span className="text-sm font-light">
              Organizado por {event.creadorId.firstname}{" "}
              {event.creadorId.lastname}
            </span>
          </div>
          <div className="w-[90%] border-b border-border mt-6"></div>
        </div>

        {/* Detalles del evento */}
        <div className="w-full flex flex-col items-center mt-6">
          <div className="w-[80%] flex flex-col gap-3">
            <div className="text-sm flex items-center gap-2 font-light">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
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
                    d="M15 7C16.1046 7 17 6.10457 17 5C17 3.89543 16.1046 3 15 3C13.8954 3 13 3.89543 13 5C13 6.10457 13.8954 7 15 7Z"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>{" "}
                  <path
                    d="M12.6133 8.26691L9.30505 12.4021L13.4403 16.5374L11.3727 21.0861"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>{" "}
                  <path
                    d="M6.4104 9.5075L9.79728 6.19931L12.6132 8.26692L15.508 11.5752H19.2297"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>{" "}
                  <path
                    d="M8.89152 15.7103L7.65095 16.5374H4.34277"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>{" "}
                </g>
              </svg>
              {event.deporte}
            </div>
            <div className="text-sm flex items-center w-full font-light gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <rect width="24" height="24" fill="white"></rect>{" "}
                  <path
                    d="M18 9C18 13.7462 14.2456 18.4924 12.6765 20.2688C12.3109 20.6827 11.6891 20.6827 11.3235 20.2688C9.75444 18.4924 6 13.7462 6 9C6 7 7.5 3 12 3C16.5 3 18 7 18 9Z"
                    stroke="#000000"
                    strokeLinejoin="round"
                  ></path>{" "}
                  <circle
                    cx="12"
                    cy="9"
                    r="2"
                    stroke="#000000"
                    strokeLinejoin="round"
                  ></circle>{" "}
                </g>
              </svg>
              {event.localidad}
            </div>
            <div className="text-sm flex items-center w-full font-light gap-1">
              <svg
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="#000000"
                height={18}
                width={18}
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <circle cx="32" cy="32" r="24"></circle>
                  <polyline points="40 44 32 32 32 16"></polyline>
                </g>
              </svg>
              {event.duracion} de duración de la salida
            </div>
            <div className="text-sm flex items-center w-full font-light gap-1 capitalize">
              <svg
                fill="#000000"
                viewBox="0 0 32 32"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                height={18}
                width={18}
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <title>signal</title>{" "}
                  <path d="M2 25.25c-0.414 0-0.75 0.336-0.75 0.75v0 4c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-4c-0-0.414-0.336-0.75-0.75-0.75v0zM8.968 19.25c-0.414 0-0.75 0.336-0.75 0.75v0 10c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-10c-0-0.414-0.336-0.75-0.75-0.75v0zM16 13.25c-0.414 0-0.75 0.336-0.75 0.75v0 16c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-16c-0-0.414-0.336-0.75-0.75-0.75v0zM30 1.25c-0.414 0-0.75 0.336-0.75 0.75v0 28c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-28c-0-0.414-0.336-0.75-0.75-0.75v0zM23 7.249c-0.414 0-0.75 0.336-0.75 0.75v0 22.001c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-22.001c-0-0.414-0.336-0.75-0.75-0.75v0z"></path>{" "}
                </g>
              </svg>
              {event.dificultad}
            </div>
            {/* Agregar más detalles como fecha, duración, dificultad si están disponibles */}
          </div>
          <div className="w-[90%] border-b border-border mt-6"></div>
        </div>

        {/* Descripción */}
        <div className="w-full flex flex-col items-center mt-6">
          <div className="w-[90%] font-extralight text-justify">
            {event.descripcion}
          </div>
          <div className="w-[90%] border-b border-border mt-6"></div>
        </div>

        {/* Punto de encuentro */}
        <div className="w-full flex flex-col items-center mt-6">
          <div className="w-[90%]">
            <p className="mb-3">
              <span className="text-lg font-normal">Punto de encuentro</span>
              <br />
              <span className="text-sm text-muted-foreground font-extralight">
                {event.ubicacion}
              </span>
            </p>

            {event.locationCoords ? (
              <div className="w-full relative h-[300px] rounded-xl overflow-hidden border shadow-md z-0">
                {/* Map Component */}
                {event.locationCoords ? (
                  <div className="w-full relative h-[300px] rounded-xl overflow-hidden border z-0">
                    <MapComponent
                      position={{
                        lat: event.locationCoords.lat,
                        lng: event.locationCoords.lng,
                      }}
                      onChange={() => { }}
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
                  <p className="text-sm text-muted-foreground">
                    No hay coordenadas disponibles.
                  </p>
                )}
                {/* Botón "Tocar para ampliar" */}
                {/* <div
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded cursor-pointer hover:bg-opacity-70 transition"
          onClick={() => setShowFullMapPuntoDeEncuntro(true)}
        >
          Tocar para ampliar
        </div> */}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay coordenadas disponibles.
              </p>
            )}
          </div>

          <div className="w-[90%] border-b border-gray-300 mt-7"></div>
        </div>

        {/* Recorrido (si existe Strava Map) */}
        {/* {decodedCoords.length > 0 && (
  <div className="mt-10 w-full flex flex-col items-center">
    <div className="flex flex-col w-[90%] gap-2">
      <span className="text-lg font-normal">Recorrido</span>
      <div className="w-full h-[300px] rounded-xl overflow-hidden cursor-pointer relative border shadow-md">
        <StravaMap coords={routeCoords} />
        <div
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded cursor-pointer hover:bg-opacity-70 transition"
          onClick={() => setShowFullMap(true)}
        >
          Tocar para ampliar
        </div>
      </div>
    </div>
  </div>
)} */}

        {/* Grupo de Whatsapp */}
        <div className="flex flex-col items-center mt-6 w-full">
          <div className="w-[90%]">
            <h2 className="text-lg font-semibold mb-2 text-foreground">
              Grupo de Whatsapp
            </h2>

            {event.whatsappLink ? (
              <div className="flex justify-center mt-2">
                <a
                  href={event.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border w-full py-3 rounded-lg font-medium bg-card shadow-md justify-center hover:bg-green-50 transition text-muted-foreground"
                >
                  Unirse
                </a>
              </div>
            ) : (
              <p className="text-center text-muted-foreground mt-3">
                No tiene un grupo vinculado
              </p>
            )}
          </div>

          <div className="w-[90%] border-b border-gray-300 mt-8"></div>
        </div>

        {/* Participantes */}
        <div className="flex flex-col items-center mt-6">
          <div className="w-[90%]">
            <p className="text-lg font-normal mb-2">Participantes</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {miembros.length > 0 ? (
                <>
                  {miembros.slice(0, 4).map((m) => (
                    <img
                      key={m._id}
                      src={m.imagen}
                      alt={m.nombre}
                      className="h-16 w-16 rounded-full object-cover border shadow-md"
                      onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "/assets/icons/person_24dp_E8EAED.svg")
                      }
                    />
                  ))}
                  {miembros.length > 4 && (
                    <div
                      className="h-16 w-16 rounded-full bg-card text-lg flex items-center justify-center border text-orange-500 font-semibold shadow-md cursor-pointer"
                      onClick={() =>
                        router.push(`/social/miembros/${event._id}`)
                      }
                    >
                      +{miembros.length - 4}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">
                  Nadie se ha unido aún
                </span>
              )}
            </div>
          </div>
          <div className="w-[90%] border-b border-border mt-6"></div>
        </div>

        {/* Bar */}
        {event.bar && (
          <div className="flex flex-col items-center mt-6">
            <div className="w-[90%]">
              <p className="text-lg font-normal mb-3">Bar para el after</p>

              {/* Información del bar */}
              <div className="bg-card rounded-[20px] p-4 shadow-md border">
                <div className="flex items-center gap-3 mb-3">
                  {/* Logo del bar */}
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden border shadow-sm cursor-pointer flex-shrink-0"
                    onClick={() => {
                      setSelectedImage(event.bar!.logo);
                      setShowImageModal(true);
                    }}
                  >
                    <img
                      src={event.bar.logo}
                      alt={event.bar.name}
                      className="w-full h-full object-cover hover:opacity-80 transition"
                      onError={(e) => ((e.target as HTMLImageElement).src = "")}
                    />
                  </div>

                  {/* Información del bar */}
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {event.bar.name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        width={14}
                        height={14}
                      >
                        <path
                          d="M18 9C18 13.7462 14.2456 18.4924 12.6765 20.2688C12.3109 20.6827 11.6891 20.6827 11.3235 20.2688C9.75444 18.4924 6 13.7462 6 9C6 7 7.5 3 12 3C16.5 3 18 7 18 9Z"
                          stroke="#666"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="9"
                          r="2"
                          stroke="#666"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {event.bar.direccion}
                    </p>
                  </div>
                </div>

                {/* Carrusel de imágenes */}
                {event.bar.imagenesCarrusel &&
                  event.bar.imagenesCarrusel.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {event.bar.imagenesCarrusel.map((imagen, index) => (
                        <div
                          key={index}
                          className="w-20 h-20 rounded-lg overflow-hidden border shadow-sm cursor-pointer flex-shrink-0"
                          onClick={() => {
                            setSelectedImage(imagen);
                            setShowImageModal(true);
                          }}
                        >
                          <img
                            src={imagen}
                            alt={`${event.bar!.name} - Imagen ${index + 1}`}
                            className="w-full h-full object-cover hover:opacity-80 transition"
                            onError={(e) =>
                              ((e.target as HTMLImageElement).src = "")
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
            <div className="w-[90%] border-b border-border mt-6"></div>
          </div>
        )}

        {/* Sponsors */}
        {event.sponsors && event.sponsors.length > 0 && (
          <div className="flex flex-col items-center mt-6">
            <div className="w-[90%]">
              <p className="text-lg font-normal mb-3">Sponsors</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {event.sponsors.map((sponsor) => (
                  <div key={sponsor._id} className="">
                    <img
                      src={sponsor.imagen}
                      alt={sponsor.name}
                      className="w-24 h-24 rounded-full object-cover border"
                      onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "/assets/icons/business.svg")
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para ampliar imágenes */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* <div className="mt-8 mb-[150px]">
        <button
          onClick={handleAccion}
          className={`w-full py-3 rounded-full font-semibold transition ${
            yaUnido
              ? "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
              : "bg-green-100 text-green-600 hover:bg-green-600 hover:text-white"
          }`}
        >
          {yaUnido ? "Salir " : "Unirse a la salida"}
        </button>
      </div> */}

      <div
        className={`fixed w-full left-1/2 -translate-x-1/2 z-50 ${session ? "bottom-[80px]" : "bottom-0"
          }`}
      >
        <div className="bg-background shadow-lg h-[120px] border-t px-4 flex justify-between items-center">
          {/* Información del evento */}
          <div className="w-1/2 flex flex-col">
            <p className="font-semibold text-foreground text-xl underline">
              ${Number(event.precio).toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-muted-foreground">
              {parseLocalDate(event.fecha)}, {event.hora} hs
            </p>

            <div className="flex w-full justify-between mt-2">
              <p
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap font-medium ${(event.cupo - miembros.length) / event.cupo > 0.5
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

          {/* Botón de acción */}
          <div className="flex h-[60px] w-1/2 justify-center items-center">
            {session?.user?.id === event.creadorId._id ? (
              <button
                onClick={() => router.push(`/social/editar/${event._id}`)}
                className="bg-card shadow-md text-sm rounded-lg flex items-center justify-center border w-[90px] h-[40px] font-semibold hover:bg-muted transition"
              >
                Editar
              </button>
            ) : (
              <button
                onClick={() => {
                  handleAccion();
                }}
                disabled={yaUnido === "pendiente" || yaUnido === "si"} // deshabilitar si está pendiente o ya unido
                className={`rounded-[20px] w-auto px-4 flex justify-center items-center font-semibold text-lg
        ${yaUnido === "no" ? "bg-[#C95100] text-white" : ""}
        ${yaUnido === "pendiente" ? "bg-muted text-white opacity-50" : ""}
        ${yaUnido === "rechazado" ? "bg-red-500 text-white" : ""}
        ${yaUnido === "si" ? "bg-[#001A46] text-white" : ""}
      `}
              >
                {yaUnido === "no" && "Unirse"}
                {yaUnido === "pendiente" && "Solicitud enviada"}
                {yaUnido === "rechazado" && "Reenviar"}
                {yaUnido === "si" && "Miembro"}
              </button>
            )}
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        salidaId={params.id}
        precio={event.precio}
        cbu={event.cbu}
        alias={event.alias}
        userId={session?.user.id}
      />
      <div className="pb-[200px]" />
    </main>
  );
}
