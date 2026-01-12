"use client";

import { useState, useMemo } from "react";
import TopContainer from "@/components/TopContainer";
import EventModal from "@/components/EventModal";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import EmptyState from "@/components/EmptyState";
import { Toaster } from "react-hot-toast";
import { ClubDelTrekking } from "@/components/ClubDelTrekking";
import AirbnbCard from "@/components/AirbnbCard";
import EventCard from "@/components/EventCard";
import FilterModal, {
  FilterConfig,
  FilterValues,
} from "@/components/FilterModal";
import { Filter, MapPin, TrendingUp, Trash2 } from "lucide-react";
import { useAcademias, useSalidas } from "@/hooks/useHome";

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

// Filter configurations
const salidasFilterConfig: FilterConfig[] = [
  {
    key: "deporte",
    label: "Deporte",
    type: "select",
    options: [
      { value: "", label: "Todos los deportes" },
      { value: "Running", label: "Running" },
      { value: "Ciclismo", label: "Ciclismo" },
      { value: "Otros", label: "Otros" },
    ],
  },
  {
    key: "dificultad",
    label: "Dificultad",
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
    key: "ordenPrecio",
    label: "Ordenar por precio",
    type: "select",
    icon: <TrendingUp size={14} />,
    options: [
      { value: "", label: "Sin ordenar" },
      { value: "asc", label: "Menor a mayor" },
      { value: "desc", label: "Mayor a menor" },
    ],
  },
];

const academiasFilterConfig: FilterConfig[] = [
  {
    key: "deporte",
    label: "Disciplina",
    type: "select",
    options: [
      { value: "", label: "Todas las disciplinas" },
      { value: "Running", label: "Running" },
      { value: "Ciclismo", label: "Ciclismo" },
      { value: "Trekking", label: "Trekking" },
      { value: "Otros", label: "Otros" },
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
    key: "ordenPrecio",
    label: "Ordenar por precio",
    type: "select",
    icon: <TrendingUp size={14} />,
    options: [
      { value: "", label: "Sin ordenar" },
      { value: "asc", label: "Menor a mayor" },
      { value: "desc", label: "Mayor a menor" },
    ],
  },
];

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent] = useState<ModalEvent | null>(null);
  const [contentFilter, setContentFilter] = useState<"salidas" | "academias">(
    "academias"
  );
  const [selectedLocalidad, setSelectedLocalidad] = useState(
    "San Miguel de Tucuman"
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [salidasFilters, setSalidasFilters] = useState<FilterValues>({
    deporte: "",
    dificultad: "",
    localidad: "",
    ordenPrecio: "",
  });
  const [academiasFilters, setAcademiasFilters] = useState<FilterValues>({
    deporte: "",
    localidad: "",
    ordenPrecio: "",
  });

  // Fetch data with TanStack Query
  const { data: academiasData = [], isLoading: loadingAcademias } =
    useAcademias();
  const { data: salidasData = [], isLoading: loadingSalidas } = useSalidas();

  // Apply filters and sorting
  const filteredSalidas = useMemo(() => {
    let filtered = [...salidasData];

    // Apply filters
    if (salidasFilters.deporte) {
      filtered = filtered.filter((s) => s.deporte === salidasFilters.deporte);
    }
    if (
      salidasFilters.dificultad &&
      typeof salidasFilters.dificultad === "string"
    ) {
      filtered = filtered.filter(
        (s) =>
          s.dificultad?.toLowerCase() ===
          (salidasFilters.dificultad as string).toLowerCase()
      );
    }
    if (salidasFilters.localidad) {
      filtered = filtered.filter(
        (s) => s.localidad === salidasFilters.localidad
      );
    }

    // Apply sorting
    if (salidasFilters.ordenPrecio === "asc") {
      filtered.sort((a, b) => Number(a.precio) - Number(b.precio));
    } else if (salidasFilters.ordenPrecio === "desc") {
      filtered.sort((a, b) => Number(b.precio) - Number(a.precio));
    }

    return filtered;
  }, [salidasData, salidasFilters]);

  const filteredAcademias = useMemo(() => {
    let filtered = [...academiasData];

    // Apply filters
    if (academiasFilters.deporte) {
      filtered = filtered.filter(
        (a) => a.tipo_disciplina === academiasFilters.deporte
      );
    }
    if (academiasFilters.localidad) {
      filtered = filtered.filter(
        (a) => a.localidad === academiasFilters.localidad
      );
    }

    // Apply sorting
    if (academiasFilters.ordenPrecio === "asc") {
      filtered.sort((a, b) => Number(a.precio) - Number(b.precio));
    } else if (academiasFilters.ordenPrecio === "desc") {
      filtered.sort((a, b) => Number(b.precio) - Number(a.precio));
    }

    return filtered;
  }, [academiasData, academiasFilters]);

  const handleFilterApply = (filters: FilterValues) => {
    if (contentFilter === "salidas") {
      setSalidasFilters(filters);
    } else {
      setAcademiasFilters(filters);
    }
  };

  const getActiveFilterCount = () => {
    const currentFilters =
      contentFilter === "salidas" ? salidasFilters : academiasFilters;
    return Object.values(currentFilters).filter((value) => value !== "").length;
  };

  const handleClearFilters = () => {
    if (contentFilter === "salidas") {
      setSalidasFilters({
        deporte: "",
        dificultad: "",
        localidad: "",
        ordenPrecio: "",
      });
    } else {
      setAcademiasFilters({
        deporte: "",
        localidad: "",
        ordenPrecio: "",
      });
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <main className="bg-background min-h-screen text-foreground app-container py-6 space-y-6">
        <TopContainer
          selectedLocalidad={selectedLocalidad}
          setSelectedLocalidad={setSelectedLocalidad}
        />


        <ClubDelTrekking />


        <section className="space-y-4">
          <>
            {filteredSalidas.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                {filteredSalidas.map((salida) => (
                  <EventCard
                    key={salida._id}
                    event={{
                      _id: salida._id,
                      title: salida.nombre,
                      date: salida.fecha,
                      time: salida.hora,
                      price: salida.precio,
                      image: salida.imagen,
                      location: salida.ubicacion,
                      creadorId:
                        typeof salida.creador_id === "string"
                          ? salida.creador_id
                          : salida.creador_id._id,
                      localidad: salida.localidad,
                      category: salida.deporte,
                      dificultad: salida.dificultad,
                      teacher:
                        typeof salida.creador_id === "string"
                          ? ""
                          : `${salida.creador_id.firstname} ${salida.creador_id.lastname}`,
                      cupo: salida.cupo,
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin salidas disponibles"
                description="Una vez que carguemos salidas, las vas a ver acá."
                imageSrc="/assets/icons/emptyTrekking.png"
              />
            )}
          </>

        </section>
        <div className="pb-[200px]"></div>

        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent}
        />

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={handleFilterApply}
          title={
            contentFilter === "salidas"
              ? "Filtrar salidas"
              : "Filtrar academias"
          }
          filters={
            contentFilter === "salidas"
              ? salidasFilterConfig
              : academiasFilterConfig
          }
          currentValues={
            contentFilter === "salidas" ? salidasFilters : academiasFilters
          }
        />
      </main>
    </>
  );
}
