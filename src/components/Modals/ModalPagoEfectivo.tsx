import { useState } from "react";
export default function PaymentModal({ alumnos, grupos, onClose }) {
  const [selectedAlumno, setSelectedAlumno] = useState("");
  const [selectedMes, setSelectedMes] = useState("");

  const handleConfirm = () => {
    console.log(`Alumno: ${selectedAlumno}, Mes: ${selectedMes}`);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[350px]">
        <h2 className="text-xl font-semibold mb-4">Registrar pago</h2>

        <label className="block mb-2">Seleccionar alumno:</label>
        <select
          className="w-full mb-4 p-2 border-4 rounded"
          value={selectedAlumno}
          onChange={(e) => setSelectedAlumno(e.target.value)}
        >
          {Array.isArray(alumnos) && alumnos.length > 0 ? (
            alumnos.map((alumno) => (
              <option key={alumno._id} value={alumno._id}>
                {alumno.nombre}
              </option>
            ))
          ) : (
            <option disabled>Cargando alumnos...</option>
          )}
        </select>

        <label className="block mb-2 ">Seleccionar mes:</label>
        <select
          className="w-full mb-4 p-2 border-4 rounded"
          onChange={(e) => setSelectedMes(e.target.value)}
        >
          {["Enero", "Febrero", "Marzo", "Abril"].map((mes) => (
            <option key={mes} value={mes}>
              {mes}
            </option>
          ))}
        </select>

        <button
          className="w-full bg-[#FF9A3D] text-white py-2 rounded hover:bg-orange-600"
          onClick={handleConfirm}
        >
          Confirmar
        </button>

        <button className="w-full mt-2 text-gray-500 py-2" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
