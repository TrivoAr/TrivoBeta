import { useState } from "react";
import { BounceModal } from "@/components/base/AnimatedModal";

export default function PaymentModal({ alumnos, grupos, onClose }) {
  const [selectedAlumno, setSelectedAlumno] = useState("");
  const [selectedMes, setSelectedMes] = useState("");

  const handleConfirm = () => {
    console.log(`Alumno: ${selectedAlumno}, Mes: ${selectedMes}`);
    onClose();
  };

  return (
    <BounceModal
      isOpen={true}
      onClose={onClose}
      title="Registrar pago"
      size="sm"
      footer={
        <div className="flex flex-col space-y-2 w-full">
          <button
            className="w-full bg-[#FF9A3D] text-white py-2 rounded hover:bg-orange-600 transition-colors"
            onClick={handleConfirm}
          >
            Confirmar
          </button>
          <button
            className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium">
            Seleccionar alumno:
          </label>
          <select
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9A3D] focus:border-transparent"
            value={selectedAlumno}
            onChange={(e) => setSelectedAlumno(e.target.value)}
          >
            <option value="">Seleccionar...</option>
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
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">
            Seleccionar mes:
          </label>
          <select
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9A3D] focus:border-transparent"
            value={selectedMes}
            onChange={(e) => setSelectedMes(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {["Enero", "Febrero", "Marzo", "Abril"].map((mes) => (
              <option key={mes} value={mes}>
                {mes}
              </option>
            ))}
          </select>
        </div>
      </div>
    </BounceModal>
  );
}
