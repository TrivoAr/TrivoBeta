"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import debounce from "lodash.debounce";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";
import { useSession, signOut } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import mapboxgl from "mapbox-gl";
import { useBares } from "@/hooks/useBares";
import { useSponsors } from "@/hooks/useSponsors";
import { useProvinces, useLocalitiesByProvince, useLocationFromCoords } from "@/hooks/useArgentinaLocations";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

interface Coords {
  lat: number;
  lng: number;
}

function useDebounce(callback: (...args: any[]) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedFn;
}

interface LatLng {
  lat: number;
  lng: number;
}

export default function CrearTeamPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);
  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  // Hooks para obtener bares y sponsors
  const { data: bares, isLoading: loadingBares } = useBares();
  const { data: sponsorsResponse, isLoading: loadingSponsors } = useSponsors();

  // Extraer array de sponsors de la respuesta
  const sponsors = sponsorsResponse?.data || [];

  // Estados para selecciones
  const [selectedBar, setSelectedBar] = useState<string>("");
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);

  // Estados para detección de ubicación
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedLocality, setSelectedLocality] = useState("");

  // Hooks para ubicación argentina
  const { data: provinces } = useProvinces();
  const { data: localities } = useLocalitiesByProvince(selectedProvince);
  const locationFromCoordsQuery = useLocationFromCoords();

  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    precio: "",
    deporte: "",
    fecha: "",
    hora: "",
    duracion: "",
    descripcion: "",
    whatsappLink: "",
    localidad: "",
    provincia: "",
    dificultad: "",
    telefonoOrganizador: session?.user.telnumber || "",
    coords: null as LatLng | null,
    stravaMap: {
      id: "",
      summary_polyline: "",
      polyline: "",
      resource_state: 0,
    },
    cupo: 0,
    detalles: "",
    cbu: "",
    alias: "",
  });
  const [coords, setCoords] = useState<Coords>({
    lat: -26.8333,
    lng: -65.2167,
  });
  const [ubicacion, setUbicacion] = useState("");

  const [imagen, setImagen] = useState<File | null>(null);
  const defaultCoords: LatLng = { lat: -26.8333, lng: -65.2167 };
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función para manejar selección múltiple de sponsors
  const handleSponsorToggle = (sponsorId: string) => {
    setSelectedSponsors(prev =>
      prev.includes(sponsorId)
        ? prev.filter(id => id !== sponsorId)
        : [...prev, sponsorId]
    );
  };

  // Función para detectar ubicación por GPS
  const detectLocationFromGPS = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalización no soportada en este dispositivo");
      return;
    }

    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast.error("GPS requiere conexión segura (HTTPS)");
      return;
    }

    setLocationDetecting(true);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const message = isMobile
      ? "📱 Presiona 'Permitir' cuando aparezca la solicitud de ubicación"
      : "🌍 Buscando ubicación... Acepta los permisos cuando aparezcan";

    toast.loading(message, {
      duration: 6000,
      id: 'gps-search'
    });

    if (isMobile) {
      setTimeout(() => {
        toast("💡 Si no aparece la solicitud, verifica que la ubicación esté activada en tu dispositivo", {
          duration: 4000,
          icon: "💡"
        });
      }, 2000);
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setLocationDetecting(false);
          toast.dismiss('gps-search');
          toast.error("🚫 Ubicación bloqueada. Permite el acceso en configuración del navegador y recarga la página", { duration: 8000 });
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
          lng: position.coords.longitude
        };

        try {
          const locationData = await locationFromCoordsQuery.mutateAsync(coords);

          const province = provinces?.find(p =>
            p.name.toLowerCase() === locationData.province?.toLowerCase()
          );

          if (province) {
            setSelectedProvince(province.id);
            setFormData(prev => ({
              ...prev,
              provincia: province.name,
              coords: coords
            }));

            if (locationData.locality) {
              setSelectedLocality(locationData.locality);
              setFormData(prev => ({
                ...prev,
                localidad: locationData.locality
              }));
            }
          }

          setCoords(coords);
          setFormData(prev => ({ ...prev, coords }));

          if (marker.current && map.current) {
            marker.current.setLngLat([coords.lng, coords.lat]);
            map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 14 });
          }

          toast.dismiss('gps-search');
          toast.success(`📍 Ubicación detectada: ${locationData.province}, ${locationData.locality}`);

        } catch (error) {
          console.error("Error detectando ubicación:", error);
          toast.dismiss('gps-search');
          toast.error("Error al detectar ubicación específica, pero coordenadas obtenidas");

          setCoords(coords);
          setFormData(prev => ({ ...prev, coords }));

          if (marker.current && map.current) {
            marker.current.setLngLat([coords.lng, coords.lat]);
            map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 14 });
          }
        }

        setLocationDetecting(false);
      },
      (error) => {
        setLocationDetecting(false);
        toast.dismiss('gps-search');

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
        maximumAge: 300000
      }
    );
  };

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [coords.lng, coords.lat],
      zoom: 13,
    });

    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map.current);

    // Evento al mover marcador
    marker.current.on("dragend", () => {
      const { lat, lng } = marker.current!.getLngLat();
      handleCoordsChange({ lat, lng });
    });

    // Evento al clickear en el mapa
    map.current.on("click", (e: mapboxgl.MapMouseEvent) => {
      const { lat, lng } = e.lngLat;
      marker.current!.setLngLat([lng, lat]);
      handleCoordsChange({ lat, lng });
    });

    // Cargar ubicación inicial
    handleCoordsChange(coords);
  }, []);


  const setUbicacionBoth = (val: string) => {
  setUbicacion(val);
  setFormData(prev => ({ ...prev, ubicacion: val }));
};

  // 🔄 Cambiar coordenadas y buscar dirección
