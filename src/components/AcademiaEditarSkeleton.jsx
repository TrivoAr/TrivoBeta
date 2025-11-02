import Skeleton from "react-loading-skeleton";
import React from "react";
import { useSkeletonColors } from "@/hooks/useSkeletonColors";

const AcademiaEditarSkeleton = () => {
  const { baseColor, highlightColor } = useSkeletonColors();

  return (
    <div className="w-[390px] flex flex-col items-center gap-5">
      {/* Header y botón volver */}
      <div className="relative w-full h-[30px] flex">
        <div className="absolute top-2 left-2">
          <Skeleton
            circle
            width={36}
            height={36}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
      </div>
      <Skeleton
        width={180}
        height={28}
        baseColor={baseColor}
        highlightColor={highlightColor}
        className="mb-2"
      />
      <div className="w-[390px] mx-auto p-4 space-y-5 rounded-xl mb-[80px] bg-background">
        {/* Input nombre_academia */}
        <Skeleton
          className="w-full px-4 py-6 rounded-[40px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Input precio */}
        <Skeleton
          className="w-full px-4 py-6 rounded-[40px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Select país */}
        <Skeleton
          className="w-full px-4 py-6 rounded-[40px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Select provincia */}
        <Skeleton
          className="w-full px-4 py-6 rounded-[40px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Select localidad */}
        <Skeleton
          className="w-full px-4 py-5 rounded-[40px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Textarea descripción */}
        <Skeleton
          className="w-full px-4 py-9 rounded-[40px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Select tipo_disciplina */}
        <Skeleton
          className="w-full px-4 py-4 rounded-[40px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Checkbox clase gratis */}
        <div className="flex items-center gap-2 my-5">
          <Skeleton
            circle
            width={24}
            height={24}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <Skeleton
            width={120}
            height={18}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
        {/* Imagen */}
        <Skeleton
          className="w-full h-48 rounded-xl my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Botón guardar */}
        <Skeleton
          className="w-full h-12 rounded-[20px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        {/* Botón eliminar */}
        <Skeleton
          className="w-full h-10 rounded-[10px] my-5"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
      </div>
    </div>
  );
};

export default AcademiaEditarSkeleton;
