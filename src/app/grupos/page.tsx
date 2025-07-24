"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";
import debounce from "lodash.debounce";
import Academia from "@/models/academia";
import { saveGroupImage } from "@/app/api/grupos/saveGroupImage";

const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

interface LatLng {
  lat: number;
  lng: number;
}

const CrearGrupo = () => {
  const router = useRouter();
  const [academias, setAcademias] = useState<any[]>([]);
  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);
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
    locationCoords: "",
    avisos: "",
  });
  const [loading, setLoading] = useState(true);
  const [imagen, setImagen] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const defaultCoords: LatLng = { lat: -26.8333, lng: -65.2167 };

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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    // const { name, value } = e.target;
    // setGrupo({ ...grupo, [name]: value });
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

  const uploadImageAndGetUrl = async (file: File): Promise<string> => {
    const imageRef = ref(storage, `grupos/${file.name}-${Date.now()}`);
    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);
    return url;
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // 1. Crear grupo sin imagen
      const res = await fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grupo),
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
    setGrupo((prev) => ({ ...prev, coords }));

    const direccion = await fetchAddressFromCoords(coords.lat, coords.lng);
    setQuery(direccion);
    setGrupo((prev) => ({ ...prev, ubicacion: direccion }));
  };

  const handleSelectSuggestion = (item: any) => {
    const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setMarkerPos(coords);
    setGrupo((prev) => ({ ...prev, coords, ubicacion: item.display_name }));
    setQuery(item.display_name);
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

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  if (academias.length === 0) {
    return (
      <div className="text-center mt-10 p-4 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-4">No tienes academias creadas</h1>
        <p className="text-gray-700">
          Crea una academia primero para poder gestionar grupos.
        </p>
      </div>
    );
  }

  console.log(academias);

  return (
    <div className="w-[390px] flex flex-col items-center gap-5 bg-[#FEFBF9">
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
      <h2 className="text-center font-bold text-xl bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent">
        Crear grupo <span className="text-black">de entrenamiento</span>
      </h2>

      <form
        onSubmit={handleSubmit}
        className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-[#FEFBF9]"
      >
        <select
          name="academia_id"
          value={grupo.academia_id}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Academia</option>
          {academias.map((academia) => (
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <select
          name="nivel"
          value={grupo.nivel}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        />

        <div className="space-y-4">
          <label className="block font-medium text-slate-400">
            Días de entrenamiento
          </label>
          {/* Chips visuales */}
          <div className="flex flex-wrap gap-3 mt-2">
            {grupo.dias.map((dia) => (
              <span
                key={dia}
                className="flex items-center bg-white border text-orange-700 px-4 py-1.5 rounded-full text-sm shadow-sm"
              >
                {dia}
                <button
                  type="button"
                  onClick={() => removeDia(dia)}
                  className="ml-2 text-orange-500 hover:text-orange-700"
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
            className="
      w-full
      h-70
      px-5
      py-3
      border
      rounded-xl
      shadow-md
      bg-white
      text-gray-400
      focus:outline-none
      focus:ring-2
      focus:ring-orange-400
      overflow-y-auto
      scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-100
    "
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <textarea
          name="descripcion"
          value={grupo.descripcion}
          onChange={handleInputChange}
          placeholder="Descripción"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
        <textarea
          name="avisos"
          value={grupo.avisos}
          onChange={handleInputChange}
          placeholder="Avisos, indicaciones para hacer en el grupo"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <select
          name="tipo_grupo"
          value={grupo.tipo_grupo}
          onChange={handleInputChange}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          {academias[0].tipo_disciplina === "Ciclismo" ? (
            <div>
              <option value="">Selecciona una diciplina</option>
              <option value="Ruta">Ruta</option>
              <option value="MTB">MTB</option>
              <option value="Otros">Otros</option>
            </div>
          ) : null}
          {academias[0].tipo_disciplina === "Running" ? (
            <div>
              <option value="">Selecciona una diciplina</option>
              <option value="Urbano">Urbano</option>
              <option value="Trail">Trail</option>
              <option value="Marathon">Marathon</option>
              <option value="Otros">Otros</option>
            </div>
          ) : null}
          {academias[0].tipo_disciplina === "Trekking" ? (
            <div>
              <option value="">Selecciona una diciplina</option>
              <option value="de dia">De día</option>
              <option value="varios dias">Varios días</option>
              <option value="Senderismo">Senderimos</option>
              <option value="Ascensos">Ascensos</option>
              <option value="Otros">Otros</option>
            </div>
          ) : null}
        </select>
        <label className="block text-slate-400">
          Banner del grupo
          <div className="mt-2 w-full h-40 bg-white border shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
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
        <label className="block relative">
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
        </label>

        <button
          type="submit"
          className="w-full py-2 rounded-md text-white  bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] font-bold"
        >
          Crear Grupo
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="text-md text-orange-400"
        >
          Atrás
        </button>
      </form>
      <div className="pb-[20px]"></div>
    </div>
  );
};

export default CrearGrupo;