const handleCoordsChange = async ({ lat, lng }: Coords) => {
  setCoords({ lat, lng });
  setFormData(prev => ({ ...prev, coords: { lat, lng } })); // <-- sync

  try {
    const res = await fetch(`/api/search/reverse?lat=${lat}&lon=${lng}`);
    const data = await res.json();
    if (data.display_name) {
      setUbicacionBoth(data.display_name); // <-- sync input + formData
    }
  } catch (err) {
    console.error("Error reverse geocoding:", err);
  }
};


const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setUbicacionBoth(value); // <-- antes: sólo setUbicacion

  debouncedFetchSuggestions(value);

  if (value.length < 3) {
    setSuggestions([]);
    return;
  }

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    setSuggestions(data);
  } catch (err) {
    console.error("Error fetching suggestions:", err);
  }
};

const handleSuggestionClick = (s: { display_name: string; lat: string; lon: string }) => {
  const lat = parseFloat(s.lat);
  const lng = parseFloat(s.lon);

  setUbicacionBoth(s.display_name);
  setCoords({ lat, lng });
  setFormData(prev => ({ ...prev, coords: { lat, lng } })); // <-- sync

  marker.current!.setLngLat([lng, lat]);
  map.current!.flyTo({ center: [lng, lat], zoom: 14 });
  setSuggestions([]);
};

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    if (!formData.ubicacion || !formData.coords) {
      toast.error("Seleccioná una ubicación en el mapa o desde las sugerencias");
      setIsSubmitting(false);
      return;
    }

    let imageUrl = "";
    if (imagen) {
      const imageRef = ref(storage, `team-social/${uuidv4()}`);
      await uploadBytes(imageRef, imagen);
      imageUrl = await getDownloadURL(imageRef);
    }

    const salidaData = {
      ...formData,
      imagen: imageUrl,
      locationCoords: formData.coords, // ya NO será null
      bar: selectedBar || null,
      sponsors: selectedSponsors.length > 0 ? selectedSponsors : [],
      provincia: formData.provincia,
      dificultad: formData.dificultad,
    };

    const res = await fetch("/api/team-social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(salidaData),
    });

    if (res.ok) {
      toast.success("Social team creado con éxito");
      router.push("/home");
    } else {
      setIsSubmitting(false);
      const error = await res.json();
      console.error("Error al crear team social:", error);
      toast.error("Error al crear salida, datos incompletos");
    }
  } catch (err) {
    console.error("Error inesperado:", err);
    setIsSubmitting(false);
  }
};

  const coordsToSave = formData.coords || defaultCoords;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const fetchSuggestions = (q: string) => {
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => setSuggestions(data))
      .catch((err) => {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
      });
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

  const debouncedFetchSuggestions = useDebounce(fetchSuggestions, 300);



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

