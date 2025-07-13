"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PushManager from "../../components/PushManager";
import Eventos1 from "../../../public/assets/Tdah.webp";
import Eventos2 from "../../../public/assets/jujuy.webp";
import TopContainer from "@/components/TopContainer";
import Link from "next/link";
import EventModal from "@/components/EventModal";
import { SafelistConfig } from "tailwindcss/types/config";
import TeamSocial from "@/models/teamSocial";
import SkeletonCard from "@/components/TopContainer";

interface Academia {
  _id: string;
  nombre_academia: string;
  pais: string;
  provincia: string;
  localidad: string;
}

interface Entrenamiento {
  id: string;
  nombre: string;
  dia: string;
  hora: string;
  ubicacion: string;
  descripcion: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

type EventType = {
  _id: string;
  title: string;
  date: string;
  time: string;
  price: string;
  image: string;
  location: string;
  category: string;
  localidad: string;
  locationCoords: {
    lat: number;
    lng: number;
  };
  teacher: string;
};

type ModalEvent = {
  id: any;
  title: string;
  date: string;
  time: string;
  location: string;
  teacher: string;
  localidad: string;
  participants: string[];
  locationCoords: {
    lat: number;
    lng: number;
  };
};

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [salidaSocial, setSalidaSocial] = useState<EventType[]>([]);
  const [salidaTeamSocial, setSalidaTeamSocial] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [miMatch, setMiMatch] = useState<any[]>([]);
  const [miMatchTeamSocial, setMiMatchTeamSocial] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocalidad, setSelectedLocalidad] = useState(
    "San Miguel de Tucuman"
  );
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
    rol: session?.user.role || "",
  });
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

