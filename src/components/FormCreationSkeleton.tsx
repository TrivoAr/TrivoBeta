"use client";

import React from "react";
import LoadingSkeleton, {
  SkeletonCard,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
} from "./LoadingSkeleton";

const FormCreationSkeleton: React.FC = () => {
  return (
    <div className="w-[390px] flex flex-col items-center gap-5 bg-[#FEFBF9] dark:bg-gray-900 min-h-screen">
      {/* Header con botón de retroceso */}
      <div className="relative w-full h-[40px] flex">
        <div className="absolute top-2 left-2">
          <LoadingSkeleton circle height={40} width={40} />
        </div>
      </div>

      {/* Título */}
      <LoadingSkeleton height={28} width={250} className="text-center" />

      {/* Formulario */}
      <div className="max-w-sm mx-auto p-4 space-y-5 rounded-xl mb-[80px] bg-[#FEFBF9] dark:bg-gray-900 w-full">
        {/* Campo select (Academia) */}
        <LoadingSkeleton height={56} width="100%" borderRadius="15px" />

        {/* Campo input (Nombre) */}
        <LoadingSkeleton height={56} width="100%" borderRadius="15px" />

        {/* Campo select (Dificultad) */}
        <LoadingSkeleton height={56} width="100%" borderRadius="15px" />

        {/* Campo time (Horario) */}
        <LoadingSkeleton height={56} width="100%" borderRadius="15px" />

        {/* Días de entrenamiento */}
        <div className="space-y-4">
          <LoadingSkeleton height={20} width={180} />

          {/* Chips visuales */}
          <div className="flex flex-wrap gap-3 mt-2">
            {[1, 2, 3].map((_, index) => (
              <LoadingSkeleton
                key={index}
                height={32}
                width={60}
                borderRadius="16px"
              />
            ))}
          </div>

          {/* Select múltiple de días */}
          <LoadingSkeleton height={180} width="100%" borderRadius="12px" />
        </div>

        {/* Campo select (Duración del entrenamiento) */}
        <LoadingSkeleton height={56} width="100%" borderRadius="15px" />

        {/* Campo input (Cuota mensual) */}
        <LoadingSkeleton height={56} width="100%" borderRadius="15px" />

        {/* Campo textarea (Descripción) */}
        <LoadingSkeleton height={80} width="100%" borderRadius="15px" />

        {/* Campo textarea (Avisos) */}
        <LoadingSkeleton height={80} width="100%" borderRadius="15px" />

        {/* Campo select (Tipo de grupo) */}
        <LoadingSkeleton height={56} width="100%" borderRadius="15px" />

        {/* Banner del grupo */}
        <div className="space-y-2">
          <LoadingSkeleton height={16} width={120} />
          <div className="w-full h-40 bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
            <LoadingSkeleton height="100%" width="100%" />
          </div>
        </div>

        {/* Ubicación */}
        <div className="space-y-2">
          <LoadingSkeleton height={16} width={80} />
          <LoadingSkeleton height={56} width="100%" borderRadius="15px" />
        </div>

        {/* Mapa */}
        <div className="w-full h-[300px] bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md overflow-hidden">
          <LoadingSkeleton height="100%" width="100%" />
        </div>

        {/* Botón de envío */}
        <LoadingSkeleton height={48} width="100%" borderRadius="20px" />
      </div>

      {/* Espaciado final */}
      <div className="pb-[20px]"></div>
    </div>
  );
};

export default FormCreationSkeleton;
