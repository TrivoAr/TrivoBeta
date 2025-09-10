"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
// Removed TanStack Query
import { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";
import DescriptionEditor from "@/components/DescriptionEditor";
import dynamic from "next/dynamic";
import debounce from "lodash.debounce";


const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

interface LatLng {
  lat: number;
  lng: number;
}

interface SalidaSocial {
  _id: string;
  nombre: string;
  ubicacion: string;
  precio: string;
  deporte: string;
  fecha: string;
  hora: string;
  duracion: string;
  descripcion: string;
  localidad: string;
  whatsappLink: string;
  dificultad: string;
  telefonoOrganizador: string;
  coords?: LatLng;
  locationCoords?: LatLng;
  stravaMap: {
    id: string;
    summary_polyline: string;
    polyline: string;
    resource_state: number;
  };
  cupo: number;
  detalles: string;
  cbu?: string;
  alias?: string;
  profesorId?: string;
  imagen?: string;
}

export default function EditarSalida({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [localSalida, setLocalSalida] = useState<any>(null);
  const [markerPos, setMarkerPos] = useState<LatLng>({
    lat: -26.8333,
    lng: -65.2167,
  });

  // -------- Query salida --------
  const salidaQuery = useQuery({
    queryKey: ["salida", params.id],
    queryFn: async (): Promise<SalidaSocial> => {
      const res = await fetch(`/api/social/${params.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando salida");
      return res.json();
    },
  });

  // ✅ reemplaza onSuccess con un useEffect que corre cuando hay data
  useEffect(() => {
    if (salidaQuery.data) {
      setLocalSalida(salidaQuery.data);
      if (salidaQuery.data.locationCoords) {
        setMarkerPos(salidaQuery.data.locationCoords);
      }
      if (salidaQuery.data.imagen) {
        setPreviewUrl(salidaQuery.data.imagen);
      }
    }
  }, [salidaQuery.data]);

  // -------- Query profes --------
  const profesQuery = useQuery({
    queryKey: ["profes"],
    queryFn: async () => {
      const res = await fetch(`/api/profile/profes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando profesores");
      return res.json();
    },
  });

  // -------- Mutation update --------
  const updateMutation = useMutation<SalidaSocial, Error, SalidaSocial>({
    mutationFn: async (payload: SalidaSocial) => {
      const res = await fetch(`/api/social/${params.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo actualizar");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Salida actualizada");
      router.push("/dashboard");
    },
  });

  // -------- Mutation delete --------
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/${params.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Salida eliminada");
      router.push("/dashboard");
    },
  });

  // -------- Sync imagen inicial --------
  useEffect(() => {
    if (salidaQuery.data?.imagen) {
      setPreviewUrl(salidaQuery.data.imagen);
    }
  }, [salidaQuery.data?.imagen]);

  // -------- Handlers --------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setImagen(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const salida = salidaQuery.data;

    let imageUrl = salida.imagen || "";
    if (imagen) {
      const imageRef = ref(storage, `salidas/${uuidv4()}`);
      await uploadBytes(imageRef, imagen);
      imageUrl = await getDownloadURL(imageRef);
    }

    const payload = {
      ...localSalida,
      imagen: imageUrl,
    };

    if (!payload.profesorId) delete payload.profesorId;

    updateMutation.mutate(payload);
  };

  const handleCoordsChange = async (coords: LatLng) => {
    setMarkerPos(coords);
    const direccion = await fetchAddressFromCoords(coords.lat, coords.lng);
    setLocalSalida((prev: any) => ({
      ...prev,
      ubicacion: direccion || `Lat: ${coords.lat}, Lng: ${coords.lng}`,
      locationCoords: coords,
    }));
  };

  const handleSuggestionClick = (s: any) => {
    const coords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    salidaQuery.data.ubicacion = s.display_name;
    salidaQuery.data.locationCoords = coords;
    setMarkerPos(coords);
    setSuggestions([]);
  };

  // -------- Fetch sugerencias + reverse --------
  const fetchSuggestions = async (q: string) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      // Silently handle search suggestions error
    }
  };

  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchSuggestions, 400),
    []
  );

  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/search/reverse?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      return data.display_name as string;
    } catch (error) {
      return "Ubicación seleccionada"; // fallback
    }
  };

  // -------- UI --------
  if (salidaQuery.isLoading) return <p>Cargando...</p>;
  if (salidaQuery.isError) return <p>Error cargando salida</p>;

  const salida = salidaQuery.data;

  return (
    <div className="flex flex-col justify-center items-center bg-[#FEFBF9] mb-[150px]">
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-[#FEFBF9]">
        <h1 className="text-center font-normal text-2xl mb-4">Editar salida</h1>

        {/* Nombre */}
        <input
          name="nombre"
          defaultValue={salida.nombre}
          onChange={(e) => (salida.nombre = e.target.value)}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          placeholder="Nombre"
        />

        {/* Localidad */}
        <select
          defaultValue={salida.localidad || ""}
          onChange={(e) => (salida.localidad = e.target.value)}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Localidad</option>
          <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
          <option value="Yerba Buena">Yerba Buena</option>
          <option value="Tafi Viejo">Tafi Viejo</option>
          <option value="Otros">Otros</option>
        </select>

        {/* Deporte */}
        <select
          defaultValue={salida.deporte || ""}
          onChange={(e) => (salida.deporte = e.target.value)}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Selecciona un deporte</option>
          <option value="Running">Running</option>
          <option value="Ciclismo">Ciclismo</option>
          <option value="Trekking">Trekking</option>
          <option value="Otros">Otros</option>
        </select>

        {/* Duración */}
        <select
          defaultValue={salida.duracion || ""}
          onChange={(e) => (salida.duracion = e.target.value)}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Duración</option>
          <option value="1 hs">1 hs</option>
          <option value="2 hs">2 hs</option>
          <option value="3 hs">3 hs</option>
        </select>

        {/* Dificultad */}
        <select
          defaultValue={salida.dificultad || ""}
          onChange={(e) => (salida.dificultad = e.target.value)}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Dificultad</option>
          <option value="facil">Principiantes</option>
          <option value="media">Media</option>
          <option value="dificil">Difícil</option>
        </select>

        {/* Precio */}
        <input
          name="precio"
          defaultValue={salida.precio}
          onChange={(e) => (salida.precio = e.target.value)}
          placeholder="Precio"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        {/* Alias / CBU */}
        <input
          name="alias"
          defaultValue={salida.alias}
          onChange={(e) => (salida.alias = e.target.value)}
          placeholder="Alias/CBU"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        {/* Cupo */}
        <input
          name="cupo"
          type="number"
          defaultValue={salida.cupo}
          onChange={(e) => (salida.cupo = Number(e.target.value))}
          placeholder="Cupo"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        {/* Fecha y Hora */}
        <div className="flex gap-3 mb-3">
          <input
            type="date"
            defaultValue={salida.fecha?.split("T")[0]}
            onChange={(e) => (salida.fecha = e.target.value)}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
          />
          <input
            type="time"
            defaultValue={salida.hora}
            onChange={(e) => (salida.hora = e.target.value)}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
          />
        </div>

        {/* Descripción */}
        <DescriptionEditor
          value={salida.descripcion ?? ""}
          onChange={(val) => (salida.descripcion = val)}
          maxChars={2000}
        />

        {/* Detalles */}
        {/* <textarea
          defaultValue={salida.detalles}
          onChange={(e) => (salida.detalles = e.target.value)}
          placeholder="¿Qué incluye la salida?"
          className="w-full px-4 py-2 border rounded mb-3"
        /> */}

        {/* Teléfono */}
        <input
          name="telefonoOrganizador"
          defaultValue={salida.telefonoOrganizador}
          onChange={(e) => (salida.telefonoOrganizador = e.target.value)}
          placeholder="Teléfono organizador"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        />

        {/* WhatsApp */}
        <input
          name="whatsappLink"
          defaultValue={salida.whatsappLink}
          onChange={(e) => (salida.whatsappLink = e.target.value)}
          placeholder="Link de WhatsApp"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        />

        {/* Profesor */}
        <select
          defaultValue={salida.profesorId || ""}
          onChange={(e) => (salida.profesorId = e.target.value || undefined)}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Sin profesor</option>
          {profesQuery.data?.map((p: any) => (
            <option key={p._id} value={p._id}>
              {p.firstname} {p.lastname}
            </option>
          ))}
        </select>

        {/* Ubicación */}
        <div className="relative mb-3">
          <input
            type="text"
            name="ubicacion"
            value={localSalida?.ubicacion || ""}
            onChange={(e) =>
              setLocalSalida((prev: any) => ({
                ...prev,
                ubicacion: e.target.value,
              }))
            }
            placeholder="Buscar ubicación..."
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
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

        {/* Mapa */}
        <div className="w-full h-[300px] border border-gray-300 rounded mb-3">
          <MapWithNoSSR
            position={markerPos}
            onChange={handleCoordsChange}
            editable={true}
            showControls={true}
          />
        </div>

        {/* Imagen */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">Imagen</span>
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

        {/* Botones */}
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="bg-[#C95100] text-white w-full py-2 rounded-[20px] mt-4"
        >
          {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          type="button"
          onClick={() => deleteMutation.mutate()}
          className="w-full mt-2 text-red-500 py-3"
        >
          Eliminar salida
        </button>
      </form>
    </div>
  );
}
