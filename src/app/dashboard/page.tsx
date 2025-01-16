"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PushManager from "../../components/PushManager";
import Eventos1 from "../../../public/assets/Tdah.webp";
import Eventos2 from "../../../public/assets/jujuy.webp";
import TopContainer from "@/components/TopContainer";
import Link from "next/link";

interface Academia {
  _id: string; // Cambié id a _id para coincidir con lo que normalmente se utiliza en MongoDB
  nombre_academia: string;
  pais: string;
  provincia: string;
  localidad: string;
}

interface Entrenamiento {
  id: string;
  nombre: string;
  dia: string;
  hora: string;
  ubicacion: string;
  descripcion: string;
}

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const fetchAcademia = async () => {
        try {
          const res = await fetch(`/api/academias?owner=true`);
          const data = await res.json();
          console.log(data); // Verifica si el campo _id está presente
          if (data.length > 0) {
            setAcademia(data[0]); // Supone que el usuario tiene una academia principal
          }
        } catch (error) {
          console.error("Error fetching academia:", error);
        }
      };

      const fetchEntrenamientos = async () => {
        try {
          if (session) {
            // Obtener la fecha de inicio de la semana (domingo)
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // Restar días para llegar al domingo
            const weekStartISO = weekStart.toISOString().split("T")[0]; // Formato YYYY-MM-DD

            const res = await fetch(
              `/api/entrenamientos?user=${session.user.id}&weekStart=${weekStartISO}`
            );

            if (!res.ok) {
              throw new Error(
                `Error al obtener entrenamientos: ${res.statusText}`
              );
            }

            const data = await res.json();
            setEntrenamientos(data);
          }
        } catch (error) {
          console.error("Error fetching entrenamientos:", error);
          setEntrenamientos([]); // Asegúrate de limpiar en caso de error
        }
      };

      fetchAcademia();
      fetchEntrenamientos();
    }
  }, [session]);

  if (status === "loading") return <p>Cargando...</p>;

  if (!session) return <p>No estás autenticado. Por favor, inicia sesión.</p>;

  const handleEntrar = () => {
    if (academia && academia._id) {
      router.push(`/academias/${academia._id}`);
    } else {
      console.error("Academia ID is not available");
    }
  };
  const handleSearch = () => {
    router.push(`/academias`);
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen">
      <PushManager />
      <div className="w-[389px] shadow-md bg-white overflow-y-auto h-screen">
        <TopContainer />

        {/* Mis grupos */}
        <div className="mb-6 p-4">
          <div className=" flex justify-between pr-4">
            <h2 className="text-xl font-semibold mb-3">Mis grupos</h2>
            <Link href="/academias/crear">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="30px"
                viewBox="0 0 24 24"
                width="30px"
                fill="#333"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Grupo principal */}
            <div className="coverAcademias bg-white p-4 rounded-lg shadow flex flex-col">
              <div className="mb-4">
                {academia ? (
                  <>
                    <p className="text-lg font-semibold text-white pb-8">
                      {academia.nombre_academia}
                    </p>
                    {/* <p className="text-sm text-gray-600 text-white">
                      {academia.localidad}, {academia.provincia}, {academia.pais}
                    </p> */}
                    <button
                      onClick={handleEntrar}
                      className="mt-auto block w-full bg-orange-500 text-white py-2 rounded "
                    >
                      Entrar
                    </button>
                  </>
                ) : (
                  <div>
                    <p className="text-500 text-white pb-8">
                      No tienes una academia principal.
                    </p>
                    <button
                      onClick={handleSearch}
                      className="mt-auto block w-full bg-orange-500 text-white py-2 rounded"
                    >
                      Buscar
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Entrenamientos */}
            <div
              className="space-y-4"
              onClick={() => router.push(`/entrenamiento`)}
            >
              <div className="bg-white p-4 rounded-lg shadow">
                {entrenamientos.length > 0 ? (
                  entrenamientos.map((entrenamiento) => (
                    <div
                      key={entrenamiento.id}
                      className="bg-white p-4 rounded-lg shadow"
                    >
                      <p className="text-sm font-medium">
                        {entrenamiento.descripcion}
                      </p>
                      <p className="text-xs text-gray-600">
                        {entrenamiento.dia} · {entrenamiento.hora} ·{" "}
                        {entrenamiento.ubicacion}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No tienes entrenamientos programados.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Eventos */}
        <div>
  <h2 className="text-xl font-semibold mb-3 pl-4 pr-4">Eventos</h2>
  <div className="scroll-container overflow-x-auto pl-4 pr-4">
    <div className="flex space-x-4">
      <div className="bg-white rounded-lg shadow min-w-[200px]">
        <Image
          src={Eventos1}
          alt="Carrera"
          className="w-full h-24 object-cover rounded-t-lg"
        />
        <div className="p-4">
          <p className="text-sm font-medium">Carrera Mes del TDAH</p>
          <p className="text-xs text-gray-600">Sábado 27 de Julio</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow min-w-[200px]">
        <Image
          src={Eventos2}
          alt="Maratón"
          className="w-full h-24 object-cover rounded-t-lg"
        />
        <div className="p-4">
          <p className="text-sm font-medium">Maratón Independencia</p>
          <p className="text-xs text-gray-600">Domingo 21 de Julio</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow min-w-[200px]">
        <Image
          src={Eventos2}
          alt="Maratón"
          className="w-full h-24 object-cover rounded-t-lg"
        />
        <div className="p-4">
          <p className="text-sm font-medium">Maratón Independencia</p>
          <p className="text-xs text-gray-600">Domingo 21 de Julio</p>
        </div>
      </div>
    </div>
  </div>
</div>
        {/* Aventuras */}
        <div className="pl-4 pr-4">
          <br />
          <h2 className="text-xl font-semibold mb-3">Aventuras</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow">
              <Image
                src={Eventos1}
                alt="Carrera"
                className="w-full h-24 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <p className="text-sm font-medium">Carrera Mes del TDAH</p>
                <p className="text-xs text-gray-600">Sábado 27 de Julio</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow">
              <Image
                src={Eventos1}
                alt="Maratón"
                className="w-full h-24 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <p className="text-sm font-medium">Maratón Independencia</p>
                <p className="text-xs text-gray-600">Domingo 21 de Julio</p>
              </div>
            </div>
          </div>
        </div>
        <br />
        <br />
        <br />
      </div>
    </div>
  );
};

export default DashboardPage;
