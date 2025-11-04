import Skeleton from "react-loading-skeleton";
import React from "react";
import { useSkeletonColors } from "@/hooks/useSkeletonColors";

const GrupoDetailSkeleton = () => {
  const { baseColor, highlightColor } = useSkeletonColors();

  return (
    <div className="flex flex-col w-[390px] items-center bg-background">
      {/* Header con imagen y botón */}
      <div className="relative w-full h-[190px] flex mb-2">
        <Skeleton
          height={190}
          width="100%"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        <div className="absolute top-2 left-2">
          <Skeleton
            circle
            width={36}
            height={36}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
        <div className="absolute top-2 right-4">
          <Skeleton
            circle
            width={36}
            height={36}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
      </div>
      {/* Título y localidad */}
      <div className="flex flex-col items-center gap-2 w-full px-3 mb-2">
        <Skeleton
          width={220}
          height={36}
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        <Skeleton
          width={100}
          height={18}
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        <div className="w-[90%] border-b border-b-[#ccc] mt-2"></div>
      </div>
      {/* Info del grupo */}
      <div className="w-full flex flex-col gap-4 mb-2">
        <Skeleton
          width={180}
          height={24}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        {[1, 2, 3, 4].map((i) => (
          <div className="w-[90%] ml-4 flex flex-col gap-1" key={i}>
            <div className="flex items-center gap-2">
              <Skeleton
                width={20}
                height={20}
                circle
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
              <Skeleton
                width={120}
                height={16}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </div>
            <Skeleton
              width={160}
              height={16}
              baseColor={baseColor}
              highlightColor={highlightColor}
              className="ml-6"
            />
          </div>
        ))}
        <div className="w-[90%] border-b border-b-[#ccc] self-center"></div>
      </div>
      {/* Descripción */}
      <div className="flex flex-col w-[390px] mb-2">
        <Skeleton
          width={120}
          height={22}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        <Skeleton
          width={320}
          height={16}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        <Skeleton
          width={280}
          height={14}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-1"
        />
        <div className="w-[90%] border-b border-b-[#ccc] self-center mt-2"></div>
      </div>
      {/* Avisos */}
      <div className="flex flex-col w-[390px] mb-2">
        <Skeleton
          width={160}
          height={22}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        <Skeleton
          width={320}
          height={16}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        <Skeleton
          width={280}
          height={14}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-1"
        />
        <div className="w-[90%] border-b border-b-[#ccc] self-center mt-2"></div>
      </div>
      {/* Punto de encuentro y mapa */}
      <div className="flex flex-col w-[390px] mb-2">
        <Skeleton
          width={180}
          height={22}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        <Skeleton
          width={200}
          height={16}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        <Skeleton
          width={350}
          height={180}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="self-center mt-3 rounded-xl"
        />
        <div className="w-[90%] border-b border-b-[#ccc] self-center mt-3"></div>
      </div>
      {/* Miembros */}
      <div className="flex flex-col w-[390px] mb-2">
        <Skeleton
          width={180}
          height={22}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        <div className="flex gap-2 ml-6 mt-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton
              key={i}
              circle
              width={75}
              height={75}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
          ))}
        </div>
        <div className="w-[90%] border-b border-b-[#ccc] self-center mt-2"></div>
      </div>
      {/* Profesor */}
      <div className="flex flex-col w-[390px] mb-2">
        <Skeleton
          width={120}
          height={22}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="ml-6 mt-2"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="self-center mt-2">
            <Skeleton
              className="w-[300px] h-[176px] rounded-[20px]"
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <div className="absolute -mt-[150px] left-1/2 -translate-x-1/2">
              <Skeleton
                circle
                width={80}
                height={80}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </div>
          </div>
          <Skeleton
            width={100}
            height={18}
            baseColor={baseColor}
            highlightColor={highlightColor}
            className="self-center mt-2"
          />
          <Skeleton
            width={60}
            height={12}
            baseColor={baseColor}
            highlightColor={highlightColor}
            className="self-center"
          />
          <Skeleton
            width={300}
            height={14}
            baseColor={baseColor}
            highlightColor={highlightColor}
            className="self-center mt-2"
          />
        </div>
      </div>
      <div className="pb-[200px]"></div>
    </div>
  );
};

export default GrupoDetailSkeleton;
