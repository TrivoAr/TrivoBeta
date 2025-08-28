"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import Link from "next/link";
import axios from "axios";
import { set } from "mongoose";

const TopContainer = ({ selectedLocalidad, setSelectedLocalidad }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const horaActual = new Date().getHours();
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [SolicitudesPendientes, setSolicitudesPendientes] = useState(false); // estado solicitudes pendientes

  console.log("datos", session?.user?.imagen);

useEffect(() => {
  if (!session?.user) return;

  const fetchData = async () => {
    try {
      // Hacer ambas llamadas en paralelo
      const [notificacionesRes, solicitudesRes] = await Promise.all([
        axios.get("/api/notificaciones"),
        axios.get("/api/academias/solicitudes"),
      ]);

      const notificaciones = notificacionesRes.data || [];
      const solicitudes = solicitudesRes.data || [];

      const noLeidas = notificaciones.filter((n) => !n.read);
      const pendientes = solicitudes.filter((s) => s.estado === "pendiente");

      setSolicitudesPendientes(pendientes.length > 0);

      // Sumar ambas cantidades de forma unificada
      setUnreadCount(noLeidas.length + pendientes.length);
    } catch (error) {
      console.error("Error al cargar notificaciones o solicitudes", error);
    }
  };

  fetchData();

  const loadProfileImage = async () => {
    try {
      const imageUrl = await getProfileImage("profile-image.jpg", session.user.id);
      setProfileImage(imageUrl);
    } catch (error) {
      setProfileImage(session.user.imagen);
    }
  };

  loadProfileImage();
}, [session]);


  if (status === "loading") {
    return <p>Cargando...</p>;
  }

  const handleNotificationClick = () => {
    router.push("/notificaciones");
  };

  console.log("imageb", session?.user);

  return (
    <div className="containerTop  bg-[#FEFBF9] h-[50px] w-[100%] max-w-[390px] flex justify-between items-center">
      {/* Avatar */}
      <Link href="/dashboard/profile">


      {session?.user ? ( <img
          className="h-[48px] w-[48px] rounded-[15px] object-cover shadow-md"
          src={profileImage || session?.user?.imagen}
          alt="User Profile"
        />):(<div
          className="h-[48px] w-[48px] rounded-[15px] object-cover shadow-md"
           style={{
            backgroundImage: `url("/assets/logo/Trivo T.png")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />)}
       
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
        {(SolicitudesPendientes || unreadCount > 0) && (
          <span className="absolute top-3 right-2 bg-red-600 text-white text-[10px] min-w-[19px] h-[19px] flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default TopContainer;