useEffect(() => {
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/strava/activities?userId=${session?.user.id}`);
      const data = await res.json();

      if (data.error) {
        console.error("Error al traer actividades:", data.error);
        return;
      }
      
      setActivities(data);
    } catch (err) {
      console.error("Error cargando actividades:", err);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user.id) fetchActivities();
}, [session?.user.id]);
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto p-4 space-y-3 rounded-xl mb-[80px]"
    >
      <Toaster position="top-center" />
      <h2 className="text-center font-normal text-xl">Crear social team</h2>

      <label className="block">
        Nombre
        <input
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="nombre del equipo"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>
      {/* Provincia */}
      <label className="block">
        Provincia
        <select
          value={selectedProvince}
          onChange={(e) => {
            setSelectedProvince(e.target.value);
            const provinceName = provinces?.find(p => p.id === e.target.value)?.name || "";
            setFormData(prev => ({ ...prev, provincia: provinceName }));
            setSelectedLocality(""); // Reset localidad al cambiar provincia
          }}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-foreground"
        >
          <option value="">Seleccionar provincia</option>
          {provinces?.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </label>

      {/* Localidad */}
      <label className="block">
        Localidad
        <select
          value={selectedLocality}
          onChange={(e) => {
            setSelectedLocality(e.target.value);
            const localityName = localities?.find(l => l.id === e.target.value)?.name || e.target.value;
            setFormData(prev => ({ ...prev, localidad: localityName }));
          }}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-foreground"
          disabled={!selectedProvince}
        >
          <option value="">
            {selectedProvince ? "Seleccionar localidad" : "Primero selecciona una provincia"}
          </option>
          {localities?.map((locality) => (
            <option key={locality.id} value={locality.id}>
              {locality.name}
            </option>
          ))}
        </select>
      </label>

      {/* Botón de GPS */}
      <button
        type="button"
        onClick={detectLocationFromGPS}
        disabled={locationDetecting}
        className="w-full py-3 px-4 bg-[#C95100] hover:bg-[#B04500] disabled:bg-[#C95100]/50 text-white rounded-[15px] flex items-center justify-center gap-2 transition-colors"
      >
        {locationDetecting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Detectando ubicación...
          </>
        ) : (
          <>
            📍 Detectar mi ubicación
          </>
        )}
      </button>

      <label className="block">
        Precio
        <input
          name="precio"
          type="number"
          value={formData.precio}
          onChange={handleChange}
          placeholder="$9.999"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>
      <label className="block">
        CBU/Alias
        <input
          name="alias"
          value={formData.alias}
          onChange={handleChange}
          placeholder="Alias"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card mb-2"
        />
      </label>

      <label className="block">
        Cupo
        <input
          name="cupo"
          type="number"
          value={formData.cupo}
          onChange={handleChange}
          placeholder="Cantidad maxima de personas"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>

      <select
        name="deporte"
        value={formData.deporte}
        onChange={handleChange}
        className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
      >
        <option value="">Selecciona un deporte</option>
        <option value="Running">Running</option>
        <option value="Ciclismo">Ciclismo</option>
        <option value="Trekking">Trekking</option>
        <option value="Otros">Otros</option>
      </select>

      {/* Campo de Dificultad */}
      <label className="block">
        Dificultad
        <select
          name="dificultad"
          value={formData.dificultad}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-foreground"
        >
          <option value="">Seleccionar dificultad</option>
          <option value="Principiante">Facil</option>
          <option value="Intermedio">Media</option>
          <option value="Avanzado">Dificil</option>
        </select>
      </label>

      <label className="block">
        <select
          name="duracion"
          value={formData.duracion}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        >
          <option value="">Duración</option>
          <option value="1 hs">1 hs</option>
          <option value="2 hs">2 hs</option>
          <option value="3 hs">3 hs</option>
        </select>
      </label>

      <label className="block">
        Fecha
        <input
          type="date"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        />
      </label>
      <label className="block">
        Hora
        <input
          type="time"
          name="hora"
          value={formData.hora}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        />
      </label>

      <p>Descripción</p>

      <textarea
        name="descripcion"
        value={formData.descripcion}
        onChange={handleChange}
        placeholder="Somos un equipo de ciclismo recreativo..."
        className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
      />
      <label className="block">
        Link del grupo de WhatsApp
        <input
          name="whatsappLink"
          value={formData.whatsappLink || ""}
          onChange={handleChange}
          placeholder="https://chat.whatsapp.com/..."
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>

      <label className="block">
        Número de teléfono del organizador
        <input
          name="telefonoOrganizador"
          value={formData.telefonoOrganizador}
          onChange={handleChange}
          placeholder="+5491123456789"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>
      <label className="block">
        Imagen
        <div className="w-full h-40 bg-card shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Vista previa"
              className="w-full h-full object-cover absolute top-0 left-0"
            />
          ) : (
            <span className="text-gray-500 z-0">Subir imagen</span>
          )}
        </div>
      </label>

      <label className="block">
        Actividades Strava
        <select
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          onChange={(e) => {
            const selectedId = e.target.value;
            const selectedActivity = activities.find(
              (a) => a.id.toString() === selectedId
            );

            if (selectedActivity) {
              setFormData((prev) => ({
                ...prev,
                stravaMap: {
                  id: selectedActivity.map.id,
                  summary_polyline: selectedActivity.map.summary_polyline,
                  polyline: selectedActivity.map.polyline,
                  resource_state: selectedActivity.map.resource_state,
                },
              }));
            }
          }}
        >
          <option value="">Selecciona una actividad</option>
          {activities?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} - {Math.round(a.distance / 1000)} km
            </option>
          ))}
        </select>
      </label>

      {/* <label className="block relative">
        Ubicación
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Parque central..."
          className="w-full px-4 py-4 border shadow-md rounded-[15px]"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 bg-card border mt-1 rounded w-full max-h-40 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="px-2 py-1 cursor-pointer hover:bg-gray-100"
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
      </label>
      <label className="block">
        <MapWithNoSSR
          position={markerPos || defaultCoords}
          onChange={handleCoordsChange}
        />
      </label> */}

      <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={ubicacion}
          onChange={handleInputChange}
          placeholder="Buscar ubicación..."
          className="w-full p-2 border border-gray-300 rounded"
        />
        {suggestions.length > 0 && (
          <ul className="absolute bg-card shadow-md w-full rounded mt-1 max-h-48 overflow-auto z-10">
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                className="p-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSuggestionClick(s)}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div
        ref={mapContainer}
        className="w-full h-[400px] border border-gray-300 rounded"
      />
    </div>

      {/* Selección de Bar */}
      <label className="block">
        Bar (opcional)
        <select
          value={selectedBar}
          onChange={(e) => setSelectedBar(e.target.value)}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-foreground"
          disabled={loadingBares}
        >
          <option value="">Seleccionar bar (opcional)</option>
          {bares?.map((bar) => (
            <option key={bar._id} value={bar._id}>
              {bar.name} - {bar.direccion}
            </option>
          ))}
        </select>
        {loadingBares && <p className="text-sm text-gray-500 mt-1">Cargando bares...</p>}
      </label>

      {/* Selección de Sponsors */}
      <div className="block">
        <label className="block mb-2">Sponsors (opcional)</label>
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
                  <span className="text-sm text-gray-700">{sponsor.name}</span>
                </div>
              </label>
            ))}
            {sponsors?.length === 0 && (
              <p className="text-sm text-gray-500">No hay sponsors disponibles</p>
            )}
          </div>
        )}
        {selectedSponsors.length > 0 && (
          <p className="text-xs text-gray-600 mt-2">
            {selectedSponsors.length} sponsor(s) seleccionado(s)
          </p>
        )}
      </div>

      <button
        className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creando social team" : "Crear social team"}
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
        onClick={() => router.back()}
        className="w-full py-2 rounded-md text-[#C95100] font-semibold"
      >
        Atrás
      </button>
    </form>
  );
}
