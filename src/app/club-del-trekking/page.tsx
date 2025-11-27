"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, MapPin, Calendar, Search, ChevronLeft } from "lucide-react";
import TrekkingEventCard from "@/components/TrekkingEventCard";
import EventModal from "@/components/EventModal";
import EmptyState from "@/components/EmptyState";
import FilterModal, {
  FilterConfig,
  FilterValues,
} from "@/components/FilterModal";
import { Toaster } from "react-hot-toast";

type EventType = {
  _id: string;
  title: string;
  date: string;
  time: string;
  price: string;
  image: string;
  imagenes?: string[];
  location: string;
  creadorId: string;
  localidad: string;
  category: string;
  locationCoords: {
    lat: number;
    lng: number;
  };
  teacher: string;
  dificultad?: string;
  stravaMap?: {
    id: string;
    summary_polyline: string;
    polyline: string;
    resource_state: number;
  };
  cupo: number;
};

type ModalEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  localidad: string;
  teacher: string;
  creadorId: string;
  participants: string[];
  locationCoords: {
    lat: number;
    lng: number;
  };
};

// Filter configuration for the FilterModal
const filterConfig: FilterConfig[] = [
  {
    key: "dificultad",
    label: "Nivel de dificultad",
    type: "select",
    options: [
      { value: "", label: "Todas las dificultades" },
      { value: "facil", label: "Facil" },
      { value: "media", label: "Media" },
      { value: "dificil", label: "Dificil" },
    ],
  },
  {
    key: "localidad",
    label: "Ubicación",
    type: "select",
    icon: <MapPin size={14} />,
    options: [
      { value: "", label: "Todas las localidades" },
      { value: "San Miguel de Tucuman", label: "San Miguel de Tucumán" },
      { value: "Yerba Buena", label: "Yerba Buena" },
      { value: "Tafi Viejo", label: "Tafí Viejo" },
      { value: "Las Talitas", label: "Las Talitas" },
      { value: "Banda del Rio Sali", label: "Banda del Río Salí" },
    ],
  },
  {
    key: "nocturna",
    label: "Horario",
    type: "select",
    options: [
      { value: "", label: "Todos los horarios" },
      { value: "diurna", label: "Salidas diurnas" },
      { value: "nocturna", label: "Salidas nocturnas" },
    ],
  },
];

