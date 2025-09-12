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
  const [showLocationModal, setShowLocationModal] = useState(false); // modal de explicación GPS
  const [hasInteractedWithModal, setHasInteractedWithModal] = useState(false); // si ya interactuó con el modal

 
  const { 
    detectLocation, 
    isLoading: locationLoading, 
    error: locationError, 
    data: locationData,
    isSuccess: locationSuccess,
    reset: resetLocation 
  } = useLocationDetection();

  const { data: savedLocations } = useSavedLocations();


  const handleLocationRequest = () => {
    setShowLocationModal(true);
  };

  const confirmLocationRequest = () => {
    setShowLocationModal(false);
    setHasInteractedWithModal(true);
    localStorage.setItem('trivo_location_modal_interacted', 'true');
    resetLocation(); // Limpiar estado anterior
    detectLocation(); // Activar detección
  };

  const dismissLocationModal = () => {
    setShowLocationModal(false);
    setHasInteractedWithModal(true);
    localStorage.setItem('trivo_location_modal_interacted', 'true');
  };

  // Cargar estado persistido al montar
  useEffect(() => {
    const hasInteracted = localStorage.getItem('trivo_location_modal_interacted') === 'true';
    setHasInteractedWithModal(hasInteracted);
    
    // Cargar ubicación guardada si existe
    const savedLocation = localStorage.getItem('trivo_detected_location');
    if (savedLocation && setSelectedLocalidad) {
      setSelectedLocalidad(savedLocation);
    }
  }, [setSelectedLocalidad]);

  
useEffect(() => {
  if (locationSuccess && locationData && setSelectedLocalidad) {
    const detectedCity = locationData.city || "Desconocido";
    setSelectedLocalidad(detectedCity);
    
    // Guardar ubicación detectada en localStorage
    if (detectedCity !== "Desconocido") {
      localStorage.setItem('trivo_detected_location', detectedCity);
    }

    // Guardar en savedLocations si no está
    if (
      detectedCity !== "Desconocido" &&
      savedLocations &&
      !savedLocations.some((loc) => loc.city === detectedCity)
    ) {
      // Acá deberías llamar a tu API o método de persistencia
      axios.post("/api/locations", { city: detectedCity }).catch(() => {
        console.log("No se pudo guardar la ubicación detectada");
      });
    }
  }
}, [locationSuccess, locationData, setSelectedLocalidad, savedLocations]);



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
      


      {session?.user ? (
        <Link href="/dashboard/profile">
        <img
          className="h-[48px] w-[48px] rounded-[15px] object-cover shadow-md"
          src={profileImage || session?.user?.imagen || "/assets/logo/Trivo T.png"}
          alt="User Profile"
          onError={(e) => {
            e.target.src = "/assets/logo/Trivo T.png";
          }}
        />
        </Link>
        
      ) : (
        <Link href="/login">
        <div
          className="h-[48px] w-[48px] rounded-[15px] shadow-md"
          style={{
            backgroundImage: `url("/assets/logo/Trivo T.png")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
        </Link>
      )}
       
      

      {/* Ubicación */}
      {/* <div className="flex flex-col items-center justify-center text-center">
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
              
              {savedLocations && savedLocations.map((loc, index) => (
                <option key={index} value={loc.city}>{loc.city}</option>
              ))}
            </select>
          )} */}
          
          {/* {locationError && (
            <span className="text-[10px] text-red-500 ml-1" title={locationError.message}>❌</span>
          )}
        </div>
      </div> */}

      <div className="flex flex-col items-center">
        {/* Estado de ubicación */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] text-gray-500">
            {locationSuccess && locationData ? 'Ubicación detectada' : 'Ubicación'}
          </span>
          {!locationSuccess && !locationLoading && (
            <button
              onClick={hasInteractedWithModal ? confirmLocationRequest : handleLocationRequest}
              className="text-[10px] text-[#C95100] underline hover:text-[#A04400]"
              title="Habilitar ubicación para mejores recomendaciones"
            >
              {hasInteractedWithModal ? 'Activar' : 'Detectar'}
            </button>
          )}
        </div>

        {/* Mostrar ubicación actual o opciones guardadas */}
        {(locationData?.city || (savedLocations && savedLocations.length > 0) || localStorage.getItem('trivo_detected_location')) ? (
          <select
            name="localidad"
            value={selectedLocalidad}
            onChange={(e) => setSelectedLocalidad(e.target.value)}
            className="w-auto px-2 py-1 rounded-[15px] focus:outline-none bg-[#FEFBF9] text-center text-[12px] border border-gray-200"
          >
            {/* Ciudad detectada automáticamente */}
            {locationData?.city && (
              <option value={locationData.city}>{locationData.city}</option>
            )}

            {/* Ubicación guardada en localStorage (si no está en locationData) */}
            {!locationData?.city && localStorage.getItem('trivo_detected_location') && (
              <option value={localStorage.getItem('trivo_detected_location')}>
                {localStorage.getItem('trivo_detected_location')}
              </option>
            )}

            {/* Ciudades guardadas del usuario */}
            {savedLocations && savedLocations.length > 0 && 
              savedLocations.map((loc, index) => (
                <option key={index} value={loc.city}>
                  {loc.city}
                </option>
              ))
            }
          </select>
        ) : (
          <span className="text-[12px] text-gray-400 px-2 py-1">
            Sin ubicación
          </span>
        )}

        {/* Loading indicator */}
        {locationLoading && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] text-gray-500">Detectando...</span>
          </div>
        )}
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

      {/* Modal de explicación GPS */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-auto shadow-lg">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-[#C95100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Activar ubicación
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Para usar Trivo necesitas permitir el acceso a tu ubicación
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C95100] rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">
                  <strong>Actividades cercanas:</strong> Encuentra eventos y lugares cerca de ti
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C95100] rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">
                  <strong>Recomendaciones precisas:</strong> Contenido relevante para tu zona
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C95100] rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">
                  <strong>Una sola vez:</strong> Se guarda automáticamente para futuros usos
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-6 text-center">
              Tu ubicación es privada y solo se usa para mejorar tu experiencia en la app
            </p>

            <div className="flex gap-3">
              <button
                onClick={dismissLocationModal}
                className="flex-1 py-2 px-4 border rounded-[20px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Más tarde
              </button>
              <button
                onClick={confirmLocationRequest}
                className="flex-1 py-2 px-4 bg-[#C95100] text-white rounded-[20px] hover:bg-[#A04400] transition-colors"
              >
                Activar GPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopContainer;
