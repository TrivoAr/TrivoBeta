"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import debounce from "lodash.debounce";
import { confirmActionToast } from "@/app/utils/confirmActionToast";

interface LatLng {
  lat: number;
  lng: number;
}

interface Salida {
  nombre: string;
  descripcion: string;
  lat: number;
  lng: number;
}

export default function EditarSalida({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    deporte: "",
    fecha: "",
    hora: "",
    ubicacion: "",
    localidad: "",
    whatsappLink: "",
    telefonoOrganizador: "",
    imagen: "",
    locationCoords: { lat: 0, lng: 0 },
  });

  const [markerPos, setMarkerPos] = useState<LatLng>({ lat: 0, lng: 0 });
  const defaultCoords = { lat: -26.8333, lng: -65.2167 };

  // useEffect(() => {
  //    let isMounted = true;
  //    const toastId = toast.loading("Cargando datos de la salida...");

  //   const fetchData = async () => {
  //     try {
  //       const res = await fetch(`/api/social/${params.id}`);
  //       const data = await res.json();
  //       if (!isMounted) return;
  //       setFormData(data);
  //       if (data.locationCoords) {
  //         setMarkerPos(data.locationCoords);
  //       } else {
  //         setMarkerPos(defaultCoords);
  //       }

  //     toast.dismiss(toastId);
  //     toast.success("Datos cargados con éxito");
  //     } catch (err) {
  //       console.error("Error cargando datos:", err);
  //       toast.dismiss(toastId);
  //     toast.error("Error cargando los datos");
  //     }
  //   };

  //   fetchData();
  //   return () => {
  //   isMounted = false;
  // };
  // }, [params.id]);

  useEffect(() => {
  toast.promise(
    fetch(`/api/social/${params.id}`).then((res) => res.json()).then((data) => {
      setFormData(data);
      setMarkerPos(data.locationCoords || defaultCoords);
    }),
    {
      loading: "Cargando datos de la salida...",
      success: "Datos cargados con éxito",
      error: "Error al cargar los datos",
    }
  );
}, [params.id]);


  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await fetch(`/api/social/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        lat: markerPos.lat,
        lng: markerPos.lng,
        locationCoords: markerPos,
      }),
    });
    toast.success("Salida Actualizada");
    router.push("/dashboard");
  };

  const handleDelete = async () => {
    // const confirm = window.confirm(
    //   "¿Estás seguro que querés eliminar esta salida?"
    // );
    // if (!confirm) return;

    // await fetch(`/api/social/${params.id}`, { method: "DELETE" });
    // router.push("/dashboard");

    confirmActionToast({
      message: "¿Eliminar grupo?",
      description: "Esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      loadingMessage: "Eliminando grupo...",
      successMessage: "Salida eliminada con éxito",
      errorMessage: "No se pudo eliminar el grupo",
      onConfirm: async () => {
        await fetch(`/api/social/${params.id}`, { method: "DELETE" });
        setTimeout(() => {
          router.push("/dashboard");
        }, 200);
      },
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
    <div className="flex flex-col justify-center items-center bg-[#FEFBF9] mb-[150px]">
      <button
        onClick={() => router.back()}
        className="text-[#C76C01] self-start bg-white shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center ml-5 mt-5"
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
          <h1 className="text-center font-normal text-2xl">Editar salida</h1>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Título"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <select
            name="localidad"
            value={formData.localidad}
            onChange={handleChange}
            className="w-full p-4  border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
            className="w-full p-4  border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="Running">Running</option>
            <option value="Ciclismo">Ciclismo</option>
            <option value="Trekking">Trekking</option>
            <option value="Otros">Otros</option>
          </select>

          <div className="flex gap-4">
            <input
              type="date"
              name="fecha"
              value={formData.fecha.split("T")[0]}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

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

          <input
            type="text"
            name="telefonoOrganizador"
            placeholder="+5491123456789"
            value={formData.telefonoOrganizador}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <input
            type="text"
            name="whatsappLink"
            placeholder="https://chat.whatsapp.com/..."
            value={formData.whatsappLink}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

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
            onClick={handleDelete}
            className="w-full mt-2 text-red-500 py-3"
          >
            Eliminar salida
          </button>
        </div>
      </form>
      <div className="pb-[300px]"></div>
    </div>
  );
}