export default function ClubDelTrekking() {
  const router = useRouter();
  const [events, setEvents] = useState<EventType[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterValues>({
    dificultad: "",
    localidad: "",
    nocturna: "",
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent] = useState<ModalEvent | null>(null);

  useEffect(() => {
    const fetchTrekkingEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/social");
        const rawData = await res.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter for trekking events from today onwards
        const trekkingEvents = rawData
          .filter((item: any) => {
            // Filter by sport type
            if (item.deporte?.toLowerCase() !== "trekking") return false;

            // Filter by date (today and future)
            if (!item.fecha) return false;
            const [year, month, day] = item.fecha.split("-").map(Number);
            const eventDate = new Date(year, month - 1, day);
            return eventDate >= today;
          })
          .map((item: any) => ({
            _id: item._id,
            title: item.nombre,
            date: item.fecha,
            time: item.hora,
            price: item.precio,
            image: item.imagen,
            imagenes: item.imagenes, // Agregar el array de imágenes
            category: item.deporte,
            creadorId: item.creador_id?._id || item.creador_id,
            localidad: item.localidad,
            location: item.ubicacion,
            locationCoords: item.locationCoords,
            dificultad: item.dificultad,
            teacher: item.creador_id?.firstname || "Sin profe",
            cupo: item.cupo,
            stravaMap: item.stravaMap,
          }));

        setEvents(trekkingEvents);
        setFilteredEvents(trekkingEvents);
      } catch (error) {
        // Error al obtener eventos de trekking
      } finally {
        setLoading(false);
      }
    };

    fetchTrekkingEvents();
  }, []);

  useEffect(() => {
    // Apply search and filters
    let filtered = events;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.teacher.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (filters.dificultad) {
      filtered = filtered.filter(
        (event) =>
          event.dificultad?.toLowerCase() ===
          (filters.dificultad as string).toLowerCase()
      );
    }

    // Apply location filter
    if (filters.localidad) {
      filtered = filtered.filter(
        (event) => event.localidad === filters.localidad
      );
    }

    // Apply nocturna filter (based on time)
    if (filters.nocturna) {
      filtered = filtered.filter((event) => {
        if (!event.time) return false;

        // Parse time in HH:MM format
        const [hours] = event.time.split(":").map(Number);

        if (filters.nocturna === "nocturna") {
          // Nocturna: 18:00 (6 PM) onwards or before 06:00 (6 AM)
          return hours >= 18 || hours < 6;
        } else if (filters.nocturna === "diurna") {
          // Diurna: 06:00 (6 AM) to 17:59 (5:59 PM)
          return hours >= 6 && hours < 18;
        }
        return true;
      });
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, filters]);

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const getActiveFilterCount = () => {
    const count = Object.values(filters).filter((value) => value !== "").length;
    return count;
  };

  return (
    <>
      <Toaster position="top-center" />
      <main className="bg-background min-h-screen text-foreground w-[390px] mx-auto">
        {/* Airbnb-style Header - Clean and Elevated */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
          {/* Navigation Bar */}
          <div className="px-5 pt-4 pb-3">
            <button
              onClick={() => router.push("/home")}
              className="flex items-center gap-2 group mb-4 -ml-2 rounded-full border shadow-md"
              aria-label="Volver al inicio"
            >
              <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                <ChevronLeft
                  size={18}
                  className="text-gray-700 dark:text-gray-300"
                  strokeWidth={2.5}
                />
              </div>
            </button>
          </div>

          {/* Hero Section with Mountain Pattern Banner */}
          <div className="px-5 pb-6">
            <div className="relative overflow-hidden rounded-2xl">
              {/* Fondo gradiente con patrón de montañas */}
              <div className="relative bg-gradient-to-br from-[#C95100] via-[#A03D00] to-[#7A2D00] p-6 min-h-[160px]">
                {/* Patrón de montañas abstracto */}
                <div className="absolute inset-0 opacity-20">
                  <svg viewBox="0 0 400 160" className="w-full h-full">
                    <path
                      d="M0,160 L0,100 L50,60 L100,80 L150,40 L200,70 L250,30 L300,50 L350,20 L400,40 L400,160 Z"
                      fill="currentColor"
                      className="text-white"
                    />
                    <path
                      d="M0,160 L0,120 L60,90 L120,110 L180,70 L240,100 L300,60 L360,80 L400,50 L400,160 Z"
                      fill="currentColor"
                      className="text-white opacity-60"
                    />
                  </svg>
                </div>

                {/* Contenido del banner */}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Icono de montaña */}
                    <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-white"
                      >
                        <path
                          d="M5 16L8 10L12 14L16 8L19 12V16H5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 20H22"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <h1 className="text-white font-bold text-lg leading-tight">
                      Club del Trekking
                    </h1>
                  </div>

                  <p className="text-white/90 text-sm font-medium mb-3 leading-relaxed">
                    Aventuras únicas en la naturaleza
                  </p>

                  {/* Stats Pills */}
                  <div className="flex gap-2">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <span className="text-white text-xs font-semibold">
                        {filteredEvents.length} trekkings disponibles
                      </span>
                    </div>
                  </div>
                </div>

                {/* Efectos de brillo */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl transform -translate-x-8 -translate-y-8"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-8 translate-y-8"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Search and Filter Section */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Buscar trekkings, ubicaciones o instructores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-[30px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C95100] focus:border-[#C95100] transition-colors shadow-md"
              />
            </div>

            {/* Filter Button */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2  rounded-[30px] shadow-md font-medium transition-all duration-200 ${
                    getActiveFilterCount() > 0
                      ? "bg-[#C95100] text-white hover:bg-[#A03D00] shadow-md"
                      : "border border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <Filter
                    size={16}
                    className={
                      getActiveFilterCount() > 0
                        ? "text-white"
                        : "text-[#C95100]"
                    }
                  />
                  <span className="text-sm">
                    {getActiveFilterCount() > 0
                      ? `${getActiveFilterCount()} filtro${getActiveFilterCount() !== 1 ? "s" : ""}`
                      : "Filtros"}
                  </span>
                </button>

                {/* Results Counter */}
                {(searchTerm || getActiveFilterCount() > 0) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={14} className="text-[#C95100]" />
                    <span>
                      {filteredEvents.length} resultado
                      {filteredEvents.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Active Filter Chips */}
              {getActiveFilterCount() > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    Filtros activos:
                  </span>

                  {/* Difficulty Filter Chip */}
                  {filters.dificultad && (
                    <div className="flex items-center gap-1 bg-[#C95100]/10 border border-[#C95100]/20 rounded-full px-3 py-1">
                      <span className="text-xs font-medium text-[#C95100]">
                        {
                          filterConfig
                            .find((f) => f.key === "dificultad")
                            ?.options.find(
                              (o) => o.value === filters.dificultad
                            )?.label
                        }
                      </span>
                      <button
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, dificultad: "" }))
                        }
                        className="ml-1 text-[#C95100] hover:text-[#A03D00] transition-colors"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Location Filter Chip */}
                  {filters.localidad && (
                    <div className="flex items-center gap-1 bg-[#C95100]/10 border border-[#C95100]/20 rounded-full px-3 py-1">
                      <MapPin size={10} className="text-[#C95100]" />
                      <span className="text-xs font-medium text-[#C95100]">
                        {
                          filterConfig
                            .find((f) => f.key === "localidad")
                            ?.options.find((o) => o.value === filters.localidad)
                            ?.label
                        }
                      </span>
                      <button
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, localidad: "" }))
                        }
                        className="ml-1 text-[#C95100] hover:text-[#A03D00] transition-colors"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Nocturna Filter Chip */}
                  {filters.nocturna && (
                    <div className="flex items-center gap-1 bg-[#C95100]/10 border border-[#C95100]/20 rounded-full px-3 py-1">
                      <Calendar size={10} className="text-[#C95100]" />
                      <span className="text-xs font-medium text-[#C95100]">
                        {
                          filterConfig
                            .find((f) => f.key === "nocturna")
                            ?.options.find((o) => o.value === filters.nocturna)
                            ?.label
                        }
                      </span>
                      <button
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, nocturna: "" }))
                        }
                        className="ml-1 text-[#C95100] hover:text-[#A03D00] transition-colors"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Search Term Chip */}
                  {searchTerm && (
                    <div className="flex items-center gap-1 bg-[#C95100]/10 border border-[#C95100]/20 rounded-full px-3 py-1">
                      <Search size={10} className="text-[#C95100]" />
                      <span className="text-xs font-medium text-[#C95100]">
                        &quot;
                        {searchTerm.length > 15
                          ? searchTerm.substring(0, 15) + "..."
                          : searchTerm}
                        &quot;
                      </span>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 text-[#C95100] hover:text-[#A03D00] transition-colors"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Clear All Button */}
                  {(getActiveFilterCount() > 1 ||
                    (getActiveFilterCount() > 0 && searchTerm)) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilters({
                          dificultad: "",
                          localidad: "",
                          nocturna: "",
                        });
                      }}
                      className="text-xs text-[#C95100] hover:text-[#A03D00] font-medium transition-colors underline"
                    >
                      Limpiar todo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Events Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Próximas aventuras
                </h2>
                <p className="text-sm text-muted-foreground">
                  Trekkings disponibles en tu zona
                </p>
              </div>
              {filteredEvents.length > 0 && (
                <div className="bg-[#C95100] rounded-full px-3 py-1">
                  <span className="text-white text-sm font-medium">
                    {filteredEvents.length}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C95100] border-t-transparent"></div>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <TrekkingEventCard
                    key={event._id}
                    event={event}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay trekkings disponibles"
                description={
                  searchTerm || getActiveFilterCount() > 0
                    ? "No se encontraron trekkings con los criterios de búsqueda. Prueba ajustando los filtros o el término de búsqueda."
                    : "Aún no hay trekkings programados. ¡Vuelve pronto para nuevas aventuras!"
                }
                imageSrc="/assets/icons/emptyTrekking.png"
              />
            )}
          </section>

          {/* Bottom padding for navigation */}
          <div className="pb-[200px]"></div>
        </div>

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={handleApplyFilters}
          title="Filtrar trekkings"
          filters={filterConfig}
          currentValues={filters}
        />

        {/* Event Modal */}
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          event={selectedEvent}
        />
      </main>
    </>
  );
}
