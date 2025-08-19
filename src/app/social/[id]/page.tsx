"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import polyline from "polyline";
import StravaMap from "@/components/StravaMap";
import MapComponent from "@/components/MapComponent";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import Skeleton from "react-loading-skeleton";
import LoginModal from "@/components/Modals/LoginModal";
import "react-loading-skeleton/dist/skeleton.css";
import { url } from "inspector";
// import "MatchLoadingSkeleton" from "components/MatchLoadingSkeleton";

// Configuración del icono por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
}

interface Miembro {
  _id: string;
  nombre: string;
  imagen: string;
}

export default function EventPage({ params }: PageProps) {
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [yaUnido, setYaUnido] = useState(false);
  const [favorito, setFavorito] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  let decodedCoords: [number, number][] = [];

  if (event?.stravaMap?.summary_polyline) {
    decodedCoords = polyline
      .decode(event.stravaMap.summary_polyline)
      .map(([lat, lng]) => [lng, lat]);
  }

  const router = useRouter();

  //   const routeGeoJSON = {
  //   type: "Feature",
  //   geometry: {
  //     type: "LineString",
  //     coordinates: coords.map(([lat, lng]) => [lng, lat]),
  //   },
  // };

  let routeGeoJSON = null;

  // if (event?.stravaMap?.summary_polyline) {
  //   console.log("que digo", event.stravaMap);
  //   try {
  //     const coords = polyline.decode(event.stravaMap.summary_polyline);
  //     routeGeoJSON = {
  //       type: "Feature",
  //       geometry: {
  //         type: "LineString",
  //         coordinates: coords.map(([lat, lng]) => [lng, lat]),
  //       },
  //     };
  //   } catch (err) {
  //     console.error("Error decodificando la polyline:", err);
  //   }
  // }

  let routeCoords: [number, number][] = [];

  if (event?.stravaMap?.summary_polyline) {
    try {
      routeCoords = polyline
        .decode(event.stravaMap.summary_polyline)
        .map(([lat, lng]) => [lng, lat]);
    } catch (err) {
      console.error("Error decodificando la polyline:", err);
    }
  }

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/social/${params.id}`);
        setEvent(response.data);
      } catch (err) {
        console.error("Error al cargar evento", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMiembros = async () => {
      try {
        const res = await fetch(`/api/social/miembros?salidaId=${params.id}`);
        const data = await res.json();
        setMiembros(data);
      } catch (err) {
        console.error("Error al cargar miembros", err);
      }
    };

    const checkUnido = async () => {
      const res = await fetch("/api/social/unirse/estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salidaId: params.id }),
      });
      const data = await res.json();
      setYaUnido(data.unido);
    };

    fetchEvent();
    fetchMiembros();
    if (session) checkUnido();
    checkFavorito();
  }, [params.id, session]);

  const handleAccion = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    const metodo = yaUnido ? "DELETE" : "POST";
    const url = yaUnido
      ? `/api/social/unirse?salidaId=${params.id}`
      : "/api/social/unirse";

    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: yaUnido ? null : JSON.stringify({ salidaId: params.id }),
    });

    if (res.ok) {
      alert(yaUnido ? "Has salido de la salida" : "¡Te uniste exitosamente!");
      setYaUnido(!yaUnido);
    } else {
      const msg = await res.text();
      alert("Error: " + msg);
    }
  };

  const checkFavorito = async () => {
    try {
      const res = await fetch(`/api/favoritos/sociales/${params.id}`);
      const data = await res.json();
      setFavorito(data.favorito);
    } catch (err) {
      console.error("Error al verificar favorito:", err);
    }
  };

  const toggleFavorito = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/favoritos/sociales/${params.id}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("No se pudo cambiar favorito");

      const data = await res.json();
      setFavorito(data.favorito);
      toast.success(
        data.favorito
          ? "Salida agregada a favoritos"
          : "Salida eliminada de favoritos"
      );
    } catch (err) {
      console.error("Error al hacer toggle de favorito:", err);
    }
  };

  if (loading)
    return (
      <main className="bg-[#FEFBF9] min-h-screen px-4 py-6 w-[390px] mx-auto">
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

  console.log("saida", event);

  return (
    <main className="bg-[#FEFBF9] min-h-screen text-black  w-[390px] mx-auto">
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
          )}
        </button>

        {/* Botón compartir */}
        <button
          onClick={() => {
            navigator.clipboard
              .writeText(window.location.href)
              .then(() => {
                // alert("¡Link copiado al portapapeles!");
                toast.success("¡Link copiado al portapapeles!");
              })
              .catch((err) => {
                console.error("Error al copiar el link:", err);
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
      <div className="px-4 py-2">
        <h1 className="text-xl  font-semibold text-center">{event.nombre}</h1>
        <div className="text-sm text-[#808488] flex flex-col w-full gap-1 justify-center items-center">
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
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
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
          <div className="w-[90%] border-b borderb-[#808488] mt-2"></div>
        </div>

        <div className="w-full flex items-center flex-col mt-2">
          <div className="flex items-center justify-start gap-2 w-[90%]">
            <div className="h-[80px] w-[80px] bg-white shadow-md rounded-full flex justify-center items-center border">
              <img
                src={event.creador_id.imagen}
                alt="Organizador"
                className="h-[70px] w-[70px] rounded-full object-cover border"
              />
            </div>

            <span className="text-sm  pr-[20px] font-light">
              Organizado por {event.creador_id.firstname}{" "}
              {event.creador_id.lastname}
            </span>
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-2"></div>
        </div>

        <div className="w-full flex flex-col items-center mt-3">
          <div className="w-[90%] flex flex-col items-center gap-2">
            <div className="text-sm flex items-center w-full font-light gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M15 7C16.1046 7 17 6.10457 17 5C17 3.89543 16.1046 3 15 3C13.8954 3 13 3.89543 13 5C13 6.10457 13.8954 7 15 7Z"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M12.6133 8.26691L9.30505 12.4021L13.4403 16.5374L11.3727 21.0861"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M6.4104 9.5075L9.79728 6.19931L12.6132 8.26692L15.508 11.5752H19.2297"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M8.89152 15.7103L7.65095 16.5374H4.34277"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
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
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <rect width="24" height="24" fill="white"></rect>{" "}
                  <path
                    d="M18 9C18 13.7462 14.2456 18.4924 12.6765 20.2688C12.3109 20.6827 11.6891 20.6827 11.3235 20.2688C9.75444 18.4924 6 13.7462 6 9C6 7 7.5 3 12 3C16.5 3 18 7 18 9Z"
                    stroke="#000000"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <circle
                    cx="12"
                    cy="9"
                    r="2"
                    stroke="#000000"
                    stroke-linejoin="round"
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
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <circle cx="32" cy="32" r="24"></circle>
                  <polyline points="40 44 32 32 32 16"></polyline>
                </g>
              </svg>
              {event.duracion} de duración del evento
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
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <title>signal</title>{" "}
                  <path d="M2 25.25c-0.414 0-0.75 0.336-0.75 0.75v0 4c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-4c-0-0.414-0.336-0.75-0.75-0.75v0zM8.968 19.25c-0.414 0-0.75 0.336-0.75 0.75v0 10c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-10c-0-0.414-0.336-0.75-0.75-0.75v0zM16 13.25c-0.414 0-0.75 0.336-0.75 0.75v0 16c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-16c-0-0.414-0.336-0.75-0.75-0.75v0zM30 1.25c-0.414 0-0.75 0.336-0.75 0.75v0 28c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-28c-0-0.414-0.336-0.75-0.75-0.75v0zM23 7.249c-0.414 0-0.75 0.336-0.75 0.75v0 22.001c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-22.001c-0-0.414-0.336-0.75-0.75-0.75v0z"></path>{" "}
                </g>
              </svg>
              {event.dificultad}
            </div>
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-3"></div>
        </div>
        <div className="w-full flex flex-col items-center mt-3">
          <div className="w-[90%] font-extralight text-justify">
            {event.descripcion}
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-3"></div>
        </div>

        <div className="w-full flex flex-col items-center">
          <div className="w-[90%]">
          <p className="mb-2">
            <span className="text-lg font-normal">Punto de encuentro</span>
            <br />
            <span className="text-sm text-gray-600 mb-2 font-extralight">
              {event.ubicacion}
            </span>
          </p>
          {event.locationCoords ? (
            <div className="w-full h-[300px] rounded-xl overflow-hidden border z-0">
              <MapComponent
                position={{
                  lat: event.locationCoords.lat,
                  lng: event.locationCoords.lng,
                }}
                onChange={() => {}} // callback vacío si no quieres actualizar nada
              />
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No hay coordenadas disponibles.
            </p>
          )}
        </div>
        <div className="w-[90%] border-b borderb-[#808488] mt-3"></div>
        </div>
        
        <div className="mt-3 w-full flex flex-col items-center">
          <div className="flex flex-col w-[90%] gap-2">
          <span className="text-lg font-normal">Recorrido</span>
          <div className="rounded-xl" style={{ width: "100%", height: "300px" }}>
            {decodedCoords.length > 0 && <StravaMap coords={routeCoords} />}
          </div>
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-6"></div>
        </div>

      

        <div className="w-full flex flex-col items-center mt-6">
          <div className="flex justify-center flex-col items-center gap-3">
            <div className="bg-white p-3 w-[300px] rounded-[20px] flex flex-col shadow-md border self-center items-center gap-3">
              <div
                className="rounded-full h-[100px] w-[100px] shadow-md"
                style={{
                  backgroundImage: `url(${event.creador_id.imagen})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              ></div>
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-normal">
                  {event.creador_id.firstname} {event.creador_id.lastname}
                </h2>
                <p className="text-sm font-light text-slate-400 mb-1">Profesor</p>
                <a
                  href={`https://wa.me/${event.telefonoOrganizador?.replace(
                    /\D/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-medium border  bg-[#C95100] px-[20px] py-[3px] rounded-[20px]"
                >
                  Contacto
                </a>
              </div>
            </div>
            <div className="w-[90%] font-extralight text-justify">{event.creador_id.bio}</div>
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-6"></div>
        </div>

          <div className="flex flex-col items-center mt-6">
          <div className="w-[90%]">
          <h2 className="text-lg font-normal mb-1">
            Grupo de Whatsapp
          </h2>
          {event.whatsappLink && (
            <div className="flex justify-center mt-2">
              <a
                href={event.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border w-full py-1 rounded-[10px] font-light bg-white shadow-md justify-center"
              >
                Unirse{" "}
              </a>
            </div>
          )}
          </div>
          <div className="w-[90%] border-b borderb-[#808488] mt-6"></div>
        </div>




          <div className="flex w-full justify-center items-center mt-4">
          <div className="w-[90%]">
            <p className="text-lg font-normal mb-1">Participantes</p>
            <div className="flex -space-x-2 mt-1">
              {miembros.length > 0 ? (
                <>
                  {miembros.slice(0, 2).map((m) => (
                    <img
                      key={m._id}
                      src={m.imagen}
                      alt={m.nombre}
                      className="h-8 w-8 rounded-full object-cover border shadow-md"
                      title={m.nombre}
                      onError={(e) =>
                        ((e.target as HTMLImageElement).src =
                          "/assets/icons/person_24dp_E8EAED.svg")
                      }
                    />
                  ))}
                  {miembros.length > 2 && (
                    <div className="h-40 w-40 rounded-full bg-white text-xs flex items-center justify-center border text-orange-500 font-semibold shadow-md">
                      +{miembros.length - 2}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-500">
                  Nadie se ha unido aún
                </span>
              )}
            </div>
          </div>
        </div>





        <div className="fixed bottom-[70px] w-[100%] left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#FEFBF9] shadow-md h-[120px] border px-4  flex justify-between items-center">
            <div className="w-[50%] flex flex-col">
              <p className="font-semibold text-gray-800 text-lg">
                ${event.precio}
              </p>
              <p className="text-xs text-gray-400">
                {parseLocalDate(event.fecha)}, {event.hora} hs
              </p>
            </div>

            <div className="flex h-[60px] w-[50%] justify-center items-center">

              {session?.user?.id === event.creador_id._id ? (
                // Si es el creador, mostrar botón editar
                <button
                  onClick={() => router.push(`/social/editar/${event._id}`)}
                  className="bg-white h-[30px] shadow-md text-sm rounded-[10px] flex items-center justify-center border w-[90px] font-semibold"
                >
                  Editar
                </button>
              ) : (
                // Si NO es el creador, mostrar botón unirse/salir
                <button
                  onClick={handleAccion}
                  className={`rounded-[10px]  p-2 h-[30px] flex justify-center items-center transition shadow-md ${
                    yaUnido
                      ? "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
                      : "bg-orange-500 text-white hover:text-white"
                  }`}
                >
                  {yaUnido ? "Salir" : "Matchear"}
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
    </main>
  );
}