"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PushManager from "../../components/PushManager";
import Eventos1 from "../../../public/assets/Tdah.webp";
import Eventos2 from "../../../public/assets/jujuy.webp";

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
          const res = await fetch(`/api/entrenamientos?user=${session.user.id}`);
          const data = await res.json();
          setEntrenamientos(data);
        } catch (error) {
          console.error("Error fetching entrenamientos:", error);
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

  return (
    
    <div className="flex justify-center bg-gray-100 min-h-screen">
      <PushManager/>
      <div className="w-[389px] p-4 shadow-md bg-white overflow-y-auto h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img
              className="h-[75px] w-[75px] rounded-full"
              src="https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"
              alt="Avatar"
            />
            <div>
              <h1 className="text-lg font-semibold">{session.user.fullname}</h1>
              <p className="text-sm text-gray-600">San Miguel de Tucumán</p>
            </div>
          </div>
          <button className="p-2 bg-gray-200 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="30px"
              viewBox="0 0 24 24"
              width="30px"
              fill="#999999"
            >
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
          </button>
        </div>

        {/* Mis grupos */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Mis grupos</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Grupo principal */}
            <div className="coverAcademias bg-white p-4 rounded-lg shadow flex flex-col">
              <div className="mb-4">
                {academia ? (
                  <>
                    <p className="text-lg font-semibold text-white">{academia.nombre_academia}</p>
                    {/* <p className="text-sm text-gray-600 text-white">
                      {academia.localidad}, {academia.provincia}, {academia.pais}
                    </p> */}
                  </>
                ) : (
                  <p className="text-gray-500">No tienes una academia principal.</p>
                )}
              </div>
              <button
                onClick={handleEntrar}
                className="mt-auto block w-full bg-orange-500 text-white py-2 rounded"
              >
                Entrar
              </button>
            </div>
            {/* Entrenamientos */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                {entrenamientos.length > 0 ? (
                  entrenamientos.map((entrenamiento) => (
                    <div key={entrenamiento.id} className="bg-white p-4 rounded-lg shadow">
                      <p className="text-sm font-medium">{entrenamiento.nombre}</p>
                      <p className="text-xs text-gray-600">
                        {entrenamiento.dia} · {entrenamiento.hora} · {entrenamiento.ubicacion}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No tienes entrenamientos programados.</p>
                )}
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-medium">Entrenamiento SMT</p>
                <p className="text-xs text-gray-600">Sáb y Mar · 18 hs · Parque</p>
              </div>
            </div>
          </div>
        </div>

        {/* Eventos */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Eventos</h2>
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
                src={Eventos2}
                alt="Carrera"
                className="w-full h-24 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <p className="text-sm font-medium">Maratón Independencia</p>
                <p className="text-xs text-gray-600">Domingo 21 de Julio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aventuras */}
        <div>
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
