"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopContainer from "@/components/TopContainer";
import Link from "next/link";

type Academia = {
  _id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
  imagen?: string;
};

const disciplines = [
  { key: "running", label: "Running", icon: "/assets/icons/directions_run_40dp_FFB86A.svg" },
  { key: "ciclismo", label: "Ciclismo", icon: "/assets/icons/directions_bike_40dp_FFB86A.svg" },
  { key: "trekking", label: "Trekking", icon: "/assets/icons/hiking_40dp_FFB86A.svg" },
  { key: "otros", label: "Otros", icon: "/assets/icons/terrain_40dp_FFB86A.svg" },
];

export default function AcademiasPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [academias, setAcademias] = useState<Academia[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("running");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocalidad, setSelectedLocalidad] = useState("San Miguel de Tucuman");

  useEffect(() => {
    fetch("/api/academias")
      .then(res => res.json())
      .then((data: Academia[]) => setAcademias(data))
      .catch(console.error);
  }, []);

  const filtered = academias.filter(a => {
    const matchesDiscipline =
      selectedDiscipline === "otros"
        ? !disciplines.some(d => d.key !== "otros" && d.key === a.tipo_disciplina)
        : a.tipo_disciplina === selectedDiscipline;

    const matchesSearch = a.nombre_academia.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDiscipline && matchesSearch;
  });

  return (
    <main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      <TopContainer
  selectedLocalidad={selectedLocalidad}
  setSelectedLocalidad={setSelectedLocalidad}
/>


      {/* Filtros de disciplinas */}
      <div className="flex space-x-3 justify-center overflow-x-auto pb-2 scrollbar-hide">
        {disciplines.map(d => (
          <button
            key={d.key}
            onClick={() => setSelectedDiscipline(d.key)}
            className={`flex-shrink-0 w-[74px] h-[74px] rounded-[20px] border shadow-md flex flex-col items-center justify-center ${
              selectedDiscipline === d.key
                ? "border-2 border-orange-200 text-orange-300"
                : "bg-white text-[#808488]"
            }`}
          >
            <img src={d.icon} alt={d.label} className="w-[25px] h-[25px] mb-2" />
            <span className="text-[11px] font-semibold leading-none text-center">{d.label}</span>
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="px-1">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar academia..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* Encabezado y botón crear */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          <span className="text-[#C76C01]">Academias</span>{" "}
          {selectedDiscipline.charAt(0).toUpperCase() + selectedDiscipline.slice(1)}
        </h2>
        {session?.user.role === "dueño de academia" && (
          <button onClick={() => router.push("/academias/crear")}>
            <img src="/assets/Logo/add-circle-svgrepo-com.svg" className="w-[26px] h-[26px]" alt="Agregar academia" />
          </button>
        )}
      </div>

      {/* Listado de academias */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 pb-4">
          {filtered.length > 0 ? (
            filtered.map(a => (
              <Link key={a._id} href={`/academias/${a._id}`}>
                <div className="flex-shrink-0 w-[250px] h-[190px] bg-white rounded-[10px] shadow-md overflow-hidden">
                  <div
                    className="h-[110px] bg-cover bg-center"
                    style={{ backgroundImage: `url('/assets/Logo/Trivo T.png')`, width:125, height:110, }}
                  />
                  <div className="p-3">
                    <h3 className="font-bold text-base mb-1">{a.nombre_academia}</h3>
                    <p className="text-xs flex items-center gap-1 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="#333">
                        <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z" />
                      </svg>
                      {a.telefono}
                    </p>
                    <p className="text-xs text-gray-600">🏷️ {a.tipo_disciplina}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500 self-center">No hay academias para esta disciplina.</p>
          )}
        </div>
      </div>
    </main>
  );
}
