"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

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

export default function HistorialPagos() {
  const { data: session } = useSession();
  const [pagosPorGrupo, setPagosPorGrupo] = useState<Record<string, Pago[]>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const usuario_id = session?.user?.id;
  const id_academia = typeof window !== "undefined" ? localStorage.getItem("academia_id") : null;

  useEffect(() => {
    if (!usuario_id || !id_academia) return;
  
    async function fetchPagos() {
      try {
        const [pagosRes, gruposRes] = await Promise.all([
          axios.get("/api/registrar-pago"),
          axios.get(`/api/academias/${id_academia}`)
        ]);
  
        const pagosData: Pago[] = pagosRes.data;
        const gruposData: Grupo[] = gruposRes.data.grupos;
  
        // Crear un mapa de grupos
        const gruposMap: Record<string, string> = {};
        gruposData.forEach(grupo => {
          gruposMap[grupo._id] = grupo.nombre_grupo;
        });
        setGrupos(gruposMap);
  
        // Filtrar pagos para el usuario actual y que pertenezcan a un grupo de la academia
        const pagosFiltrados = pagosData.filter(
          (pago) => pago.usuario_id === usuario_id && gruposMap[pago.grupo_id]
        );
  
        // Agrupar pagos por grupo
        const pagosAgrupados: Record<string, Pago[]> = {};
        pagosFiltrados.forEach(pago => {
          if (!pagosAgrupados[pago.grupo_id]) {
            pagosAgrupados[pago.grupo_id] = [];
          }
          pagosAgrupados[pago.grupo_id].push(pago);
        });
  
        // Ordenar los pagos dentro de cada grupo por fecha de pago (descendente)
        Object.keys(pagosAgrupados).forEach(grupoId => {
          pagosAgrupados[grupoId].sort(
            (a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
          );
        });
  
        setPagosPorGrupo(pagosAgrupados);
      } catch (err) {
        setError("Error al obtener los pagos o los grupos");
      } finally {
        setLoading(false);
      }
    }
  
    fetchPagos();
  }, [usuario_id, id_academia]);
  
  if (loading) return <p className="text-center text-gray-500">Cargando pagos...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="w-[380px] p-4 max-w-lg mx-auto">
<div className="w-full max-w-lg mx-auto bg-gray-100 p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-center mb-4">Historial de pagos</h2>
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
                    <p className={`font-semibold ${session?.user.role === "dueño de academia" ? "text-green-500" : "text-red-500"}`}>
                      {session?.user.role === "dueño de academia" ? `+${pago.monto}` : `-${pago.monto}`}
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
    </div>
  );
}
