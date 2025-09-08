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
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>
      <select
        name="localidad"
        value={formData.localidad}
        onChange={handleChange}
        className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
      >
        <option value="">Localidad</option>
        <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
        <option value="Yerba Buena">Yerba Buena</option>
        <option value="Tafi Viejo">Tafi Viejo</option>
        <option value="Otros">Otros</option>
      </select>

      <label className="block">
        Precio
        <input
          name="precio"
          type="number"
          value={formData.precio}
          onChange={handleChange}
          placeholder="$9.999"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>
      <label className="block">
        CBU/Alias
        <input
          name="alias"
          value={formData.alias}
          onChange={handleChange}
          placeholder="Alias"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white mb-2"
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
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>

      <select
        name="deporte"
        value={formData.deporte}
        onChange={handleChange}
        className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
      >
        <option value="">Selecciona un deporte</option>
        <option value="Running">Running</option>
        <option value="Ciclismo">Ciclismo</option>
        <option value="Trekking">Trekking</option>
        <option value="Otros">Otros</option>
      </select>

      <label className="block">
        <select
          name="duracion"
          value={formData.duracion}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
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
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        />
      </label>
      <label className="block">
        Hora
        <input
          type="time"
          name="hora"
          value={formData.hora}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        />
      </label>

      <p>Descripción</p>

      <textarea
        name="descripcion"
        value={formData.descripcion}
        onChange={handleChange}
        placeholder="Somos un equipo de ciclismo recreativo..."
        className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
      />
      <label className="block">
        Link del grupo de WhatsApp
        <input
          name="whatsappLink"
          value={formData.whatsappLink || ""}
          onChange={handleChange}
          placeholder="https://chat.whatsapp.com/..."
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>

      <label className="block">
        Número de teléfono del organizador
        <input
          name="telefonoOrganizador"
          value={formData.telefonoOrganizador}
          onChange={handleChange}
          placeholder="+5491123456789"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>
      <label className="block">
        Imagen
        <div className="w-full h-40 bg-white shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
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
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
          <ul className="absolute z-10 bg-white border mt-1 rounded w-full max-h-40 overflow-y-auto">
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
          <ul className="absolute bg-white shadow-md w-full rounded mt-1 max-h-48 overflow-auto z-10">
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
