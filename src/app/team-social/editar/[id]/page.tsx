"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { PATCH } from "@/app/api/grupos/route";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import debounce from "lodash.debounce";


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
    ubicacion: "",
    imagen: "",
    localidad: "",
    whatsappLink: "",
    telefonoOrganizador: "",
    locationCoords: { lat: 0, lng: 0 },
  });

    useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/team-social/${params.id}`);
        const data = await res.json();
        setFormData(data);
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
  }, [params.id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await fetch(`/api/team-social/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        lat: markerPos.lat,
        lng: markerPos.lng,
        locationCoords: markerPos,
      }),
    });

    toast.success("Social team actualizado");
    router.push("/dashboard");
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
    <div className="flex flex-col justify-center items-center bg-[#FEFBF9]">
      <Toaster position="top-center" /> 
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
          <h1 className="text-center font-normal text-2xl">
            Editar Social Team
          </h1>
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
          <input
            type="text"
            name="precio"
            placeholder="Precio"
            value={formData.precio}
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
