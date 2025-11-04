import Skeleton from "react-loading-skeleton";
import React from "react";
import { useSkeletonColors } from "@/hooks/useSkeletonColors";

const GrupoVistaSkeleton = () => {
  const { baseColor, highlightColor } = useSkeletonColors();

  return (
    <div className="bg-background min-h-screen p-4 flex flex-col items-center">
      <div className="max-w-md bg-card shadow-lg rounded-3xl overflow-hidden w-full">
        {/* Header */}
        <div className="relative">
          <Skeleton
            height={160}
            width="100%"
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-center">
            <Skeleton
              width={200}
              height={28}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <Skeleton
              width={120}
              height={16}
              baseColor={baseColor}
              highlightColor={highlightColor}
              className="mt-2"
            />
          </div>
        </div>

        {/* Información principal */}
        <div className="p-6 space-y-6">
          {/* Nivel y horario */}
          <div className="flex justify-between items-center">
            <div className="text-center">
              <Skeleton
                width={40}
                height={14}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
              <Skeleton
                width={60}
                height={18}
                baseColor={baseColor}
                highlightColor={highlightColor}
                className="mt-1"
              />
            </div>
            <div className="text-center">
              <Skeleton
                width={40}
                height={14}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
              <Skeleton
                width={80}
                height={18}
                baseColor={baseColor}
                highlightColor={highlightColor}
                className="mt-1"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <Skeleton
              width={100}
              height={20}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <Skeleton
              count={2}
              width={"100%"}
              height={14}
              baseColor={baseColor}
              highlightColor={highlightColor}
              className="mt-2"
            />
          </div>

          {/* Eventos próximos */}
          <div>
            <Skeleton
              width={140}
              height={20}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <div className="mt-2 bg-indigo-100 rounded-lg p-4">
              <Skeleton
                width={120}
                height={16}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
              <Skeleton
                width={80}
                height={14}
                baseColor={baseColor}
                highlightColor={highlightColor}
                className="mt-1"
              />
            </div>
          </div>

          {/* Objetivos */}
          <div>
            <Skeleton
              width={80}
              height={20}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <div className="mt-2 space-y-1">
              <Skeleton
                width={180}
                height={14}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
              <Skeleton
                width={160}
                height={14}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </div>
          </div>

          {/* Profesor */}
          <div>
            <Skeleton
              width={80}
              height={20}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <div className="flex items-center mt-2">
              <Skeleton
                circle
                width={48}
                height={48}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
              <div className="ml-4">
                <Skeleton
                  width={100}
                  height={16}
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                />
                <Skeleton
                  width={180}
                  height={14}
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Miembros */}
          <div>
            <Skeleton
              width={140}
              height={20}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton
                  key={i}
                  circle
                  width={48}
                  height={48}
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 flex justify-between items-center">
          <Skeleton
            width={100}
            height={20}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <Skeleton
            width={120}
            height={40}
            baseColor={baseColor}
            highlightColor={highlightColor}
            style={{ borderRadius: 8 }}
          />
        </div>
      </div>
    </div>
  );
};

export default GrupoVistaSkeleton;