useEffect(() => {
  const obtenerTeams = async () => {
    try {
      const res = await fetch("/api/team-social/mis", { method: "GET" });

      if (!res.ok) throw new Error("Error al obtener los teams");

      const data = await res.json();

      console.log("teams donde estoy:", data);

      setMiMatchTeamSocial(data); // o como sea que se llame tu estado
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los teams");
    } finally {
      setLoading(false);
    }
  };
  obtenerTeams();
}, []);

  useEffect(() => {
    const fetchMiMatch = async () => {
      try {
        const res = await fetch("/api/social/unirse/estado", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error("Error al obtener las salidas");
        }
        const data = await res.json();
        const salidas = data.salidas ?? [];

        console.log("que pingo es esto", data.salidas);

        setMiMatch(salidas);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las salidas");
      } finally {
        setLoading(false);
      }
    };

    fetchMiMatch();
  }, []);

  useEffect(() => {
    if (session) {
      const fetchAcademia = async () => {
        try {
          let url = `/api/academias?owner=true`;

          if (session?.user.role !== "dueño de academia") {
            url = `/api/academias?userId=${session.user.id}`; // Nueva API para obtener academias de un usuario
          }

          const res = await fetch(url);
          const data = await res.json();

          if (data.length > 0) {
            setAcademia(data[0]); // Asigna la primera academia encontrada
          }
        } catch (error) {
          console.error("Error fetching academia:", error);
        }
      };

      const fetchSalidaSocial = async () => {
        try {
          let url = `/api/social`;
          console.log("url", url);
          const res = await fetch(url);
          const data = await res.json();
          console.log("data", data);

          // data es un array → filtramos los que el creador sea el user logueado
          const userId = session?.user.id;
          const filteredData = data.filter(
            (item: any) => item.creador_id?._id === userId
          );

          console.log("filteredData", filteredData);

          const mappedData = filteredData.map((item: any) => ({
            _id: item._id,
            title: item.nombre,
            date: item.fecha,
            time: item.hora,
            price: item.precio,
            image: item.imagen,
            category: item.deporte,
            location: item.ubicacion,
            locationCoords: item.locationCoords,
            localidad: item.localidad,
            highlighted: false,
            teacher: item.creador_id?.firstname || "Sin profe",
          }));

          setSalidaSocial(mappedData);
        } catch (error) {
          console.error("Error fetching academia:", error);
        } finally {
          setLoading(false);
        }
      };

      const fetchSalidaTeamSocial = async () => {
        try {
          let url = `/api/team-social`;
          const res = await fetch(url);
          const data = await res.json();
          console.log("social team puto", data);

          // data es un array → filtramos los que el creador sea el user logueado

          const userId = session?.user.id;
          const filteredData = data.filter(
            (item: any) => item.creadorId === userId
          );

          console.log("puto 2:", filteredData);

          const mappedData = filteredData.map((item: any) => ({
            _id: item._id,
            title: item.nombre,
            date: item.fecha,
            time: item.hora,
            price: item.precio,
            image: item.imagen,
            category: item.deporte,
            location: item.ubicacion,
            locationCoords: item.locationCoords,
            localidad: item.localidad,
            highlighted: false,
            teacher: item.creador_id?.firstname || "Sin profe",
          }));

          setSalidaTeamSocial(mappedData);
        } catch (error) {
          console.error("Error fetching academia:", error);
        }
      };

      const fetchEntrenamientos = async () => {
        try {
          if (session) {
            // Obtener la fecha de inicio de la semana (domingo)
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // Restar días para llegar al domingo
            const weekStartISO = weekStart.toISOString().split("T")[0]; // Formato YYYY-MM-DD

            const res = await fetch(
              `/api/entrenamientos?user=${session.user.id}&weekStart=${weekStartISO}`
            );

            if (!res.ok) {
              throw new Error(
                `Error al obtener entrenamientos: ${res.statusText}`
              );
            }

            const data = await res.json();
          }
        } catch (error) {
          console.error("Error fetching entrenamientos:", error);
        }
      };

      fetchAcademia();
      fetchSalidaSocial();
      fetchSalidaTeamSocial();
      fetchEntrenamientos();
    }
    if (session?.user) {
      setFormData({
        fullname: session.user.fullname || "",
        email: session.user.email || "",
        rol: session.user.role || "",
      });
    }
  }, [session]);

  if (status === "loading") return <p>Cargando...</p>;

  if (!session) return <p>No estás autenticado. Por favor, inicia sesión.</p>;

  const handleEntrar = () => {
    if (academia && academia._id) {
      router.push(`/academias/${academia._id}`);
    } else {
      console.error("Academia ID is not available");
    }
  };

  const handleSearch = () => {
    router.push(`/academias`);
  };

  const handleDelete = async (event) => {
    const confirm = window.confirm(
      "¿Estás seguro que querés eliminar esta salida?"
    );
    if (!confirm) return;

    await fetch(`/api/social/${event}`, { method: "DELETE" });
    router.push("/home");
  };

  const handleDeleteTeamSocial = async (event) => {
    const confirm = window.confirm(
      "¿Estás seguro que querés eliminar esta salida?"
    );
    if (!confirm) return;

    await fetch(`/api/team-social/${event}`, { method: "DELETE" });
    alert("Salida borrada con exito");
    router.refresh;
  };

  //  if (loading) return (
  //   <main className="bg-red-400 min-h-screen text-black px-4 py-6 w-[390px] mx-auto">
  //     <TopContainer selectedLocalidad={selectedLocalidad}
  //   setSelectedLocalidad={setSelectedLocalidad}/>
  //     <SkeletonCard setSelectedLocalidad={null} selectedLocalidad={null} />
  //   </main>
  // );

  console.log("mi match", miMatch);

  return (
    <main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      <TopContainer
        selectedLocalidad={selectedLocalidad}
        setSelectedLocalidad={setSelectedLocalidad}
      />

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold mb-3">
            <span className="text-[#C76C01]">Mis</span> salidas
          </h2>
          {/* {formData.rol === "dueño de academia" && (
            <button onClick={() => router.push("/academias/crear")}>
              <img
                className="h-[26px] w-[26px]"
                src="/assets/Logo/add-circle-svgrepo-com.svg"
                alt="crear"
              />
            </button>
          )} */}
        </div>
        <div
          className={`overflow-x-auto scrollbar-hide ${
            salidaSocial.length > 0 ? "h-[245px]" : "h-auto"
          }`}
        >
          <div className="flex space-x-4">
            {salidaSocial.length > 0 ? (
              salidaSocial.map((event) => (
                <div
                  key={event._id}
                  className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border"
                >
                  <div
                    className="h-[115px] bg-slate-200"
                    onClick={() => router.push(`/social/${event._id}`)}
                  >
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bg-[#00000080] text-white rounded-full w-[95px] h-[25px] flex justify-center items-center top-[10px] left-[10px]">
                    <p className="font-bold">{event.category}</p>
                  </div>
                  <div className="p-3 flex flex-col gap-3">
                    <div>
                      <h1 className="font-semibold text-lg">{event.title}</h1>
                      <div className="flex items-center text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="#f97316"
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          className="mr-1"
                        >
                          <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                        </svg>{" "}
                        <p className="text-slate-400">{event.localidad}</p>
                      </div>
                    </div>

                    <div className="text-slate-400 text-md">
                      <p>
                        {" "}
                        {new Date(event.date).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}
                      </p>
                      <p className="font-bold">{event.time} hs</p>
                    </div>
                  </div>
                  <div className="absolute top-[39%] right-[10px] flex gap-5">
                    <div
                      className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                      onClick={() =>
                        router.push(`/social/miembros/${event._id}`)
                      }
                    >
                      <img src="/assets/icons/groups_24dp_E8EAED.svg" alt="" />
                    </div>
                    <button
                      onClick={() => router.push(`/social/editar/${event._id}`)}
                      className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                    >
                      <img
                        src="/assets/icons/Edit.svg"
                        alt=""
                        className="h-[20px] w-[20px] text-orange-500"
                      />
                    </button>
                  </div>
                  <div className="absolute top-1 right-[10px]">
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        height={25}
                        width={25}
                        fill="none"
                        stroke="#6f6d6d"
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
                            d="M20.5001 6H3.5"
                            stroke="#6e6c6c"
                            stroke-width="1.5"
                            stroke-linecap="round"
                          ></path>{" "}
                          <path
                            d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5"
                            stroke="#6e6c6c"
                            stroke-width="1.5"
                            stroke-linecap="round"
                          ></path>{" "}
                          <path
                            d="M9.5 11L10 16"
                            stroke="#6e6c6c"
                            stroke-width="1.5"
                            stroke-linecap="round"
                          ></path>{" "}
                          <path
                            d="M14.5 11L14 16"
                            stroke="#6e6c6c"
                            stroke-width="1.5"
                            stroke-linecap="round"
                          ></path>{" "}
                          <path
                            d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6"
                            stroke="#6e6c6c"
                            stroke-width="1.5"
                          ></path>{" "}
                        </g>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div>
                <p>Sin salidas creadas</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Team */}
      {formData.rol === "dueño de academia" && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold mb-3">
              <span className="text-[#C76C01]">Mis</span> social Team
            </h2>
          </div>
          <div
            className={`overflow-x-auto scrollbar-hide ${
              salidaTeamSocial.length > 0 ? "h-[245px]" : "h-auto"
            }`}
          >
            <div className="flex space-x-4">
              {salidaTeamSocial.length > 0 ? (
                salidaTeamSocial.map((event) => (
                  <div
                    key={event._id}
                    className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border"
                  >
                    <div
                      className="h-[115px] bg-slate-200"
                      onClick={() => router.push(`/team-social/${event._id}`)}
                    >
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bg-[#00000080] text-white rounded-full w-[95px] h-[25px] flex justify-center items-center top-[10px] left-[10px]">
                      <p className="font-bold">{event.category}</p>
                    </div>
                    <div className="p-3 flex flex-col">
                      <div className="">
                        <h1 className="font-semibold text-lg">{event.title}</h1>
                        <div className="flex items-center text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="#f97316"
                            viewBox="0 0 24 24"
                            width="13"
                            height="13"
                            className="mr-1"
                          >
                            <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                          </svg>{" "}
                          <p className="text-slate-400">{event.localidad}</p>
                        </div>
                      </div>

                      <div className="text-slate-400 text-md">
                        <p className="font-semibold text-lg">
                          ${Number(event.price).toLocaleString("es-AR")}
                        </p>
                        <p>
                          {new Date(event.date).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                          , {event.time} hs
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-[39%] right-[10px] flex gap-5">
                      <div
                        className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                        onClick={() =>
                          router.push(`/team-social/miembros/${event._id}`)
                        }
                      >
                        <img
                          src="/assets/icons/groups_24dp_E8EAED.svg"
                          alt=""
                        />
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/team-social/editar/${event._id}`)
                        }
                        className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                      >
                        <img
                          src="/assets/icons/Edit.svg"
                          alt=""
                          className="h-[20px] w-[20px] text-orange-500"
                        />
                      </button>
                    </div>
                    <div className="absolute top-1 right-[10px]">
                      <button
                        onClick={() => handleDeleteTeamSocial(event._id)}
                        className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          height={25}
                          width={25}
                          fill="none"
                          stroke="#6f6d6d"
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
                              d="M20.5001 6H3.5"
                              stroke="#6e6c6c"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5"
                              stroke="#6e6c6c"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M9.5 11L10 16"
                              stroke="#6e6c6c"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M14.5 11L14 16"
                              stroke="#6e6c6c"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6"
                              stroke="#6e6c6c"
                              stroke-width="1.5"
                            ></path>{" "}
                          </g>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <p>Sin salidas creadas</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* mis match*/}

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold mb-3">
            <span className="text-[#C76C01]">Match</span> salidas
          </h2>
        </div>
        <div
          className={`overflow-x-auto scrollbar-hide ${
            miMatch.length > 0 ? "h-[245px]" : "h-auto"
          }`}
        >
          <div className="flex space-x-4">
            {miMatch.length > 0 ? (
              miMatch.map((event) => (
                <div
                  key={event._id}
                  className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border"
                >
                  <div
                    className="h-[115px] bg-slate-200"
                    onClick={() => router.push(`/social/${event._id}`)}
                  >
                    <img
                      src={event.imagen}
                      alt={event.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bg-[#00000080] text-white rounded-full w-[95px] h-[25px] flex justify-center items-center top-[10px] left-[10px]">
                    <p className="font-bold">{event.deporte}</p>
                  </div>
                  <div className="p-3 flex flex-col">
                    <div className="">
                      <h1 className="font-semibold text-lg">{event.nombre}</h1>
                      <div className="flex items-center text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="#f97316"
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          className="mr-1"
                        >
                          <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                        </svg>{" "}
                        <p className="text-slate-400">{event.localidad}</p>
                      </div>
                    </div>

                    <div className="text-slate-400 text-md">
                      <p className="font-semibold text-lg">   {new Date(event.fecha).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}{" "}</p>
                    
                      <p>{event.hora} hs</p>
                    </div>
                  </div>
                  <div className="absolute top-[39%] right-[10px] flex gap-5">
                    <div
                      className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                      onClick={() =>
                        router.push(`/social/miembros/${event._id}`)
                      }
                    >
                      <img src="/assets/icons/groups_24dp_E8EAED.svg" alt="" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div>
                <p>Sin salidas creadas</p>
              </div>
            )}
          </div>
        </div>
      </section>

  {/*mis match  Social Team */}
      
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold mb-3">
              <span className="text-[#C76C01]">Match</span> social Team
            </h2>
          </div>
          <div
            className={`overflow-x-auto scrollbar-hide ${
              miMatchTeamSocial.length > 0 ? "h-[245px]" : "h-auto"
            }`}
          >
            <div className="flex space-x-4">
              {miMatchTeamSocial.length > 0 ? (
                miMatchTeamSocial.map((event) => (
                  <div
                    key={event._id}
                    className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border"
                  >
                    <div
                      className="h-[115px] bg-slate-200"
                      onClick={() => router.push(`/team-social/${event._id}`)}
                    >
                      <img
                        src={event.imagen}
                        alt={event.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bg-[#00000080] text-white rounded-full w-[95px] h-[25px] flex justify-center items-center top-[10px] left-[10px]">
                      <p className="font-bold">{event.deporte}</p>
                    </div>
                    <div className="p-3 flex flex-col">
                      <div className="">
                        <h1 className="font-semibold text-lg">{event.nombre}</h1>
                        <div className="flex items-center text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="#f97316"
                            viewBox="0 0 24 24"
                            width="13"
                            height="13"
                            className="mr-1"
                          >
                            <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                          </svg>{" "}
                          <p className="text-slate-400">{event.localidad}</p>
                        </div>
                      </div>

                      <div className="text-slate-400 text-md">
                        <p className="font-semibold text-lg">
                          ${Number(event.precio).toLocaleString("es-AR")}
                        </p>
                        <p>
                          {new Date(event.fecha).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                          , {event.hora} hs
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-[39%] right-[10px] flex gap-5">
                      <div
                        className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                        onClick={() =>
                          router.push(`/team-social/miembros/${event._id}`)
                        }
                      >
                        <img
                          src="/assets/icons/groups_24dp_E8EAED.svg"
                          alt=""
                        />
                      </div>
                    </div>
                    <div className="absolute top-1 right-[10px]">
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <p>No hiciste match aún</p>
                </div>
              )}
            </div>
          </div>
        </section>
      







      <div className="pb-[100px]"></div>
    </main>
  );
};

export default DashboardPage;

{
  /* Eventos */
}
{
  /*
        <div>
  <h2 className="text-xl font-semibold mb-3 pl-4 pr-4">Eventos</h2>
  <div className="scroll-container overflow-x-auto pl-4 pr-4">
    <div className="flex space-x-4">
      <div className="bg-white rounded-lg shadow min-w-[200px]">
        <Image
          src={Eventos1}
          alt="Carrera"
          className="w-full h-24 object-cover rounded-t-lg"
        />
        <div className="p-4">
          <p className="text-sm font-medium">Carrera Mes del TDAH</p>
          <p className="text-xs text-gray-600">Sábado 27 de Julio</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow min-w-[200px]">
        <Image
          src={Eventos2}
          alt="Maratón"
          className="w-full h-24 object-cover rounded-t-lg"
        />
        <div className="p-4">
          <p className="text-sm font-medium">Maratón Independencia</p>
          <p className="text-xs text-gray-600">Domingo 21 de Julio</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow min-w-[200px]">
        <Image
          src={Eventos2}
          alt="Maratón"
          className="w-full h-24 object-cover rounded-t-lg"
        />
        <div className="p-4">
          <p className="text-sm font-medium">Maratón Independencia</p>
          <p className="text-xs text-gray-600">Domingo 21 de Julio</p>
        </div>
      </div>
    </div>
  </div>
</div>*/
}
{
  /* Aventuras */
}
{
  /*
        <div className="pl-4 pr-4">
          <br />
          <h2 className="text-xl font-semibold mb-3">Aventuras</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow">
              <Image
                src={Eventos1}
                alt="Carrera"
                className="w-full h-24 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <p className="text-sm font-medium">Carrera Mes del TDAH</p>
                <p className="text-xs text-gray-600">Sábado 27 de Julio</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow">
              <Image
                src={Eventos1}
                alt="Maratón"
                className="w-full h-24 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <p className="text-sm font-medium">Maratón Independencia</p>
                <p className="text-xs text-gray-600">Domingo 21 de Julio</p>
              </div>
            </div>
          </div>
        </div>*/
}
