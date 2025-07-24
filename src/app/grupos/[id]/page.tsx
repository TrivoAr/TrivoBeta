"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModalEntrenamiento from "@/components/Modals/ModalEntrenamiento";
import axios from "axios";
import { getGroupImage } from "@/app/api/grupos/getGroupImage";
import { saveGroupImage } from "@/app/api/grupos/saveGroupImage";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import toast, { Toaster } from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { url } from "inspector";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Tipos
type Grupo = {
  _id: string;
  nombre_grupo: string;
  nivel?: string;
  ubicacion?: string;
  direccion?: string;
  horario?: string;
  descripcion?: string;
  tipo_grupo?: string;
  cuota_mensual?: string;
  tiempo_promedio?: string;
  dias?: string[];
  aviso?: string;
  locationCoords?: {
    lat: number;
    lng: number;
  };
  profesor_id?: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen: string;
    telnumber: string;
    instagram: string;
    bio: string;
  };
};

type Alumno = {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
};

type Entrenamiento = {
  alumno_id: string;
  grupo_id: string;
  fecha: string;
  descripcion: string;
  objetivo: string;
  estado: string; // Siempre será "gris"
};

export default function GrupoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [alumnos, setAlumnos] = useState<
    (Alumno & { profileImage?: string })[]
  >([]);
  const [entrenamientoData, setEntrenamientoData] = useState<Entrenamiento>({
    alumno_id: "",
    grupo_id: params.id,
    fecha: "",
    descripcion: "",
    objetivo: "",
    estado: "gris", // Valor inicial fijo
  });
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [groupImage, setGroupImage] = useState<string>(
    "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"
  );
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // Para controlar el acceso del usuario

  const router = useRouter();
  const { data: session } = useSession();

  const userRole = session?.user?.role;
  const userId = session?.user?.id;
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
    rol: session?.user.role || "",
  });

  useEffect(() => {
    if (!userId || !params.id) return; // Verificar que el userId y el params.id estén disponibles

    const checkUserAccess = async () => {
      try {
        // Obtener los detalles del grupo primero para obtener el ID de la academia
        const academiaId = localStorage.getItem("academia_id");

        // Ahora hacer la solicitud para verificar el acceso con el ID de la academia
        const response = await axios.get(
          `/api/academias/${academiaId}/miembros`,
          {
            headers: {
              user_id: userId,
            },
          }
        );

        console.log("Respuesta de verificación de acceso:", response);

        // Verificar si el usuario está en la lista de miembros de la academia y tiene un grupo asignado
        const hasAccess = response.data.miembros.some(
          (miembro: any) => miembro.user_id._id === userId
        );

        if (hasAccess) {
          setIsAuthorized(true); // Usuario tiene acceso
        } else {
          setIsAuthorized(false); // Usuario no tiene acceso
        }
      } catch (error) {
        console.error("Error al verificar el acceso del usuario:", error);
        setError("Hubo un problema al verificar el acceso del usuario.");
      }
    };
    if (session?.user) {
      setFormData({
        fullname: session.user.fullname || "",
        email: session.user.email || "",
        rol: session.user.role || "",
      });
    }
    checkUserAccess(); // Ejecutar la función para verificar el acceso
  }, [params.id, userId]);

  useEffect(() => {
    if (isAuthorized === false) {
      setError("No tienes acceso a esta academia.");
      return;
    }

    const fetchGrupo = async () => {
      try {
        // Si el usuario tiene acceso, cargamos los detalles del grupo
        const response = await axios.get(`/api/grupos/${params.id}`);
        const alumnosData = response.data.alumnos.map(
          (item: any) => item.user_id
        );

        try {
          const imageUrl = await getGroupImage(
            "foto_perfil_grupo.jpg",
            params.id
          );
          setGroupImage(imageUrl);
        } catch {
          console.log(
            "No se encontró una imagen para este grupo, usando predeterminada."
          );
        }

        const alumnosWithImages = await Promise.all(
          alumnosData.map(async (alumno: Alumno) => {
            try {
              const imageUrl = await getProfileImage(
                "profile-image.jpg",
                alumno._id
              );
              return { ...alumno, profileImage: imageUrl };
            } catch (error) {
              console.error(
                `Error al obtener imagen del alumno ${alumno._id}:`,
                error
              );
              return {
                ...alumno,
                profileImage:
                  "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
              };
            }
          })
        );

        setGrupo(response.data.grupo);
        setAlumnos(alumnosWithImages);
      } catch (error) {
        setError("Hubo un problema al cargar los detalles del grupo.");
      }
    };

    if (isAuthorized === true) {
      fetchGrupo();
    }
  }, [isAuthorized, params.id]);

  const handleAssignEntrenamiento = async () => {
    try {
      await axios.post(`/api/entrenamientos`, entrenamientoData);
      alert("Entrenamiento asignado con éxito.");
      setIsAssigning(false);
      setEntrenamientoData({
        alumno_id: "",
        grupo_id: params.id,
        fecha: "",
        descripcion: "",
        objetivo: "",
        estado: "gris", // Restablecer valor fijo
      });
      setSelectedAlumno(null);
    } catch (error) {
      console.error("Error al asignar el entrenamiento:", error);
      alert("Hubo un problema al asignar el entrenamiento.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEntrenamientoData({
      ...entrenamientoData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAlumnoClick = (alumno: Alumno) => {
    if (userRole === "alumno") return;
    setSelectedAlumno(alumno);
    setEntrenamientoData({ ...entrenamientoData, alumno_id: alumno._id });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await saveGroupImage(file, params.id);
      setGroupImage(imageUrl);
      alert("Imagen actualizada con éxito.");
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert("Hubo un problema al subir la imagen del grupo.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleIrAPago = () => {
    if (!grupo) return;

    const { _id, nombre_grupo, cuota_mensual } = grupo;
    const fecha = new Date().toLocaleString();

    // Obtener el ID de la academia desde el localStorage
    const academiaId = localStorage.getItem("academia_id");

    // Almacenar los datos en localStorage
    localStorage.setItem("grupoId", _id);
    localStorage.setItem("nombreGrupo", nombre_grupo);
    localStorage.setItem("monto", cuota_mensual || "0");
    localStorage.setItem("fecha", fecha);
    localStorage.setItem("academiaId", academiaId); // Añadir el academiaId

    // Redirigir a la página de pago
    router.push("/pagos");
  };

  function extraerLocalidad(ubicacion: string): string {
    const partes = ubicacion.split(",");
    if (partes.length < 2) return ""; // No hay suficiente info

    // Tomamos la segunda parte (lo que suele venir después de la dirección)
    let segundaParte = partes[1];

    // Quitamos el código postal tipo "T4000", "X5000", etc.
    // Regex: cualquier letra seguida de 4 dígitos
    segundaParte = segundaParte.replace(/[A-Z]\d{4}/g, "").trim();

    return segundaParte;
  }

    const handleDelete = async (id) => {
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar este grupo?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/grupos/${id}`);
      if (response.status === 200) {
        toast.success("¡Grupo eliminado con éxito!");
        router.push("/dashboard");
      } else {
        throw new Error("Error al eliminar el grupo");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el grupo.");
    }
  };

  const formatDias = (dias: string[]) => {
    if (dias.length === 1) return dias[0];
    if (dias.length === 2) return `${dias[0]} y ${dias[1]}`;
    return `${dias.slice(0, -1).join(", ")} y ${dias[dias.length - 1]}`;
  };

  if (error) return <div>{error}</div>;

  if (!grupo) return <div>Cargando...</div>;

  console.log("datos grupo", grupo.profesor_id);

  return (
    <div className="flex flex-col w-[390px] items-center bg-[#FEFBF9]">
      {/* <button
        type="button"
        onClick={() => router.back()}
        className=" absolute top-2 left-2 bg-black text-white p-2 rounded-full shadow-md hover:bg-blue-600 transition duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
          width="24"
          height="24"
        >
          <path
            fillRule="evenodd"
            d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
          />
        </svg>
      </button>
      {formData.rol=== "dueño de academia" && (
      <button
        onClick={() => router.push(`/grupos/${params.id}/editar`)}
        className="absolute bg-black top-2 right-2 z-50  p-1 rounded-full shadow-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="25px"
          height="25px"
        >
          <path
            fill="#fcfcfc"
            d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"
          />
        </svg>
      </button>)}

      <div
        className="coverAcademias w-[390px] h-[190px] bg-cover bg-center"
        style={{ backgroundImage: `url('${groupImage}')` }}
      ></div>

      <div className="absolute top-[135px] logo h-[120px] w-[390px] flex justify-start items-center gap-3 p-8">
        <img src={groupImage} className="rounded-full object-cover h-[120px] w-[120px]" alt="Logo" />
        <h1 className="w-[280px] h-[22px] text-[20px] font-[700] text-[#333] leading-[22px] mx-auto mt-[30px]">
          {grupo.nombre_grupo}
        </h1>
      </div> */}

      <Toaster position="top-center" />
      <div
        className="relative w-full h-[190px] flex"
        style={{
          backgroundImage: `url(${groupImage})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="btnFondo absolute top-2 left-2 text-white p-2 rounded-full shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="black"
            viewBox="0 0 16 16"
            width="24"
            height="24"
          >
            <path
              fillRule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
            />
          </svg>
        </button>

        {session.user.id === grupo.profesor_id._id ? ( <button className="btnFondo absolute top-2 right-4 text-white p-2 rounded-full shadow-md" onClick={() => handleDelete(grupo._id)}>
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
        </button>) : (null)}

       
      </div>
      
      <div className="flex flex-col items-center gap-3 w-full px-3 justify-center">
        <div>
          <h1 className="text-4xl font-bold text-center">
            {grupo.nombre_grupo}
          </h1>

          <p className="text-sm text-center flex items-center justify-center gap-1">
            {" "}
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
            {extraerLocalidad(grupo.ubicacion)}
          </p>
        </div>
        <div className="w-[90%] border-b border-b-[#ccc]"></div>
      </div>

      {/* info del grupo */}
      <div className="w-full flex flex-col gap-4">
        <p className="ml-6 mt-2 font-light text-xl poppins-light">Info del entrenamiento</p>
        <div className="w-[90%] ml-4 flex">
          <div>
            <div className="flex items-center justify-start gap-1">
              <svg
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="#000000"
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
                  <circle cx="32" cy="32" r="24"></circle>
                  <polyline points="40 44 32 32 32 16"></polyline>
                </g>
              </svg>
              <p className="poppins-thin">Tiempo de Entreamiento</p>
            </div>
            <p className="text-[#666666] ml-6 poppins-thin">{grupo.tiempo_promedio}</p>
          </div>
        </div>

        <div className="w-[90%] ml-4 flex">
          <div>
            <div className="flex items-center justify-start gap-1">
              <svg
                viewBox="-2.5 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                fill="#000000"
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
                  <title>signal [#1517]</title>{" "}
                  <desc>Created with Sketch.</desc> <defs> </defs>{" "}
                  <g
                    id="Page-1"
                    stroke="none"
                    stroke-width="1"
                    fill="none"
                    fill-rule="evenodd"
                  >
                    {" "}
                    <g
                      id="Dribbble-Light-Preview"
                      transform="translate(-182.000000, -240.000000)"
                      fill="#000000"
                    >
                      {" "}
                      <g
                        id="icons"
                        transform="translate(56.000000, 160.000000)"
                      >
                        {" "}
                        <path
                          d="M126,100 L128.142857,100 L128.142857,96 L126,96 L126,100 Z M130.285714,100 L132.428571,100 L132.428571,92 L130.285714,92 L130.285714,100 Z M138.857143,100 L141,100 L141,80 L138.857143,80 L138.857143,100 Z M134.571429,100 L136.714286,100 L136.714286,86 L134.571429,86 L134.571429,100 Z"
                          id="signal-[#1517]"
                        >
                          {" "}
                        </path>{" "}
                      </g>{" "}
                    </g>{" "}
                  </g>{" "}
                </g>
              </svg>
              <p className="poppins-thin">Dificultad</p>
            </div>
            <p className="text-[#666666] ml-6 poppins-thin">{grupo.nivel}</p>
          </div>
        </div>

        <div className="w-[90%] ml-4 flex">
          <div>
            <div className="flex items-center justify-start gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                height={20}
                width={20}
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M17 10C17 11.7279 15.0424 14.9907 13.577 17.3543C12.8967 18.4514 12.5566 19 12 19C11.4434 19 11.1033 18.4514 10.423 17.3543C8.95763 14.9907 7 11.7279 7 10C7 7.23858 9.23858 5 12 5C14.7614 5 17 7.23858 17 10Z"
                    stroke="#464455"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M14.5 10C14.5 11.3807 13.3807 12.5 12 12.5C10.6193 12.5 9.5 11.3807 9.5 10C9.5 8.61929 10.6193 7.5 12 7.5C13.3807 7.5 14.5 8.61929 14.5 10Z"
                    stroke="#464455"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </g>
              </svg>
              <p className="poppins-thin">Dirección</p>
            </div>
            <p className="text-[#666666] ml-6 poppins-thin">
              {grupo.ubicacion.split(",")[0]}
            </p>
          </div>
        </div>
        <div className="w-[90%] ml-4 flex">
          <div>
            <div className="flex items-center justify-start gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                height={20}
                width={20}
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
                    d="M16 15.2V16.8875L16.9 17.9M9 11H4M9 3V7M15 3V7M9 5H12M15 5H18C19.1046 5 20 5.89543 20 7V9M6 5C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H9M20.5 17C20.5 19.4853 18.4853 21.5 16 21.5C13.5147 21.5 11.5 19.4853 11.5 17C11.5 14.5147 13.5147 12.5 16 12.5C18.4853 12.5 20.5 14.5147 20.5 17Z"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
              <p className="poppins-thin">Dias y horario</p>
            </div>
            <p className="text-[#666666] ml-6 poppins-thin">
              {formatDias(grupo.dias)}, {grupo.horario}hs
            </p>
          </div>
        </div>
        <div className="w-[90%] border-b border-b-[#ccc] self-center"></div>
      </div>

      <div className="flex flex-col w-[390px]">
        <div className="flex flex-col">
          <h2 className="ml-6 mt-2 font-light text-xl">Descripción</h2>
          <p className="text-sm  font-light text-[#666666] p-2 ml-6">
            {grupo.descripcion || "El Profe no agrego una descripción"}
          </p>
          <hr className="border-t border-[#ccc] mb-2 w-[90%] self-center" />
        </div>

        <div className="flex flex-col">
          <h2 className="ml-6 mt-2 font-light text-xl">Avisos Importantes</h2>
          <p className="text-sm  font-light text-[#666666] p-2 ml-6">
            {grupo.aviso || "El profe aún no incluyo avisos"}
          </p>
          <hr className="border-t border-[#ccc] mb-2 w-[90%] self-center" />
        </div>

        <div className="flex flex-col">
          <h2 className="ml-6 mt-2 font-light text-xl">Punto de Encuentro</h2>
          <p className="text-sm  font-light text-[#666666] p-2 ml-6">
            {grupo.ubicacion.split(",")[0]}
          </p>

          {grupo.locationCoords ? (
            <div className="w-[90%] h-[310px] rounded-xl overflow-hidden border z-0 self-center">
              <MapContainer
                center={[grupo.locationCoords.lat, grupo.locationCoords.lng]}
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
                    grupo.locationCoords.lat,
                    grupo.locationCoords.lng,
                  ]}
                >
                  <Popup>{grupo.nombre_grupo}</Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <p className="text-sm  font-light text-[#666666] ml-6 mb-2">
              No hay coordenadas disponibles.
            </p>
          )}

          <hr className="border-t border-[#ccc] mb-3 mt-3 w-[90%] self-center" />
        </div>

        {/* <div className="rounded-lg p-1 w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold text-left text-[#333] mb-2">
            Cuota Mensual
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {grupo.cuota_mensual || "Sin especificar cuota"}
          </p>
          <button
            onClick={handleIrAPago}
            className="bg-[#FF9A3D] text-#333 text-sm font-semibold w-full py-2 rounded-md hover:bg-[#FFA55C] transition-colors"
          >
            Pagar Cuota
          </button>
        </div> */}
        <div>
          <div className="flex flex-col">
            <h2 className="ml-6 mt-2 font-light text-xl">
              Miembros de la tribu
            </h2>
            {alumnos.length > 0 ? (
              <ul className="flex gap-2 ml-6 mt-2 flex-wrap">
                {alumnos.map((alumno) => (
                  <li
                    key={alumno._id}
                    onClick={() => handleAlumnoClick(alumno)}
                  >
                    <div
                      style={{
                        backgroundImage: `url(${alumno.profileImage})`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                      className="w-[75px] h-[75px] rounded-full object-cover"
                    />
                    {/* {userRole !== "alumno" &&
                  selectedAlumno?._id === alumno._id && (
                    <div>
                      <button
                        onClick={() => {
                          setIsAssigning(true);
                        }}
                        className="border border-[#FF9A3D] w-[125px] h-[32px] rounded-[10px] text-[#FF9A3D] self-center"
                      >
                        Entrenamiento
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/entrenamiento/${selectedAlumno?._id}`)
                        }
                        className="border border-[#FF9A3D] w-[125px] h-[32px] rounded-[10px] text-[#FF9A3D] self-center"
                      >
                        Ver Historial
                      </button>
                    </div>
                  )} */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm  font-light text-[#666666] ml-6 mb-2">
                No hay miembros en esta tribu.
              </p>
            )}
          </div>
        </div>

        <hr className="border-t border-gray-300 w-[90%] mb-2 self-center" />

        <div className="">
          <h2 className="ml-6 mt-2 font-light text-xl">Profesor</h2>
          <div className="flex flex-col items-center gap-2">
            <div className="self-center mt-2">
              <div className="w-[300px] h-[176px] bg-white border rounded-[20px] flex flex-col items-center gap-1">
                <div
                  className="rounded-full h-[80px] w-[80px] border shadow-sm mt-4"
                  style={{
                    backgroundImage: `url(${grupo.profesor_id.imagen})`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                ></div>
                <p>
                  {grupo.profesor_id.firstname} {grupo.profesor_id.lastname}
                </p>
                <p className="text-xs text-[#666666]">Profesor</p>
              </div>
            </div>
            <p className="text-xs text-[#666666] text-justify self-center mt-2 w-[300px]">
              {grupo.profesor_id.bio}
            </p>
          </div>
        </div>
      </div>

      {isAssigning && selectedAlumno && (
        <ModalEntrenamiento estado={isAssigning} cambiarEstado={setIsAssigning}>
          <div className="w-full p-2 flex flex-col items-center">
            <h3 className="font-bold text-center mb-4">
              {selectedAlumno.firstname} {selectedAlumno.lastname}
            </h3>
            <input
              type="date"
              name="fecha"
              value={entrenamientoData.fecha}
              onChange={handleChange}
              className="mb-4 border p-2 w-[90%] rounded"
            />
            <textarea
              name="objetivo"
              value={entrenamientoData.objetivo}
              onChange={handleChange}
              placeholder="0bjetivo"
              className="mb-4 border p-2 w-[90%] rounded"
            ></textarea>
            <textarea
              name="descripcion"
              value={entrenamientoData.descripcion}
              onChange={handleChange}
              placeholder="Estimulo"
              className="mb-4 border p-2 w-[90%] rounded"
            ></textarea>
            <button
              onClick={handleAssignEntrenamiento}
              className="bg-[#FF9A3D] text-[#333] py-2 px-4 rounded-full w-[90%] font-bold"
            >
              Confirmar
            </button>
            <button
              onClick={() => setIsAssigning(false)}
              className="mt-3 border-2 border-[#FF9A3D] text-[#FF9A3D] py-2 px-4 rounded-full w-[90%] font-bold"
            >
              Cancelar
            </button>
          </div>
        </ModalEntrenamiento>
      )}

      <div className="pb-[200px]"></div>
    </div>
  );
}
