"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModalEntrenamiento from "@/components/Modals/ModalEntrenamiento";
import axios from "axios";
import { getGroupImage } from "@/app/api/grupos/getGroupImage";
import { saveGroupImage } from "@/app/api/grupos/saveGroupImage";

// Tipos

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
  const [groupImage, setGroupImage] = useState<string>(
    "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();

  const userRole = session?.user?.role;

  useEffect(() => {
    const fetchGrupo = async () => {
      try {
        const response = await axios.get(`/api/grupos/${params.id}`);
        setGrupo(response.data.grupo);
        setAlumnos(response.data.alumnos.map((item: any) => item.user_id));

        // Intentar obtener la imagen del grupo
        try {
          const imageUrl = await getGroupImage("group-image.jpg", params.id);
          setGroupImage(imageUrl);
        } catch {
          console.log("No se encontró una imagen para este grupo, usando predeterminada.");
        }
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
    if (userRole === "alumno") return;
    setSelectedAlumno(alumno);
    setEntrenamientoData({ ...entrenamientoData, alumno_id: alumno._id });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await saveGroupImage(file, params.id);
      setGroupImage(imageUrl);
      alert("Imagen actualizada con éxito.");
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert("Hubo un problema al subir la imagen del grupo.");
    } finally {
      setUploadingImage(false);
    }
  };

  if (error) return <div>{error}</div>;

  if (!grupo) return <div>Cargando...</div>;

  return (
    <div className="flex flex-col items-center p-5">
      <button
        type="button"
        onClick={() => router.back()}
        className=" absolute top-2 left-2 bg-black text-white p-2 rounded-full shadow-md hover:bg-blue-600 transition duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
          width="24"
          height="24"
        >
          <path
            fillRule="evenodd"
            d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
          />
        </svg>
      </button>
      <div
        className="coverAcademias w-[390px] h-[190px] bg-cover bg-center"
        style={{ backgroundImage: `url('${groupImage}')` }}
      ></div>

      <div className="flex justify-center gap-5 mt-[-60px]">
        <div className="logo h-[120px] w-[120px] bg-slate-400 rounded-full border border-[#333] flex justify-center items-center">
          <img
            src={groupImage}
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

      {userRole !== "alumno" && (
        <div className="mt-4">
          <label className="text-sm font-bold" htmlFor="uploadImage">
            Subir/Actualizar imagen del grupo:
          </label>
          <input
            id="uploadImage"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block mt-2"
          />
          {uploadingImage && <p>Subiendo imagen...</p>}
        </div>
      )}

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

      {isAssigning && selectedAlumno && (
        <ModalEntrenamiento
          estado={isAssigning}
          cambiarEstado={setIsAssigning}
        >
          <div className="w-full p-2 flex flex-col items-center">
            <h3 className="font-bold text-center mb-4">
              {selectedAlumno.firstname} {selectedAlumno.lastname}
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