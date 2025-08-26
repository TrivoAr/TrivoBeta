"use client";
import { useState, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";
import debounce from "lodash.debounce";
import toast, { Toaster } from "react-hot-toast";
import mapboxgl from "mapbox-gl";
import { set } from "mongoose";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

interface Coords {
  lat: number;
  lng: number;
}

interface LatLng {
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

export default function CrearSalidaPage() {
  const router = useRouter();
  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const mapContainer = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profes, setprofes] = useState([]);
  const [queryProfesor, setQueryProfesor] = useState("");
  const [profesorSuggestions, setProfesorSuggestions] = useState<any[]>([]);

  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ubicacion, setUbicacion] = useState("");
  const [coords, setCoords] = useState<Coords>({
    lat: -26.8333,
    lng: -65.2167,
  });
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
    localidad: "",
    whatsappLink: "",
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

  const [imagen, setImagen] = useState<File | null>(null);
  const defaultCoords: LatLng = { lat: -26.8333, lng: -65.2167 };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCoordsChange = async (coords: LatLng) => {
    setMarkerPos(coords);
    setFormData((prev) => ({ ...prev, coords }));

    const direccion = await fetchAddressFromCoords(coords.lat, coords.lng);
    setQuery(direccion);
    setFormData((prev) => ({ ...prev, ubicacion: direccion }));
  };

  const handleSelectSuggestion = (item: any) => {
    const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setMarkerPos(coords);
    setFormData((prev) => ({ ...prev, coords, ubicacion: item.display_name }));
    setQuery(item.display_name);
    setSuggestions([]); // cerrar sugerencias
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = "";
    setIsSubmitting(true);

    if (imagen) {
      const imageRef = ref(storage, `salidas/${uuidv4()}`);
      await uploadBytes(imageRef, imagen);
      imageUrl = await getDownloadURL(imageRef);
    }

    const coordsToSave = formData.coords || defaultCoords;

    const salidaData = {
      ...formData,
      imagen: imageUrl,
      locationCoords: coordsToSave,
    };

    const res = await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(salidaData),
    });

    if (res.ok) {
      toast.success("Salida creada con exito");
      router.push("/home");
    } else {
      setIsSubmitting(false);
      toast.error("Error al crear la salida");
      console.error("Error al crear salida social");
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
    if (map.current) return; // evitar inicializar dos veces

    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [coords.lng, coords.lat],
      zoom: 13,
    });

    // Añadir controles
    map.current.addControl(new mapboxgl.NavigationControl());

    // Crear el marcador
    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map.current);

    // Evento al arrastrar el marcador
    marker.current.on("dragend", async () => {
      const lngLat = marker.current!.getLngLat();
      setCoords({ lat: lngLat.lat, lng: lngLat.lng });

      const direccion = await fetchAddressFromCoords(lngLat.lat, lngLat.lng);
      setUbicacion(direccion);
      setFormData((prev) => ({
        ...prev,
        ubicacion: direccion,
        coords: { lat: lngLat.lat, lng: lngLat.lng },
      }));
    });

    // Evento click en mapa para mover el marcador
    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      marker.current!.setLngLat([lng, lat]);
      setCoords({ lat, lng });

      const direccion = await fetchAddressFromCoords(lat, lng);
      setUbicacion(direccion);
      setFormData((prev) => ({
        ...prev,
        ubicacion: direccion,
        coords: { lat, lng },
      }));
    });
  }, [coords.lat, coords.lng]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedFetchSuggestions(value);
    setUbicacion(value);

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

  const handleSuggestionClick = (s: any) => {
    setUbicacion(s.display_name);
    setCoords({ lat: s.lat, lng: s.lon });
    marker.current!.setLngLat([s.lon, s.lat]);
    map.current!.flyTo({ center: [s.lon, s.lat], zoom: 14 });
    setSuggestions([]);
  };

  const debouncedFetchSuggestions = useDebounce(fetchSuggestions, 300);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/strava/activities?userId=${session?.user.id}`
        );

        const data = await res.json();

        if(data.error){
          return
          
        }else{
          setActivities(data);
        }
        
      } catch (err) {
        console.error("Error cargando actividades:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/profes`);
        const data = await res.json();
        setprofes(data);
      } catch (err) {
        console.error("Error al obtener los profes", err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user.id) fetchActivities();
    fetchProfes();
  }, [session?.user.id]);

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-[#FEFBF9]"
    >
      <Toaster position="top-center" />
      <h2 className="text-center font-normal text-2xl">Crear salida</h2>
      <label className="block">
        Nombre
        <input
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="salida en grupo"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>

      <select
        name="localidad"
        value={formData.localidad}
        onChange={handleChange}
        className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
      >
        <option value="">Localidad</option>
        <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
        <option value="Yerba Buena">Yerba Buena</option>
        <option value="Tafi Viejo">Tafi Viejo</option>
        <option value="Otros">Otros</option>
      </select>

      <select
        name="deporte"
        value={formData.deporte}
        onChange={handleChange}
        className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Duración</option>
          <option value="1 hs">1 hs</option>
          <option value="2 hs">2 hs</option>
          <option value="3 hs">3 hs</option>
        </select>
      </label>
      <select
        name="dificultad"
        value={formData.dificultad}
        onChange={handleChange}
        className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
      >
        <option value="">Dificultad</option>
        <option value="facil">Principiantes</option>
        <option value="media">Media</option>
        <option value="dificil">Dificil</option>
      </select>

      <label className="block">
        Precio
        <input
          name="precio"
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white mb-2"
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

      <label className="block">
        Fecha
        <input
          type="date"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        />
      </label>

      <label className="block">
        Hora
        <input
          type="time"
          name="hora"
          value={formData.hora}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        />
      </label>

      <label className="block">
        Descripción
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Organizamos una salida de running"
          className="w-full px-3 py-4 border rounded-[15px] shadow-md"
        />
      </label>
      <label className="block">
        Que incluye la salida?
        <textarea
          name="detalles"
          value={formData.detalles}
          onChange={handleChange}
          placeholder="Seguro, guia, etc..."
          className="w-full px-3 py-4 border rounded-[15px] shadow-md"
        />
      </label>

      <label className="block">
        Link del grupo de WhatsApp
        <input
          name="whatsappLink"
          value={formData.whatsappLink || ""}
          onChange={handleChange}
          placeholder="https://chat.whatsapp.com/..."
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>

      <label className="block">
        Número de teléfono del organizador
        <input
          name="telefonoOrganizador"
          value={formData.telefonoOrganizador}
          onChange={handleChange}
          placeholder="+5491123456789"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>
      <label className="block">
        Imagen
        <div className="w-full h-40 bg-white border shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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

      {/* <label className="block">
        Seleccionar Profesor
        <select
          name="profesorId"
          value={formData.profesorId}
          onChange={handleProfesorSelect}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Selecciona un profesor</option>
          {profes.map((p: any) => (
            <option key={p._id} value={p._id}>
              {p.firstname} {p.lastname}
            </option>
          ))}
        </select>
      </label> */}


      <label className="block relative">
  Asignar profesor
  <input
    type="text"
    value={queryProfesor} // <- usa el estado de búsqueda
    onChange={(e) => {
      const value = e.target.value;
      setQueryProfesor(value);

      // Filtrar sugerencias localmente
      const filtered = profes.filter((p) =>
        p.firstname.toLowerCase().includes(value.toLowerCase())
      );
      setProfesorSuggestions(filtered);
    }}
    placeholder="Buscar profesor..."
    className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
  />
  {profesorSuggestions.length > 0 && (
    <ul className="absolute top-full left-0 right-0 bg-white border shadow-md rounded-md max-h-40 overflow-y-auto z-50">
      {profesorSuggestions.map((p) => (
        <li
          key={p._id}
          className="px-4 py-2 cursor-pointer hover:bg-orange-100"
          onClick={() => {
            setFormData((prev) => ({ ...prev, profesorId: p._id }));
            setQueryProfesor(`${p.firstname} ${p.lastname}`);
            setProfesorSuggestions([]);
          }}
        >
          {p.firstname} {p.lastname}
        </li>
      ))}
    </ul>
  )}
</label>






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
        {isSubmitting ? "Creando salida" : "Crear salida"}
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

      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-orange-500 font-semibold cente "
        >
          Atrás
        </button>
      </div>

      <div className="mb-[190px]"></div>
    </form>
  );
}
