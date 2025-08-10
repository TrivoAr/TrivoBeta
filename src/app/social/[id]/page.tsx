"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

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
  };
  locationCoords?: {
    lat: number;
    lng: number;
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

  const router = useRouter();

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
      return}

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

  return (
    <main className="bg-[#FEFBF9] min-h-screen text-black  w-[390px] mx-auto h-[1000px]">
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
      <div className="px-4 py-6">
        <h1 className="text-xl  font-semibold mb-4 text-center">
          {/* <span className="bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent font-semibold">
          {event.deporte}
        </span>{" "} */}{" "}
          {event.nombre}
        </h1>
        <div className="text-sm text-gray-700 mt-3 flex flex-col gap-1 justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/icons/Locationgray.svg"
              alt=""
              className="w-[14px] h-[14px] object-cover"
            />
            <span>{event.localidad}</span>
          </div>
          {/* <div className="flex items-center gap-2 pl-[50px]">
          <img
            src="/assets/icons/Calendargray.svg"
            alt=""
            className="w-[14px] h-[14px] object-cover"
          />
          <span>{new Date(event.fecha).toLocaleDateString()}</span>
        </div> */}
          {/* <div className="flex items-center gap-2">
          <img
            src="/assets/icons/Clockgray.svg"
            alt=""
            className="w-[14px] h-[14px] object-cover"
          />
          <span>{event.hora}</span>
        </div> */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/icons/Usergray.svg"
              alt=""
              className="w-[14px] h-[14px] object-cover"
            />
            <span>{event.deporte}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="h-full">
            <p className="text-sm font-medium text-[#808488]">Participantes</p>
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
                    <div className="h-8 w-8 rounded-full bg-white text-xs flex items-center justify-center border text-orange-500 font-semibold shadow-md">
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

          <div className="h-full">
            <p className="text-sm font-medium text-[#808488]">Organiza</p>
            <div className="flex items-center justify-start mt-1 gap-2">
              <img
                src={event.creador_id.imagen}
                alt="Organizador"
                className="h-8 w-8 rounded-full object-cover border"
              />
              <span className="text-sm  pr-[20px]">
                {event.creador_id.firstname}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent mb-1">
            Descripcion
          </h2>
          <p className="text-sm text-[#808488] leading-relaxed">
            {event.descripcion}
          </p>
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent mb-1">
            Grupo de Whatsapp
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Unite al grupo de la salida para más información:
          </p>
          {event.whatsappLink && (
            <div className="flex justify-center mt-2">
              <a
                href={event.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-green-500 text-green-500 px-4 py-2 rounded-md font-medium hover:bg-green-50 transition"
              >
                Grupo{" "}
                <img
                  src="/assets/Logo/Whatsapp.svg"
                  alt="Grupo"
                  className="w-5 h-5"
                />
              </a>
            </div>
          )}
        </div>
        <div className="mt-6 ">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent mb-1">
            Ubicación
          </h2>
          <p className="mb-2">
            <span className="text-slate-500 font-bold">Direcccion:</span>
            <br />
            <span className="text-sm text-gray-600 mb-2">
              {" "}
              {event.ubicacion}
            </span>
          </p>
          {event.locationCoords ? (
            <div className="w-full h-48 rounded-xl overflow-hidden border z-0">
              <MapContainer
                center={[event.locationCoords.lat, event.locationCoords.lng]}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                className="z-2"
              >
                <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[
                    event.locationCoords.lat,
                    event.locationCoords.lng,
                  ]}
                >
                  <Popup>{event.nombre}</Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No hay coordenadas disponibles.
            </p>
          )}
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent mb-1">
            Organizador{" "}
          </h2>
          <div className="flex justify-center gap-3">
            <div className="bg-white p-3 w-auto h-[160px] rounded-[15px] flex shadow-md self-center justify-around items-center gap-3">
              <div
                className="rounded-full h-[100px] w-[100px] shadow-md"
                style={{
                  backgroundImage: `url(${event.creador_id.imagen})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              ></div>
              <div>
                <h2 className="text-lg font-bold text-slate-700 mb-1">
                  {event.creador_id.firstname} {event.creador_id.lastname}
                </h2>
                <a
                  href={`https://wa.me/${event.telefonoOrganizador?.replace(
                    /\D/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-bold border  bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] px-[15px] py-[5px] rounded-[15px]"
                >
                  Contacto
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="mt-8 mb-[200px]">
        <button
          onClick={handleAccion}
          className={`w-full py-3 rounded-[15px] font-semibold transition ${
            yaUnido
              ? "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
              : "bg-green-100 text-green-600 hover:bg-green-600 hover:text-white"
          }`}
        >
          {yaUnido ? "Salir " : "Unirse a la salida"}
        </button>
      </div> */}

        {/* Barra fija sobre el mapa */}

        {/* {session?.user?.id === event.creador_id._id && (
      <div className="fixed bottom-[100px] w-[100%] left-1/2 -translate-x-1/2  px-2">
        <div className="bg-white shadow-md rounded-xl px-4 py-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">
              {new Date(event.fecha).toLocaleDateString()}, {event.hora} hs
            </p>
            <p className="font-semibold text-sm text-gray-800">
              {event.ubicacion}
            </p>
          </div>

          <div className="flex gap-2">
            <button className="bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm rounded-xl flex items-center gap-1">
              <img src="/assets/icons/Users-group.svg" className="w-4 h-4" />
              Participantes
            </button>
              <button
                onClick={() => router.push(`/social/editar/${event._id}`)}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm rounded-xl flex items-center gap-1"
              >
                <img src="/assets/icons/Edit.svg" className="w-4 h-4" />
                Editar
              </button>
            
          </div>
        </div>
      </div>)} */}

        <div className="fixed bottom-[70px] w-[100%] left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#FEFBF9] shadow-md h-[120px] border px-2  flex justify-between items-center">
            <div className="w-[50%] flex flex-col">
              <p className="font-semibold text-sm text-gray-800">
                {event.localidad}
              </p>
              <p className="text-xs text-gray-400">
                {parseLocalDate(event.fecha)}, {event.hora} hs
              </p>
              <p className="text-xs text-gray-400">
                Duracion: {event.duracion}{" "}
              </p>
            </div>

            <div className="flex h-[60px] w-[50%] gap-3 justify-center items-center">
              <button
                className="bg-white h-[30px] shadow-md text-sm rounded-[10px] flex items-center justify-center border p-2"
                onClick={() => router.push(`/social/miembros/${event._id}`)}
              >
                {/* <img src="/assets/icons/Users-group.svg" className="w-[30px] h-[30px]" /> */}
                <span>Participantes</span>
              </button>

              {session?.user?.id === event.creador_id._id ? (
                // Si es el creador, mostrar botón editar
                <button
                  onClick={() => router.push(`/social/editar/${event._id}`)}
                  className="bg-white h-[30px] shadow-md text-sm rounded-[10px] flex items-center justify-center border p-3 font-semibold"
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
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

        <div className="pb-[200px]" />
      </div>
    </main>
  );
}
