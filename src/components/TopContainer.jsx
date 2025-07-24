"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import Link from "next/link";
import axios from "axios";

const TopContainer = ({ selectedLocalidad, setSelectedLocalidad }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const horaActual = new Date().getHours();
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [SolicitudesPendientes, setSolicitudesPendientes] = useState(false); // estado solicitudes pendientes

  console.log("datos", session?.user?.imagen);

  // Obtener solicitudes
  useEffect(() => {
    if (session?.user) {
      // Verificar las solicitudes del usuario cuando el componente se monta
      const fetchSolicitudes = async () => {
        try {
          const response = await axios.get("/api/academias/solicitudes");
          const solicitudesData = response.data;
          // Establecer si hay solicitudes pendientes
          setSolicitudesPendientes(
            solicitudesData.some(
              (solicitud) => solicitud.estado === "pendiente"
            )
          );
        } catch (error) {
          console.error("Error al cargar las solicitudes", error);
        }
      };

      fetchSolicitudes();

      // Intentar obtener la imagen del perfil
      const loadProfileImage = async () => {
        try {
          const imageUrl = await getProfileImage(
            "profile-image.jpg",
            session.user.id
          );
          setProfileImage(imageUrl);
        } catch (error) {
          console.error("Error al obtener la imagen del perfil:", error);
          // Puedes agregar una imagen predeterminada en caso de error
          setProfileImage(session.user.imagen
          );
        }
      };

      loadProfileImage();
    }
  }, [session]);

  let saludo;
  if (horaActual >= 6 && horaActual < 12) {
    saludo = "Buen día";
  } else if (horaActual >= 12 && horaActual < 20) {
    saludo = "Buenas tardes";
  } else {
    saludo = "Buenas noches";
  }

  if (status === "loading") {
    return <p>Cargando...</p>;
  }

  const handleNotificationClick = () => {
    if (session?.user?.role === "dueño de academia") {
      router.push("/academias/solicitudes");
    } else {
      // Puedes manejar otros casos aquí si es necesario
      router.push("/social/crear");
    }
  };

  return (
    <div className="containerTop  bg-[#FEFBF9] h-[50px] w-[100%] max-w-[390px] flex justify-between items-center">
      {/* Avatar */}
      <Link href="/dashboard/profile">
        <img
          className="h-[48px] w-[48px] rounded-[15px] object-cover shadow-md"
          src={
            profileImage || session.user.imagen
          }
          alt="User Profile"
        />
      </Link>

      {/* Ubicación */}
      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-gray-500 text-[12px]">Ubicación</p>
        <div className="flex items-center text-[14px] font-medium text-black">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#f97316"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            className="mr-1"
          >
            <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
          </svg>
          <select
            name="localidad"
            value={selectedLocalidad}
            onChange={(e) => setSelectedLocalidad(e.target.value)}
            className="w-auto p-auto rounded-[15px] focus:outline-none bg-[#FEFBF9] text-center"
          >
            <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
            <option value="Yerba Buena" className="w-auto">
              Yerba Buena
            </option>
            <option value="Tafi Viejo">Tafi Viejo</option>
            <option value="Otros">Otros</option>
          </select>
          {/* San Miguel de Tucumán
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="ml-1 w-4 h-4"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg> */}
        </div>
      </div>

      {/* Notificación */}
      <div
        className="relative cursor-pointer"
        onClick={handleNotificationClick}
      >
        <div className="h-[48px] w-[48px] bg-white border rounded-[15px] shadow-md flex justify-center items-center">
          <img
            className="h-[26px] w-[26px] color-black"
            src="/assets/icons/Notification.svg"
            alt=""
          />
        </div>
        {SolicitudesPendientes && (
          <span className="absolute top-0 right-0 h-[10px] w-[10px] bg-red-600 rounded-full border-2 border-white" />
        )}
      </div>
    </div>
  );
};

export default TopContainer;
