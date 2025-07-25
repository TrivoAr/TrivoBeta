"use client";

import { useEffect, useState, FormEvent, HtmlHTMLAttributes, useMemo } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import { saveGroupImage } from "@/app/api/grupos/saveGroupImage";
import debounce from "lodash.debounce";

interface LatLng {
  lat: number;
  lng: number;
}

export default function EditarGrupo({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const defaultCoords = { lat: -26.8333, lng: -65.2167 };
  const [markerPos, setMarkerPos] = useState<LatLng>({ lat: 0, lng: 0 });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
  });
  const [academias, setAcademias] = useState<any[]>([]);
  const [formData, setFormData] = useState({
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener los datos del grupo
  const fetchGrupo = async () => {
    try {
      const response = await axios.get(`/api/grupos/${params.id}`);
      setFormData((prev) => ({
        ...prev,
        ...response.data.grupo,
        dias: Array.isArray(response.data.grupo.dias)
          ? response.data.grupo.dias
          : response.data.grupo.dias?.split(",") ?? [],
      }));

      console.log("que pija hermano", response.data.grupo.locationCoords);

      if (response.data.grupo.locationCoords) {
        setMarkerPos(response.data.grupo.locationCoords);
      } else {
        setMarkerPos(defaultCoords);
      }

      toast.success("Datos cargados con éxito");
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      toast.error("Error al cargar los datos del grupo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const res = await fetch("/api/academias?owner=true");
        const data = await res.json();
        console.log("que pija", data);
        setAcademias(data);
      } catch (error) {
        console.error("Error al cargar academias:", error);
        toast.error("Error al cargar las academias");
      } finally {
        setLoading(false);
      }
    };
    fetchAcademias();
    fetchGrupo();
  }, []);

  // Manejar el envío del formulario
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.patch(`/api/grupos/${params.id}`, formData);
      if (response.status === 200) {
        toast.success("¡Grupo actualizado con éxito!");
        router.push("/dashboard");
      } else {
        throw new Error("Error al actualizar el grupo");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof AxiosError) {
        setIsSubmitting(false);
        const errorMessage = error.response?.data?.message || "Error en la solicitud";
        toast.error(errorMessage);
      } else {
        setIsSubmitting(false);
        toast.error("Ocurrió un error desconocido");
      }
    }
  };

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type, value, multiple, options } =
      e.target as HTMLSelectElement;

    if (multiple) {
      const selectedValues = Array.from(options)
        .filter((opt) => opt.selected)
        .map((opt) => opt.value);
      setFormData({ ...formData, [name]: selectedValues });
    } else {
      // Para los demás inputs
      setFormData({ ...formData, [name]: value });
    }
  };

  const removeDia = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      dias: prev.dias.filter((d) => d !== dia),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await saveGroupImage(file, params.id);
      setProfileImage(imageUrl);
      alert("Imagen actualizada con éxito.");
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert("Hubo un problema al subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

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
    setMarkerPos(coords);
    setSuggestions([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm(
      "¿Estás seguro de que deseas eliminar este grupo?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/grupos/${params.id}/eliminar`);
      if (response.status === 200) {
        toast.success("¡Grupo eliminado con éxito!");
        router.push("/dashboard");
      } else {
        throw new Error("Error al eliminar el grupo");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el grupo.");
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
      <h2 className="text-center font-medium text-xl">Editar grupo</h2>

      <form
        onSubmit={handleSubmit}
        className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-[#FEFBF9]"
      >
        <input
          type="text"
          name="nombre_grupo"
          value={formData.nombre_grupo}
          onChange={handleChange}
          required
          placeholder="Nombre del grupo"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Descripción"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
        <input
          type="time"
          name="horario"
          value={formData.horario}
          onChange={handleChange}
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
            {formData.dias.map((dia) => (
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
            value={formData.dias}
            onChange={handleChange}
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
        <select
          name="tiempo_promedio"
          value={formData.tiempo_promedio}
          onChange={handleChange}
          required
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Duracion del Entrenamiento</option>
          <option value="1hs">1 hora</option>
          <option value="2hs">2 hora</option>
          <option value="3hs">3 hora</option>
        </select>

        <select
          name="nivel"
          value={formData.nivel}
          onChange={handleChange}
          required
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Selecciona dificultad</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>

        <select
          name="tipo_grupo"
          value={formData.tipo_grupo}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          {academias[0]?.tipo_disciplina === "Ciclismo" ? (
            <div>
              <option value="">Selecciona una diciplina</option>
              <option value="Ruta">Ruta</option>
              <option value="MTB">MTB</option>
              <option value="Otros">Otros</option>
            </div>
          ) : null}
          {academias[0]?.tipo_disciplina === "Running" ? (
            <div>
              <option value="">Selecciona una diciplina</option>
              <option value="Urbano">Urbano</option>
              <option value="Trail">Trail</option>
              <option value="Marathon">Marathon</option>
              <option value="Otros">Otros</option>
            </div>
          ) : null}
          {academias[0]?.tipo_disciplina === "Trekking" ? (
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

        <input
          type="text"
          name="cuota_mensual"
          value={formData.cuota_mensual}
          onChange={handleChange}
          placeholder="Cuota mensual"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
        <textarea
          name="aviso"
          value={formData.aviso}
          onChange={handleChange}
          placeholder="Avisos, indicaciones para hacer en el grupo"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
            <ul className="absolute bg-white border rounded-md z-10 w-full max-h-40 overflow-y-auto">
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

        <div>
          <div className="flex flex-col items-center">
            {formData.imagen ? (
              <img
                src={formData.imagen}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl cursor-pointer mb-2"
                onClick={() => document.getElementById("fileInput")?.click()}
              />
            ) : (
              <div
                onClick={() => document.getElementById("fileInput")?.click()}
                className="w-full h-48 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center cursor-pointer text-orange-400 hover:bg-orange-50 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 00.88 2.66L5 19h14l1.12-1.34A4 4 0 0021 15V7a4 4 0 00-4-4H7a4 4 0 00-4 4v8z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11v6m0 0l3-3m-3 3l-3-3"
                  />
                </svg>
                <span>Agregar imagen</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              id="fileInput"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>


         <button
            className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Guardando cambios" : "Guardar cambios"}
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
          className=" text-red-500 font-medium px-4 py-2 block w-full mt-4 rounded-[10px]"
          onClick={handleDelete}
        >
          Eliminar Grupo
        </button>
      </form>

      <div className="pb-[100px]"></div>
    </div>
  );
}
