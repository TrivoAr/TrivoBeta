"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

type Academia = {
  _id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
};

export default function AcademiasPage() {
  const [academias, setAcademias] = useState<Academia[]>([]);

  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const response = await axios.get("/api/academias");
        setAcademias(response.data);
      } catch (error) {
        console.error("Error fetching academias:", error);
      }
    };

    fetchAcademias();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Explorar Academias</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {academias.map((academia) => (
          <div key={academia._id} className="border p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold">{academia.nombre_academia}</h2>
            <p>{academia.descripcion}</p>
            <p>Disciplina: {academia.tipo_disciplina}</p>
            <p>Teléfono: {academia.telefono}</p>
            <Link href={`/academias/${academia._id}`}>
              <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
                Ver Detalles
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
