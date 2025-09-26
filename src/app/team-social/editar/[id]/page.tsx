"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { PATCH } from "@/app/api/grupos/route";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import debounce from "lodash.debounce";
import {
  useProvinces,
  useLocalitiesByProvince,
  useLocationFromCoords,
} from "@/hooks/useArgentinaLocations";
import { useBares } from "@/hooks/useBares";
import { useSponsors } from "@/hooks/useSponsors";

interface LatLng {
  lat: number;
  lng: number;
}

export default function EditarTeamSalida({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [markerPos, setMarkerPos] = useState<LatLng>({ lat: 0, lng: 0 });
  const defaultCoords = { lat: -26.8333, lng: -65.2167 };
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para ubicación
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedLocality, setSelectedLocality] = useState("");

  // Estados para selecciones
  const [selectedBar, setSelectedBar] = useState<string>("");
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);

  // Hooks para datos
  const { data: provinces } = useProvinces();
  const { data: localities } = useLocalitiesByProvince(selectedProvince);
  const locationFromCoordsQuery = useLocationFromCoords();
  const { data: bares, isLoading: loadingBares } = useBares();
  const { data: sponsorsResponse, isLoading: loadingSponsors } = useSponsors();

  // Extraer array de sponsors de la respuesta
  const sponsors = sponsorsResponse?.data || [];

  const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
  });

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    deporte: "",
    fecha: "",
    precio: "",
    hora: "",
    duracion: "",
    ubicacion: "",
    imagen: "",
    localidad: "",
    provincia: "",
    dificultad: "",
    whatsappLink: "",
    telefonoOrganizador: "",
    cupo: 0,
    alias: "",
    cbu: "",
    locationCoords: { lat: 0, lng: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/team-social/${params.id}`);
        const data = await res.json();

        setFormData({
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          deporte: data.deporte || "",
          fecha: data.fecha || "",
          precio: data.precio || "",
          hora: data.hora || "",
          duracion: data.duracion || "",
          ubicacion: data.ubicacion || "",
          imagen: data.imagen || "",
          localidad: data.localidad || "",
          provincia: data.provincia || "",
          dificultad: data.dificultad || "",
          whatsappLink: data.whatsappLink || "",
          telefonoOrganizador: data.telefonoOrganizador || "",
          cupo: data.cupo || 0,
          alias: data.alias || "",
          cbu: data.cbu || "",
          locationCoords: data.locationCoords || { lat: 0, lng: 0 },
        });

        // Poblar selecciones existentes
        if (data.bar) {
          setSelectedBar(data.bar._id || data.bar);
        }
        if (data.sponsors && data.sponsors.length > 0) {
          setSelectedSponsors(data.sponsors.map((s: any) => s._id || s));
        }

        // Poblar provincia y localidad si existen
        if (data.provincia && provinces) {
          const province = provinces.find((p) => p.name === data.provincia);
          if (province) {
            setSelectedProvince(province.id);
          }
        }
        if (data.localidad) {
          setSelectedLocality(data.localidad);
        }

        if (data.locationCoords) {
          setMarkerPos(data.locationCoords);
        } else {
          setMarkerPos(defaultCoords);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };

    fetchData();
  }, [params.id, provinces]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    // const { name, value } = e.target;
    // setFormData((prevData) => ({ ...prevData, [name]: value }));
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    if (name === "ubicacion") {
      // Debounce
      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        fetchSuggestions(value);
      }, 500);
      setTypingTimeout(timeout);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(formData.ubicacion)}`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error buscando sugerencias:", err);
    }
  };

  //   const handleCoordsChange = (coords: LatLng) => {
  //   setMarkerPos(coords);
  //   setFormData((prev) => ({
  //     ...prev,
  //     lat: coords.lat,
  //     lng: coords.lng,
  //     locationCoords: coords,
  //   }));
  // };

  const handleCoordsChange = async (coords: LatLng) => {
    setMarkerPos(coords);

    const direccion = await fetchAddressFromCoords(coords.lat, coords.lng);

    setFormData((prev) => ({
      ...prev,
      ubicacion: direccion || prev.ubicacion,
      lat: coords.lat,
      lng: coords.lng,
      locationCoords: coords,
    }));
  };

  const handleSuggestionClick = (suggestion: any) => {
    const coords = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };
    setFormData((prev) => ({
      ...prev,
      ubicacion: suggestion.display_name,
      lat: coords.lat,
      lng: coords.lng,
    }));
    setMarkerPos(coords); // 👈 Esto hace que el mapa se actualice
    setSuggestions([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prevData) => ({
          ...prevData,
          imagen: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para manejar selección múltiple de sponsors
  const handleSponsorToggle = (sponsorId: string) => {
    setSelectedSponsors((prev) =>
      prev.includes(sponsorId)
        ? prev.filter((id) => id !== sponsorId)
        : [...prev, sponsorId]
    );
  };

  // Función para detectar ubicación por GPS
  const detectLocationFromGPS = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalización no soportada en este dispositivo");
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      toast.error("GPS requiere conexión segura (HTTPS)");
      return;
    }

    setLocationDetecting(true);

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const message = isMobile
      ? "📱 Presiona 'Permitir' cuando aparezca la solicitud de ubicación"
      : "🌍 Buscando ubicación... Acepta los permisos cuando aparezcan";

    toast.loading(message, {
      duration: 6000,
      id: "gps-search",
    });

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "denied") {
          setLocationDetecting(false);
          toast.dismiss("gps-search");
          toast.error(
            "🚫 Ubicación bloqueada. Permite el acceso en configuración del navegador y recarga la página",
            { duration: 8000 }
          );
          return;
        }
      }
    } catch (e) {
      // Ignorar errores de permissions API
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          const locationData =
            await locationFromCoordsQuery.mutateAsync(coords);

          const province = provinces?.find(
            (p) => p.name.toLowerCase() === locationData.province?.toLowerCase()
          );

          if (province) {
            setSelectedProvince(province.id);
            setFormData((prev) => ({
              ...prev,
              provincia: province.name,
            }));

            if (locationData.locality) {
              setSelectedLocality(locationData.locality);
              setFormData((prev) => ({
                ...prev,
                localidad: locationData.locality,
              }));
            }
          }

          setMarkerPos(coords);
          setFormData((prev) => ({ ...prev, locationCoords: coords }));

          toast.dismiss("gps-search");
          toast.success(
            `📍 Ubicación detectada: ${locationData.province}, ${locationData.locality}`
          );
        } catch (error) {
          console.error("Error detectando ubicación:", error);
          toast.dismiss("gps-search");
          toast.error(
            "Error al detectar ubicación específica, pero coordenadas obtenidas"
          );

          setMarkerPos(coords);
          setFormData((prev) => ({ ...prev, locationCoords: coords }));
        }

        setLocationDetecting(false);
      },
      (error) => {
        setLocationDetecting(false);
        toast.dismiss("gps-search");

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("🚫 Permiso de ubicación denegado");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("📍 Ubicación no disponible");
            break;
          case error.TIMEOUT:
            toast.error("⏱️ Tiempo agotado buscando ubicación");
            break;
          default:
            toast.error("❌ Error desconocido obteniendo ubicación");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData = {
        ...formData,
        locationCoords: markerPos,
        bar: selectedBar || null,
        sponsors: selectedSponsors.length > 0 ? selectedSponsors : [],
      };

      await fetch(`/api/team-social/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      toast.success("Social team actualizado");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error actualizando:", error);
      toast.error("Error al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleDelete = async () => {
  //   const confirm = window.confirm(
  //     "¿Estás seguro que querés eliminar esta salida?"
  //   );
  //   if (!confirm) return;

  //   toast.loading("Borrando social team");
  //   await fetch(`/api/team-social/${params.id}`, { method: "DELETE" });
  //   router.push("/dashboard");
  // };

  const handleDelete = async () => {
    const confirm = window.confirm(
      "¿Estás seguro que querés eliminar esta salida?"
    );
    if (!confirm) return;

    const toastId = toast.loading("Borrando social team...");

    try {
      const response = await fetch(`/api/team-social/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la salida.");
      }

      toast.success("¡Salida eliminada con éxito!", { id: toastId });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error eliminando salida:", error);
      toast.error("Hubo un problema al eliminar la salida.", { id: toastId });
    }
  };

  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/search/reverse?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      return data.display_name as string;
    } catch (error) {
      console.error("Error al obtener dirección inversa:", error);
      return "";
    }
  };

  const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 500), []);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  // Cleanup para evitar memory leaks
  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  return (
    <div className="flex flex-col justify-center items-center bg-background">
      <Toaster position="top-center" />
      <button
        onClick={() => router.back()}
        className="text-[#C76C01] self-start bg-card shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center ml-5 mt-5"
      >
        <img
          src="/assets/icons/Collapse Arrow.svg"
          alt="callback"
          className="h-[20px] w-[20px]"
        />
      </button>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl h-[900px] p-8 mb-4"
      >
        <div className="mb-4 flex justify-center items-center relative">
          <h1 className="text-center font-normal text-2xl">
            Editar Social Team
          </h1>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del equipo"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          />

          {/* Provincia */}
          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              const provinceName =
                provinces?.find((p) => p.id === e.target.value)?.name || "";
              setFormData((prev) => ({ ...prev, provincia: provinceName }));
              setSelectedLocality(""); // Reset localidad al cambiar provincia
            }}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-foreground"
          >
            <option value="">Seleccionar provincia</option>
            {provinces?.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>

          {/* Localidad */}
          <select
            value={selectedLocality}
            onChange={(e) => {
              setSelectedLocality(e.target.value);
              const localityName =
                localities?.find((l) => l.id === e.target.value)?.name ||
                e.target.value;
              setFormData((prev) => ({ ...prev, localidad: localityName }));
            }}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-foreground"
            disabled={!selectedProvince}
          >
            <option value="">
              {selectedProvince
                ? "Seleccionar localidad"
                : "Primero selecciona una provincia"}
            </option>
            {localities?.map((locality) => (
              <option key={locality.id} value={locality.id}>
                {locality.name}
              </option>
            ))}
          </select>

          {/* Botón GPS */}
          <button
            type="button"
            onClick={detectLocationFromGPS}
            disabled={locationDetecting}
            className="w-full py-3 px-4 bg-[#C95100] hover:bg-[#B04500] disabled:bg-[#C95100]/50 text-white rounded-[15px] flex items-center justify-center gap-2 transition-colors"
          >
            {locationDetecting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Detectando ubicación...
              </>
            ) : (
              <>📍 Detectar mi ubicación</>
            )}
          </button>

          <input
            type="text"
            name="precio"
            placeholder="Precio"
            value={formData.precio}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          />

          <input
            type="text"
            name="alias"
            placeholder="CBU/Alias"
            value={formData.alias}
            onChange={handleChange}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          />

          <input
            type="number"
            name="cupo"
            placeholder="Cupo máximo"
            value={formData.cupo}
            onChange={handleChange}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          />

          <select
            name="deporte"
            value={formData.deporte}
            onChange={handleChange}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-slate-400"
          >
            <option value="">Selecciona un deporte</option>
            <option value="Running">Running</option>
            <option value="Ciclismo">Ciclismo</option>
            <option value="Trekking">Trekking</option>
            <option value="Otros">Otros</option>
          </select>

          {/* Campo de Dificultad */}
          <select
            name="dificultad"
            value={formData.dificultad}
            onChange={handleChange}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-foreground"
          >
            <option value="">Seleccionar dificultad</option>
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
            <option value="Experto">Experto</option>
          </select>

          <select
            name="duracion"
            value={formData.duracion}
            onChange={handleChange}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-slate-400"
          >
            <option value="">Duración</option>
            <option value="1 hs">1 hs</option>
            <option value="2 hs">2 hs</option>
            <option value="3 hs">3 hs</option>
          </select>

          <div className="flex gap-4">
            <input
              type="date"
              name="fecha"
              value={formData.fecha.split("T")[0]}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
            />
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
            />
          </div>

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          />

          <input
            type="text"
            name="whatsappLink"
            placeholder="Link del grupo de WhatsApp"
            value={formData.whatsappLink}
            onChange={handleChange}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          />

          <input
            type="text"
            name="telefonoOrganizador"
            placeholder="Número de teléfono del organizador"
            value={formData.telefonoOrganizador}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          />

          <div className="relative">
            <input
              type="text"
              name="ubicacion"
              placeholder="Ubicación"
              value={formData.ubicacion}
              onChange={handleChange}
              required
              className="w-full px-4 py-4 border shadow-md rounded-[15px]"
            />
            {suggestions.length > 0 && (
              <ul className="absolute bg-card border rounded-md z-10 w-full max-h-40 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4">
            <MapWithNoSSR position={markerPos} onChange={handleCoordsChange} />
          </div>

          {/* Selección de Bar */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Bar (opcional)
            </label>
            <select
              value={selectedBar}
              onChange={(e) => setSelectedBar(e.target.value)}
              className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-foreground"
              disabled={loadingBares}
            >
              <option value="">Seleccionar bar (opcional)</option>
              {bares?.map((bar) => (
                <option key={bar._id} value={bar._id}>
                  {bar.name} - {bar.direccion}
                </option>
              ))}
            </select>
            {loadingBares && (
              <p className="text-sm text-gray-500 mt-1">Cargando bares...</p>
            )}
          </div>

          {/* Selección de Sponsors */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Sponsors (opcional)
            </label>
            {loadingSponsors ? (
              <p className="text-sm text-gray-500">Cargando sponsors...</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-[15px] p-3">
                {sponsors?.map((sponsor) => (
                  <label
                    key={sponsor._id}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSponsors.includes(sponsor._id)}
                      onChange={() => handleSponsorToggle(sponsor._id)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div className="flex items-center space-x-2">
                      {sponsor.imagen && (
                        <img
                          src={sponsor.imagen}
                          alt={sponsor.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="text-sm text-gray-700">
                        {sponsor.name}
                      </span>
                    </div>
                  </label>
                ))}
                {sponsors?.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No hay sponsors disponibles
                  </p>
                )}
              </div>
            )}
            {selectedSponsors.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {selectedSponsors.length} sponsor(s) seleccionado(s)
              </p>
            )}
          </div>

          <div>
            <p>Cambiar imagen</p>
            {formData.imagen && (
              <img
                src={formData.imagen}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl cursor-pointer mb-2"
                onClick={() => document.getElementById("fileInput")?.click()}
              />
            )}
            <input
              type="file"
              accept="image/*"
              id="fileInput"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* <button
            type="submit"
            className="w-full  bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white py-3 rounded-xl font-semibold hover:bg-orange-600"
          >
            Guardar cambios
          </button> */}
          <button
            className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Actualizando social" : "Actualizar social"}
            {isSubmitting && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full mt-2 text-red-500 py-3"
          >
            Eliminar salida
          </button>
        </div>
      </form>
      <div className="pb-[500px]"></div>
    </div>
  );
}
