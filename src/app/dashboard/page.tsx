"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const DashboardPage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Cargando...</p>;

  if (!session) return <p>No estás autenticado. Por favor, inicia sesión.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bienvenido, {session.user.fullname}</h1>
      
      <div className="flex gap-4">
        <Link href="/academias" className="px-4 py-2 bg-blue-500 text-white rounded">
          Buscar Academias
        </Link>
        {session.user.role === "dueño de academia" && (
          <Link href="/academias/crear" className="px-4 py-2 bg-green-500 text-white rounded">
            Crear Academia
          </Link>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;


