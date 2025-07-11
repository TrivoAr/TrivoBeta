"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage"; 
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
};

type Academia = {
  _id: string;
  dueño_id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
  localidad: string;
};

export default function AcademiaDetailPage({ params }: { params: { id: string } }) {
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
    rol: session?.user.role || ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/academias/${params.id}`);
        setAcademia(response.data.academia);
        setGrupos(response.data.grupos);
        localStorage.setItem("academia_id", params.id);
        localStorage.setItem("dueño_id", response.data.academia.dueño_id);
        // Intentar obtener la imagen del perfil
      const loadProfileImage = async () => {
        try {
          const imageUrl = await getAcademyImage("profile-image.jpg", params.id );
          setProfileImage(imageUrl);
        } catch (error) {
          console.error("Error al obtener la imagen del perfil:", error);
          // Puedes agregar una imagen predeterminada en caso de error
          setProfileImage("https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg");
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
        const miembrosResponse = await axios.get(`/api/academias/${params.id}/miembros`);
        const miembrosData = miembrosResponse.data.miembros;
    
        // Verifica si el usuario está en la lista y su estado es "aceptado"
        const usuarioEsMiembro = miembrosData.some(
          (miembro: any) => miembro.user_id._id === session.user.id && miembro.estado === "aceptado"
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

    toast.promise(
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
        if (err.response?.status === 400 && err.response.data.message.includes("solicitud activa")) {
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
      <div className="relative w-full h-[190px] bg-black opacity-80" style={{backgroundImage: `linear-gradient(
        0deg,
        rgba(0,0,0,0.2),
        rgba(0,0,0,0.2)
      ), url(${profileImage})`, backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center', }} >
            <button
     type="button"
     onClick={() => router.back()}
     className=" absolute top-2 left-2 text-white p-2 rounded-full shadow-md bg-white">
    <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="orange"
    viewBox="0 0 16 16"
    width="24"
    height="24">
    <path
      fillRule="evenodd"
      d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
        />
    </svg>
</button>
{/* {formData.rol=== "dueño de academia" && (
      <button onClick={() => router.push(`/academias/${params.id}/editar`)} className="absolute top-2 right-2 z-50  p-1 rounded-full shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512"
      width="25px"
      height="25px">
      <path fill="#fcfcfc" d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
      </svg>
       </button>)} */}
      </div>
  


      <div className="flex w-full mt-2 px-3">
        {/* <div className="logo h-[120px] w-[120px] bg-slate-400 rounded-[50%] relative bottom-[60px] border border-[#333]">
          <img
            src={profileImage || "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"}
            className="rounded-full object-cover h-[120px] w-[120px]"
            alt="Logo"
          />
        </div> */}
        <div>
          <h1 className="text-3xl font-bold">{academia.nombre_academia}</h1>
          <p className="text-sm text-[#333]">{academia.localidad}</p>
        </div>
      </div> 

      <div className="flex w-[338px] justify-center gap-2 mt-4">
        <button
          onClick={() => router.push(`/academias/${params.id}/miembros`)}
          className="w-[95px] h-[30px] border rounded-[10px] flex justify-center items-center text-sm bg-white shadow-md text-slate-500"
        >
          Miembros
        </button>
            {academia.dueño_id === session?.user?.id && (<button
              onClick={() => router.push(`/grupos`)}
              className="w-[95px] h-[30px] border rounded-[10px] flex justify-center items-center text-sm bg-white shadow-md text-slate-500"
            > Crear Grupo
            </button>)}
             {academia.dueño_id === session?.user?.id && (<button
              onClick={() => router.push(`/academias/${params.id}/editar`)} 
              className="p-3 h-[30px] border rounded-[10px] flex justify-center items-center text-sm bg-white shadow-md text-slate-500"
            > Editar Academia
            </button>)}
      </div>

    <div className="flex flex-col gap-5 mt-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">Grupos de entrenamiento</h2>
      </div>
        {grupos.length === 0 ? (
          <div>
            <p>No hay grupos disponibles para esta academia.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-5 justify-center">
            {grupos.map((grupo) => (
              <li
                key={grupo._id}
                className="bg-white w-[338px] h-[110px] rounded-[10px] shadow-md cursor-pointer flex flex-col justify-between p-2"
                onClick={() => router.push(`/grupos/${grupo._id}`)}
              >
                <p className="text-[10px] text-orange-500 font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="#F97316">
                    <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm40 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-280Z" />
                  </svg>
                  {grupo.horario} hs
                </p>
                <p className="text-orange-500 font-bold text-2xl flex items-center justify-between w-full">
                  {grupo.nombre_grupo}{" "}
                  <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#F97316">
                    <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
                  </svg>
                </p>
                <p className="text-[10px] text-[#F97316] font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#F97316">
                    <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                  </svg>
                  {grupo.ubicacion}
                </p>
              </li>
            ))}
          </ul>
        )}
       {!esMiembro && (
  <button
    onClick={handleJoinAcademia}
    disabled={hasActiveRequest}
    className={`border w-[125px] h-[32px] rounded-[10px] self-center ${
      hasActiveRequest ? "border-gray-400 text-gray-400" : "border-[#FF9A3D] text-[#FF9A3D]"
    }`}
  >
    {hasActiveRequest ? "Solicitud enviada" : "Unirse"}
  </button>
)}
       {/* <button onClick={handleEdit} className="btn-icon">
          ⚙️ {/* Ícono de tuerca }
        </button>*/}
      </div>
    </div>
  );
}
