"use client";

import { FaCalendarAlt, FaUser, FaBullseye } from "react-icons/fa";

const DetalleGrupo = () => {
  const grupo = {
    nombre: "Entrenamiento General 5km",
    ubicacion: "Plaza Roca, Tucumán",
    nivel: "Intermedio",
    horario: "Lunes y Jueves 19h",
    cuota_mensual: "$25000/mes",
    descripcion:
      "Un grupo ideal diseñado para los recién iniciados en carreras de 5km, con técnicas específicas, apoyo grupal y evaluación continua.",
    eventos: [{ titulo: "Trekking cerro San Javier", fecha: "Sáb 15 Oct" }],
    objetivos: ["Participar en carreras locales", "Mantener un estilo de vida activo"],
    profesor: {
      nombre: "Manuel Hernández",
      descripcion:
        "Profesor especializado en running, ganador de múltiples competencias locales y entrenador con 10 años de experiencia.",
    },
    miembros: [
      "Andrea Morales",
      "Álvaro Landeta",
      "Alejandra Méndez",
      "Adrián Lucena",
      "Sofía Márquez",
      "Javier Acosta",
    ],
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 flex flex-col items-center">
      <div className="max-w-md bg-white shadow-lg rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="relative">
          <img
            src="/path/to/banner.jpg"
            alt="Banner del grupo"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-bold text-white">{grupo.nombre}</h1>
            <p className="text-sm text-gray-300 mt-1">{grupo.ubicacion}</p>
          </div>
        </div>

        {/* Información principal */}
        <div className="p-6 space-y-6">
          {/* Nivel y horario */}
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-sm text-gray-500">Nivel</p>
              <p className="text-base font-bold text-gray-800">{grupo.nivel}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Horario</p>
              <p className="text-base font-bold text-gray-800">{grupo.horario}</p>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h2 className="text-lg font-bold text-gray-800">Descripción</h2>
            <p className="text-sm text-gray-600 mt-2">{grupo.descripcion}</p>
          </div>

          {/* Eventos próximos */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <FaCalendarAlt className="mr-2 text-indigo-500" /> Eventos próximos
            </h2>
            <div className="mt-2 bg-indigo-100 rounded-lg p-4">
              <p className="font-medium text-gray-800">{grupo.eventos[0].titulo}</p>
              <p className="text-sm text-gray-600">{grupo.eventos[0].fecha}</p>
            </div>
          </div>

          {/* Objetivos */}
          <div>
            <h2 className="text-lg font-bold text-gray-800">Objetivos</h2>
            <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
              {grupo.objetivos.map((objetivo, index) => (
                <li key={index}>{objetivo}</li>
              ))}
            </ul>
          </div>

          {/* Profesor */}
          <div>
            <h2 className="text-lg font-bold text-gray-800">Profesor</h2>
            <div className="flex items-center mt-2">
              <img
                src="/path/to/professor.jpg"
                alt="Foto del profesor"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="ml-4">
                <p className="font-semibold text-gray-800">{grupo.profesor.nombre}</p>
                <p className="text-sm text-gray-600">{grupo.profesor.descripcion}</p>
              </div>
            </div>
          </div>

          {/* Miembros */}
          <div>
            <h2 className="text-lg font-bold text-gray-800">Miembros del grupo</h2>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {grupo.miembros.map((miembro, index) => (
                <div
                  key={index}
                  className="text-center bg-gray-100 rounded-full p-2 text-sm text-gray-700"
                >
                  {miembro}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 flex justify-between items-center">
          <p className="text-lg font-bold text-gray-800">{grupo.cuota_mensual}</p>
          <button className="bg-orange-500 text-white px-4 py-2 rounded-md shadow hover:bg-orange-600">
            Ingresar al grupo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleGrupo;