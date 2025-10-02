"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import debounce from "lodash.debounce";
import Academia from "@/models/academia";
import { useSession } from "next-auth/react";
import { saveGroupImage } from "@/app/api/grupos/saveGroupImage";
import FormCreationSkeleton from "@/components/FormCreationSkeleton";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Mapbox
const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Cargando mapa...</div>
    </div>
  ),
});

interface LatLng {
  lat: number;
  lng: number;
}

const CrearGrupo = () => {
  const router = useRouter();
  const [academias, setAcademias] = useState<any[]>([]);
  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [grupo, setGrupo] = useState({
    academia_id: "",
    nombre_grupo: "",
    nivel: "",
    ubicacion: "",
    horario: "",
    cuota_mensual: "",
    descripcion: "",
    tipo_grupo: "",
    tiempo_promedio: "",
    dias: [] as string[],
    imagen: "",
    locationCoords: null as LatLng | null,
    aviso: "",
    profesor_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [imagen, setImagen] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const defaultCoords: LatLng = { lat: -26.8333, lng: -65.2167 };
  const { data: session } = useSession();

  // Estados para Mapbox
  const mapRef = useRef<any>(null);
  const [coords, setCoords] = useState<LatLng>(defaultCoords);
  const [ubicacion, setUbicacion] = useState("");

  // Efecto para posicionar el marcador inicial si hay coordenadas guardadas
  useEffect(() => {
    if (grupo.locationCoords && mapRef.current) {
      const savedCoords = grupo.locationCoords;
      setCoords(savedCoords);
      setMarkerPos(savedCoords);
      mapRef.current.updateMarker(savedCoords);
    }
  }, [grupo.locationCoords]);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Estados para búsqueda de profesores
  const [profes, setProfes] = useState<any[]>([]);
  const [queryProfesor, setQueryProfesor] = useState("");
  const [profesorSuggestions, setProfesorSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const res = await fetch("/api/academias?owner=true");
        const data = await res.json();
        setAcademias(data);
      } catch (error) {
        console.error("Error al cargar academias:", error);
        toast.error("Error al cargar las academias");
      } finally {
        setLoading(false);
      }
    };
    fetchAcademias();
  }, []);

  // Fetch profesores
  useEffect(() => {
    const fetchProfes = async () => {
      try {
        const res = await fetch(`/api/profile/profes`);
        const data = await res.json();
        setProfes(data);
      } catch (err) {
        console.error("Error al obtener los profes", err);
      }
    };
    fetchProfes();
  }, []);

  // Manejar selección de ubicación desde el mapa
  const handleLocationSelect = useCallback(
    async (newCoords: LatLng, address: string) => {
      setCoords(newCoords);
      setMarkerPos(newCoords);
      setQuery(address);
      setSuggestions([]); // Limpiar sugerencias cuando se selecciona desde el mapa
      setGrupo((prev) => ({
        ...prev,
        ubicacion: address,
        locationCoords: newCoords,
      }));
    },
    []
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, type, value, multiple, options } =
      e.target as HTMLSelectElement;

    // Si es un select múltiple, recogemos todos los valores seleccionados
    if (multiple) {
      const selectedValues = Array.from(options)
        .filter((opt) => opt.selected)
        .map((opt) => opt.value);
      setGrupo({ ...grupo, [name]: selectedValues });
    } else {
      // Para los demás inputs
      setGrupo({ ...grupo, [name]: value });
    }
  };

  const removeDia = (dia: string) => {
    setGrupo((prev) => ({
      ...prev,
      dias: prev.dias.filter((d) => d !== dia),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!session?.user?.id) {
      toast.error("No has iniciado sesión.");
      return;
    }

    try {
      const grupoConProfesor = {
        ...grupo,
        profesor_id: grupo.profesor_id || null,
      };

      const res = await fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grupoConProfesor),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Error: ${errorData.error}`);
        return;
      }

      const grupoCreado = await res.json();

      // 2. Subir imagen si hay
      if (imagen) {
        const imageUrl = await saveGroupImage(imagen, grupoCreado._id);

        // 3. Actualizar grupo con imagen
        await fetch(`/api/grupos/${grupoCreado._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagen: imageUrl }),
        });
      }

      toast.success("Grupo creado exitosamente");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error al crear el grupo:", error);
      setIsSubmitting(false);
      toast.error("Hubo un error al crear el grupo");
    }
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
    setGrupo((prev) => ({ ...prev, locationCoords: coords }));

    // Actualizar mapa usando la referencia
    if (mapRef.current) {
      mapRef.current.updateMarker(coords);
    }

    const direccion = await fetchAddressFromCoords(coords.lat, coords.lng);
    setQuery(direccion);
    setGrupo((prev) => ({ ...prev, ubicacion: direccion }));
  };

  const handleSelectSuggestion = (item: any) => {
    const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setMarkerPos(coords);
    setCoords(coords);
    setGrupo((prev) => ({
      ...prev,
      locationCoords: coords,
      ubicacion: item.display_name,
    }));
    setQuery(item.display_name);

    // Actualizar mapa usando la referencia
    if (mapRef.current) {
      mapRef.current.updateMarker(coords);
    }

    setSuggestions([]); // cerrar sugerencias
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

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/search/reverse?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      return data.display_name as string;
    } catch (error) {
      console.error("Error al obtener dirección inversa:", error);
      return "";
    }
  };

  const handleInputLocationChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setQuery(value);
    setGrupo((prev) => ({ ...prev, ubicacion: value }));

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    // Solo usar el debounced fetch, no hacer fetch inmediato
    debouncedFetch(value);
  };

  const handleSuggestionClick = (s: any) => {
    const coords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setQuery(s.display_name);
    setCoords(coords);
    setMarkerPos(coords);

    // Actualizar mapa usando la referencia
    if (mapRef.current) {
      mapRef.current.updateMarker(coords);
    }

    setGrupo((prev) => ({
      ...prev,
      ubicacion: s.display_name,
      locationCoords: coords,
    }));
    setSuggestions([]);
  };

  const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 300), []);

  // Cleanup para evitar memory leaks
  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  // Hook para manejar clics fuera de las sugerencias
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) {
    return <FormCreationSkeleton />;
  }

  if (!Array.isArray(academias) || academias.length === 0) {
    return (
      <div className="text-center mt-10 p-4 bg-white dark:bg-gray-800 rounded shadow border dark:border-gray-600">
        <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          No tienes academias creadas
        </h1>
        <p className="text-gray-700 dark:text-gray-300">
          Crea una academia primero para poder gestionar grupos.
        </p>
      </div>
    );
  }

  return (
    <div className="w-[390px] flex flex-col items-center gap-5 bg-[#FEFBF9] dark:bg-gray-900 min-h-screen">
      <Toaster position="top-center" />
      <div className="relative w-full h-[40px] flex">
        <button
          type="button"
          onClick={() => router.back()}
          className="btnFondo absolute top-2 left-2 text-white p-2 rounded-full shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="black"
            viewBox="0 0 16 16"
            width="24"
            height="24"
          >
            <path
              fillRule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
            />
          </svg>
        </button>
      </div>

      <h2 className="text-center font-medium text-xl text-gray-900 dark:text-white">
        Crear grupo de entrenamiento
      </h2>

      <form
        onSubmit={handleSubmit}
        className="max-w-sm mx-auto p-4 space-y-5 rounded-xl mb-[80px] bg-[#FEFBF9] dark:bg-gray-900"
      >
        <select
          name="academia_id"
          value={grupo.academia_id}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-300"
        >
          <option value="">Academia</option>
          {Array.isArray(academias) &&
            academias.map((academia) => (
              <option key={academia._id} value={academia._id}>
                {academia.nombre_academia}
              </option>
            ))}
        </select>

        <input
          type="text"
          name="nombre_grupo"
          value={grupo.nombre_grupo}
          onChange={handleInputChange}
          required
          placeholder="Nombre"
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        <select
          name="nivel"
          value={grupo.nivel}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-300"
        >
          <option value="">Selecciona dificultad</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>

        <input
          type="time"
          name="horario"
          value={grupo.horario}
          onChange={handleInputChange}
          placeholder="Horario"
          required
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-300"
        />

        <div className="space-y-4">
          <label className="block font-medium text-slate-400 dark:text-gray-300">
            Días de entrenamiento
          </label>
          {/* Chips visuales */}
          <div className="flex flex-wrap gap-3 mt-2">
            {grupo.dias.map((dia) => (
              <span
                key={dia}
                className="flex items-center bg-white dark:bg-gray-700 border dark:border-gray-600 text-orange-700 dark:text-orange-300 px-4 py-1.5 rounded-full text-sm shadow-sm"
              >
                {dia}
                <button
                  type="button"
                  onClick={() => removeDia(dia)}
                  className="ml-2 text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                  title="Eliminar"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <select
            name="dias"
            value={grupo.dias}
            onChange={handleInputChange}
            required
            multiple
            className="w-full h-70 px-5 py-3 border dark:border-gray-600 rounded-xl shadow-md bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-100"
          >
            <option className="py-3" value={"Lun"}>
              Lunes
            </option>
            <option className="py-3" value={"Mar"}>
              Martes
            </option>
            <option className="py-3" value={"Mie"}>
              Miércoles
            </option>
            <option className="py-3" value={"Jue"}>
              Jueves
            </option>
            <option className="py-3" value={"Vie"}>
              Viernes
            </option>
            <option className="py-3" value={"Sab"}>
              Sábado
            </option>
            <option className="py-3" value={"Dom"}>
              Domingo
            </option>
          </select>
        </div>

        {/* tiempo */}
        <select
          name="tiempo_promedio"
          value={grupo.tiempo_promedio}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-300"
        >
          <option value="">Duracion del Entrenamiento</option>
          <option value="1hs">1 hora</option>
          <option value="2hs">2 hora</option>
          <option value="3hs">3 hora</option>
        </select>

        <input
          type="text"
          name="cuota_mensual"
          value={grupo.cuota_mensual}
          onChange={handleInputChange}
          placeholder="Cuota mensual"
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        <textarea
          name="descripcion"
          value={grupo.descripcion}
          onChange={handleInputChange}
          placeholder="Descripción"
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <textarea
          name="aviso"
          value={grupo.aviso}
          onChange={handleInputChange}
          placeholder="Avisos, indicaciones para hacer en el grupo"
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        <select
          name="tipo_grupo"
          value={grupo.tipo_grupo}
          onChange={handleInputChange}
          className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-300"
        >
          {Array.isArray(academias) &&
          academias.length > 0 &&
          academias[0]?.tipo_disciplina === "Ciclismo" ? (
            <>
              <option value="">Selecciona una diciplina</option>
              <option value="Ruta">Ruta</option>
              <option value="MTB">MTB</option>
              <option value="Otros">Otros</option>
            </>
          ) : null}
          {Array.isArray(academias) &&
          academias.length > 0 &&
          academias[0]?.tipo_disciplina === "Running" ? (
            <>
              <option value="">Selecciona una diciplina</option>
              <option value="Urbano">Urbano</option>
              <option value="Trail">Trail</option>
              <option value="Marathon">Marathon</option>
              <option value="Otros">Otros</option>
            </>
          ) : null}
          {Array.isArray(academias) &&
          academias.length > 0 &&
          academias[0]?.tipo_disciplina === "Trekking" ? (
            <>
              <option value="">Selecciona una diciplina</option>
              <option value="de dia">De día</option>
              <option value="varios dias">Varios días</option>
              <option value="Senderismo">Senderimos</option>
              <option value="Ascensos">Ascensos</option>
              <option value="Otros">Otros</option>
            </>
          ) : null}
        </select>

        <label className="block text-slate-400 dark:text-gray-300">
          Banner del grupo
          <div className="mt-2 w-full h-40 bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
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
              <span className="text-gray-500 dark:text-gray-400 z-0">
                Subir imagen
              </span>
            )}
          </div>
        </label>

        {/* Búsqueda de profesores */}
        <label className="block relative text-slate-400 dark:text-gray-300">
          Asignar profesor
          <input
            type="text"
            value={queryProfesor}
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
            className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          {profesorSuggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-md rounded-md max-h-40 overflow-y-auto z-50">
              {profesorSuggestions.map((p) => (
                <li
                  key={p._id}
                  className="px-4 py-2 cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  onClick={() => {
                    setGrupo((prev) => ({ ...prev, profesor_id: p._id }));
                    setQueryProfesor(`${p.firstname} ${p.lastname}`);
                    setProfesorSuggestions([]);
                  }}
                >
                  {p.firstname} {p.lastname}
                </li>
              ))}
            </ul>
          )}
          {/* Mostrar preview del profesor seleccionado */}
          {grupo.profesor_id && queryProfesor && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-[15px] mt-2">
              {(() => {
                const selectedProfesor = profes.find(
                  (p) => p._id === grupo.profesor_id
                );
                return selectedProfesor ? (
                  <div className="flex items-center gap-3">
                    {selectedProfesor.imagen ? (
                      <img
                        src={selectedProfesor.imagen}
                        alt={`${selectedProfesor.firstname} ${selectedProfesor.lastname}`}
                        className="w-12 h-12 object-cover rounded-full border-2 border-blue-300"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfesor.firstname + " " + selectedProfesor.lastname)}&background=3b82f6&color=fff&size=128`;
                        }}
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfesor.firstname + " " + selectedProfesor.lastname)}&background=3b82f6&color=fff&size=128`}
                        alt={`${selectedProfesor.firstname} ${selectedProfesor.lastname}`}
                        className="w-12 h-12 object-cover rounded-full border-2 border-blue-300"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        👨‍🏫 Profesor seleccionado: {selectedProfesor.firstname}{" "}
                        {selectedProfesor.lastname}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Este profesor aparecerá como instructor del grupo
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </label>

        {/* Ubicación con Mapbox */}
        <div className="flex flex-col gap-2">
          <label className="block text-slate-400 dark:text-gray-300">
            Ubicación
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputLocationChange}
              placeholder="Buscar ubicación..."
              className="w-full px-4 py-4 border dark:border-gray-600 shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {suggestions.length > 0 && (
              <ul
                ref={suggestionsRef}
                className="absolute z-50 bg-white dark:bg-gray-800 border dark:border-gray-600 mt-1 rounded w-full max-h-40 overflow-y-auto shadow-lg"
              >
                {suggestions.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="px-4 py-2 cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                  >
                    {item.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <MapboxMap
            ref={mapRef}
            initialCoords={defaultCoords}
            onLocationSelect={handleLocationSelect}
            className="w-full h-[300px] border dark:border-gray-600 border-gray-300 rounded"
          />
        </div>

        <button
          className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creando grupo" : "Crear grupo"}
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
      </form>
      <div className="pb-[20px]"></div>
    </div>
  );
};

export default CrearGrupo;
