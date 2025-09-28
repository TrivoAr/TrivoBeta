"use client";

import React from "react";
import LoadingSkeleton, {
  SkeletonCard,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage
} from "./LoadingSkeleton";

const GrupoDetailSkeletonV2: React.FC = () => {
  return (
    <div className="flex flex-col w-[390px] items-center bg-[#FEFBF9] dark:bg-gray-900 min-h-screen">
      {/* Header con imagen de fondo */}
      <div className="relative w-full h-[190px]">
        <SkeletonImage
          height={190}
          width="100%"
          className="w-full h-full"
        />

        {/* Botones overlay */}
        <div className="absolute top-2 left-2">
          <LoadingSkeleton circle height={36} width={36} />
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <LoadingSkeleton circle height={36} width={36} />
          <LoadingSkeleton circle height={36} width={36} />
        </div>
      </div>

      <div className="px-4 py-2 w-full">
        {/* Título del grupo */}
        <div className="flex flex-col items-center gap-3 w-full px-3 justify-center mb-6">
          <div className="text-center">
            <LoadingSkeleton height={35} width={250} className="mb-2" />
            <div className="flex items-center justify-center gap-1">
              <LoadingSkeleton circle height={13} width={13} />
              <LoadingSkeleton height={16} width={120} />
            </div>
          </div>
          <LoadingSkeleton height={1} width="90%" />
        </div>

        {/* Info del entrenamiento */}
        <div className="w-full flex flex-col gap-2 mb-6">
          <LoadingSkeleton height={22} width={180} className="ml-6" />

          {/* Items de información */}
          {[1, 2, 3, 4].map((_, index) => (
            <div key={index} className="w-[90%] ml-4 flex">
              <div>
                <div className="flex items-center justify-start gap-1 mb-1">
                  <LoadingSkeleton circle height={20} width={20} />
                  <LoadingSkeleton height={16} width={150} />
                </div>
                <LoadingSkeleton height={14} width={100} className="ml-6" />
              </div>
            </div>
          ))}

          <LoadingSkeleton height={1} width="90%" className="self-center mt-4" />
        </div>

        {/* Descripción */}
        <div className="flex flex-col w-full mt-6 mb-6">
          <LoadingSkeleton height={22} width={120} className="ml-6 mb-2" />
          <SkeletonText lines={3} className="p-2 ml-5 mb-3" />
          <LoadingSkeleton height={1} width="90%" className="self-center" />
        </div>

        {/* Avisos importantes */}
        <div className="flex flex-col w-full mb-6">
          <LoadingSkeleton height={22} width={180} className="ml-6 mb-2" />
          <SkeletonText lines={2} className="p-2 ml-5 mb-3" />
          <LoadingSkeleton height={1} width="90%" className="self-center" />
        </div>

        {/* Punto de encuentro */}
        <div className="flex flex-col w-full mb-6">
          <LoadingSkeleton height={20} width={160} className="ml-6 mb-2" />
          <div className="flex items-center gap-1 ml-6 mb-4">
            <LoadingSkeleton circle height={13} width={13} />
            <LoadingSkeleton height={14} width={200} />
          </div>

          {/* Mapa skeleton */}
          <div className="w-[90%] h-[310px] rounded-xl overflow-hidden border z-0 self-center relative">
            <LoadingSkeleton height="100%" width="100%" />
            <div className="absolute top-2 right-2">
              <LoadingSkeleton height={24} width={120} borderRadius="0.25rem" />
            </div>
          </div>

          <LoadingSkeleton height={1} width="90%" className="self-center mt-5" />
        </div>

        {/* Miembros de la tribu */}
        <div className="flex flex-col w-full mb-6">
          <LoadingSkeleton height={20} width={160} className="ml-6 mb-2" />
          <div className="flex gap-2 ml-6 mt-2 flex-wrap">
            {[1, 2, 3, 4].map((_, index) => (
              <SkeletonAvatar key={index} size={75} />
            ))}
          </div>
          <LoadingSkeleton height={1} width="90%" className="self-center mt-4" />
        </div>

        {/* Profesor */}
        <div className="flex flex-col w-full mb-6">
          <LoadingSkeleton height={20} width={80} className="ml-6 mb-2" />
          <div className="flex flex-col items-center gap-2">
            <div className="self-center mt-2">
              <div className="w-[300px] h-[176px] bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-[20px] flex flex-col items-center gap-1 p-4">
                <SkeletonAvatar size={80} className="mt-2" />
                <LoadingSkeleton height={16} width={150} className="mt-2" />
                <LoadingSkeleton height={12} width={60} />
              </div>
            </div>
            <SkeletonText lines={3} className="w-[300px] text-justify mt-2" />
          </div>
        </div>

        {/* Espaciado final */}
        <div className="pb-[200px]"></div>
      </div>
    </div>
  );
};

export default GrupoDetailSkeletonV2;