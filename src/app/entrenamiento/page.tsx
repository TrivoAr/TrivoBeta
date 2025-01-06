"use client"
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getProfileImage } from "@/app/api/profile/getProfileImage"; 

interface Entrenamiento {
  _id: string;
  fecha: string;
  estado: string;
  descripcion: string;
}

const EntrenamientoPage = () => {
  const { data: session, status } = useSession();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [profileImage, setProfileImage] = useState(String); 
  const router = useRouter();

  const getWeekStartDate = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const fetchEntrenamientos = async () => {
    try {
      // Limpia los entrenamientos antes de cargar los nuevos
      setEntrenamientos([]);
  
      if (session) {
        const weekStart = getWeekStartDate(currentWeek).toISOString().split("T")[0]; // Formato YYYY-MM-DD
        const response = await axios.get('/api/entrenamientos', {
          params: {
            user: session.user.id,
            weekStart: weekStart,
          },
        });
  
        // Asigna los nuevos entrenamientos al estado
        setEntrenamientos(response.data);
      }
    } catch (error) {
      console.error("Error al cargar los entrenamientos:", error);
      setEntrenamientos([]); // Asegúrate de limpiar si hay un error
    }
  };
  if (session?.user) {
        // Intentar obtener la imagen del perfil
        const loadProfileImage = async () => {
          try {
            const imageUrl = await getProfileImage("profile-image.jpg", session.user.id);
            setProfileImage(imageUrl);
          } catch (error) {
            console.error("Error al obtener la imagen del perfil:", error);
            // Puedes agregar una imagen predeterminada en caso de error
            setProfileImage("https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg");
          }
        };
  
        loadProfileImage();
      }
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`/api/entrenamientos/${id}`, { estado: newStatus });
      setEntrenamientos((prev) =>
        prev.map((entrenamiento) =>
          entrenamiento._id === id
            ? { ...entrenamiento, estado: newStatus }
            : entrenamiento
        )
      );
    } catch (error) {
      console.error("Error al actualizar el estado del entrenamiento:", error);
    }
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === "prev" ? -7 : 7));
    setCurrentWeek(newWeek);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/entrenamientos/${id}`);
  };

  // Aseguramos que siempre que la semana cambie, se obtengan los entrenamientos para esa semana
  useEffect(() => {
    fetchEntrenamientos();
  }, [currentWeek, session]);

  return (
    <div className="w-[390px]">
      <div className="relative">
        <div className="h-[224px] bg-slate-400 w-[390px]"></div>
        <div className="h-[80px] w-[80px] bg-slate-700 rounded-full absolute top-[185px] left-9">
        <img
          className="h-[75px] w-[75px] rounded-full ml-0.5"
          src={profileImage || "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"} // Usa la imagen del perfil
          alt="User Profile"
        />
        </div>
        <div className="flex flex-col w-[390px] items-center">
          <p className="font-bold text-xl">Entrenamiento</p>
          <p className="font-light text-sm text-slate-500">{session?.user?.fullname || "Usuario no identificado"}</p>
        </div>
      </div>

      <div className="mt-10 flex w-[390px] justify-center items-center">
        <button onClick={() => handleWeekChange("prev")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="#FA861F"
          >
            <path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" />
          </svg>
        </button>

        <div className="text-sm">
          Entrenamiento de la semana {getWeekStartDate(currentWeek).toLocaleDateString()}
        </div>

        <button onClick={() => handleWeekChange("next")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="#FA861F"
          >
            <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
          </svg>
        </button>
      </div>

      <div className="mt-5 w-[390px] flex flex-col justify-center items-center gap-3">
        {entrenamientos.map((entrenamiento) => (
          <div className="flex items-center gap-5" key={entrenamiento._id}>
            <button
              onClick={() => handleViewDetails(entrenamiento._id)}
              className="bg-[#FA861F] h-[40px] w-[290px] text-[#333] rounded-[10px] flex items-center justify-around shadow text-sm"
            >
              {entrenamiento.descripcion} {new Date(entrenamiento.fecha).toLocaleDateString()}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="#333"
              >
                <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
              </svg>
            </button>

            <div
              onClick={() => handleStatusChange(entrenamiento._id, entrenamiento.estado === "verde" ? "rojo" : "verde")}
              className={`rounded-full h-[15px] w-[15px] bg-${entrenamiento.estado === "verde" ? "[#78A55A]" : entrenamiento.estado === "rojo" ? "[#FF3E3E]" : "[#A0AEC0]"}`}
            ></div>
          </div>
        ))}
      </div>

      <div className="flex w-[390px] flex-col items-center mt-10">
        <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 0 24 24" width="50px" fill="#333">
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
        </svg>
        <p className="text-sm">Agregar entrenamiento</p>
      </div>
    </div>
  );
};

export default EntrenamientoPage;
