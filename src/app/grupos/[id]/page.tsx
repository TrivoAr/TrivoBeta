"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModalEntrenamiento from "@/components/Modals/ModalEntrenamiento";
import axios from "axios";

type Grupo = {
  _id: string;
  nombre_grupo: string;
  nivel?: string;
  ubicacion?: string;
  direccion?: string;
  horario?: string;
  descripcion?: string;
  tipo_grupo?: string;
};

type Alumno = {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
};

type Entrenamiento = {
  alumno_id: string;
  grupo_id: string;
  fecha: string;
  descripcion: string;
};

export default function GrupoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [entrenamientoData, setEntrenamientoData] = useState<Entrenamiento>({
    alumno_id: "",
    grupo_id: params.id,
    fecha: "",
    descripcion: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = session?.user?.role; // Asumiendo que el rol del usuario está en `session.user.role`.

  useEffect(() => {
    const fetchGrupo = async () => {
      try {
        const response = await axios.get(`/api/grupos/${params.id}`);
        setGrupo(response.data.grupo);
        setAlumnos(response.data.alumnos.map((item: any) => item.user_id));
      } catch (error) {
        console.error("Error al cargar los detalles del grupo:", error);
        setError("Hubo un problema al cargar los detalles del grupo.");
      }
    };

    fetchGrupo();
  }, [params.id]);

  const handleAssignEntrenamiento = async () => {
    try {
      await axios.post(`/api/entrenamientos`, entrenamientoData);
      alert("Entrenamiento asignado con éxito.");
      setIsAssigning(false);
      setEntrenamientoData({
        alumno_id: "",
        grupo_id: params.id,
        fecha: "",
        descripcion: "",
      });
      setSelectedAlumno(null);
    } catch (error) {
      console.error("Error al asignar el entrenamiento:", error);
      alert("Hubo un problema al asignar el entrenamiento.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEntrenamientoData({
      ...entrenamientoData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAlumnoClick = (alumno: Alumno) => {
    // Si el usuario es alumno, no ejecutamos ninguna acción al hacer clic en otro miembro.
    if (userRole === "alumno") return;
    setSelectedAlumno(alumno);
    setEntrenamientoData({ ...entrenamientoData, alumno_id: alumno._id });
  };


  const [estadoModal1, cambiarEstadoModal1] = useState(true);

  if (error) return <div>{error}</div>;

  if (!grupo) return <div>Cargando...</div>;



  return (
    <div className="flex flex-col items-center p-5">
      <div
        className="coverAcademias w-[390px] h-[190px] bg-cover bg-center"
        style={{
          backgroundImage: `url('https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg')`,
        }}
      ></div>

      <div className="flex justify-center gap-5 mt-[-60px]">
        <div className="logo h-[120px] w-[120px] bg-slate-400 rounded-full border border-[#333] flex justify-center items-center">
          <img
            src="https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"
            className="rounded-full"
            alt="Logo"
          />
        </div>
        <div>
          <br />
          <br />
          <br />
          <h1 className="text-3xl font-bold text-[#333]">
            {grupo.nombre_grupo}
          </h1>
          <p className="text-sm text-[#333]">
            Ubicación: {grupo.ubicacion || "No especificado"}
          </p>
          <p className="text-sm text-[#333]">
            Horario: {grupo.horario || "No especificado"}
          </p>
          <p className="text-sm text-[#333]">
            Nivel: {grupo.nivel || "No especificado"}
          </p>
        </div>
      </div>

      <div className="w-[338px] mt-5 mb-5 p-4 bg-white shadow rounded-lg">
        <h2 className="font-bold text-xl mb-4">Alumnos del grupo</h2>
        {alumnos.length > 0 ? (
          <ul>
            {alumnos.map((alumno) => (
              <li
                key={alumno._id}
                className={`flex justify-between items-center mb-3 p-2 rounded-lg ${
                  userRole === "alumno"
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-gray-100"
                }`}
                onClick={() => handleAlumnoClick(alumno)}
              >
                <span className="text-lg">
                  {alumno.firstname} {alumno.lastname}
                </span>
                {userRole !== "alumno" &&
                  selectedAlumno?._id === alumno._id && (
                    <button
                    onClick={() => {
                      setIsAssigning(true);
                      cambiarEstadoModal1(!estadoModal1);
                    }}
                      className="border border-[#FF9A3D] w-[125px] h-[32px] rounded-[10px] text-[#FF9A3D] self-center"
                    >
                      Entrenamiento
                    </button>
                  )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay alumnos en este grupo.</p>
        )}
      </div>

      {/* Asignación de entrenamiento */}

      {isAssigning && selectedAlumno && estadoModal1 &&(
        <ModalEntrenamiento estado ={estadoModal1} cambiarEstado={cambiarEstadoModal1}>
          
          <div className="w-full p-2 flex flex-col items-center">
            <h3 className="font-bold text-center mb-4">
              {selectedAlumno.firstname}{" "}
              {selectedAlumno.lastname}
            </h3>
            <input
              type="date"
              name="fecha"
              value={entrenamientoData.fecha}
              onChange={handleChange}
              className="mb-4 border p-2 w-[90%] rounded"
            />
            <textarea
              name="descripcion"
              value={entrenamientoData.descripcion}
              onChange={handleChange}
              placeholder="Descripción del entrenamiento"
              className="mb-4 border p-2 w-[90%] rounded"
            ></textarea>
            <button
              onClick={handleAssignEntrenamiento}
              className="bg-[#FF9A3D] text-[#333] py-2 px-4 rounded-full w-[90%] font-bold"
            >
              Confirmar
            </button>
            <button
              onClick={() => setIsAssigning(false)}
              className="mt-3 border-2 border-[#FF9A3D] text-[#FF9A3D] py-2 px-4 rounded-full w-[90%] font-bold"
            >
              Cancelar
            </button>
          </div>
        </ModalEntrenamiento>
      )}
    </div>
  );
}
