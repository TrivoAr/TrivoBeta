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
import dayjs from "dayjs";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";

const categories = [
  { label: "Mi panel" },
  { label: "Mis match" },
  { label: "Mis favoritos" },
];

interface Academia {
  _id: string;
  nombre_academia: string;
  pais: string;
  provincia: string;
  localidad: string;
  imagenUrl: string;
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
  const [selectedCategory, setSelectedCategory] = useState("Mis match");
  const [salidaTeamSocial, setSalidaTeamSocial] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [miMatch, setMiMatch] = useState<any[]>([]);
  const [miMatchTeamSocial, setMiMatchTeamSocial] = useState<any[]>([]);
  const [salidasFavoritas, setSalidasFavoritas] = useState<EventType[]>([]);
  const [teamSocialFavoritos, setTeamSocialFavoritos] = useState<EventType[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedLocalidad, setSelectedLocalidad] = useState(
    "San Miguel de Tucuman"
  );
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
    rol: session?.user.role || "",
  });
  const [academiasFavoritas, setAcademiasFavoritas] = useState<Academia[]>([]);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);

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

          // data es un array → filtramos los que el creador sea el user logueado

          const userId = session?.user.id;
          const filteredData = data.filter(
            (item: any) => item.creadorId === userId
          );

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

  useEffect(() => {
    const fetchFavoritos = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch("/api/profile");
        const data = await res.json();

        const favoritasAcademias = data.favoritos?.academias || [];
        const favoritasSalidas = data.favoritos?.salidas || [];
        const favoritasTeamSocial = data.favoritos?.teamSocial || [];

        // Mapear academias con imagen
        const favoritasConImagen = await Promise.all(
          favoritasAcademias.map(async (academia: any) => {
            try {
              const imagenUrl = await getAcademyImage(
                "profile-image.jpg",
                academia._id
              );
              return { ...academia, imagenUrl };
            } catch {
              return {
                ...academia,
                imagenUrl:
                  "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg",
              };
            }
          })
        );

        setAcademiasFavoritas(favoritasConImagen);
        setFavoritosIds(favoritasAcademias.map((a: any) => a._id));

        // Mapear salidas favoritas
        const mappedSalidas = favoritasSalidas.map((item: any) => ({
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

        const mappedTeams = favoritasTeamSocial.map((item: any) => ({
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

        setTeamSocialFavoritos(mappedTeams);

        setSalidasFavoritas(mappedSalidas);
      } catch (err) {
        console.error("Error cargando favoritos:", err);
      }
    };

    fetchFavoritos();
  }, [session]);

  const toggleFavoritoTeamSocial = async (teamSocialId) => {
    try {
      const res = await fetch(`/api/favoritos/team-social/${teamSocialId}`, {
        method: "POST", // o DELETE si preferís quitar directo
      });

      if (!res.ok) throw new Error("Error al actualizar favorito");

      // Quitar de favoritos en el estado local
      setTeamSocialFavoritos((prev) =>
        prev.filter((item) => item._id !== teamSocialId)
      );
    } catch (error) {
      console.error("No se pudo actualizar favorito:", error);
    }
  };

  const toggleFavorito = async (academiaId: string) => {
    try {
      const res = await fetch(`/api/favoritos/academias/${academiaId}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error al actualizar favorito");

      const data = await res.json();

      // Toggle en el estado local
      if (data.favorito) {
        setFavoritosIds((prev) => [...prev, academiaId]);
      } else {
        setFavoritosIds((prev) => prev.filter((id) => id !== academiaId));
        setAcademiasFavoritas((prev) =>
          prev.filter((a) => a._id !== academiaId)
        );
      }
    } catch (err) {
      console.error("Error al hacer toggle de favorito:", err);
    }
  };

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

      toast.success("¡Salida eliminada con éxito!", {
        id: "delete-social-toast",
      });

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
    const confirm = window.confirm(
      "¿Estás seguro que querés eliminar esta salida?"
    );
    if (!confirm) return;

    const toastId = toast.loading("Eliminando salida...");

    try {
      const response = await fetch(`/api/team-social/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      // 🔁 Actualizar estado local
      setSalidaTeamSocial((prev) =>
        prev.filter((item) => item._id !== eventId)
      );

      toast.success("¡Salida eliminada con éxito!", { id: toastId });
    } catch (error) {
      console.error("Error al eliminar salida:", error);
      toast.error("Ocurrió un error al eliminar la salida.", { id: toastId });
    }
  };

  const parseLocalDate = (isoDateString: string | undefined): string => {
    if (!isoDateString) return "Fecha inválida";

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
          cat.label === "Mi panel" && session.user.role !== "admin" ? null : (
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
        )))}
      </div>

      {session.user.role === "admin" && selectedCategory === "Mi panel" ? (
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
                              {parseLocalDate(event.date)}, {event.time} hs
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
                        No creaste tu social team aún.{" "}
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
                          {parseLocalDate(event.fecha)}
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
                <div className="flex space-x-4 h-[245px]">
                  {loading ? (
                    Array.from({ length: 1 }).map((_, i) => (
                      <DashboardCardSkeleton key={i} />
                    ))
                  ) : academia ? (
                    <div className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md border relative">
                      <div
                        className="w-full h-[50%] relative"
                        style={{
                          backgroundImage: `url(${academia.imagenUrl})`,
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

      {/* Mis favoritos */}

      {selectedCategory === "Mis favoritos" && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-normal mb-3">Salidas favoritas</h2>
          </div>
          <div
            className={`overflow-x-auto scrollbar-hide ${
              salidasFavoritas.length > 0 ? "h-[245px]" : "h-auto"
            }`}
          >
            <div className="flex space-x-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <DashboardCardSkeleton key={i} />
                ))
              ) : salidasFavoritas.length > 0 ? (
                salidasFavoritas.map((event) => (
                  //
                  <div
                    key={event._id}
                    className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border"
                  >
                    {/* Imagen y etiqueta */}
                    <div
                      className="h-[115px] bg-slate-200 cursor-pointer"
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

                    {/* ❤️ Botón para quitar de favoritos */}
                    <div className="absolute top-[10px] right-[10px] z-10">
                      <button
                        onClick={async () => {
                          try {
                            await fetch(`/api/favoritos/salidas/${event._id}`, {
                              method: "POST",
                            });
                            // Actualizá el estado local de favoritos
                            setSalidasFavoritas((prev) =>
                              prev.filter((s) => s._id !== event._id)
                            );
                          } catch (err) {
                            console.error("Error al quitar favorito:", err);
                          }
                        }}
                        className="btnFondo p-2 rounded-full shadow-md hover:scale-105 transition"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="#e11d48"
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                        >
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 
        4.42 3 7.5 3c1.74 0 3.41 0.81 
        4.5 2.09C13.09 3.81 14.76 3 16.5 
        3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
        6.86-8.55 11.54L12 21.35z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-3 flex flex-col">
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
                        </svg>
                        <p className="text-[#666] font-light">
                          {event.localidad}
                        </p>
                      </div>

                      <div className="text-[#666] text-md">
                        <p className="font-light text-lg">
                          {parseLocalDate(event.date)}
                        </p>
                        <p>{event.time} hs</p>
                      </div>
                    </div>

                    {/* Miembros */}
                    <div className="absolute top-[39%] right-[10px] flex gap-5">
                      <div
                        className="bg-[#fff] border w-[40px] h-[40px] rounded-full flex justify-center items-center cursor-pointer"
                        onClick={() =>
                          router.push(`/social/miembros/${event._id}`)
                        }
                      >
                        {/* Miembros Icon */}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          height={24}
                          width={24}
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {/* ... icon paths ... */}
                        </svg>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <p className="font-light text-[#666]">
                    Aún no tenés salidas marcadas como favoritas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {selectedCategory === "Mis favoritos" &&
        teamSocialFavoritos.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-medium mb-3">
                Mis Team Social favoritos
              </h2>
            </div>
            <div
              className={`overflow-x-auto scrollbar-hide ${
                teamSocialFavoritos.length > 0 ? "h-[245px]" : "h-auto"
              }`}
            >
              <div className="flex space-x-4">
                {teamSocialFavoritos.map((event) => (
                  <div
                    key={event._id}
                    className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border"
                  >
                    <div
                      className="h-[115px] bg-slate-200 cursor-pointer"
                      onClick={() => router.push(`/team-social/${event._id}`)}
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
                          </svg>
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
                          {parseLocalDate(event.date)}, {event.time} hs
                        </p>
                      </div>
                    </div>
                    {/* Botón para quitar de favoritos */}
                    <div className="absolute top-1 right-[10px]">
                      <button
                        onClick={() => toggleFavoritoTeamSocial(event._id)}
                        className="btnFondo border w-[40px] h-[40px] rounded-full flex justify-center items-center"
                        title="Quitar de favoritos"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="#ef4444"
                          xmlns="http://www.w3.org/2000/svg"
                          height={20}
                          width={20}
                        >
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.41 4.42 3 
                    7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 
                    14.76 3 16.5 3 19.58 3 22 5.41 
                    22 8.5c0 3.78-3.4 6.86-8.55 
                    11.54L12 21.35z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {selectedCategory === "Mis favoritos" && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-medium mb-3">Grupos favoritos</h2>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4 h-[245px]">
              {academiasFavoritas.length === 0 ? (
                <div className="text-gray-600">
                  No tenés academias favoritas aún.
                </div>
              ) : (
                academiasFavoritas.map((academia) => (
                  <div
                    key={academia._id}
                    className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md border relative"
                  >
                    {/* Imagen */}
                    <div
                      className="w-full h-[50%] relative cursor-pointer"
                      style={{
                        backgroundImage: `url(${academia.imagenUrl})`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                      onClick={() => router.push(`/academias/${academia._id}`)}
                    >
                      <div className="absolute bg-[#00000080] text-white rounded-full w-[95px] h-[25px] flex justify-center items-center top-[10px] left-[10px] font-semibold">
                        {academia.tipo_disciplina}
                      </div>

                      {/* ❤️ botón de favoritos */}
                      <button
                        className="absolute top-2 right-2 text-white btnFondo rounded-full p-3 flex justify-center items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(academia._id);
                        }}
                      >
                        {favoritosIds.includes(academia._id) ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="red"
                            viewBox="0 0 24 24"
                            width="25"
                            height="25"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.5 4 5.5 4c1.54 0 3.04.99 3.57 2.36h1.87C13.46 4.99 14.96 4 16.5 4 18.5 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            stroke="white"
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
                    </div>

                    {/* Info */}
                    <div className="w-full h-[50%] p-3">
                      <p className="font-normal text-lg">
                        {academia.nombre_academia}
                      </p>
                      <div className="flex items-center text-sm mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="#f97316"
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          className="mr-1"
                        >
                          <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                        </svg>
                        <p className="text-[#666]">{academia.localidad}</p>
                      </div>
                      <div className="font-normal text-lg text-[#666] mt-1">
                        ${Number(academia.precio).toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

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
