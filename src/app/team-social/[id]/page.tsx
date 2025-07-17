"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useSession } from "next-auth/react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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
  precio: string;
  deporte: string;
  fecha: string;
  hora: string;
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
}

interface Miembro {
  _id: string;
  nombre: string;
  imagen: string;
}

export default function TeamEventPage({ params }: PageProps) {
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [yaUnido, setYaUnido] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/team-social/${params.id}`);
        console.log("Evento:", response.data);
        setEvent(response.data);
      } catch (err) {
        console.error("Error al cargar evento", err);
        setError("Error al cargar el evento");
      } finally {
        setLoading(false);
      }
    };

    const fetchMiembros = async () => {
      try {
        const res = await fetch(
          `/api/team-social/miembros?teamSocialId=${params.id}`
        );
        const data = await res.json();
        console.log("miembros", data);
        setMiembros(data);
      } catch (err) {
        console.error("Error al cargar miembros", err);
      }
    };

    const checkUnido = async () => {
      const res = await fetch("/api/team-social/unirse/estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamSocialId: params.id }), // 👈 aquí
      });
      const data = await res.json();
      setYaUnido(data.unido);
    };

    fetchEvent();
    fetchMiembros();
    if (session) checkUnido();
  }, [params.id, session]);

  const handleAccion = async () => {
    const metodo = yaUnido ? "DELETE" : "POST";
    const url = yaUnido
      ? `/api/team-social/unirse?teamSocialId=${params.id}` // 👈 aquí
      : "/api/team-social/unirse";

    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: yaUnido ? null : JSON.stringify({ teamSocialId: params.id }), // 👈 aquí
    });

    if (res.ok) {
      alert(yaUnido ? "Has salido del evento" : "¡Te uniste exitosamente!");
      setYaUnido(!yaUnido);
    } else {
      const msg = await res.text();
      alert("Error: " + msg);
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
    <main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 w-[390px] mx-auto">
      <button
        onClick={() => router.back()}
        className="text-[#C76C01] text-lg mb-6 shadow-md bg-white h-[40px] w-[40px] rounded-full flex justify-center items-center"
      >
        <img src="/assets/icons/Collapse Arrow.svg" alt="callback" />
      </button>

      <h1 className="text-xl font-semibold mb-4">
        <span className="bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent font-semibold"></span>{" "}
        {event.nombre}
      </h1>

      <div className="w-full h-[180px] rounded-xl overflow-hidden">
        <Image
          src={event.imagen}
          alt="Evento"
          width={500}
          height={180}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="text-sm text-gray-700 mt-3 flex flex-col gap-1 justify-between">
        <div className="flex items-center gap-1">
          <img
            src="/assets/icons/Locationgray.svg"
            className="w-[14px] h-[14px]"
            alt=""
          />
          <span>{event.localidad}</span>
        </div>
        {/* <div className="flex items-center gap-2 pl-[50px]">
          <img
            src="/assets/icons/Calendargray.svg"
            className="w-[14px] h-[14px]"
            alt=""
          />
          <span>{new Date(event.fecha).toLocaleDateString()}</span>
        </div> */}
        {/* <div className="flex items-center gap-2">
          <img
            src="/assets/icons/Clockgray.svg"
            className="w-[14px] h-[14px]"
            alt=""
          />
          <span>{event.hora}</span>
        </div> */}
        <div className="flex items-center gap-1">
          <img
            src="/assets/icons/Usergray.svg"
            className="w-[14px] h-[14px]"
            alt=""
          />
          <span className="">{event.deporte}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-sm font-medium text-[#808488]">Participantes</p>
          <div className="flex -space-x-2 mt-1">
            {miembros.length > 0 ? (
              <>
                {miembros.slice(0, 2).map((m) => (
                  <img
                    key={m._id}
                    src={m.imagen}
                    alt={m.nombre}
                    className="h-8 w-8 rounded-full object-cover border"
                    title={m.nombre}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "/assets/icons/person_24dp_E8EAED.svg")
                    }
                  />
                ))}
                {miembros.length > 2 && (
                  <div className="h-8 w-8 rounded-full bg-white text-xs flex items-center justify-center border text-orange-400 font-semibold">
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

        <div className="">
          <p className="text-sm font-medium text-[#808488] pr-[60px]">
            Organiza
          </p>
          <div className="flex items-center justify-start mt-1 gap-2">
            <img
              src={
                event.creadorId.imagen || "/assets/icons/person_24dp_E8EAED.svg"
              }
              alt="Organizador"
              className="h-6 w-6 rounded-full object-cover border"
            />
            <span className="text-sm pr-[20px]">
              {event.creadorId.firstname}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent mb-1">
          Descripción
        </h2>
        <p className="text-sm text-[#808488] leading-relaxed">
          {event.descripcion}
        </p>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent mb-1">
          Ubicación
        </h2>
        {event.locationCoords ? (
          <div className="w-full h-48 rounded-xl overflow-hidden border">
            <MapContainer
              center={[event.locationCoords.lat, event.locationCoords.lng]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[event.locationCoords.lat, event.locationCoords.lng]}
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
          Grupo de whatsapp
        </h2>
        <p className="text-sm text-[#808488] leading-relaxed">
          Para mas información, unite al grupo:
        </p>
        {event.whatsappLink && (
          <div className="flex justify-center mt-3">
            <a
              href={event.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-green-500 text-green-500 px-7 py-2 rounded-md font-medium hover:bg-green-50 transition"
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
      <div className="mt-6">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent mb-1">
          Organizador{" "}
        </h2>
        <div className="flex justify-center gap-3">
          <div className="bg-white p-3 w-auto h-[160px] rounded-[15px] flex shadow-md self-center justify-around items-center gap-3">
            <div
              className="rounded-full h-[100px] w-[100px] shadow-md"
              style={{
                backgroundImage: `url(${event.creadorId.imagen})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            ></div>
            <div>
              <h2 className="text-lg font-bold text-slate-700 mb-1">
                {event.creadorId.firstname} {event.creadorId.lastname}
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

      <div className="fixed bottom-[80px] w-[100%] left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#FEFBF9] shadow-md h-[100px] border  flex justify-around items-center">
          <div className="ml-4">
            <p className="font-semibold text-2xl text-gray-500 ">
              ${Number(event.precio).toLocaleString("es-AR")}
            </p>
            <p className="text-sm text-gray-500">
              {parseLocalDate(event.fecha)},{event.hora}hs
            </p>
            <p className="text-sm text-gray-500">Duracion: {event.duracion}</p>
          </div>

          <div className="flex h-[60px] w-[50%] gap-3 justify-center items-center">
            <button
              className="bg-white h-[30px] shadow-md text-sm rounded-[10px] flex items-center justify-center border p-2"
              onClick={() => router.push(`/team-social/miembros/${event._id}`)}
            >
              {/* <img src="/assets/icons/Users-group.svg" className="w-[30px] h-[30px]" /> */}
              <span>Participantes</span>
            </button>

            {session?.user?.id === event.creadorId._id ? (
              // Si es el creador, mostrar botón editar
              <button
                onClick={() => router.push(`/team-social/editar/${event._id}`)}
                className="bg-white h-[30px] shadow-md text-sm rounded-[10px] flex items-center justify-center border p-3 font-semibold"
              >
                Editar
              </button>
            ) : (
              // Si NO es el creador, mostrar botón unirse/salir
              <button
                onClick={handleAccion}
                className={`rounded-[10px]  p-2 h-[30px] flex justify-center items-center transition shadow-md font-bold ${
                  yaUnido
                    ? "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
                    : " bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white hover:text-white"
                }`}
              >
                {yaUnido ? "Salir" : "Matchear"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pb-[200px]" />
    </main>
  );
}
