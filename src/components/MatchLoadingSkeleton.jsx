import Skeleton from 'react-loading-skeleton';
import React from 'react';

const baseColor = '#e0e0e0';
const highlightColor = '#f5f5f5';

const AcademiaLoadingSkeleton = () => {
  return (
    <div className="flex flex-col w-[390px] items-center bg-[#FEFBF9] space-y-6 pb-[230px]">
      {/* Imagen de portada */}
      <div className="relative w-full h-[190px] flex mb-4">
        <Skeleton height={190} width="100%" style={{ position: 'absolute', top: 0, left: 0 }} baseColor={baseColor} highlightColor={highlightColor} />
        {/* Botones superiores */}
        <div className="absolute top-2 left-2">
          <Skeleton circle width={40} height={40} baseColor={baseColor} highlightColor={highlightColor} />
        </div>
        <div className="absolute top-2 right-14">
          <Skeleton circle width={40} height={40} baseColor={baseColor} highlightColor={highlightColor} />
        </div>
        <div className="absolute top-2 right-2">
          <Skeleton circle width={40} height={40} baseColor={baseColor} highlightColor={highlightColor} />
        </div>
      </div>

      {/* Nombre y localidad */}
      <div className="flex flex-col items-center w-full space-y-2 mb-2">
        <Skeleton width={200} height={36} baseColor={baseColor} highlightColor={highlightColor} />
        <Skeleton width={100} height={18} baseColor={baseColor} highlightColor={highlightColor} />
      </div>

      {/* Stats y reseñas */}
      <div className="w-[80%] border-b-[0.5px] h-[80px] border-b-[#ccc] flex justify-center items-center mb-2">
        <div className="flex flex-col justify-center items-center w-[49%] gap-2">
          <Skeleton width={40} height={20} baseColor={baseColor} highlightColor={highlightColor} />
          <div className="flex gap-2 mt-1">
            <Skeleton circle width={13} height={13} baseColor={baseColor} highlightColor={highlightColor} />
            <Skeleton circle width={13} height={13} baseColor={baseColor} highlightColor={highlightColor} />
            <Skeleton circle width={13} height={13} baseColor={baseColor} highlightColor={highlightColor} />
          </div>
        </div>
        <div className="h-[45px] w-[0.5px] border-r border-r-[#ccc]"></div>
        <div className="flex flex-col justify-center items-center w-[49%] gap-2">
          <Skeleton width={30} height={20} baseColor={baseColor} highlightColor={highlightColor} />
          <Skeleton width={60} height={16} baseColor={baseColor} highlightColor={highlightColor} />
        </div>
      </div>

      {/* Dueño y contacto */}
      <div className="w-[80%] border-b-[0.5px] h-[150px] border-b-[#ccc] flex justify-center items-center gap-4 mb-2">
        <Skeleton circle width={80} height={80} baseColor={baseColor} highlightColor={highlightColor} />
        <div className="flex flex-col justify-around h-[80px] gap-3">
          <Skeleton width={100} height={18} baseColor={baseColor} highlightColor={highlightColor} />
          <div className="flex gap-4 mt-2">
            <Skeleton width={60} height={24} baseColor={baseColor} highlightColor={highlightColor} />
            <Skeleton width={80} height={24} baseColor={baseColor} highlightColor={highlightColor} />
          </div>
        </div>
      </div>

      {/* Entrenamientos (título) */}
      <div className="flex items-center ml-8 mt-4 w-full mb-2">
        <Skeleton width={160} height={28} baseColor={baseColor} highlightColor={highlightColor} />
      </div>
      {/* Grupos (cards) */}
      <div className="flex gap-4 flex-wrap justify-start px-4 w-full mt-2 mb-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col w-[170px] gap-2 mb-2">
            <Skeleton height={144} width={170} style={{ borderRadius: 15 }} baseColor={baseColor} highlightColor={highlightColor} />
            <Skeleton width={90} height={20} style={{ borderRadius: 20 }} baseColor={baseColor} highlightColor={highlightColor} />
            <Skeleton width={80} height={16} baseColor={baseColor} highlightColor={highlightColor} />
            <Skeleton width={60} height={12} baseColor={baseColor} highlightColor={highlightColor} />
            <Skeleton width={60} height={12} baseColor={baseColor} highlightColor={highlightColor} />
          </div>
        ))}
      </div>

      {/* Miembros */}
      <div className="mt-6 w-full px-4 mb-2">
        <Skeleton width={120} height={28} baseColor={baseColor} highlightColor={highlightColor} />
        <div className="h-[130px] w-[160px] p-2 mt-2 flex flex-col gap-4">
          <Skeleton circle width={40} height={40} baseColor={baseColor} highlightColor={highlightColor} />
          <Skeleton width={100} height={16} baseColor={baseColor} highlightColor={highlightColor} />
          <div className="flex justify-end mt-4">
            <Skeleton width={40} height={20} baseColor={baseColor} highlightColor={highlightColor} />
          </div>
        </div>
      </div>

      {/* Precio y botón */}
      <div className="fixed bottom-[80px] w-[100%] left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#FEFBF9] shadow-md h-[120px] border px-2 flex justify-around items-center gap-6">
          <div className="w-[50%] flex flex-col justify-center items-start gap-3 p-4">
            <Skeleton width={80} height={28} baseColor={baseColor} highlightColor={highlightColor} />
            <Skeleton width={110} height={20} baseColor={baseColor} highlightColor={highlightColor} />
          </div>
          <div className="flex h-[60px] w-[60%] gap-4 justify-center items-center">
            <Skeleton width={140} height={50} style={{ borderRadius: 20 }} baseColor={baseColor} highlightColor={highlightColor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademiaLoadingSkeleton;
