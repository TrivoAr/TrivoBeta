"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import ModalPagoEfectivo from "@/components/Modals/ModalPagoEfectivo";

interface Pago {
  _id: string;
  usuario_id: string;
  grupo_id: string;
  mes_pagado: string;
  monto: number;
  estado: string;
  fecha_pago: string;
}

interface Grupo {
  _id: string;
  nombre_grupo: string;
}

interface Alumno {
  _id: string;
  nombre: string;
  grupo_id: string;
}

export default function HistorialPagos() {
  const { data: session } = useSession();
  const [pagosPorGrupo, setPagosPorGrupo] = useState<Record<string, Pago[]>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const usuario_id = session?.user?.id;
  const id_academia = typeof window !== "undefined" ? localStorage.getItem("academia_id") : null;

  useEffect(() => {
    if (!usuario_id || !id_academia) return;

    async function fetchData() {
      try {
        const [pagosRes, gruposRes, alumnosRes] = await Promise.all([
          axios.get("/api/registrar-pago"),
          axios.get(`/api/academias/${id_academia}`),
          axios.get(`/api/academias/${id_academia}/miembros`),
        ]);
        

        const pagosData: Pago[] = pagosRes.data;
        const gruposData: Grupo[] = gruposRes.data.grupos;
        const alumnosData: Alumno[] = alumnosRes.data.miembros.map((miembro: any) => ({
          _id: miembro.user_id._id,
          nombre: `${miembro.user_id.firstname} ${miembro.user_id.lastname}`,
          grupo_id: miembro.grupo._id,
        }));
        

        // Crear un mapa de grupos
        const gruposMap: Record<string, string> = {};
        gruposData.forEach((grupo) => {
          gruposMap[grupo._id] = grupo.nombre_grupo;
        });
        setGrupos(gruposMap);
        setAlumnos(alumnosData);

        // Filtrar pagos del usuario y agrupar por grupo
        const pagosFiltrados = pagosData.filter(
          (pago) => pago.usuario_id === usuario_id && gruposMap[pago.grupo_id]
        );
        const pagosAgrupados: Record<string, Pago[]> = {};
        pagosFiltrados.forEach((pago) => {
          if (!pagosAgrupados[pago.grupo_id]) {
            pagosAgrupados[pago.grupo_id] = [];
          }
          pagosAgrupados[pago.grupo_id].push(pago);
        });

        // Ordenar pagos por fecha de pago descendente
        Object.keys(pagosAgrupados).forEach((grupoId) => {
          pagosAgrupados[grupoId].sort(
            (a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
          );
        });

        setPagosPorGrupo(pagosAgrupados);
      } catch (err) {
        setError("Error al obtener los pagos, grupos o alumnos");
        setError(`Error: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [usuario_id, id_academia]);

  if (loading) return <p className="text-center text-gray-500">Cargando pagos...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="w-[380px] p-4 max-w-lg mx-auto">
     <div className="w-full max-w-lg mx-auto bg-gray-100 p-4 rounded-lg shadow-md">
       <div className="flex items-center justify-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Historial de pagos</h2>
          <button className="fixed bottom-20 right-4 p-4 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 shadow-lg transition-transform transform hover:scale-110"
           onClick={() => setIsModalOpen(true)}>
            <svg
          xmlns="http://www.w3.org/2000/svg"
          height="48px"
          viewBox="0 0 24 24"
          width="48px"
          fill="#333"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
      </button>
    </div>
      {Object.keys(pagosPorGrupo).length === 0 ? (
        <p className="text-center text-gray-500">No hay pagos registrados.</p>
      ) : (
        Object.keys(pagosPorGrupo).map(grupoId => (
          <div key={grupoId} className="mb-6">
            <h3 className="text-md font-bold text-gray-700 bg-gray-300 px-3 py-2 rounded-md">
              {grupos[grupoId] || "Grupo desconocido"}
            </h3>
            <ul className="space-y-2 mt-2">
              {pagosPorGrupo[grupoId].map(pago => (
                <li key={pago._id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                  <div>
                    <p className="text-sm text-gray-500">
                      Mes: {new Date(pago.fecha_pago).toLocaleString("es-ES", { month: "long" })}
                    </p>
                    <p className={`text-sm ${pago.estado === "aprobado" ? "text-green-500" : "text-red-500"}`}>
                      {pago.estado}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${session?.user.rol === "dueño de academia" ? "text-green-500" : "text-red-500"}`}>
                      {session?.user.rol === "dueño de academia" ? `+${pago.monto}` : `-${pago.monto}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(pago.fecha_pago).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
    {isModalOpen && <ModalPagoEfectivo alumnos={alumnos} grupos={grupos} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
