"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

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
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
};

export default function AcademiaDetailPage({ params }: { params: { id: string } }) {
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveRequest, setHasActiveRequest] = useState(false); // Estado para solicitudes activas
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/academias/${params.id}`);
        setAcademia(response.data.academia);
        setGrupos(response.data.grupos);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
        setError("Hubo un problema al cargar los datos de la academia.");
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
    

    fetchData();
    checkActiveRequest(); // Verificar solicitud activa
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
    <div className="flex flex-col items-center">
      <Toaster position="top-center" />
      <div className="coverAcademias w-[390px] h-[190px]"></div>

      <div className="flex justify-center gap-5">
        <div className="logo h-[120px] w-[120px] bg-slate-400 rounded-[50%] relative bottom-[60px] border border-[#333]">
          <img
            src="https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"
            className="rounded-full"
            alt="Logo"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{academia.nombre_academia}</h1>
          <p className="text-sm text-[#333]">San Miguel de Tucumán</p>
          <p className="text-sm text-[#a4a4a4]">
            0/50 <span className="text-[#333]">Miembros</span>
          </p>
        </div>
      </div>

      <div className="flex w-[338px] justify-around">
        <button className="w-[80px] h-[20px] border border-[#FA861F] text-[#FA861F] rounded-[40px] flex justify-center items-center text-sm">
          Info
        </button>
        <button className="w-[80px] h-[20px] border border-[#FA861F] text-[#FA861F] rounded-[40px] flex justify-center items-center text-sm">
          Galeria
        </button>
        <button
          onClick={() => router.push(`/academias/${params.id}/miembros`)}
          className="w-[80px] h-[20px] border border-[#FA861F] text-[#FA861F] rounded-[40px] flex justify-center items-center text-sm"
        >
          Miembros
        </button>
      </div>

      <div className="flex flex-col gap-5 mt-5">
        <h2 className="font-bold text-xl">Grupos de entrenamiento</h2>

        {grupos.length === 0 ? (
          <div>
            <p>No hay grupos disponibles para esta academia.</p>
            <button
              onClick={() => router.push(`/grupos`)}
              className="border border-[#FF9A3D] w-[125px] h-[32px] rounded-[10px] text-[#FF9A3D] self-center"
            >
              Crear grupo
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-5 justify-center">
            {grupos.map((grupo) => (
              <li
                key={grupo._id}
                className="gruposCard w-[338px] h-[110px] rounded-[10px] shadow cursor-pointer flex flex-col justify-between p-2"
                onClick={() => router.push(`/grupos/${grupo._id}`)}
              >
                <p className="text-[10px] text-[#f4f4f4] font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="#f4f4f4">
                    <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm40 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-280Z" />
                  </svg>
                  {grupo.horario} hs
                </p>
                <p className="text-[#F4F4F4] font-bold text-2xl flex items-center justify-between w-full">
                  {grupo.nombre_grupo}{" "}
                  <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#F4F4F4">
                    <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
                  </svg>
                </p>
                <p className="text-[10px] text-[#f4f4f4] font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#f4f4f4">
                    <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                  </svg>
                  {grupo.ubicacion}
                </p>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleJoinAcademia}
          disabled={hasActiveRequest} // Deshabilitar si hay solicitud activa
          className={`border w-[125px] h-[32px] rounded-[10px] self-center ${
            hasActiveRequest
              ? "border-gray-400 text-gray-400"
              : "border-[#FF9A3D] text-[#FF9A3D]"
          }`}
        >
          {hasActiveRequest ? " Solicitud enviada " : "Unirse"}
        </button>
        <button onClick={handleEdit} className="btn-icon">
          ⚙️ {/* Ícono de tuerca */}
        </button>
      </div>
    </div>
  );
}
