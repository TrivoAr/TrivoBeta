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
  _id: string; 
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
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
    rol: session?.user.role || ""
  });
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const fetchAcademia = async () => {
        try {
          let url = `/api/academias?owner=true`;
      
          if (session?.user.role !== "dueño de academia") {
            url = `/api/academias?userId=${session.user.id}`; // Nueva API para obtener academias de un usuario
          }
      
          const res = await fetch(url);
          const data = await res.json();
      
          if (data.length > 0) {
            setAcademia(data[0]); // Asigna la primera academia encontrada
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
    if (session?.user) {
      setFormData({
        fullname: session.user.fullname || "",
        email: session.user.email || "",
        rol: session.user.role || "",
      });
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
<main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      <TopContainer />

      {/* Grupo principal (como salida destacada) */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold mb-3">
            <span className="text-[#C76C01]">Grupo</span> principal
          </h2>
          {formData.rol === "dueño de academia" && (
            <button onClick={() => router.push("/academias/crear")}>
              <img
                className="h-[26px] w-[26px]"
                src="/assets/Logo/add-circle-svgrepo-com.svg"
                alt="crear"
              />
            </button>
          )}
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4">
            {academia ? (
              <div className="flex-shrink-0 w-[310px] h-[176px] rounded-[15px] overflow-hidden shadow-md relative">
                <img
                  src="/assets/Logo/Trivo T.png"
                  alt="Academia"
                  className="w-[200px] h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#00000080] p-4 flex flex-col justify-between">
                  <div className="text-white space-y-1">
                    <p className="text-lg font-semibold">{academia.nombre_academia}</p>
                    <p className="text-xs">
                      📍 {academia.localidad}, {academia.provincia}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleEntrar}
                      style={{
                        background: "linear-gradient(90deg, #C76C01 0%, #FFBD6E 100%)",
                      }}
                      className="text-black text-[10px] font-semibold h-[22px] w-[79px] rounded-[20px]"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-600">No tienes academias aún.</div>
            )}
          </div>
        </div>
      </section>

      {/* Entrenamientos */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">
            <span className="text-[#C76C01]">Mis</span> entrenamientos
          </h2>
        </div>

        <div className="space-y-3">
          {entrenamientos.length > 0 ? (
            entrenamientos.map((entrenamiento) => (
              <div
                key={entrenamiento.id}
                className="bg-white p-4 rounded-[15px] shadow-md space-y-1"
              >
                <p className="text-base font-semibold">{entrenamiento.descripcion}</p>
                <p className="text-sm text-gray-600">
                  🗓️ {entrenamiento.dia} · 🕒 {entrenamiento.hora}
                </p>
                <p className="text-sm text-gray-600">📍 {entrenamiento.ubicacion}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No tienes entrenamientos programados.</p>
          )}
        </div>
      </section>
    </main>
  );

};

export default DashboardPage;


        {/* Eventos */}
        {/*
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
</div>*/}
        {/* Aventuras */}
        {/*
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
        </div>*/}