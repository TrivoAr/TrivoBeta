"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo, use } from "react";
import toast, { Toaster } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorageInstance } from "@/libs/firebaseConfig";
import DescriptionEditor from "@/components/DescriptionEditor";
import dynamic from "next/dynamic";
import debounce from "lodash.debounce";
import {
  useProvinces,
  useLocalitiesByProvince,
  useLocationFromCoords,
} from "@/hooks/useArgentinaLocations";
import { useSponsors } from "@/hooks/useSponsors";

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
  sponsors?: (string | { _id: string })[];
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

  // Estados para provincia/localidad
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedLocality, setSelectedLocality] = useState<string>("");

  // Hooks para Argentina locations
  const { data: provinces = [], isLoading: provincesLoading } = useProvinces();
  const { data: localities = [], isLoading: localitiesLoading } =
    useLocalitiesByProvince(selectedProvince);

  // Hook para sponsors
  const {
    data: sponsorsData,
    isLoading: sponsorsLoading,
    error: sponsorsError,
  } = useSponsors();

  // -------- Query salida --------
  const salidaQuery = useQuery({
    queryKey: ["salida", id],
    queryFn: async (): Promise<SalidaSocial> => {
      const res = await fetch(`/api/social/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando salida");
      return res.json();
    },
  });

  // ✅ reemplaza onSuccess con un useEffect que corre cuando hay data
  useEffect(() => {
    if (salidaQuery.data) {
      // Asegurar que sponsors sea un array
      const salidaData = {
        ...salidaQuery.data,
        sponsors: Array.isArray(salidaQuery.data.sponsors)
          ? salidaQuery.data.sponsors.map((s) =>
            typeof s === "string" ? s : s._id
          )
          : [],
      };
      setLocalSalida(salidaData);
      if (salidaQuery.data.locationCoords) {
        setMarkerPos(salidaQuery.data.locationCoords);
      }
      if (salidaQuery.data.imagen) {
        setPreviewUrl(salidaQuery.data.imagen);
      }
    }
  }, [salidaQuery.data]);

  // Mapear localidad existente a provincia/localidad cuando se cargan los datos
  useEffect(() => {
    if (salidaQuery.data?.localidad && provinces.length > 0) {
      // Buscar en qué provincia está esta localidad
      for (const province of provinces) {
        const locality = province.localities.find(
          (l) =>
            l.name.toLowerCase() === salidaQuery.data.localidad.toLowerCase()
        );
        if (locality) {
          setSelectedProvince(province.id);
          setSelectedLocality(locality.id);
          break;
        }
      }
    }
  }, [salidaQuery.data?.localidad, provinces]);

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
      const res = await fetch(`/api/social/${id}`, {
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
      const res = await fetch(`/api/social/${id}`, {
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
      const storage = await getStorageInstance();
      const imageRef = ref(storage, `salidas/${uuidv4()}`);
      await uploadBytes(imageRef, imagen);
      imageUrl = await getDownloadURL(imageRef);
    }

    const payload = {
      ...localSalida,
      imagen: imageUrl,
    };

    if (!payload.profesorId) delete payload.profesorId;
    if (!payload.sponsors || payload.sponsors.length === 0)
      delete payload.sponsors;

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
    setLocalSalida((prev: any) => ({
      ...prev,
      ubicacion: s.display_name,
      locationCoords: coords,
    }));
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
    <div className="flex flex-col justify-center items-center bg-background mb-[150px]">
      <Toaster position="top-center" />
      <form
        onSubmit={handleSubmit}
        className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-background"
      >
        <h1 className="text-center font-normal text-2xl mb-4">Editar salida</h1>

        {/* Nombre */}
        <input
          name="nombre"
          value={localSalida?.nombre || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({ ...prev, nombre: e.target.value }))
          }
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
          placeholder="Nombre"
        />

        {/* Localidad - Placeholder for province/locality system */}
        <select
          value={localSalida?.localidad || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({
              ...prev,
              localidad: e.target.value,
            }))
          }
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        >
          <option value="">Localidad</option>
          <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
          <option value="Yerba Buena">Yerba Buena</option>
          <option value="Tafi Viejo">Tafi Viejo</option>
          <option value="Otros">Otros</option>
        </select>

        {/* Deporte */}
        <select
          value={localSalida?.deporte || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({
              ...prev,
              deporte: e.target.value,
            }))
          }
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        >
          <option value="">Selecciona un deporte</option>
          <option value="Running">Running</option>
          <option value="Ciclismo">Ciclismo</option>
          <option value="Trekking">Trekking</option>
          <option value="Otros">Otros</option>
        </select>

        {/* Duración */}
        <select
          value={localSalida?.duracion || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({
              ...prev,
              duracion: e.target.value,
            }))
          }
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        >
          <option value="">Duración</option>
          <option value="1 hs">1 hs</option>
          <option value="2 hs">2 hs</option>
          <option value="3 hs">3 hs</option>
        </select>

        {/* Dificultad */}
        <select
          value={localSalida?.dificultad || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({
              ...prev,
              dificultad: e.target.value,
            }))
          }
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        >
          <option value="">Dificultad</option>
          <option value="facil">Principiantes</option>
          <option value="media">Media</option>
          <option value="dificil">Difícil</option>
        </select>

        {/* Precio */}
        <input
          name="precio"
          value={localSalida?.precio || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({ ...prev, precio: e.target.value }))
          }
          placeholder="Precio"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />

        {/* Alias / CBU */}
        <input
          name="alias"
          value={localSalida?.alias || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({ ...prev, alias: e.target.value }))
          }
          placeholder="Alias/CBU"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />

        {/* Cupo */}
        <input
          name="cupo"
          type="number"
          value={localSalida?.cupo || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({
              ...prev,
              cupo: Number(e.target.value),
            }))
          }
          placeholder="Cupo"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />

        {/* Fecha y Hora */}
        <div className="flex gap-3 mb-3">
          <input
            type="date"
            value={localSalida?.fecha?.split("T")[0] || ""}
            onChange={(e) =>
              setLocalSalida((prev: any) => ({
                ...prev,
                fecha: e.target.value,
              }))
            }
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
          />
          <input
            type="time"
            value={localSalida?.hora || ""}
            onChange={(e) =>
              setLocalSalida((prev: any) => ({ ...prev, hora: e.target.value }))
            }
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
          />
        </div>

        {/* Descripción */}
        <DescriptionEditor
          value={localSalida?.descripcion ?? ""}
          onChange={(val) =>
            setLocalSalida((prev: any) => ({ ...prev, descripcion: val }))
          }
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
          value={localSalida?.telefonoOrganizador || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({
              ...prev,
              telefonoOrganizador: e.target.value,
            }))
          }
          placeholder="Teléfono organizador"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        />

        {/* WhatsApp */}
        <input
          name="whatsappLink"
          value={localSalida?.whatsappLink || ""}
          onChange={(e) =>
            setLocalSalida((prev: any) => ({
              ...prev,
              whatsappLink: e.target.value,
            }))
          }
          placeholder="Link de WhatsApp"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        />

        {/* Profesor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Profesor (opcional)
          </label>

          <select
            value={localSalida?.profesorId || ""}
            onChange={(e) =>
              setLocalSalida((prev: any) => ({
                ...prev,
                profesorId: e.target.value || undefined,
              }))
            }
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
          >
            <option value="">Sin profesor</option>
            {profesQuery.data?.map((p: any) => (
              <option key={p._id} value={p._id}>
                {p.firstname} {p.lastname}
              </option>
            ))}
          </select>

          {/* Mostrar preview del profesor seleccionado */}
          {localSalida?.profesorId && profesQuery.data && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-[15px]">
              {(() => {
                const selectedProfesor = profesQuery.data.find(
                  (p) => p._id === localSalida.profesorId
                );
                return selectedProfesor ? (
                  <div className="flex items-center gap-3">
                    {selectedProfesor.imagen && (
                      <img
                        src={selectedProfesor.imagen}
                        alt={`${selectedProfesor.firstname} ${selectedProfesor.lastname}`}
                        className="w-12 h-12 object-cover rounded-full border-2 border-blue-300"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        👨‍🏫 Profesor seleccionado: {selectedProfesor.firstname}{" "}
                        {selectedProfesor.lastname}
                      </p>
                      <p className="text-xs text-blue-600">
                        Este profesor aparecerá como instructor de la salida
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Selector de Sponsor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Sponsor (opcional)
          </label>

          {sponsorsLoading ? (
            <div className="w-full px-4 py-4 border shadow-md rounded-[15px] bg-gray-100 text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Cargando sponsors...
            </div>
          ) : sponsorsError ? (
            <div className="w-full px-4 py-4 border border-red-200 shadow-md rounded-[15px] bg-red-50 text-red-600">
              Error al cargar sponsors
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">
                Selecciona uno o más sponsors (opcional):
              </div>
              {sponsorsData?.data?.map((sponsor) => (
                <label
                  key={sponsor._id}
                  className="flex items-center gap-3 p-3 border rounded-[15px] hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={
                      localSalida?.sponsors?.includes(sponsor._id) || false
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLocalSalida((prev: any) => ({
                          ...prev,
                          sponsors: [...(prev.sponsors || []), sponsor._id],
                        }));
                      } else {
                        setLocalSalida((prev: any) => ({
                          ...prev,
                          sponsors: (prev.sponsors || []).filter(
                            (id: string) => id !== sponsor._id
                          ),
                        }));
                      }
                    }}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  {sponsor.imagen && (
                    <img
                      src={sponsor.imagen}
                      alt={sponsor.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <span className="text-sm font-medium">{sponsor.name}</span>
                </label>
              ))}
            </div>
          )}

          {/* Mostrar preview de sponsors seleccionados */}
          {localSalida?.sponsors &&
            localSalida.sponsors.length > 0 &&
            sponsorsData?.data && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-[15px]">
                <p className="text-sm font-medium text-orange-800 mb-2">
                  🎯 Sponsors seleccionados ({localSalida.sponsors.length}):
                </p>
                <div className="space-y-2">
                  {localSalida.sponsors.map((sponsorId) => {
                    const sponsor = sponsorsData.data.find(
                      (s) => s._id === sponsorId
                    );
                    return sponsor ? (
                      <div
                        key={sponsor._id}
                        className="flex items-center gap-2"
                      >
                        {sponsor.imagen && (
                          <img
                            src={sponsor.imagen}
                            alt={sponsor.name}
                            className="w-6 h-6 object-cover rounded"
                          />
                        )}
                        <span className="text-sm text-orange-700">
                          {sponsor.name}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
                <p className="text-xs text-orange-600 mt-2">
                  Estos sponsors aparecerán asociados a tu salida
                </p>
              </div>
            )}
        </div>

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
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
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
