"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModalEntrenamiento from "@/components/Modals/ModalEntrenamiento";
import axios from "axios";
import { getGroupImage } from "@/app/api/grupos/getGroupImage";
import { saveGroupImage } from "@/app/api/grupos/saveGroupImage";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

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
  cuota_mensual?: string;
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
  estado: string; // Siempre será "gris"
};

export default function GrupoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [alumnos, setAlumnos] = useState<(Alumno & { profileImage?: string })[]>([]);
  const [entrenamientoData, setEntrenamientoData] = useState<Entrenamiento>({
    alumno_id: "",
    grupo_id: params.id,
    fecha: "",
    descripcion: "",
    estado: "gris", // Valor inicial fijo
  });
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [groupImage, setGroupImage] = useState<string>(
    "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // Para controlar el acceso del usuario

  const router = useRouter();
  const { data: session } = useSession();

  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId || !params.id) return; // Verificar que el userId y el params.id estén disponibles
  
    const checkUserAccess = async () => {
      try {
        // Obtener los detalles del grupo primero para obtener el ID de la academia
        const academiaId = localStorage.getItem("academia_id");
  
        // Ahora hacer la solicitud para verificar el acceso con el ID de la academia
        const response = await axios.get(`/api/academias/${academiaId}/miembros`, {
          headers: {
            "user_id": userId,
          },
        });
  
        console.log('Respuesta de verificación de acceso:', response);
  
        // Verificar si el usuario está en la lista de miembros de la academia y tiene un grupo asignado
        const hasAccess = response.data.miembros.some(
          (miembro: any) => miembro.user_id._id === userId 
        );
  
        if (hasAccess) {
          setIsAuthorized(true); // Usuario tiene acceso
        } else {
          setIsAuthorized(false); // Usuario no tiene acceso
        }
      } catch (error) {
        console.error('Error al verificar el acceso del usuario:', error);
        setError("Hubo un problema al verificar el acceso del usuario.");
      }
    };
  
    checkUserAccess(); // Ejecutar la función para verificar el acceso
  
  }, [params.id, userId]);

  useEffect(() => {
    if (isAuthorized === false) {
      setError("No tienes acceso a esta academia.");
      return;
    }

    const fetchGrupo = async () => {
      try {
        // Si el usuario tiene acceso, cargamos los detalles del grupo
        const response = await axios.get(`/api/grupos/${params.id}`);
        const alumnosData = response.data.alumnos.map((item: any) => item.user_id);

        try {
          const imageUrl = await getGroupImage("foto_perfil_grupo.jpg", params.id);
          setGroupImage(imageUrl);
        } catch {
          console.log("No se encontró una imagen para este grupo, usando predeterminada.");
        }

        const alumnosWithImages = await Promise.all(
          alumnosData.map(async (alumno: Alumno) => {
            try {
              const imageUrl = await getProfileImage("profile-image.jpg", alumno._id);
              return { ...alumno, profileImage: imageUrl };
            } catch (error) {
              console.error(`Error al obtener imagen del alumno ${alumno._id}:`, error);
              return {
                ...alumno,
                profileImage:
                  "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
              };
            }
          })
        );

        setGrupo(response.data.grupo);
        setAlumnos(alumnosWithImages);
      } catch (error) {
        setError("Hubo un problema al cargar los detalles del grupo.");
      }
    };

    if (isAuthorized === true) {
      fetchGrupo();
    }
  }, [isAuthorized, params.id]);

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
        estado: "gris", // Restablecer valor fijo
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

  const handleIrAPago = () => {
    if (!grupo) return;
  
    const { _id, nombre_grupo, cuota_mensual } = grupo;
    const fecha = new Date().toLocaleString();
    
    // Obtener el ID de la academia desde el localStorage
    const academiaId = localStorage.getItem("academia_id");
    
    // Almacenar los datos en localStorage
    localStorage.setItem("grupoId", _id);
    localStorage.setItem("nombreGrupo", nombre_grupo);
    localStorage.setItem("monto", cuota_mensual || '0');
    localStorage.setItem("fecha", fecha);
    localStorage.setItem("academiaId", academiaId); // Añadir el academiaId
    
    // Redirigir a la página de pago
    router.push("/pagos");
  };
  

  if (error) return <div>{error}</div>;

  if (!grupo) return <div>Cargando...</div>;

  return (
    <div className="flex flex-col items-center w-[390px] bg-[#F4F4F4]">
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
      <button
        onClick={() => router.push(`/grupos/${params.id}/editar`)}
        className="absolute bg-black top-2 right-2 z-50  p-1 rounded-full shadow-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="25px"
          height="25px"
        >
          <path
            fill="#fcfcfc"
            d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"
          />
        </svg>
      </button>

      <div
        className="coverAcademias w-[390px] h-[190px] bg-cover bg-center"
        style={{ backgroundImage: `url('${groupImage}')` }}
      ></div>

      <div className="absolute top-[135px] logo h-[120px] w-[390px] flex justify-start items-center gap-3 p-8">
        <img src={groupImage} className="rounded-full w-[120px]" alt="Logo" />
        <h1 className="w-[280px] h-[22px] text-[20px] font-[700] text-[#333] leading-[22px] mx-auto mt-[30px]">
          {grupo.nombre_grupo}
        </h1>
      </div>


      {/* info del grupo */}
      <div className="mt-[90px]">
    

        <div className="flex flex-wrap w-[390px]  h-[100px] justify-center">
          {/* Columna izquierda */}


          <div className="flex items-center  justify-left gap-2 w-[40%]">
            <div className="flex items-center justify-center h-[40px] w-[40px] bg-[#FFE1C5] rounded-full">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                href="http://www.w3.org/1999/xlink"
              >
                <rect width="16" height="16" fill="url(#pattern0_441_132)" />
                <defs>
                  <pattern
                    id="pattern0_441_132"
                    patternContentUnits="objectBoundingBox"
                    width="1"
                    height="1"
                  >
                    <use href="#image0_441_132" transform="scale(0.01)" />
                  </pattern>
                  <image
                    id="image0_441_132"
                    width="100"
                    height="100"
                    href="data:image/png;base64,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"
                  />
                </defs>
              </svg>
            </div>
            <p className="text-left text-[10px] font-normal text-[#A0AEC0]">
              Ubicación
              <br />
              <span className="font-semibold text-black">
                {grupo.ubicacion || "No especificado"}
              </span>
            </p>
          </div>



          <div className="flex items-center  justify-center gap-2 w-[40%]">
            <div className="flex items-center justify-center h-[40px] w-[40px] bg-[#FFE1C5] rounded-full">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                href="http://www.w3.org/1999/xlink"
              >
                <rect width="16" height="16" fill="url(#pattern0_441_156)" />
                <defs>
                  <pattern
                    id="pattern0_441_156"
                    patternContentUnits="objectBoundingBox"
                    width="1"
                    height="1"
                  >
                    <use href="#image0_441_156" transform="scale(0.01)" />
                  </pattern>
                  <image
                    id="image0_441_156"
                    width="100"
                    height="100"
                    href="data:image/png;base64,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"
                  />
                </defs>
              </svg>
            </div>
            <p className="text-left text-[10px] font-normal text-[#A0AEC0]">
              Horario
              <br />
              <span className="font-semibold text-black">
                {grupo.horario || "No especificado"}
              </span>
            </p>
          </div>

          {/* Columna derecha */}
          <div className="flex items-center  justify-left gap-2 w-[40%]">
            <div className="flex items-center justify-center h-[40px] w-[40px] bg-[#FFE1C5] rounded-full">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                href="http://www.w3.org/1999/xlink"
              >
                <rect width="16" height="16" fill="url(#pattern0_441_138)" />
                <defs>
                  <pattern
                    id="pattern0_441_138"
                    patternContentUnits="objectBoundingBox"
                    width="1"
                    height="1"
                  >
                    <use href="#image0_441_138" transform="scale(0.01)" />
                  </pattern>
                  <image
                    id="image0_441_138"
                    width="100"
                    height="100"
                    href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAABW0lEQVR4nO3csW3DUBQEQXWibq/ol9gt2IAhrKxZgClB3vCnfDwkSdJLuj2//vJ6zVP/4w5IKyCxgMQCEgtILCCxgMQCEgtILCCxgMQCEgtILCCxgMQCEgtILCCxgMQCEgtIbDAgvwxIrHNCWh2QVgek1QFpdUBaHZBWB6TVAWl1QFodkFYHpNUBaXVAWh2QVgek1QFpdUBaHZBWB6TVAfmswe6//Vrj3Qc7IM/UYEDWGgzIWoMBWWswIGsNBmStwYCsNRiQtQYDstZgQNYaDMhagwFZazAgaw0GZK3BgKw1GJC1BgOy1mBA1hoMyFqDAdmHg7z7C92b3x/IgLz1F3xOyDM1GJC1BgOy1mBA1hoMyFqDAVlrMCBrDQZkrcGArDUYkLUGA7LWYEDWGgzIWoMBWWswIGsNBmStwYCsNRiQtQYDstZgQNYaDMhagwFZazAg+3AQSZIeP+sbcDpD8Sy6QgcAAAAASUVORK5CYII="
                  />
                </defs>
              </svg>
            </div>
            <p className="text-left text-[10px] font-normal text-[#A0AEC0]">
              Dificultad
              <br />
              <span className="font-semibold text-black">
                {grupo.nivel || "No especificado"}
              </span>
            </p>
          </div>

          <div className="flex items-center  justify-center gap-2 w-[40%]">
            <div className="flex items-center justify-center h-[40px] w-[40px] bg-[#FFE1C5] rounded-full">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                href="http://www.w3.org/1999/xlink"
              >
                <rect width="16" height="16" fill="url(#pattern0_441_126)" />
                <defs>
                  <pattern
                    id="pattern0_441_126"
                    patternContentUnits="objectBoundingBox"
                    width="1"
                    height="1"
                  >
                    <use href="#image0_441_126" transform="scale(0.01)" />
                  </pattern>
                  <image
                    id="image0_441_126"
                    width="100"
                    height="100"
                    href="data:image/png;base64,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"
                  />
                </defs>
              </svg>
            </div>
            <p className="text-left text-[10px] font-normal text-[#A0AEC0]">
              Tiempo
              <br />
              
              {/* {<span className="font-semibold text-black">
                {grupo.descripcion || "No especificado"}
              </span>} */}
            </p>
          </div>
        </div>
      </div>
      <hr className="border-t border-gray-300 w-[390px] mb-2" />
      <div className="flex flex-col w-[390px]">
        <div className="">
          <h2 className="text-xl font-bold p-2 text-[#333]">
            Descripción
          </h2>
          <p className="text-sm text-gray-500 p-2">
            {grupo.descripcion || "Sin descripción"}
          </p>
          <hr className="border-t border-gray-300 mb-2 w-[390px]" />
        </div>
        <div className="">
          <h2 className="text-xl font-bold text-left text-[#333] p-2">Profesor</h2>
          <p className="text-sm text-gray-500 p-2">
            info del profesor
            {/* {grupo.profesor || "Sin Profesor"} */}
          </p>
          <hr className="border-t border-gray-300 w-[390px] mb-2" />
        </div>
        <div className="">
          <h2 className="text-xl font-bold text-left text-[#333] p-2">Cuota Mensual</h2>
          <p className="text-sm text-gray-500 p-2">
          {grupo.cuota_mensual || "Sin especificar cuota"}
          </p>
          <button onClick={handleIrAPago} className="btn-pago">
          Pagar Cuota
          </button>
          <hr className="border-t border-gray-300 w-[390px] mb-2" />
        </div>
      </div>


      <div className="w-[95%] mt-2 mb-2 p-2 shadow-lg rounded-lg pl-4">
        <h2 className="font-bold text-mb mb-2">Alumnos del grupo</h2>
        {alumnos.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {alumnos.map((alumno) => (
              <li
                key={alumno._id}
                className={`flex items-center gap-3 p-1 rounded-lg ${
                  userRole === "alumno"
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-gray-100"
                }`}
                onClick={() => handleAlumnoClick(alumno)}
              >
                <img
                  src={alumno.profileImage || "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"}
                  alt={`${alumno.firstname} ${alumno.lastname}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-[13px] pl-2">
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
        <ModalEntrenamiento estado={isAssigning} cambiarEstado={setIsAssigning}>
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
              name="Objetivo"
              value={entrenamientoData.descripcion}
              onChange={handleChange}
              placeholder="0bjetivo"
              className="mb-4 border p-2 w-[90%] rounded"
            ></textarea>
            <textarea
              name="descripcion"
              value={entrenamientoData.descripcion}
              onChange={handleChange}
              placeholder="Estimulo"
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
