"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search, Bike, Footprints, Mountain, Dumbbell } from "lucide-react";
import TrailCard from "@/components/TrailCard";
import EmptyState from "@/components/EmptyState";
import FilterModal, {
  FilterConfig,
  FilterValues,
} from "@/components/FilterModal";

type EventType = {
  _id: string;
  nombre: string;
  fecha: string;
  hora: string;
  precio: string;
  imagen: string;
  ubicacion: string;
  creador_id: any;
  localidad: string;
  deporte: string;
  locationCoords: {
    lat: number;
    lng: number;
  };
  dificultad?: string;
  cupo: number;
  stravaMap?: any;
};

// Sport categories for filtering
const sportCategories = [
  { id: "all", label: "Todo", icon: Dumbbell, sport: "" },
  { id: "running", label: "Running", icon: Footprints, sport: "running" },
  { id: "cycling", label: "Ciclismo", icon: Bike, sport: "cycling" },
  { id: "trekking", label: "Trekking", icon: Mountain, sport: "trekking" },
];

// Filter configuration
const filterConfig: FilterConfig[] = [
  {
    key: "dificultad",
    label: "Dificultad",
    type: "select",
    options: [
      { value: "", label: "Todas las dificultades" },
      { value: "facil", label: "Fácil" },
      { value: "media", label: "Moderado" },
      { value: "dificil", label: "Difícil" },
    ],
  },
  {
    key: "localidad",
    label: "Ubicación",
    type: "select",
    options: [
      { value: "", label: "Todas las localidades" },
      { value: "San Miguel de Tucuman", label: "San Miguel de Tucumán" },
      { value: "Yerba Buena", label: "Yerba Buena" },
      { value: "Tafi Viejo", label: "Tafí Viejo" },
      { value: "Las Talitas", label: "Las Talitas" },
      { value: "Banda del Rio Sali", label: "Banda del Río Salí" },
    ],
  },
];

export default function DescubrirPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventType[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [filters, setFilters] = useState<FilterValues>({
    dificultad: "",
    localidad: "",
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/social");
        const rawData = await res.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter events from today onwards
        const upcomingEvents = rawData.filter((item: any) => {
          if (!item.fecha) return false;
          const [year, month, day] = item.fecha.split("-").map(Number);
          const eventDate = new Date(year, month - 1, day);
          return eventDate >= today;
        });

        setEvents(upcomingEvents);
        setFilteredEvents(upcomingEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Apply all filters
    let filtered = events;

    // Sport filter
    if (selectedSport !== "all") {
      const sportFilter = sportCategories.find((s) => s.id === selectedSport)
        ?.sport;
      filtered = filtered.filter(
        (event) => event.deporte?.toLowerCase() === sportFilter
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.localidad?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Difficulty filter
    if (filters.dificultad) {
      filtered = filtered.filter(
        (event) =>
          event.dificultad?.toLowerCase() ===
          (filters.dificultad as string).toLowerCase()
      );
    }

    // Location filter
    if (filters.localidad) {
      filtered = filtered.filter(
        (event) => event.localidad === filters.localidad
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedSport, filters]);

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "").length;
  };

  const handleFavoriteToggle = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const handleCardClick = (eventId: string) => {
    router.push(`/social/${eventId}`);
  };

  return (
    <main className="bg-background min-h-screen text-foreground w-[390px] mx-auto">
      {/* Minimal Header */}
      <div className="bg-background px-5 pt-6 pb-4">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h1 className="text-foreground font-bold text-2xl mb-1">Descubrir</h1>
            <p className="text-muted-foreground text-sm">
              Encuentra tu próxima aventura deportiva
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Buscar salidas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C95100] focus:border-[#C95100] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Sport Category Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {sportCategories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedSport === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedSport(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-[#C95100] text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon size={16} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Filter Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                getActiveFilterCount() > 0
                  ? "bg-[#C95100] text-white shadow-md"
                  : "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Filter size={16} />
              <span>
                {getActiveFilterCount() > 0
                  ? `${getActiveFilterCount()} filtro${getActiveFilterCount() !== 1 ? "s" : ""}`
                  : "Filtros"}
              </span>
            </button>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {filteredEvents.length} resultado{filteredEvents.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Active filters chips */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.dificultad && (
              <div className="flex items-center gap-1.5 bg-[#C95100]/10 border border-[#C95100]/20 rounded-full px-3 py-1">
                <span className="text-xs font-medium text-[#C95100]">
                  {
                    filterConfig
                      .find((f) => f.key === "dificultad")
                      ?.options.find((o) => o.value === filters.dificultad)
                      ?.label
                  }
                </span>
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, dificultad: "" }))
                  }
                  className="text-[#C95100] hover:text-[#A03D00]"
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
            {filters.localidad && (
              <div className="flex items-center gap-1.5 bg-[#C95100]/10 border border-[#C95100]/20 rounded-full px-3 py-1">
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
                  className="text-[#C95100] hover:text-[#A03D00]"
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
          </div>
        )}

        {/* Events Grid - AllTrails Style */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#C95100] border-t-transparent"></div>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredEvents.map((event, index) => (
              <TrailCard
                key={event._id}
                id={event._id}
                title={event.nombre}
                image={event.imagen}
                location={event.ubicacion}
                localidad={event.localidad}
                difficulty={event.dificultad as "facil" | "media" | "dificil"}
                category={event.deporte}
                distance={event.stravaMap ? "5.2 km" : undefined}
                duration={event.hora ? `${event.hora}` : undefined}
                rating={4.5}
                reviewCount={12}
                isFavorite={favorites.has(event._id)}
                onFavoriteToggle={handleFavoriteToggle}
                onClick={() => handleCardClick(event._id)}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay salidas disponibles"
            description={
              searchTerm || getActiveFilterCount() > 0 || selectedSport !== "all"
                ? "No se encontraron salidas con los criterios de búsqueda. Intenta ajustar los filtros."
                : "Aún no hay salidas programadas. ¡Vuelve pronto para nuevas aventuras!"
            }
            imageSrc="/assets/icons/emptyExplication.png"
          />
        )}

        {/* Bottom padding for navigation */}
        <div className="pb-24"></div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        title="Filtrar salidas"
        filters={filterConfig}
        currentValues={filters}
      />
    </main>
  );
}
