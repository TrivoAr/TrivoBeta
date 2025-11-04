"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import Link from "next/link";
import axios from "axios";
import {
  useLocationDetection,
  useSavedLocations,
} from "@/hooks/useGeolocation";

const TopContainer = ({ selectedLocalidad, setSelectedLocalidad }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [SolicitudesPendientes, setSolicitudesPendientes] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasInteractedWithModal, setHasInteractedWithModal] = useState(false);

  const {
    detectLocation,
    isLoading: locationLoading,
    error: locationError,
    data: locationData,
    isSuccess: locationSuccess,
    reset: resetLocation,
  } = useLocationDetection();

  const { data: savedLocations } = useSavedLocations();

  const handleLocationRequest = () => {
    setShowLocationModal(true);
  };

  const confirmLocationRequest = () => {
    setShowLocationModal(false);
    setHasInteractedWithModal(true);
    localStorage.setItem("trivo_location_modal_interacted", "true");
    resetLocation(); // Limpiar estado anterior
    detectLocation(); // Activar detección
  };

  const dismissLocationModal = () => {
    setShowLocationModal(false);
    setHasInteractedWithModal(true);
    localStorage.setItem("trivo_location_modal_interacted", "true");
  };

  // Cargar estado persistido al montar
  useEffect(() => {
    const hasInteracted =
      localStorage.getItem("trivo_location_modal_interacted") === "true";
    setHasInteractedWithModal(hasInteracted);

    // Cargar ubicación guardada si existe
    const savedLocation = localStorage.getItem("trivo_detected_location");
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
        localStorage.setItem("trivo_detected_location", detectedCity);
      }

      // Guardar en savedLocations si no está
      if (
        detectedCity !== "Desconocido" &&
        savedLocations &&
        !savedLocations.some((loc) => loc.city === detectedCity)
      ) {
        // Acá deberías llamar a tu API o método de persistencia
        axios.post("/api/locations", { city: detectedCity }).catch(() => {
          // Failed to save location
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

    window.addEventListener(
      "notificationMarkedAsRead",
      handleNotificationUpdate
    );

    return () => {
      window.removeEventListener(
        "notificationMarkedAsRead",
        handleNotificationUpdate
      );
    };
  }, [session]);

  // Función separada para cargar imagen de perfil
  const loadProfileImage = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      const imageUrl = await getProfileImage(
        "profile-image.jpg",
        session.user.id
      );
      if (imageUrl) {
        setProfileImage(imageUrl);
      } else {
        // Si no hay imagen de Firebase, usar la del session
        const fallbackImage = session.user.imagen || "/assets/logo/Trivo T.png";
        setProfileImage(fallbackImage);
      }
    } catch (error) {
      // Fallback: usar imagen del session o imagen por defecto
      const fallbackImage = session.user.imagen || "/assets/logo/Trivo T.png";
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
    <div className="containerTop bg-background h-[50px] w-full max-w-app mx-auto flex justify-between items-center mt-0">
      {/* Avatar */}

      {session?.user ? (
        <Link href="/dashboard/profile">
          <img
            className="h-[48px] w-[48px] rounded-[15px] object-cover shadow-md"
            src={
              profileImage ||
              session?.user?.imagen ||
              "/assets/logo/Trivo T.png"
            }
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

      <div className="flex flex-col items-center">
        {/* Estado de ubicación */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] text-gray-500">
            {locationSuccess && locationData
              ? "Ubicación detectada"
              : "Ubicación"}
          </span>
          {!locationSuccess && !locationLoading && (
            <button
              onClick={
                hasInteractedWithModal
                  ? confirmLocationRequest
                  : handleLocationRequest
              }
              className="text-[10px] text-[#C95100] underline hover:text-[#A04400]"
              title="Habilitar ubicación para mejores recomendaciones"
            >
              {hasInteractedWithModal ? "Activar" : "Detectar"}
            </button>
          )}
        </div>

        {/* Mostrar ubicación actual o opciones guardadas */}
        {locationData?.city ||
        (savedLocations && savedLocations.length > 0) ||
        localStorage.getItem("trivo_detected_location") ? (
          <select
            name="localidad"
            value={selectedLocalidad}
            onChange={(e) => setSelectedLocalidad(e.target.value)}
            className="w-auto px-2 py-1 rounded-[15px] focus:outline-none bg-background text-center text-[12px] border border-gray-200"
          >
            {/* Ciudad detectada automáticamente */}
            {locationData?.city && (
              <option value={locationData.city}>{locationData.city}</option>
            )}

            {/* Ubicación guardada en localStorage (si no está en locationData) */}
            {!locationData?.city &&
              localStorage.getItem("trivo_detected_location") && (
                <option value={localStorage.getItem("trivo_detected_location")}>
                  {localStorage.getItem("trivo_detected_location")}
                </option>
              )}

            {/* Ciudades guardadas del usuario */}
            {savedLocations &&
              savedLocations.length > 0 &&
              savedLocations.map((loc, index) => (
                <option key={index} value={loc.city}>
                  {loc.city}
                </option>
              ))}
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
        <div className="h-[48px] w-[48px] bg-card border rounded-[15px] shadow-md flex justify-center items-center">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-app-sm mx-auto shadow-lg">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8 text-[#C95100] dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Activar ubicación
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Para usar Trivo necesitas permitir el acceso a tu ubicación
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C95100] dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong className="text-gray-900 dark:text-white">Actividades cercanas:</strong> Encuentra eventos y
                  lugares cerca de ti
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C95100] dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong className="text-gray-900 dark:text-white">Recomendaciones precisas:</strong> Contenido relevante
                  para tu zona
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C95100] dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong className="text-gray-900 dark:text-white">Una sola vez:</strong> Se guarda automáticamente para
                  futuros usos
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-center">
              Tu ubicación es privada y solo se usa para mejorar tu experiencia
              en la app
            </p>

            <div className="flex gap-3">
              <button
                onClick={dismissLocationModal}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-[20px] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Más tarde
              </button>
              <button
                onClick={confirmLocationRequest}
                className="flex-1 py-2 px-4 bg-[#C95100] text-white rounded-[20px] hover:bg-[#A04400] dark:bg-orange-600 dark:hover:bg-orange-700 transition-colors"
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
