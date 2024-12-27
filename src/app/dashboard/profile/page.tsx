"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import TopContainer from "@/components/TopContainer";

function ProfilePage() {
  const { data: session, status } = useSession();
  const [showPersonalData, setShowPersonalData] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false); // Estado para los objetivos
  const [isEditing, setIsEditing] = useState(false); // Estado para edición
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
  });

  // Actualizar formData cuando la sesión cambie
  useEffect(() => {
    if (session?.user) {
      setFormData({
        fullname: session.user.fullname || "",
        email: session.user.email || "",
      });
    }
  }, [session]);

  const horaActual = new Date().getHours();

  let saludo;
  if (horaActual >= 6 && horaActual < 12) {
    saludo = "Buen día";
  } else if (horaActual >= 12 && horaActual < 20) {
    saludo = "Buenas tardes";
  } else {
    saludo = "Buenas noches";
  }

  const handleShowPersonalData = () => {
    setShowPersonalData((prev) => !prev);
  };

  const handleShowObjectives = () => {
    setShowObjectives((prev) => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    const confirmation = window.confirm("¿Estás seguro de que deseas guardar los cambios?");
    if (!confirmation) return;
  
    try {
      const { fullname, email } = formData; // Excluir 'rol' aquí
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: fullname.split(" ")[0],
          lastname: fullname.split(" ")[1],
          email,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }
  
      // Actualiza los datos de la sesión después de guardar los cambios
      const updatedUser = await response.json();
      setFormData({
        fullname: `${updatedUser.firstname} ${updatedUser.lastname}`,
        email: updatedUser.email,
      });
  
      // Si la actualización fue exitosa, se desactiva el modo de edición y cierra sesión
      setIsEditing(false);
  
      alert("Los cambios se han guardado correctamente. Se cerrará la sesión.");
      signOut();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al actualizar el perfil. Inténtalo de nuevo.");
    }
  };
  
  
  

  return (
    <div className="flex flex-col justify-between items-center gap-10">
         <TopContainer/>
      <div className="containerBtnPerfil flex flex-col gap-5">
        {/* Botón para mostrar datos personales */}
        <div
          className={`w-[351px] p-5 bg-[#E5E5E5] rounded-[10px] shadow-lg font-bold transition-all duration-300 ${
            showPersonalData ? "h-auto" : "h-[60px]"
          } flex flex-col justify-between`}
        >
          <button
            className="w-full flex items-center justify-between"
            onClick={handleShowPersonalData}
          >
            Datos Personales
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#999"
              className={`transition-transform duration-300 ${
                showPersonalData ? "rotate-90" : ""
              }`}
            >
              <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
            </svg>
          </button>

          {/* Mostrar datos personales si showPersonalData es true */}
          {showPersonalData && (
            <div className="mt-4">
              {!isEditing ? (
                <>
                  <p>
                    <span className="font-bold">Nombre: </span>
                    <span className="font-normal text-[#ADADAD]">{formData.fullname}</span>
                  </p>
                  <p>
                    <span className="font-bold">Email: </span>
                    <span className="font-normal text-[#ADADAD]">{formData.email}</span>
                  </p>
                  <p>
                    <span className="font-bold">Rol: </span>
                    <span className="font-normal text-[#ADADAD]">{session?.user.role}</span>
                  </p>
                  <button
                    className="text-blue-500 underline mt-2"
                    onClick={handleEditToggle}
                  >
                    Editar
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="Nombre completo"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="Correo"
                    />
                  </div>
                  <div className="flex gap-4 mt-3">
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded shadow-lg"
                      onClick={handleSave}
                    >
                      Guardar
                    </button>
                    <button
                      className="bg-gray-500 text-white px-4 py-2 rounded shadow-lg"
                      onClick={handleEditToggle}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button className="w-[351px] flex items-center justify-between p-5 h-[60px] bg-[#E5E5E5] rounded-[10px] shadow-lg font-bold">
          Métodos de pago
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#999"
          >
            <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
          </svg>
        </button>

        {/* Botón para mostrar Objetivos */}
        <div
          className={`w-[351px] p-5 bg-[#E5E5E5] rounded-[10px] shadow-lg font-bold transition-all duration-300 ${
            showObjectives ? "h-auto" : "h-[60px]"
          } flex flex-col justify-between`}
        >
          <button
            className="w-full flex items-center justify-between"
            onClick={handleShowObjectives}
          >
            Objetivos
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#999"
              className={`transition-transform duration-300 ${
                showObjectives ? "rotate-90" : ""
              }`}
            >
              <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
            </svg>
          </button>

          {/* Aunque no muestre datos, el área se expande y colapsa */}
          {showObjectives && (
            <div className="mt-4">
              <p className="font-normal text-[#ADADAD]">Correr 10km</p>
            </div>
          )}
        </div>
      </div>

      <button
        className="w-[120px] h-[40px] bg-[#E5E5E5] text-[#333] rounded-[10px] shadow-lg"
        onClick={() => {
          signOut();
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export default ProfilePage;
