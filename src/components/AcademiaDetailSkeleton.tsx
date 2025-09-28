"use client";

import React from "react";
import LoadingSkeleton, {
  SkeletonCard,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage
} from "./LoadingSkeleton";

const AcademiaDetailSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col w-[390px] items-center bg-background min-h-screen">
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

      <div className="flex w-full mt-2 px-3 justify-center">
        {/* Título y ubicación */}
        <div className="text-center">
          <LoadingSkeleton height={36} width={280} className="mb-2" />
          <div className="flex items-center justify-center gap-1">
            <LoadingSkeleton circle height={13} width={13} />
            <LoadingSkeleton height={16} width={150} />
          </div>
        </div>
      </div>

      {/* Rating y reseñas */}
      <div className="w-[80%] border-b-[0.5px] h-[80px] border-b-border dark:border-b-gray-600 flex justify-center items-center mt-4">
        <div className="flex flex-col justify-center items-center w-[49%]">
          <LoadingSkeleton height={20} width={40} className="mb-1" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <LoadingSkeleton key={index} height={16} width={16} />
            ))}
          </div>
        </div>
        <div className="h-[45px] w-[0.5px] border-r border-r-border dark:border-r-gray-600"></div>
        <div className="flex flex-col justify-center items-center w-[49%]">
          <LoadingSkeleton height={18} width={30} className="mb-1" />
          <LoadingSkeleton height={16} width={60} />
        </div>
      </div>

      {/* Dueño de la academia */}
      <div className="w-[80%] border-b-[0.5px] h-[150px] border-b-border dark:border-b-gray-600 flex justify-center items-center gap-2">
        <SkeletonAvatar size={80} />
        <div className="flex flex-col justify-around h-[80px] gap-2">
          <LoadingSkeleton height={16} width={140} />
          <div className="flex gap-2 justify-center items-center">
            <LoadingSkeleton height={16} width={60} />
            <LoadingSkeleton height={30} width={105} borderRadius="20px" />
          </div>
        </div>
      </div>

      {/* Entrenamientos */}
      <div className="flex flex-col gap-5 mt-4 w-full">
        <div className="flex items-center ml-8">
          <LoadingSkeleton height={28} width={180} />
        </div>

        {/* Grid de grupos */}
        <div className="flex gap-2 flex-wrap justify-start px-4">
          {[1, 2, 3, 4].map((_, index) => (
            <div key={index} className="flex flex-col w-[170px] gap-1">
              <div className="bg-card dark:bg-gray-800 w-[170px] h-[144px] rounded-[15px] shadow-md border border-border dark:border-gray-600 relative">
                <SkeletonImage height={144} width={170} />
                <div className="absolute top-2 left-2">
                  <LoadingSkeleton height={20} width={75} borderRadius="20px" />
                </div>
              </div>
              <div>
                <LoadingSkeleton height={16} width={130} className="mb-1" />
                <LoadingSkeleton height={12} width={100} className="mb-1" />
                <LoadingSkeleton height={10} width={80} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[80%] border-b border-b-border dark:border-b-gray-600 mt-5"></div>

      {/* Miembros */}
      <div className="mt-3 flex flex-col w-full px-4">
        <LoadingSkeleton height={28} width={120} className="ml-6 mb-3" />
        <div>
          <div className="h-[130px] w-[160px] p-2 bg-card dark:bg-gray-800 border border-border dark:border-gray-600 shadow-md rounded-[20px] flex flex-col justify-evenly">
            <div>
              <LoadingSkeleton height={40} width={40} className="mb-2" />
              <LoadingSkeleton height={16} width={120} />
            </div>
            <div className="flex items-center justify-end gap-1">
              <LoadingSkeleton height={16} width={30} />
              <LoadingSkeleton height={20} width={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="w-[80%] border-b border-b-border dark:border-b-gray-600 mt-5"></div>

      {/* Reseñas */}
      <div className="flex flex-col w-full px-4 mb-2">
        <div className="flex items-center ml-4 mb-2 mt-2">
          <LoadingSkeleton height={28} width={120} className="ml-4 mb-3" />
        </div>

        {/* Cards de reseñas */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 snap-x snap-mandatory mb-3">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-[220px] snap-start">
                <div className="bg-card dark:bg-gray-800 border border-border dark:border-gray-600 rounded-lg p-4 shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <SkeletonAvatar size={40} />
                    <div>
                      <LoadingSkeleton height={16} width={100} className="mb-1" />
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((_, starIndex) => (
                          <LoadingSkeleton key={starIndex} height={12} width={12} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <SkeletonText lines={3} />
                  <LoadingSkeleton height={12} width={80} className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ver todas las reseñas */}
        <div className="flex justify-center mt-3 mb-3">
          <LoadingSkeleton height={16} width={180} />
        </div>
      </div>

      <div className="w-[80%] border-b border-b-border dark:border-b-gray-600 mt-5"></div>

      {/* Botón de reseña (si es miembro) */}
      <div className="flex flex-col w-full items-center mt-4 mb-4">
        <LoadingSkeleton height={40} width={200} borderRadius="20px" />
      </div>

      <div className="w-[80%] border-b border-b-border dark:border-b-gray-600 mt-5"></div>

      {/* Footer fijo con precio y botones */}
      <div className="fixed bottom-[80px] w-[390px] left-1/2 -translate-x-1/2 z-50">
        <div className="bg-card dark:bg-gray-800 shadow-md h-[120px] border border-border dark:border-gray-600 px-2 flex justify-around items-center">
          <div className="w-[50%] flex flex-col justify-center items-start gap-1 p-4">
            <LoadingSkeleton height={24} width={80} />
            <LoadingSkeleton height={20} width={110} borderRadius="20px" />
          </div>

          <div className="flex h-[60px] w-[60%] gap-3 justify-center items-center">
            <LoadingSkeleton height={35} width={140} borderRadius="20px" />
          </div>
        </div>
      </div>

      {/* Espaciado final */}
      <div className="pb-[230px]"></div>
    </div>
  );
};

export default AcademiaDetailSkeleton;