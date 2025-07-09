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

// Configuración del icono por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
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
  }, [params.id, session]);


  const handleAccion = async () => {
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


  if (loading) return <main className="py-20 text-center">Cargando evento...</main>;
  if (error || !event) return <main className="py-20 text-center">{error || "Evento no encontrado"}</main>;

  return (
    <main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 w-[390px] mx-auto h-[1000px]">
      <button
        onClick={() => router.back()}
        className="text-[#C76C01] mb-3 bg-white shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center"
      >
        <img src="/assets/icons/Collapse Arrow.svg" alt="callback" className="h-[20px] w-[20px]"/>
      </button>

      <h1 className="text-xl font-semibold mb-4">
        {/* <span className="bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent font-semibold">
          {event.deporte}
        </span>{" "} */} {event.nombre}
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

      <div className="text-sm text-gray-700 mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <img
            src="/assets/icons/Locationgray.svg"
            alt=""
            className="w-[14px] h-[14px] object-cover"
          />
          <span>{event.localidad}</span>
        </div>
        <div className="flex items-center gap-2 pl-[50px]">
          <img
            src="/assets/icons/Calendargray.svg"
            alt=""
            className="w-[14px] h-[14px] object-cover"
          />
          <span>{new Date(event.fecha).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <img
            src="/assets/icons/Clockgray.svg"
            alt=""
            className="w-[14px] h-[14px] object-cover"
          />
          <span>{event.hora}</span>
        </div>
        <div className="flex items-center gap-2 pl-[50px]">
          <img
            src="/assets/icons/Usergray.svg"
            alt=""
            className="w-[14px] h-[14px] object-cover"
          />
          <span>Baja</span>
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

        <div className="text-right">
          <p className="text-sm font-medium text-[#808488] pr-[60px]">
            Organiza
          </p>
          <div className="flex items-center justify-start mt-1 gap-2">
            <img
              src={
                event.creador_id.imagen ||
                "/assets/icons/person_24dp_E8EAED.svg"
              }
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
              Grupo <img src="/assets/Logo/Whatsapp.svg" alt="Grupo" className="w-5 h-5" />
            </a>
          </div>
        )}

      </div>      
      <div className="mt-6 ">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent mb-1">
          Ubicación
        </h2>
        {event.locationCoords ? (
          <div className="w-full h-48 rounded-xl overflow-hidden border z-0">
            <MapContainer
              center={[event.locationCoords.lat, event.locationCoords.lng]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
             className="z-2">
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
          Organizador       </h2>
          <div className="flex w-full justify-center">
            <div className="bg-white w-[290px] h-[150px] rounded-[15px] flex shadow-md self-center justify-around items-center">
              <div className="rounded-full h-[100px] w-[100px] shadow-md" style={{backgroundImage: `url(${event.creador_id.imagen})`, backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center', }}></div>
              <div>
                <h2 className="text-lg font-bold text-slate-700 mb-1">
                  {event.creador_id.firstname} {event.creador_id.lastname}
                </h2>
                <a
                  href={`https://wa.me/${event.telefonoOrganizador?.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 font-medium"
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
  <div className="bg-[#FEFBF9] shadow-md border h-[120px] border px-2  flex justify-between items-center">
    <div className="w-[50%]">
      <p className="text-xs text-gray-400">
        {new Date(event.fecha).toLocaleDateString()}, {event.hora} hs
      </p>
      <p className="font-semibold text-sm text-gray-800">
        {event.localidad}
      </p>
    </div>

    <div className="flex h-[60px] w-[50%] gap-3 justify-center items-center">

        <button className="bg-white h-[30px] shadow-md text-sm rounded-[10px] flex items-center justify-center border p-2" onClick={() => router.push(`/social/miembros/${event._id}`)}>
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

<div className="pb-[200px]" /> 




    </main>
  );
}
