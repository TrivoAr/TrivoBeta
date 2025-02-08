"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Pago {
  _id: string;
  usuario_id: string;
  grupo_id: string;
  mes_pagado: string;
  monto: number;
  estado: string;
  fecha_pago: string;
  detalle_transaccion: {
    id_transaccion: string;
    metodo_pago: string;
    numero_tarjeta: string;
  };
}

interface Grupo {
  _id: string;
  nombre_grupo: string;
}

export default function HistorialPagos() {
  const { data: session } = useSession();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const usuario_id = session?.user?.id;

  useEffect(() => {
    if (!usuario_id) return;

    async function fetchPagos() {
      try {
        const response = await fetch("/api/registrar-pago");
        if (!response.ok) throw new Error("Error al obtener los pagos");

        const data: Pago[] = await response.json();

        // Filtrar solo los pagos del usuario autenticado
        const pagosUsuario = data.filter(
          (pago) => pago.usuario_id === usuario_id
        );

        // Ordenar pagos por fecha más reciente
        const pagosOrdenados = pagosUsuario.sort(
          (a, b) =>
            new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
        );

        setPagos(pagosOrdenados);

        // Obtener los IDs de los grupos sin repetir
        const grupoIds = Array.from(
          new Set(pagosUsuario.map((pago) => pago.grupo_id))
        );

        const gruposMap: Record<string, string> = {};
        for (const grupoId of grupoIds) {
          const res = await fetch(`/api/grupos/${grupoId}`);
          if (!res.ok) {
            console.error("Error al obtener el grupo:", grupoId);
            continue;
          }
          const { grupo } = await res.json();
          gruposMap[grupo._id] = grupo.nombre_grupo;
        }

        setGrupos(gruposMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchPagos();
  }, [usuario_id]);

  if (loading)
    return <p className="text-center text-gray-500">Cargando pagos...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="w-[380px] p-4 max-w-lg mx-auto bg-gray-100 rounded-lg shadow-md">
      <div className="flex justify-between items-center h-[60px]">
        <h2 className="text-lg font-semibold">Historial de pagos</h2>
      </div>
      <ul className="space-y-4">
        {pagos.map((pago, index) => (
          <div key={pago._id}>
            {(index === 0 ||
              new Date(pagos[index - 1].fecha_pago).toLocaleDateString() !==
                new Date(pago.fecha_pago).toLocaleDateString()) && (
              <div className="text-sm font-semibold text-gray-600 bg-gray-300 px-3 py-1 rounded-md mb-2">
                {new Date(pago.fecha_pago).toLocaleDateString()}
              </div>
            )}
            <li className="flex items-center bg-white p-4 rounded-lg shadow-sm">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 rounded-full mr-3"
              />
              <div className="flex-1">
                <p className="font-medium">
                  {grupos[pago.grupo_id] || "Grupo desconocido"}
                </p>
                <p className="text-sm text-gray-500">
                  Mes:{" "}
                  {new Date(pago.fecha_pago).toLocaleString("es-ES", {
                    month: "long",
                  })}
                </p>
                {pago.estado === "aprobado" ? (
                  <p className="text-sm text-green-500">{pago.estado}</p>
                ) : (
                  <p className="text-sm text-red-500">{pago.estado}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-red-500 font-semibold">-${pago.monto}</p>
                <p className="text-green-500 font-semibold">+${pago.monto}</p>
                <p className="text-sm text-gray-500">
                  {new Date(pago.fecha_pago).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          </div>
        ))}
      </ul>
    </div>
  );
}
