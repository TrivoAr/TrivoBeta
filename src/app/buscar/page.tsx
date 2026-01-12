"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopContainer from "@/components/TopContainer";
import SearchResultCard from "@/components/SearchResultCard";
import SearchFilters from "@/components/SearchFilters";

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

type SearchResult = {
  id: string;
  type: "salida";
  data: SalidaSocial;
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



export default function BuscarPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const salidasRes = await fetch("/api/social");
        const salidas = await salidasRes.json();

        const results: SearchResult[] = [
          ...salidas.map((item: SalidaSocial) => ({
            id: item._id,
            type: "salida" as const,
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
      // Filtro de fecha (solo para salidas)
      let matchesDate = true;
      if (result.type === "salida") {
        const salida = result.data as SalidaSocial;
        if (salida.fecha) {
          const eventDate = new Date(salida.fecha);
          eventDate.setHours(0, 0, 0, 0); // Configurar a inicio del día
          matchesDate = eventDate >= _today; // Solo eventos de hoy en adelante
        }
      }

      // Filtro de búsqueda por texto
      let matchesSearch = false;

      if (result.type === "salida") {
        const salida = result.data as SalidaSocial;
        matchesSearch =
          salida.nombre.toLowerCase().includes(query) ||
          salida.descripcion?.toLowerCase().includes(query) ||
          salida.localidad?.toLowerCase().includes(query) ||
          salida.deporte?.toLowerCase().includes(query);
      }

      // Filtro de disciplina
      let matchesDiscipline = true;
      if (selectedDiscipline !== "todos") {
        if (result.type === "salida") {
          const salida = result.data as SalidaSocial;
          matchesDiscipline =
            salida.deporte?.toLowerCase() === selectedDiscipline.toLowerCase();
        }
      }

      return (
        (query === "" || matchesSearch) &&
        matchesDiscipline &&
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
              Busca salidas sociales
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
