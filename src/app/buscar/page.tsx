"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopContainer from "@/components/TopContainer";
import SearchResultCard from "@/components/SearchResultCard";
import SearchFilters from "@/components/SearchFilters";

type Academia = {
  _id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
  imagen?: string;
  localidad: string;
  precio?: string;
  clase_gratis: boolean;
};

type SalidaSocial = {
  _id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  localidad: string;
  deporte: string;
  creador_id: any;
  imagen?: string;
  precio?: string;
  dificultad?: string;
};

type TeamSocial = {
  _id: string;
  nombre: string;
  descripcion: string;
  deporte: string;
  lugar: string;
  creadorId: string;
  imagen?: string;
  precio?: string;
  cupo?: number;
  fecha: string;
};

type SearchResult = {
  id: string;
  type: "academia" | "salida" | "team-social";
  data: Academia | SalidaSocial | TeamSocial;
};

const disciplines = [
  {
    key: "todos",
    label: "Todos",
    icon: "/assets/icons/terrain_40dp_FFB86A.svg",
  },
  {
    key: "running",
    label: "Running",
    icon: "/assets/icons/directions_run_40dp_FFB86A.svg",
  },
  {
    key: "ciclismo",
    label: "Ciclismo",
    icon: "/assets/icons/directions_bike_40dp_FFB86A.svg",
  },
  {
    key: "trekking",
    label: "Trekking",
    icon: "/assets/icons/hiking_40dp_FFB86A.svg",
  },
];

const eventTypes = [
  { key: "todos", label: "Todos", color: "#6B7280" },
  { key: "academia", label: "Academias", color: "#EA580C" },
  { key: "salida", label: "Salidas", color: "#2563EB" },
  { key: "team-social", label: "Teams", color: "#16A34A" },
];

export default function BuscarPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("todos");
  const [selectedEventType, setSelectedEventType] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [academiasRes, salidasRes, teamSocialsRes] = await Promise.all([
          fetch("/api/academias"),
          fetch("/api/social"),
          fetch("/api/team-social"),
        ]);

        const [academias, salidas, teamSocials] = await Promise.all([
          academiasRes.json(),
          salidasRes.json(),
          teamSocialsRes.json(),
        ]);

        const results: SearchResult[] = [
          ...academias.map((item: Academia) => ({
            id: item._id,
            type: "academia" as const,
            data: item,
          })),
          ...salidas.map((item: SalidaSocial) => ({
            id: item._id,
            type: "salida" as const,
            data: item,
          })),
          ...teamSocials.map((item: TeamSocial) => ({
            id: item._id,
            type: "team-social" as const,
            data: item,
          })),
        ];

        setAllResults(results);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const getFilteredResults = () => {
    const query = searchQuery.toLowerCase();
    const _today = new Date();
    _today.setHours(0, 0, 0, 0); // Configurar a inicio del día

    return allResults.filter((result) => {
      // Filtro de tipo de evento
      const matchesEventType =
        selectedEventType === "todos" || result.type === selectedEventType;

      // Filtro de fecha (solo para salidas y team-social, no para academias)
      let matchesDate = true;
      if (result.type === "salida") {
        const salida = result.data as SalidaSocial;
        if (salida.fecha) {
          const eventDate = new Date(salida.fecha);
          eventDate.setHours(0, 0, 0, 0); // Configurar a inicio del día
          matchesDate = eventDate >= _today; // Solo eventos de hoy en adelante
        }
      } else if (result.type === "team-social") {
        const team = result.data as TeamSocial;
        if (team.fecha) {
          const eventDate = new Date(team.fecha);
          eventDate.setHours(0, 0, 0, 0); // Configurar a inicio del día
          matchesDate = eventDate >= _today; // Solo eventos de hoy en adelante
        }
      }

      // Filtro de búsqueda por texto
      let matchesSearch = false;

      switch (result.type) {
        case "academia":
          const academia = result.data as Academia;
          matchesSearch =
            academia.nombre_academia.toLowerCase().includes(query) ||
            academia.descripcion?.toLowerCase().includes(query) ||
            academia.tipo_disciplina.toLowerCase().includes(query);
          break;

        case "salida":
          const salida = result.data as SalidaSocial;
          matchesSearch =
            salida.nombre.toLowerCase().includes(query) ||
            salida.descripcion?.toLowerCase().includes(query) ||
            salida.localidad?.toLowerCase().includes(query) ||
            salida.deporte?.toLowerCase().includes(query);
          break;

        case "team-social":
          const team = result.data as TeamSocial;
          matchesSearch =
            team.nombre.toLowerCase().includes(query) ||
            team.descripcion?.toLowerCase().includes(query) ||
            team.lugar?.toLowerCase().includes(query) ||
            team.deporte?.toLowerCase().includes(query);
          break;
      }

      // Filtro de disciplina
      let matchesDiscipline = true;
      if (selectedDiscipline !== "todos") {
        if (result.type === "academia") {
          const academia = result.data as Academia;
          matchesDiscipline =
            academia.tipo_disciplina?.toLowerCase() ===
            selectedDiscipline.toLowerCase();
        } else if (result.type === "salida") {
          const salida = result.data as SalidaSocial;
          matchesDiscipline =
            salida.deporte?.toLowerCase() === selectedDiscipline.toLowerCase();
        } else if (result.type === "team-social") {
          const team = result.data as TeamSocial;
          matchesDiscipline =
            team.deporte?.toLowerCase() === selectedDiscipline.toLowerCase();
        }
      }

      return (
        (query === "" || matchesSearch) &&
        matchesDiscipline &&
        matchesEventType &&
        matchesDate
      );
    });
  };

  const filteredResults = getFilteredResults();

  return (
    <main className="bg-background min-h-screen text-foreground px-4 py-6 space-y-6 w-[390px] mx-auto">
      <TopContainer selectedLocalidad={null} setSelectedLocalidad={null} />

      {/* Buscador */}
      <div className="px-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar eventos deportivos..."
          className="w-full px-4 py-3 border border-border rounded-[20px] shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#C95100] focus:border-[#C95100] transition-all bg-card"
        />
      </div>

      {/* Filtros */}
      <div className="space-y-4 px-1">
        <SearchFilters
          title="Tipo de evento"
          options={eventTypes}
          selected={selectedEventType}
          onSelect={setSelectedEventType}
        />

        <SearchFilters
          title="Disciplina"
          options={disciplines}
          selected={selectedDiscipline}
          onSelect={setSelectedDiscipline}
        />
      </div>

      {/* Encabezado */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-bold text-[#C95100]">
            Eventos Deportivos
          </h2>
          {(searchQuery ||
            selectedEventType !== "todos" ||
            selectedDiscipline !== "todos") && (
            <p className="text-sm text-muted-foreground mt-1">
              {filteredResults.length} resultado
              {filteredResults.length !== 1 ? "s" : ""} encontrado
              {filteredResults.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Listado de resultados */}
      <div className="space-y-3 px-1 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-border border-t-[#C95100] rounded-full animate-spin "></div>
              Cargando eventos...
            </div>
          </div>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <SearchResultCard
              key={result.id}
              type={result.type}
              data={result.data}
            />
          ))
        ) : searchQuery ||
          selectedEventType !== "todos" ||
          selectedDiscipline !== "todos" ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              No se encontraron eventos con los filtros seleccionados
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Intenta cambiar los filtros o buscar algo diferente
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Busca academias, salidas sociales o team socials
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Comienza escribiendo o usa los filtros de arriba
            </p>
          </div>
        )}
      </div>
      <div className="pb-[170px]"></div>
    </main>
  );
}
