"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function GrupoDetailPage({ params }: { params: { id: string } }) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  if (error) return <div>{error}</div>;

  if (!grupo) return <div>Cargando...</div>;

  return (
    <div className="flex flex-col items-center p-5">
      <div className="coverAcademias w-[390px] h-[190px] bg-cover bg-center" style={{ backgroundImage: `url('https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg')` }}></div>

      <div className="flex justify-center gap-5 mt-[-60px]">
        <div className="logo h-[120px] w-[120px] bg-slate-400 rounded-full border border-[#333] flex justify-center items-center">
          <img src="https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg" className="rounded-full" alt="Logo" />
        </div>
        <div>
          <br />
          <br />
          <br />
          <h1 className="text-3xl font-bold text-[#333]">{grupo.nombre_grupo}</h1>
          <p className="text-sm text-[#333]">Ubicación: {grupo.ubicacion || "No especificado"}</p>
          <p className="text-sm text-[#333]">Horario: {grupo.horario || "No especificado"}</p>
          <p className="text-sm text-[#333]">Nivel: {grupo.nivel || "No especificado"}</p>
        </div>
      </div>

      <div className="w-[338px] mt-5 mb-5 p-4 bg-white shadow rounded-lg">
        <h2 className="font-bold text-xl mb-4">Alumnos del Grupo</h2>
        {alumnos.length > 0 ? (
          <ul>
            {alumnos.map((alumno) => (
              <li
                key={alumno._id}
                className={`flex justify-between items-center mb-3 p-2 rounded-lg ${
                  userRole === "alumno" ? "cursor-default" : "cursor-pointer hover:bg-gray-100"
                }`}
                onClick={() => handleAlumnoClick(alumno)}
              >
                <span className="text-lg">{alumno.firstname} {alumno.lastname}</span>
                {userRole !== "alumno" && selectedAlumno?._id === alumno._id && (
                  <button
                    onClick={() => setIsAssigning(true)}
                    className="border border-[#FF9A3D] w-[125px] h-[32px] rounded-[10px] text-[#FF9A3D] self-center"
                  >
                    Asignar Entrenamiento
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
      {isAssigning && selectedAlumno && (
        <div className="mt-5 w-[338px] p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold text-lg mb-3">Asignar Entrenamiento a {selectedAlumno.firstname} {selectedAlumno.lastname}</h3>
          <input
            type="date"
            name="fecha"
            value={entrenamientoData.fecha}
            onChange={handleChange}
            className="mb-4 border p-2 w-full rounded"
          />
          <textarea
            name="descripcion"
            value={entrenamientoData.descripcion}
            onChange={handleChange}
            placeholder="Descripción del entrenamiento"
            className="mb-4 border p-2 w-full rounded"
          ></textarea>
          <button
            onClick={handleAssignEntrenamiento}
            className="bg-orange-500 text-white py-2 px-4 rounded-full w-full"
          >
            Confirmar Asignación
          </button>
          <button
            onClick={() => setIsAssigning(false)}
            className="mt-3 bg-gray-500 text-white py-2 px-4 rounded-full w-full"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
