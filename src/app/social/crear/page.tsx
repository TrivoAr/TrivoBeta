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
import DescriptionEditor from "@/components/DescriptionEditor";
import DescriptionMarkdown from "@/components/DescriptionMarkdown";
import { set } from "mongoose";
import { useProvinces, useLocalitiesByProvince, useLocationFromCoords } from "@/hooks/useArgentinaLocations";
import { useSponsors } from "@/hooks/useSponsors";

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
  const [descripcion, setDescripcion] = useState("");
  const [profesorSuggestions, setProfesorSuggestions] = useState<any[]>([]);

  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para provincia/localidad
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedLocality, setSelectedLocality] = useState<string>("");
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [gpsLocationDetected, setGpsLocationDetected] = useState(false);
  
  // Hooks para datos de ubicación
  const { data: provinces } = useProvinces();
  const { data: localities } = useLocalitiesByProvince(selectedProvince);
  const locationFromCoordsQuery = useLocationFromCoords();
  
  // Hook para sponsors
  const { data: sponsorsData, isLoading: sponsorsLoading, error: sponsorsError } = useSponsors();
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
    provincia: "",
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
    sponsors: [] as string[],
    profesorId: ""
  });

  const [imagen, setImagen] = useState<File | null>(null);
  const defaultCoords: LatLng = { lat: -26.8333, lng: -65.2167 };
  
  // Coordenadas centrales de cada provincia
  const provinceCoords: Record<string, LatLng> = {
    tucuman: { lat: -26.8333, lng: -65.2167 },
    buenos_aires: { lat: -37.5, lng: -59.5 },
    cordoba: { lat: -32.0, lng: -64.0 },
    santa_fe: { lat: -31.0, lng: -61.0 },
    mendoza: { lat: -34.75, lng: -68.5 },
  };

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
    
    // Actualizar mapa y marcador
    if (map.current) {
      map.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 15, // Zoom más cercano para ubicaciones específicas
        speed: 1.5,
        curve: 1.42
      });
    }
    
    if (marker.current) {
      marker.current.setLngLat([coords.lng, coords.lat]);
    }

    const direccion = await fetchAddressFromCoords(coords.lat, coords.lng);
    setQuery(direccion);
    setFormData((prev) => ({ ...prev, ubicacion: direccion }));
  };

  const handleSelectSuggestion = (item: any) => {
    const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setMarkerPos(coords);
    setFormData((prev) => ({ ...prev, coords, ubicacion: item.display_name }));
    setQuery(item.display_name);
    
    // Actualizar mapa y marcador
    if (map.current) {
      map.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 15,
        speed: 1.5,
        curve: 1.42
      });
    }
    
    if (marker.current) {
      marker.current.setLngLat([coords.lng, coords.lat]);
    };
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
      coords: undefined, // Remove the coords field since we're using locationCoords
      cupo: formData.cupo || 0, // Ensure cupo is a number
      sponsors: formData.sponsors || [], // Ensure sponsors array exists
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
      try {
        const errorData = await res.json();
        console.error("Error al crear salida social:", errorData);
        toast.error(errorData.error || "Error al crear la salida");
      } catch (e) {
        console.error("Error al crear salida social:", res.status);
        toast.error("Error al crear la salida");
      }
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

  // Función para detectar ubicación por GPS
  const detectLocationFromGPS = async () => {
    // Verificar soporte de geolocalización
    if (!navigator.geolocation) {
      toast.error("Geolocalización no soportada en este dispositivo");
      return;
    }

    // Verificar si estamos en HTTPS (requerido para GPS en producción)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast.error("GPS requiere conexión segura (HTTPS)");
      return;
    }

    setLocationDetecting(true);
    
    // Mostrar instrucciones más específicas para móviles
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const message = isMobile 
      ? "📱 Presiona 'Permitir' cuando aparezca la solicitud de ubicación"
      : "🌍 Buscando ubicación... Acepta los permisos cuando aparezcan";
    
    toast.loading(message, { 
      duration: 6000,
      id: 'gps-search'
    });
    
    // Para dispositivos móviles, mostrar toast adicional con instrucciones
    if (isMobile) {
      setTimeout(() => {
        toast("💡 Si no aparece la solicitud, verifica que la ubicación esté activada en tu dispositivo", {
          duration: 4000,
          icon: "💡"
        });
      }, 2000);
    }
    
    // Intentar verificar si los permisos ya están concedidos (solo si está disponible)
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
      // Ignorar errores de permissions API (no disponible en todos los navegadores)
    }
    
    // Llamar directamente a getCurrentPosition (esto pide permisos automáticamente)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          // Detectar provincia y localidad usando TanStack Query
          const locationData = await locationFromCoordsQuery.mutateAsync(coords);
          
          // Buscar provincia en nuestros datos
          const province = provinces?.find(p => 
            p.name.toLowerCase().includes(locationData.province.toLowerCase()) ||
            p.id === locationData.province
          );

          if (province) {
            setSelectedProvince(province.id);
            setFormData(prev => ({ ...prev, provincia: province.name }));

            // Buscar localidad en esa provincia
            const locality = province.localities.find(l => 
              l.name.toLowerCase().includes(locationData.locality.toLowerCase()) ||
              l.id === locationData.locality
            );

            if (locality) {
              setSelectedLocality(locality.id);
              setFormData(prev => ({ ...prev, localidad: locality.name }));
            } else {
              setFormData(prev => ({ ...prev, localidad: locationData.locality }));
            }
            
            // Centrar mapa en la provincia detectada si no tenemos coordenadas exactas del GPS
            if (!markerPos) {
              const provinceCenter = provinceCoords[province.id] || coords;
              setMarkerPos(provinceCenter);
              setFormData(prev => ({ ...prev, coords: provinceCenter }));
            }
          } else {
            setFormData(prev => ({ 
              ...prev, 
              provincia: locationData.province,
              localidad: locationData.locality 
            }));
            
            // Si no encontramos la provincia, al menos usar las coordenadas GPS
            if (!markerPos) {
              setMarkerPos(coords);
              setFormData(prev => ({ ...prev, coords }));
            }
          }

          // Actualizar coordenadas del mapa
          handleCoordsChange(coords);
          
          // Limpiar toast de loading y mostrar success
          toast.dismiss('gps-search');
          toast.success(`📍 Ubicación detectada: ${locationData.province}, ${locationData.locality}`);
          setGpsLocationDetected(true);
        } catch (error) {
          console.error("Error detectando ubicación:", error);
          
          // Limpiar toast de loading y mostrar error
          toast.dismiss('gps-search');
          toast.error("⚠️ Error al detectar ubicación específica");
          
          // Al menos actualizar coordenadas del mapa
          handleCoordsChange(coords);
        } finally {
          setLocationDetecting(false);
        }
      },
      (error) => {
        console.error("Error GPS:", error);
        setLocationDetecting(false);
        
        // Limpiar toast de loading
        toast.dismiss('gps-search');
        
        // Mensajes de error más específicos con iconos e instrucciones para móviles
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            if (isMobile) {
              toast.error("🙅‍♂️ Permisos denegados. Ve a Configuración > Sitios web > Ubicación y permite el acceso", { duration: 8000 });
              // Mostrar instrucciones adicionales para móviles después de un momento
              setTimeout(() => {
                toast("💡 En algunos móviles también puedes presionar el icono de candado en la barra de dirección", {
                  duration: 6000,
                  icon: "💡"
                });
              }, 1000);
            } else {
              toast.error("🙅‍♂️ Permisos denegados. Habilita ubicación en configuración del navegador", { duration: 6000 });
            }
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("📱 GPS no disponible. Verifica que esté activado en tu dispositivo", { duration: 5000 });
            break;
          case error.TIMEOUT:
            toast.error("⏱️ Tiempo agotado. Verifica tu conexión e intenta nuevamente", { duration: 4000 });
            break;
          default:
            toast.error("⚠️ Error de GPS. Intenta nuevamente", { duration: 4000 });
            break;
        }
      },
      {
        enableHighAccuracy: false, // Cambiar a false para mejor compatibilidad móvil
        timeout: 20000, // Más tiempo para móviles (20s)
        maximumAge: 30000 // Cache por 30 segundos (menos agresivo)
      }
    );
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
  
  // Actualizar posición del mapa cuando se selecciona una provincia manualmente
  useEffect(() => {
    // Validar que tenemos todo lo necesario y el mapa esté listo
    if (!selectedProvince || !provinceCoords[selectedProvince] || !map.current) {
      return;
    }

    try {
      const provinceCenter = provinceCoords[selectedProvince];
      
      // Solo actualizar si el mapa no tiene ya una posición específica del GPS
      if (!markerPos || (markerPos.lat === defaultCoords.lat && markerPos.lng === defaultCoords.lng)) {
        // Validar que el mapa esté completamente cargado
        if (map.current.isStyleLoaded()) {
          // Centrar el mapa en la provincia seleccionada
          map.current.easeTo({
            center: [provinceCenter.lng, provinceCenter.lat],
            zoom: 10, // Zoom apropiado para ver la provincia
            duration: 1000
          });
          
          // Actualizar marker position
          setMarkerPos(provinceCenter);
          
          // Mover el marcador si existe
          if (marker.current) {
            marker.current.setLngLat([provinceCenter.lng, provinceCenter.lat]);
          }
          
          // Actualizar formData con las nuevas coordenadas
          setFormData(prev => ({ ...prev, coords: provinceCenter }));
        } else {
          // Si el mapa aún no está cargado, esperar y reintentar
          const retryTimeout = setTimeout(() => {
            if (map.current && map.current.isStyleLoaded()) {
              map.current.easeTo({
                center: [provinceCenter.lng, provinceCenter.lat],
                zoom: 10,
                duration: 1000
              });
              setMarkerPos(provinceCenter);
              if (marker.current) {
                marker.current.setLngLat([provinceCenter.lng, provinceCenter.lat]);
              }
              setFormData(prev => ({ ...prev, coords: provinceCenter }));
            }
          }, 1000);
          
          return () => clearTimeout(retryTimeout);
        }
      }
    } catch (error) {
      console.error('Error actualizando posición del mapa:', error);
      // En caso de error, al menos actualizar las coordenadas sin tocar el mapa
      const provinceCenter = provinceCoords[selectedProvince];
      setMarkerPos(provinceCenter);
      setFormData(prev => ({ ...prev, coords: provinceCenter }));
    }
  }, [selectedProvince, defaultCoords.lat, defaultCoords.lng]);

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

        if (data.error) {
          return;
        } else {
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
      className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-background"
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>

      {/* Sección de Ubicación con GPS */}
      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Ubicación</h3>

          {/* Botón GPS */}
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
          
          {/* Texto explicativo mejorado */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Presiona "Usar mi ubicación" para detectar automáticamente tu provincia, localidad y posición en el mapa.
            </p>
          </div>
        </div>

        {/* Select de Provincia */}
        <div className="relative">
          {gpsLocationDetected && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
              ✓ GPS
            </div>
          )}
          <select
            name="provincia"
            value={selectedProvince}
            onChange={(e) => {
              const provinceId = e.target.value;
              setSelectedProvince(provinceId);
              setSelectedLocality(""); // Reset localidad
              setGpsLocationDetected(false); // Reset GPS indicator si cambian manualmente
            
            const province = provinces?.find(p => p.id === provinceId);
            setFormData(prev => ({ 
              ...prev, 
              provincia: province?.name || "",
              localidad: "" 
            }));
          }}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        >
          <option value="">Seleccionar Provincia</option>
          {provinces?.map(province => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
          </select>
        </div>

        {/* Select de Localidad */}
        <div className="relative">
          {gpsLocationDetected && formData.localidad && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
              ✓ GPS
            </div>
          )}
          <select
          name="localidad"
          value={selectedLocality}
          onChange={(e) => {
            const localityId = e.target.value;
            setSelectedLocality(localityId);
            setGpsLocationDetected(false); // Reset GPS indicator si cambian manualmente
            
            const locality = localities?.find(l => l.id === localityId);
            setFormData(prev => ({ 
              ...prev, 
              localidad: locality?.name || "" 
            }));
          }}
          disabled={!selectedProvince}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground disabled:opacity-50"
        >
          <option value="">
            {!selectedProvince ? "Primero selecciona una provincia" : "Seleccionar Localidad"}
          </option>
          {localities?.map(locality => (
            <option key={locality.id} value={locality.id}>
              {locality.name}
            </option>
          ))}
          </select>
        </div>

        {/* Mostrar ubicación detectada */}
        {formData.provincia && formData.localidad && (
          <div className={`p-3 border rounded-[15px] ${
            gpsLocationDetected 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-sm ${
              gpsLocationDetected ? 'text-green-700' : 'text-gray-600'
            }`}>
              {gpsLocationDetected ? (
                <>🎯 <strong>Ubicación detectada automáticamente:</strong> {formData.provincia}, {formData.localidad}</>
              ) : (
                <>📍 <strong>Ubicación seleccionada:</strong> {formData.provincia}, {formData.localidad}</>
              )}
            </p>
          </div>
        )}
      </div>

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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
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
        <option value="facil">Facil</option>
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
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>

      <label className="block">
        Fecha
        <input
          type="date"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        />
      </label>

      <label className="block">
        Hora
        <input
          type="time"
          name="hora"
          value={formData.hora}
          onChange={handleChange}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
        />
      </label>

      {/* <label className="block">
        Descripción
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Organizamos una salida de running"
          className="w-full px-3 py-4 border rounded-[15px] shadow-md"
        />
      </label> */}

      <div className="space-y-2">
        <label className="block">
          Descripción{" "}
        </label>

        <DescriptionEditor
          defaultValue={formData.descripcion}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, descripcion: val }))
          }
          maxChars={2000}
        />
      </div>
{/* 
      <label className="block">
        Que incluye la salida?
        <textarea
          name="detalles"
          value={formData.detalles}
          onChange={handleChange}
          placeholder="Seguro, guia, etc..."
          className="w-full px-3 py-4 border rounded-[15px] shadow-md"
        />
      </label> */}

      <label className="block">
        Link del grupo de WhatsApp
        <input
          name="whatsappLink"
          value={formData.whatsappLink || ""}
          onChange={handleChange}
          placeholder="https://chat.whatsapp.com/..."
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>

      <label className="block">
        Número de teléfono del organizador
        <input
          name="telefonoOrganizador"
          value={formData.telefonoOrganizador}
          onChange={handleChange}
          placeholder="+5491123456789"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
      </label>
      <label className="block">
        Imagen
        <div className="w-full h-40 bg-card border shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card text-muted-foreground"
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
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-card"
        />
        {profesorSuggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-card border shadow-md rounded-md max-h-40 overflow-y-auto z-50">
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
        
        {/* Mostrar preview del profesor seleccionado */}
        {formData.profesorId && queryProfesor && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-[15px] mt-2">
            {(() => {
              const selectedProfesor = profes.find(p => p._id === formData.profesorId);
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
                      👨‍🏫 Profesor seleccionado: {selectedProfesor.firstname} {selectedProfesor.lastname}
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
      </label>

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
              <label key={sponsor._id} className="flex items-center gap-3 p-3 border rounded-[15px] hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sponsors.includes(sponsor._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        sponsors: [...prev.sponsors, sponsor._id]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        sponsors: prev.sponsors.filter(id => id !== sponsor._id)
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
        {formData.sponsors.length > 0 && sponsorsData?.data && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-[15px]">
            <p className="text-sm font-medium text-orange-800 mb-2">
              🎯 Sponsors seleccionados ({formData.sponsors.length}):
            </p>
            <div className="space-y-2">
              {formData.sponsors.map(sponsorId => {
                const sponsor = sponsorsData.data.find(s => s._id === sponsorId);
                return sponsor ? (
                  <div key={sponsor._id} className="flex items-center gap-2">
                    {sponsor.imagen && (
                      <img 
                        src={sponsor.imagen} 
                        alt={sponsor.name}
                        className="w-6 h-6 object-cover rounded"
                      />
                    )}
                    <span className="text-sm text-orange-700">{sponsor.name}</span>
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
