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
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import toast, { Toaster } from "react-hot-toast";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";

const categories = [{ label: "Mi panel" }, { label: "Mis match" }];

interface Academia {
  _id: string;
  nombre_academia: string;
  pais: string;
  provincia: string;
  localidad: string;
  imagen: string;
  precio: string;
  tipo_disciplina: string;
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

// Skeleton para las cards del dashboard
const DashboardCardSkeleton = () => (
  <div className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border bg-white">
    <div className="h-[115px] bg-slate-200">
      <Skeleton height={115} width={310} />
    </div>
    <div className="absolute bg-[#00000080] text-white rounded-full w-[95px] h-[25px] flex justify-center items-center top-[10px] left-[10px]">
      <Skeleton width={60} height={15} />
    </div>
    <div className="p-3 flex flex-col gap-1">
      <div className="mt-1">
        <h1 className="font-normal text-lg">
          <Skeleton width={120} />
        </h1>
        <div className="flex items-center text-sm">
          <Skeleton width={80} />
        </div>
      </div>
      <div className="text-[#666] text-md">
        <Skeleton width={100} />
        <Skeleton width={60} />
      </div>
    </div>
    <div className="absolute top-[39%] right-[10px] flex gap-5">
      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={40} height={40} />
    </div>
    <div className="absolute top-1 right-[10px]">
      <Skeleton circle width={40} height={40} />
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [salidaSocial, setSalidaSocial] = useState<EventType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Mi panel");
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

    if (session && status === "authenticated") {
      fetchMiMatch();
    }
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
          console.log("que pija hermano", data);

          if (data.length > 0) {
            try {
              const primeraAcademia = data[0];
              const url = await getAcademyImage(
                "profile-image.jpg",
                primeraAcademia._id
              );
              const academiaConImagen = { ...primeraAcademia, imagenUrl: url };
              setAcademia(academiaConImagen);
            } catch (error) {
              console.error("Error al obtener imagen de Firebase:", error);
              const academiaConImagen = {
                ...data[0],
                imagenUrl:
                  "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg",
              };
              setAcademia(academiaConImagen);
            }
          }

          // if (data.length > 0) {
          //   setAcademia(data[0]);
          // }
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

  const handleDelete = async (eventId) => {
  const confirm = window.confirm(
    "¿Estás seguro que querés eliminar esta salida?"
  );
  if (!confirm) return;

  const toastId = toast.loading("Eliminando salida...", {
    id: "delete-social-toast",
  });

  try {
    const response = await fetch(`/api/social/${eventId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error al eliminar la salida.");
    }

    toast.success("¡Salida eliminada con éxito!", { id: "delete-social-toast" });

  
    // setTimeout(() => {
    //   router.push("/home");
    // }, 500);
    setSalidaSocial((prev) => prev.filter((item) => item._id !== eventId));


  } catch (error) {
    console.error("Error al eliminar salida:", error);
    toast.error("Ocurrió un error al eliminar la salida.", {
      id: "delete-social-toast",
    });
  }
};


const handleDeleteTeamSocial = async (eventId: string) => {
  const confirm = window.confirm("¿Estás seguro que querés eliminar esta salida?");
  if (!confirm) return;

  const toastId = toast.loading("Eliminando salida...");

  try {
    const response = await fetch(`/api/team-social/${eventId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar");

    // 🔁 Actualizar estado local
    setSalidaTeamSocial((prev) => prev.filter((item) => item._id !== eventId));

    toast.success("¡Salida eliminada con éxito!", { id: toastId });
  } catch (error) {
    console.error("Error al eliminar salida:", error);
    toast.error("Ocurrió un error al eliminar la salida.", { id: toastId });
  }
};



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
    <main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      <TopContainer
        selectedLocalidad={selectedLocalidad}
        setSelectedLocalidad={setSelectedLocalidad}
      />
      <div className="flex space-x-3 justify-center overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategory(cat.label)}
            className={`flex-shrink-0 w-[100px] h-[35px] rounded-[15px]  border shadow-md ${
              selectedCategory === cat.label
                ? "border-2 border-orange-200 text-orange-300"
                : "bg-white text-[#808488]"
            } flex flex-col items-center justify-center`}
          >
            <span className="text-[11px] font-semibold leading-none text-center">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
      {selectedCategory === "Mi panel" ? (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-medium">Mis salidas</h2>
          </div>
          <div
            className={`overflow-x-auto scrollbar-hide ${
              salidaSocial.length > 0 ? "h-[245px]" : "h-auto"
            }`}
          >
            <div className="flex space-x-4">
              {loading ? (
                // Mostrar 3 skeletons mientras carga
                Array.from({ length: 3 }).map((_, i) => (
                  <DashboardCardSkeleton key={i} />
                ))
              ) : salidaSocial.length > 0 ? (
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
                      <p className="font-semibold">{event.category}</p>
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <div className="mt-1">
                        <h1 className="font-normal text-lg">{event.title}</h1>
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
                          <p className="text-[#666] font-light">
                            {event.localidad}
                          </p>
                        </div>
                      </div>

                      <div className="text-[#666] text-md">
                        <p>
                          {parseLocalDate(event.date)}, {event.time} hs
                        </p>
                        <p className="font-light"></p>
                      </div>
                    </div>
                    <div className="absolute top-[39%] right-[10px] flex gap-5">
                      <div
                        className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                        onClick={() =>
                          router.push(`/social/miembros/${event._id}`)
                        }
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          height={24}
                          width={24}
                          xmlns="http://www.w3.org/2000/svg"
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
                              d="M1 20V19C1 15.134 4.13401 12 8 12V12C11.866 12 15 15.134 15 19V20"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M13 14V14C13 11.2386 15.2386 9 18 9V9C20.7614 9 23 11.2386 23 14V14.5"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                            <path
                              d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                          </g>
                        </svg>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/social/editar/${event._id}`)
                        }
                        className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          height={24}
                          width={24}
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
                              d="M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                            <path
                              d="M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                          </g>
                        </svg>
                      </button>
                    </div>
                    <div className="absolute top-1 right-[10px]">
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          height={24}
                          width={24}
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
                              d="M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6"
                              stroke="#000000"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                          </g>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <p className="font-light text-[#666]">
                    Sin salidas creadas.{" "}
                    <a
                      href="/social/crear"
                      className="font-medium text-[#000] border-b border-b-black"
                    >
                       Crear aquí
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* Social Team */}

      {selectedCategory === "Mi panel"
        ? formData.rol === "dueño de academia" && (
            <section>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-medium mb-3">Mis social Team</h2>
              </div>
              <div
                className={`overflow-x-auto scrollbar-hide ${
                  salidaTeamSocial.length > 0 ? "h-[245px]" : "h-auto"
                }`}
              >
                <div className="flex space-x-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <DashboardCardSkeleton key={i} />
                    ))
                  ) : salidaTeamSocial.length > 0 ? (
                    salidaTeamSocial.map((event) => (
                      <div
                        key={event._id}
                        className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border"
                      >
                        <div
                          className="h-[115px] bg-slate-200"
                          onClick={() =>
                            router.push(`/team-social/${event._id}`)
                          }
                        >
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute bg-[#00000080] text-white rounded-full w-[95px] h-[25px] flex justify-center items-center top-[10px] left-[10px]">
                          <p className="font-semibold">{event.category}</p>
                        </div>
                        <div className="p-3 flex flex-col">
                          <div className="mt-1">
                            <h1 className="font-normal text-lg">
                              {event.title}
                            </h1>
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
                              <p className="text-[#666] font-light">
                                {event.localidad}
                              </p>
                            </div>
                          </div>

                          <div className="text-[#666] text-md">
                            <p className="font-normal text-lg">
                              ${Number(event.price).toLocaleString("es-AR")}
                            </p>
                            <p className="font-light">
                              {new Date(event.date).toLocaleDateString(
                                "es-AR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                }
                              )}
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
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              height={24}
                              width={24}
                              xmlns="http://www.w3.org/2000/svg"
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
                                  d="M1 20V19C1 15.134 4.13401 12 8 12V12C11.866 12 15 15.134 15 19V20"
                                  stroke="#000000"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                ></path>{" "}
                                <path
                                  d="M13 14V14C13 11.2386 15.2386 9 18 9V9C20.7614 9 23 11.2386 23 14V14.5"
                                  stroke="#000000"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                ></path>{" "}
                                <path
                                  d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z"
                                  stroke="#000000"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>{" "}
                                <path
                                  d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z"
                                  stroke="#000000"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>{" "}
                              </g>
                            </svg>
                          </div>
                          <button
                            onClick={() =>
                              router.push(`/team-social/editar/${event._id}`)
                            }
                            className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              height={24}
                              width={24}
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
                                  d="M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z"
                                  stroke="#000000"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>{" "}
                                <path
                                  d="M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13"
                                  stroke="#000000"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>{" "}
                              </g>
                            </svg>
                          </button>
                        </div>
                        <div className="absolute top-1 right-[10px]">
                          <button
                            onClick={() => handleDeleteTeamSocial(event._id)}
                            className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              height={24}
                              width={24}
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
                                  d="M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6"
                                  stroke="#000000"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>{" "}
                              </g>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>
                      <p className="font-light text-[#666]">
                        No creaste tu social team aún. {" "}
                        <a
                          href="/team-social/crear"
                          className="font-medium text-[#000] decoration-slice border-b border-b-black "
                        >
                          Crear aquí
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )
        : null}

      {/* mis match*/}

      {selectedCategory === "Mis match" ? (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-normal mb-3">Match salidas</h2>
          </div>
          <div
            className={`overflow-x-auto scrollbar-hide ${
              miMatch.length > 0 ? "h-[245px]" : "h-auto"
            }`}
          >
            <div className="flex space-x-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <DashboardCardSkeleton key={i} />
                ))
              ) : miMatch.length > 0 ? (
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
                        <h1 className="font-normal text-lg">{event.nombre}</h1>
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
                          <p className="text-[#666] font-light">
                            {event.localidad}
                          </p>
                        </div>
                      </div>

                      <div className="text-[#666] text-md">
                        <p className="font-ligh text-lg">
                          {parseLocalDate(event.date)}
                        </p>

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
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          height={24}
                          width={24}
                          xmlns="http://www.w3.org/2000/svg"
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
                              d="M1 20V19C1 15.134 4.13401 12 8 12V12C11.866 12 15 15.134 15 19V20"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M13 14V14C13 11.2386 15.2386 9 18 9V9C20.7614 9 23 11.2386 23 14V14.5"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                            <path
                              d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <p className="font-light text-[#666]">No hiciste match aún</p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/*mis match  Social Team */}
      {selectedCategory === "Mis match" ? (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-normal mb-3">Match social Team</h2>
          </div>
          <div
            className={`overflow-x-auto scrollbar-hide ${
              miMatchTeamSocial.length > 0 ? "h-[245px]" : "h-auto"
            }`}
          >
            <div className="flex space-x-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <DashboardCardSkeleton key={i} />
                ))
              ) : miMatchTeamSocial.length > 0 ? (
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
                        <h1 className="font-normal text-lg">{event.nombre}</h1>
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
                          <p className="text-[#666] text-light">
                            {event.localidad}
                          </p>
                        </div>
                      </div>

                      <div className="text-[#666] text-md">
                        <p className="font-normal text-lg">
                          ${Number(event.precio).toLocaleString("es-AR")}
                        </p>
                        <p>
                          {parseLocalDate(event.date)}, {event.hora} hs
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
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          height={24}
                          width={24}
                          xmlns="http://www.w3.org/2000/svg"
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
                              d="M1 20V19C1 15.134 4.13401 12 8 12V12C11.866 12 15 15.134 15 19V20"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M13 14V14C13 11.2386 15.2386 9 18 9V9C20.7614 9 23 11.2386 23 14V14.5"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            ></path>{" "}
                            <path
                              d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                            <path
                              d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z"
                              stroke="#000000"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                          </g>
                        </svg>
                      </div>
                    </div>
                    <div className="absolute top-1 right-[10px]"></div>
                  </div>
                ))
              ) : (
                <div>
                  <p className="font-light text-[#666]">
                    No hiciste match aún.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {selectedCategory === "Mi panel"
        ? formData.rol === "dueño de academia" && (
            <section>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-medium mb-3">
                  Mi grupo principal
                </h2>
              </div>

              <div className="overflow-x-auto scrollbar-hide">
                <div
                  className="flex space-x-4 h-[245px]"
                  
                >
                  {loading ? (
                    Array.from({ length: 1 }).map((_, i) => (
                      <DashboardCardSkeleton key={i} />
                    ))
                  ) : academia ? (
                    <div className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md border relative">
                      <div
                        className="w-full h-[50%] relative"
                        style={{
                          backgroundImage: `url(${academia.imagen})`,
                          backgroundSize: "cover",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                        }}
                        onClick={handleEntrar}
                      >
                        {" "}
                        <div className="absolute bg-[#00000080] text-white rounded-full w-[95px] h-[25px] flex justify-center items-center top-[10px] left-[10px] font-semibold">
                          {academia.tipo_disciplina}
                        </div>{" "}
                      </div>
                      <div className="w-full h-[50%] p-3">
                        <div className="">
                          <p className="font-normal text-lg">
                            {academia.nombre_academia}
                          </p>
                        </div>
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
                          <p className="text-[#666] text-light">
                            {academia.localidad}
                          </p>
                        </div>
                        <div className="font-normal text-lg text-[#666]">
                          ${Number(academia.precio).toLocaleString("es-AR")}
                        </div>
                      </div>
                      <div className="absolute top-[42%] right-4">
                        <button
                          onClick={() =>
                            router.push(`/academias/${academia._id}/editar`)
                          }
                          className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            height={24}
                            width={24}
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
                                d="M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z"
                                stroke="#000000"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              ></path>{" "}
                              <path
                                d="M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13"
                                stroke="#000000"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              ></path>{" "}
                            </g>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      No tienes academias aún.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )
        : null}

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
