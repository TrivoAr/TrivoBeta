"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";
import { getGroupImage } from "@/app/api/grupos/getGroupImage";
import { saveGroupImage } from "@/app/api/grupos/saveGroupImage";
import { User } from "mercadopago";

type Grupo = {
  _id: string;
  nombre_grupo: string;
  nivel?: string;
  ubicacion?: string;
  direccion?: string;
  horario?: string;
  descripcion?: string;
  tipo_grupo?: string;
  imagen?: string;
};

type Academia = {
  _id: string;
  dueño_id: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen: string;
  };
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
  localidad: string;
};

export default function AcademiaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveRequest, setHasActiveRequest] = useState(false); // Estado para solicitudes activas
  const [esMiembro, setEsMiembro] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
    rol: session?.user.role || "",
  });
  const [groupImages, setGroupImages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/academias/${params.id}`);
        setAcademia(response.data.academia);
        setGrupos(response.data.grupos);

        const loadGroupImages = async () => {
          const imageMap: { [key: string]: string } = {};

          for (const grupo of response.data.grupos) {
            try {
              const imageUrl = await getGroupImage(
                "foto_perfil_grupo.jpg",
                grupo._id
              );
              imageMap[grupo._id] = imageUrl;
            } catch (error) {
              console.warn(
                `No se encontró imagen para grupo ${grupo._id}, usando imagen predeterminada.`
              );
              imageMap[grupo._id] =
                "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg";
            }
          }

          setGroupImages(imageMap);
        };

        loadGroupImages();

        localStorage.setItem("academia_id", params.id);
        localStorage.setItem("dueño_id", response.data.academia.dueño_id);
        // Intentar obtener la imagen del perfil
        const loadProfileImage = async () => {
          try {
            const imageUrl = await getAcademyImage(
              "profile-image.jpg",
              params.id
            );
            setProfileImage(imageUrl);
          } catch (error) {
            console.error("Error al obtener la imagen del perfil:", error);
            // Puedes agregar una imagen predeterminada en caso de error
            setProfileImage(
              "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"
            );
          }
        };

        loadProfileImage();
      } catch (error) {
        console.error("Error al obtener los datos:", error);
        setError("Hubo un problema al cargar los datos de la academia.");
      }
    };

    const checkMembership = async () => {
      if (!session || !session.user) return;
      try {
        const miembrosResponse = await axios.get(
          `/api/academias/${params.id}/miembros`
        );
        const miembrosData = miembrosResponse.data.miembros;

        // Verifica si el usuario está en la lista y su estado es "aceptado"
        const usuarioEsMiembro = miembrosData.some(
          (miembro: any) =>
            miembro.user_id._id === session.user.id &&
            miembro.estado === "aceptado"
        );

        console.log("Usuario es miembro:", usuarioEsMiembro);
        setEsMiembro(usuarioEsMiembro);
      } catch (error) {
        console.error("Error al verificar membresía:", error);
      }
    };

    const checkActiveRequest = async () => {
      if (!session || !session.user) return;
      try {
        const response = await axios.get(`/api/academias/solicitudes`, {
          params: {
            academia_id: params.id,
            user_id: session.user.id,
          },
        });
        setHasActiveRequest(response.data.hasActiveRequest);
      } catch (error) {
        if (error === 404) {
          console.log("No hay solicitud activa");
          setHasActiveRequest(false);
        } else {
          console.error("Error al verificar solicitud activa:", error);
        }
      }
    };
    if (session?.user) {
      setFormData({
        fullname: session.user.fullname || "",
        email: session.user.email || "",
        rol: session.user.role || "",
      });
    }

    fetchData();
    checkActiveRequest(); // Verificar solicitud activa
    checkMembership();
  }, [params.id, session]);

  const handleJoinAcademia = async () => {
    if (!session || !session.user || !session.user.id) {
      toast.error("Por favor, inicia sesión para unirte a esta academia.");
      return;
    }

    toast
      .promise(
        axios.post("/api/academias/unirse", {
          academia_id: params.id,
          user_id: session.user.id,
        }),
        {
          loading: "Enviando solicitud...",
          success: "¡Solicitud enviada con éxito! Espera la aprobación.",
          error: "Hubo un error al enviar la solicitud.",
        }
      )
      .then(() => {
        setHasActiveRequest(true); // Deshabilitar botón después de la solicitud
        router.push("/dashboard");
      })
      .catch((err) => {
        if (
          err.response?.status === 400 &&
          err.response.data.message.includes("solicitud activa")
        ) {
          setHasActiveRequest(true);
          toast.error("Ya tienes una solicitud activa para esta academia.");
        } else {
        }
        console.error("Error al unirse a la academia:", err);
      });
  };

  const handleEdit = () => {
    router.push(`/academias/${params.id}/editar`);
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!academia) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="flex flex-col w-[390px] items-center bg-[#FEFBF9]">
      <Toaster position="top-center" />
      <div
        className="relative w-full h-[190px] flex"
        style={{
          backgroundImage: `url(${profileImage})`,
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

        <button className="btnFondo absolute top-2 right-14 text-white p-2 rounded-full shadow-md">
          <svg
            viewBox="0 0 32 32"
            version="1.1"
            fill="#000000"
            width="24"
            height="24"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <g id="icomoon-ignore"> </g>{" "}
              <path
                d="M21.886 5.115c3.521 0 6.376 2.855 6.376 6.376 0 1.809-0.754 3.439-1.964 4.6l-10.297 10.349-10.484-10.536c-1.1-1.146-1.778-2.699-1.778-4.413 0-3.522 2.855-6.376 6.376-6.376 2.652 0 4.925 1.62 5.886 3.924 0.961-2.304 3.234-3.924 5.886-3.924zM21.886 4.049c-2.345 0-4.499 1.089-5.886 2.884-1.386-1.795-3.54-2.884-5.886-2.884-4.104 0-7.442 3.339-7.442 7.442 0 1.928 0.737 3.758 2.075 5.152l11.253 11.309 11.053-11.108c1.46-1.402 2.275-3.308 2.275-5.352 0-4.104-3.339-7.442-7.442-7.442v0z"
                fill="#000000"
              >
                {" "}
              </path>{" "}
            </g>
          </svg>
        </button>

        <button className="btnFondo absolute top-2 right-2 text-white p-2 rounded-full shadow-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
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
                d="M20 13L20 18C20 19.1046 19.1046 20 18 20L6 20C4.89543 20 4 19.1046 4 18L4 13"
                stroke="#000000"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>{" "}
              <path
                d="M16 8L12 4M12 4L8 8M12 4L12 16"
                stroke="#000000"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>{" "}
            </g>
          </svg>
        </button>
      </div>

      <div className="flex w-full mt-2 px-3 justify-center">
        <div>
          <h1 className="text-4xl font-bold text-center">
            {academia.nombre_academia}
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
            {academia.localidad}
          </p>
        </div>
      </div>
      <div className="w-[80%] border-b-[0.5px] h-[80px] border-b-[#ccc] flex justify-center items-center">
        <div className=" flex flex-col justify-center items-center w-[49%]">
          <p>4.87</p>
          <div className="flex gap-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              height="13px"
              width="13px"
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
                  d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
                  fill="#000"
                ></path>{" "}
              </g>
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              height="13px"
              width="13px"
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
                  d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
                  fill="#000"
                ></path>{" "}
              </g>
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              height="13px"
              width="13px"
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
                  d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
                  fill="#000"
                ></path>{" "}
              </g>
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              height="13px"
              width="13px"
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
                  d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
                  fill="#000"
                ></path>{" "}
              </g>
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              height="13px"
              width="13px"
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
                  d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
                  fill="#000"
                ></path>{" "}
              </g>
            </svg>
          </div>
        </div>
        <div className="h-[45px] w-[0.5px] border-r border-r-[#ccc]"></div>
        <div className="flex flex-col justify-center items-center w-[49%]">
          <p className="font-bold text-md">30</p>
          <p className="font-bold">Reseñas</p>
        </div>
      </div>

      {/* <div className="flex w-[338px] justify-center gap-2 mt-4">
        <button
          onClick={() => router.push(`/academias/${params.id}/miembros`)}
          className="w-[95px] h-[30px] border rounded-[10px] flex justify-center items-center text-sm bg-white shadow-md text-slate-500"
        >
          Miembros
        </button>
        {academia.dueño_id === session?.user?.id && (
          <button
            onClick={() => router.push(`/grupos`)}
            className="w-[95px] h-[30px] border rounded-[10px] flex justify-center items-center text-sm bg-white shadow-md text-slate-500"
          >
            {" "}
            Crear Grupo
          </button>
        )}
        {academia.dueño_id === session?.user?.id && (
          <button
            onClick={() => router.push(`/academias/${params.id}/editar`)}
            className="p-3 h-[30px] border rounded-[10px] flex justify-center items-center text-sm bg-white shadow-md text-slate-500"
          >
            {" "}
            Editar Academia
          </button>
        )}
      </div> */}

      <div className="w-[80%] border-b-[0.5px] h-[150px] border-b-[#ccc] flex justify-center items-center gap-2">
        <div
          className="rounded-full border w-[80px] h-[80px]"
          style={{
            backgroundImage: `url(${academia.dueño_id.imagen})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        ></div>
        <div className="flex flex-col justify-around h-[80px]">
          <div className="text-[#666]">
            <p className="poppins-extralight">{academia.dueño_id.firstname} {academia.dueño_id.lastname}</p>
          </div>
          <div className="flex gap-2 justify-center items-center">
            <div className="text-[#666] flex justify-center items-center gap-1">
              Seguir{" "}
              <svg
                viewBox="0 0 24 24"
                fill="none"
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
                  <path
                    d="M3.06167 7.24464C3.10844 6.22264 3.26846 5.56351 3.48487 5.00402L3.48778 4.99629C3.70223 4.42695 4.03818 3.91119 4.47224 3.48489L4.47833 3.47891L4.48431 3.47282C4.91096 3.0382 5.42691 2.70258 5.99575 2.4887L6.00556 2.48495C6.56378 2.26786 7.22162 2.10843 8.24447 2.06167M3.06167 7.24464C3.0125 8.33659 2.99997 8.67508 2.99997 11.5063C2.99997 14.3381 3.01181 14.6758 3.06164 15.768M3.06167 7.24464L3.06167 7.52008M3.48867 18.0168C3.70255 18.5856 4.03817 19.1015 4.47279 19.5282L4.47887 19.5342L4.48484 19.5402C4.91116 19.9743 5.42694 20.3103 5.99628 20.5247L6.00478 20.5279C6.56351 20.7446 7.22167 20.9041 8.24447 20.9509M3.48867 18.0168L3.48492 18.0069C3.26783 17.4487 3.1084 16.7909 3.06164 15.768M3.48867 18.0168L3.47585 17.9492M3.06164 15.768L3.07839 15.8562M3.06164 15.768L3.06164 15.4919M3.47585 17.9492L3.07839 15.8562M3.47585 17.9492C3.30704 17.5033 3.13322 16.881 3.07839 15.8562M3.47585 17.9492C3.48177 17.9649 3.48768 17.9803 3.49359 17.9955C3.70766 18.5726 4.04685 19.0952 4.48679 19.5256C4.91708 19.9655 5.43944 20.3046 6.01636 20.5187C6.47934 20.699 7.13172 20.8875 8.24431 20.9385C9.3671 20.9896 9.71399 21 12.5062 21C15.2985 21 15.6457 20.9896 16.7685 20.9385C17.8824 20.8874 18.534 20.6979 18.9954 20.519C19.5726 20.305 20.0953 19.9657 20.5257 19.5256C20.9655 19.0953 21.3046 18.573 21.5187 17.9961C21.699 17.5331 21.8875 16.8808 21.9384 15.7682C21.9895 14.6454 22 14.2978 22 11.5063C22 8.71472 21.9895 8.36684 21.9384 7.24405C21.8871 6.12427 21.6959 5.47168 21.5161 5.00992C21.2811 4.40322 20.9831 3.94437 20.525 3.48627C20.0678 3.02999 19.6102 2.73179 19.003 2.49654C18.5396 2.31537 17.8866 2.12531 16.7685 2.07406C16.6712 2.06964 16.5798 2.06552 16.4921 2.06168M3.07839 15.8562C3.07684 15.8273 3.07539 15.7981 3.07403 15.7685C3.06961 15.6712 3.06548 15.5797 3.06164 15.4919M8.24447 2.06167C9.33668 2.01184 9.67505 2 12.5062 2C15.3374 2 15.6756 2.01252 16.7675 2.06168M8.24447 2.06167L8.52062 2.06167M16.7675 2.06168L16.4921 2.06168M16.7675 2.06168C17.7897 2.10844 18.4489 2.26844 19.0085 2.48487L19.0162 2.48781C19.5855 2.70226 20.1013 3.03821 20.5276 3.47227L20.5335 3.4783L20.5396 3.48422C20.9737 3.91055 21.3096 4.42646 21.5239 4.99596L21.5275 5.00559C21.7446 5.56381 21.9041 6.22165 21.9508 7.2445M8.52062 2.06167L16.4921 2.06168M8.52062 2.06167C9.44548 2.02123 9.95666 2.01253 12.5062 2.01253C15.056 2.01253 15.5671 2.02124 16.4921 2.06168M8.52062 2.06167C8.43284 2.06551 8.34134 2.06964 8.24402 2.07406C7.13004 2.12512 6.47843 2.31464 6.01708 2.49358C5.43767 2.70837 4.91328 3.04936 4.48192 3.49186C4.0281 3.94756 3.73105 4.40422 3.49655 5.0094C3.31536 5.4728 3.12527 6.12614 3.07402 7.24434C3.06961 7.34135 3.06549 7.43257 3.06167 7.52008M21.9508 15.768C21.9041 16.7908 21.7446 17.449 21.5279 18.0077L21.5247 18.0162C21.3102 18.5856 20.9743 19.1013 20.5402 19.5276L20.5341 19.5336L20.5282 19.5397C20.1015 19.9743 19.5856 20.3099 19.0167 20.5238L19.0069 20.5276C18.4487 20.7447 17.7908 20.9041 16.768 20.9509M3.06164 15.4919C3.0212 14.567 3.0125 14.0558 3.0125 11.5063C3.0125 8.95591 3.0212 8.44544 3.06167 7.52008M3.06164 15.4919L3.06167 7.52008M10.8155 15.5881C11.3515 15.8101 11.926 15.9244 12.5062 15.9244C13.678 15.9244 14.8018 15.4589 15.6304 14.6304C16.4589 13.8018 16.9244 12.678 16.9244 11.5063C16.9244 10.3345 16.4589 9.21072 15.6304 8.38215C14.8018 7.55359 13.678 7.0881 12.5062 7.0881C11.926 7.0881 11.3515 7.20238 10.8155 7.42442C10.2794 7.64645 9.79239 7.97189 9.38213 8.38215C8.97187 8.79242 8.64643 9.27947 8.42439 9.81551C8.20236 10.3515 8.08808 10.9261 8.08808 11.5063C8.08808 12.0865 8.20236 12.661 8.42439 13.197C8.64643 13.7331 8.97187 14.2201 9.38213 14.6304C9.79239 15.0406 10.2794 15.3661 10.8155 15.5881ZM9.37229 8.37231C10.2035 7.54113 11.3308 7.07418 12.5062 7.07418C13.6817 7.07418 14.809 7.54113 15.6402 8.37231C16.4714 9.20349 16.9383 10.3308 16.9383 11.5063C16.9383 12.6817 16.4714 13.809 15.6402 14.6402C14.809 15.4714 13.6817 15.9383 12.5062 15.9383C11.3308 15.9383 10.2035 15.4714 9.37229 14.6402C8.54111 13.809 8.07416 12.6817 8.07416 11.5063C8.07416 10.3308 8.54111 9.20349 9.37229 8.37231ZM19.434 6.04229C19.434 6.37873 19.3003 6.70139 19.0625 6.93929C18.8246 7.17719 18.5019 7.31084 18.1655 7.31084C17.829 7.31084 17.5064 7.17719 17.2685 6.93929C17.0306 6.70139 16.8969 6.37873 16.8969 6.04229C16.8969 5.70585 17.0306 5.38319 17.2685 5.1453C17.5064 4.9074 17.829 4.77375 18.1655 4.77375C18.5019 4.77375 18.8246 4.9074 19.0625 5.1453C19.3003 5.38319 19.434 5.70585 19.434 6.04229Z"
                    stroke="#666"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            </div>
            <div className="w-[105px] h-[30px] bg-[#fff] border shadow-md rounded-[20px] flex justify-center items-center text-[#666] font-semibold">
              Contacto
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-4 w-full">
        <div className="flex items-center ml-8">
          <h2 className="font-medium text-2xl">Entrenamientos</h2>
        </div>
        {grupos.length === 0 ? (
          <div>
            <p>No hay grupos de entranamientos</p>
          </div>
        ) : (
          <ul className="flex gap-2 flex-wrap justify-start px-4">
            {grupos.map((grupo) => (
              <div className="flex flex-col w-[170px] gap-1">
                <li
                  key={grupo._id}
                  className="bg-white w-[170px] h-[144px] rounded-[15px] shadow-md cursor-pointer justify-between p-2 border"
                  style={{
                    backgroundImage: `url(${groupImages[grupo._id]})`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                  onClick={() => router.push(`/grupos/${grupo._id}`)}
                >
                  <p className="w-[90px] h-[20px] bg-[#00000070] rounded-[20px] text-white font-medium flex justify-center items-center">
                    {grupo.tipo_grupo}
                  </p>{" "}
                </li>
                <div className="">
                  <p className="font-light text-sm">{grupo.nombre_grupo}</p>
                  <div className="text-[#ccc]">
                    <p className="font-extralight text-xs">{grupo.ubicacion}</p>
                    <p className="font-extralight text-xs">{grupo.horario}</p>
                  </div>
                </div>
              </div>
            ))}
          </ul>
        )}

        {/* {!esMiembro && (
          <button
            onClick={handleJoinAcademia}
            disabled={hasActiveRequest}
            className={`border w-[125px] h-[32px] rounded-[10px] self-center ${
              hasActiveRequest
                ? "border-gray-400 text-gray-400"
                : "border-[#FF9A3D] text-[#FF9A3D]"
            }`}
          >
            {hasActiveRequest ? "Solicitud enviada" : "Unirse"}
          </button>
        )} */}
        {/* <button onClick={handleEdit} className="btn-icon">
          ⚙️ {/* Ícono de tuerca }
        </button>*/}
      </div>
      <div className="w-[80%] border-b border-b-[#ccc] mt-5"></div>

      <div className="mt-3 flex flex-col w-full px-4">
        <p className="text-2xl mb-3 font-medium ml-6">Miembros</p>
        <div>
          <div className="h-[130px] w-[160px] p-2 bg-white border shadow-md rounded-[20px] flex flex-col justify-evenly">
            <div>
              <svg
              width="40px"
              height="40px"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
              stroke-width="3"
              stroke="#ccc"
              fill="none"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <circle cx="31.89" cy="22.71" r="5.57"></circle>
                <path d="M43.16,43.74A11.28,11.28,0,0,0,31.89,32.47h0A11.27,11.27,0,0,0,20.62,43.74Z"></path>
                <circle cx="48.46" cy="22.71" r="5.57"></circle>
                <path d="M46.87,43.74H59.73A11.27,11.27,0,0,0,48.46,32.47h0a11.24,11.24,0,0,0-5.29,1.32"></path>
                <circle cx="15.54" cy="22.71" r="5.57"></circle>
                <path d="M17.13,43.74H4.27A11.27,11.27,0,0,1,15.54,32.47h0a11.24,11.24,0,0,1,5.29,1.32"></path>
              </g>
            </svg>
            <p className="font-light text-[#ccc] text-sm">
              Miembros de la tribu
            </p>

            </div>
            
            <div className="flex items-center justify-end">
              <p className="text-[#ccc]">
                Ver
              </p>
              <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  height={25}
                  width={25}
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <rect width="10" height="10" fill="white"></rect>{" "}
                    <path
                      d="M9.5 7L14.5 12L9.5 17"
                      stroke="#ccc"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>{" "}
                  </g>
                </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-[80px] w-[100%] left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#FEFBF9] shadow-md h-[120px] border px-2  flex justify-around items-center">
          <div className="w-[50%] flex flex-col justify-center items-start gap-1 p-4">
            <p className="font-semibold underline text-xl">$19000</p>
            <p className="text-xs bg-[#EFEFEF] text-[#B8B8B8] h-[20px] w-[110px] rounded-[20px] flex justify-center items-center">1° clase gratis</p>
            
          </div>

          <div className="flex h-[60px] w-[50%] gap-3 justify-center items-center">
          
            {session?.user?.id === academia.dueño_id._id ? (
              // Si es el creador, mostrar botón editar
              <button
                
                className="bg-white h-[50px] w-[140px] shadow-md text-sm rounded-[20px] flex items-center justify-center border p-4 font-semibold"
              >
                Editar
              </button>
            ) : (
              // Si NO es el creador, mostrar botón unirse/salir
                 <button
                
                className="bg-[#C95100] h-[50px] w-[140px] shadow-md rounded-[20px] flex items-center justify-center border p-5 font-semibold text-white text-lg"
              >
                Participar
              </button>
            )}
          </div>
        </div>
      </div>


          
          
    







      <div className="pb-[230px]"></div>
    </div>
  );
}
