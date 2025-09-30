"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface ClubDelTrekkingProps {
  className?: string;
}

export const ClubDelTrekking = ({ className = "" }: ClubDelTrekkingProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/club-del-trekking");
  };

  return (
    <div
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group ${className}`}
    >
      {/* Fondo gradiente con patrón de montañas */}
      <div className="relative bg-gradient-to-br from-[#C95100] via-[#A03D00] to-[#7A2D00] p-6 min-h-[160px]">
        {/* Patrón de montañas abstracto */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 160" className="w-full h-full">
            <path
              d="M0,160 L0,100 L50,60 L100,80 L150,40 L200,70 L250,30 L300,50 L350,20 L400,40 L400,160 Z"
              fill="currentColor"
              className="text-white"
            />
            <path
              d="M0,160 L0,120 L60,90 L120,110 L180,70 L240,100 L300,60 L360,80 L400,50 L400,160 Z"
              fill="currentColor"
              className="text-white opacity-60"
            />
          </svg>
        </div>

        {/* Contenido del banner */}
        <div className="relative z-10 flex items-center justify-between h-full">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* Icono de montaña */}
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M5 16L8 10L12 14L16 8L19 12V16H5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 20H22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">
                Club del Trekking
              </h3>
            </div>

            <p className="text-white/90 text-sm font-medium mb-3 leading-relaxed">
              Únete a aventuras únicas en la naturaleza
            </p>

            {/* Badge de llamada a la acción */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 transition-all duration-300 group-hover:bg-white/30">
              <span className="text-white text-xs font-semibold">Explorar ahora</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white transform transition-transform duration-300 group-hover:translate-x-1"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Icono decorativo lateral */}
          <div className="hidden sm:block opacity-30 transform rotate-12 transition-transform duration-300 group-hover:rotate-6">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M17 18L22 12L17 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 6L7 12L2 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 12H22"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Efectos de brillo */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl transform -translate-x-8 -translate-y-8"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-8 translate-y-8"></div>
      </div>

      {/* Indicador de hover sutil */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#FFB86A] to-[#C95100] transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></div>
    </div>
  );
};

