import Skeleton from "react-loading-skeleton";
import React from "react";
import { useSkeletonColors } from "@/hooks/useSkeletonColors";

const AcademiaMiembrosSkeleton = () => {
  const { baseColor, highlightColor } = useSkeletonColors();

  return (
    <div className="w-[390px] flex flex-col items-center space-y-4">
      {/* Header y botón volver */}
      <div className="relative w-full h-[40px] flex mb-2">
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
        width={200}
        height={28}
        baseColor={baseColor}
        highlightColor={highlightColor}
        className="mb-2"
      />
      {/* Tabla de miembros */}
      <table className="w-full border-collapse p-2">
        <thead>
          <tr>
            <th>
              <Skeleton
                width={40}
                height={16}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </th>
            <th>
              <Skeleton
                width={60}
                height={16}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </th>
            <th>
              <Skeleton
                width={60}
                height={16}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </th>
            <th>
              <Skeleton
                width={60}
                height={16}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map((i) => (
            <tr key={i} className="h-[70px]">
              <td className="flex justify-center items-center">
                <Skeleton
                  circle
                  width={45}
                  height={45}
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                />
              </td>
              <td className="text-sm text-center">
                <Skeleton
                  width={80}
                  height={18}
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                />
              </td>
              <td className="text-sm text-center">
                <Skeleton
                  width={90}
                  height={18}
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                />
              </td>
              <td className="text-sm text-center">
                <Skeleton
                  width={70}
                  height={32}
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  style={{ borderRadius: 16 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AcademiaMiembrosSkeleton;
