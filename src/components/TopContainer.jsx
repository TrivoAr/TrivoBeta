"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import Link from "next/link";
import axios from "axios";
import { set } from "mongoose";
import { useLocationDetection, useSavedLocations } from "@/hooks/useGeolocation";

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

  // TanStack Query hooks para geolocalización
  const { 
    detectLocation, 
    isLoading: locationLoading, 
    error: locationError, 
    data: locationData,
    isSuccess: locationSuccess,
    reset: resetLocation 
  } = useLocationDetection();

  const { data: savedLocations } = useSavedLocations();

  // Función para obtener la ubicación del usuario usando TanStack Query
  const getCurrentLocation = () => {
    resetLocation(); // Limpiar estado anterior
    detectLocation(); // Activar detección
  };

  // Efecto para actualizar el select cuando se detecta ubicación
  useEffect(() => {
    if (locationSuccess && locationData && setSelectedLocalidad) {
      const city = locationData.city;
      const knownCities = ["San Miguel de Tucuman", "Yerba Buena", "Tafi Viejo"];
      
      const foundCity = knownCities.find(cityName => 
        city.toLowerCase().includes(cityName.toLowerCase().split(" ")[0])
      );
      
      if (foundCity) {
        setSelectedLocalidad(foundCity);
      } else {
        setSelectedLocalidad("Otros");
      }
    }
  }, [locationSuccess, locationData, setSelectedLocalidad]);

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
      // Silently handle notification/request loading errors
    }
  };

  fetchData();

  // Listener para cuando se marca una notificación como leída
  const handleNotificationUpdate = () => {
    fetchData();
  };

  window.addEventListener('notificationMarkedAsRead', handleNotificationUpdate);
  
  return () => {
    window.removeEventListener('notificationMarkedAsRead', handleNotificationUpdate);
  };
}, [session]);

// Función separada para cargar imagen de perfil
const loadProfileImage = useCallback(async () => {
  if (!session?.user?.id) {
    console.log("No session or user ID available");
    return;
  }
  
  console.log("Loading profile image for user:", session.user.id);
  console.log("Session user imagen:", session.user.imagen);
  
  try {
    const imageUrl = await getProfileImage("profile-image.jpg", session.user.id);
    console.log("Firebase image URL:", imageUrl);
    if (imageUrl) {
      setProfileImage(imageUrl);
    } else {
      // Si no hay imagen de Firebase, usar la del session
      const fallbackImage = session.user.imagen || "/assets/logo/Trivo T.png";
      console.log("Using fallback image:", fallbackImage);
      setProfileImage(fallbackImage);
    }
  } catch (error) {
    console.log("Error cargando imagen de perfil:", error);
    // Fallback: usar imagen del session o imagen por defecto
    const fallbackImage = session.user.imagen || "/assets/logo/Trivo T.png";
    console.log("Using fallback after error:", fallbackImage);
    setProfileImage(fallbackImage);
  }
}, [session]);

// useEffect separado para cargar imagen de perfil
useEffect(() => {
  if (session?.user) {
    loadProfileImage();
  }
}, [session, loadProfileImage]);


  if (status === "loading") {
    return <p>Cargando...</p>;
  }

  const handleNotificationClick = () => {
    router.push("/notificaciones");
  };


  return (
    <div className="containerTop  bg-[#FEFBF9] h-[50px] w-[100%] max-w-[390px] flex justify-between items-center mt-0">
      {/* Avatar */}
      <Link href="/dashboard/profile">


      {session?.user ? (
        <img
          className="h-[48px] w-[48px] rounded-[15px] object-cover shadow-md"
          src={profileImage || session?.user?.imagen || "/assets/logo/Trivo T.png"}
          alt="User Profile"
          onError={(e) => {
            // Si falla cargar la imagen, usar imagen por defecto
            e.target.src = "/assets/logo/Trivo T.png";
          }}
        />
      ) : (
        <div
          className="h-[48px] w-[48px] rounded-[15px] shadow-md"
          style={{
            backgroundImage: `url("/assets/logo/Trivo T.png")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
      )}
       
      </Link>

      {/* Ubicación */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-1 mb-1">
          <p className="text-gray-500 text-[12px]">Ubicación</p>
          <button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Detectar mi ubicación"
          >
            {locationLoading ? (
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (null
            )}
          </button>
        </div>
        
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
          
          {locationSuccess && locationData ? (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-green-600 mb-1">📍 Detectado</span>
              <select
                name="localidad"
                value={selectedLocalidad}
                onChange={(e) => setSelectedLocalidad(e.target.value)}
                className="w-auto p-auto rounded-[15px] focus:outline-none bg-[#FEFBF9] text-center text-[12px]"
              >
                <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
                <option value="Yerba Buena">Yerba Buena</option>
                <option value="Tafi Viejo">Tafi Viejo</option>
                <option value="Otros">Otros</option>
                {locationData.city && !["San Miguel de Tucuman", "Yerba Buena", "Tafi Viejo", "Otros"].includes(locationData.city) && (
                  <option value={locationData.city}>{locationData.city}</option>
                )}
              </select>
            </div>
          ) : (
            <select
              name="localidad"
              value={selectedLocalidad}
              onChange={(e) => setSelectedLocalidad(e.target.value)}
              className="w-auto p-auto rounded-[15px] focus:outline-none bg-[#FEFBF9] text-center"
            >
              <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
              <option value="Yerba Buena">Yerba Buena</option>
              <option value="Tafi Viejo">Tafi Viejo</option>
              <option value="Otros">Otros</option>
              {/* Mostrar ubicaciones guardadas si las hay */}
              {savedLocations && savedLocations.map((loc, index) => (
                <option key={index} value={loc.city}>{loc.city}</option>
              ))}
            </select>
          )}
          
          {locationError && (
            <span className="text-[10px] text-red-500 ml-1" title={locationError.message}>❌</span>
          )}
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
