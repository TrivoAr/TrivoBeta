import Image from "next/image";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";

export interface DashboardCardProps {
  id: string;
  title: string;
  image: string;
  category: string;
  location: string;
  localidad: string;
  date?: string;
  time?: string;
  price?: string;
  teacher?: string;
  tipo_disciplina?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onViewMembers?: () => void;
  onClick?: () => void;
  isFavorite?: boolean;
  showActions?: boolean;
  type: 'salida' | 'team' | 'academia' | 'entrenamiento';
}

export const DashboardCard = ({
  id,
  title,
  image,
  category,
  location,
  localidad,
  date,
  time,
  price,
  teacher,
  tipo_disciplina,
  onEdit,
  onDelete,
  onToggleFavorite,
  onViewMembers,
  onClick,
  isFavorite = false,
  showActions = false,
  type
}: DashboardCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar activar el click si se clickeó en un botón
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border bg-white mx-auto mb-4 ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Imagen */}
      <div className="relative h-[115px] bg-slate-200">
        {imageLoading && (
          <div className="absolute inset-0">
            <Skeleton height={115} width={310} />
          </div>
        )}
        <Image
          src={image}
          alt={title}
          width={310}
          height={115}
          className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Categoría badge */}
      <div className="absolute bg-[#00000080] text-white rounded-full px-3 py-1 text-xs font-medium top-[10px] left-[10px]">
        {category || tipo_disciplina}
      </div>

      {/* Corazón de favorito en esquina superior derecha */}
      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          className="absolute top-[10px] right-[10px] p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isFavorite ? "#C95100" : "none"}
            stroke={isFavorite ? "#C95100" : "#C95100"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      )}

      {/* Contenido */}
      <div className="p-3 flex flex-col gap-1">
        <div className="mt-1">
          <h1 className="font-semibold text-lg text-gray-800 truncate">
            {title}
          </h1>
          
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <span className="mr-2">📍</span>
            <span className="truncate">{localidad}</span>
          </div>

          {/* Información específica por tipo */}
          {(date || time) && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span className="mr-2">🕒</span>
              <span>{date} {time}</span>
            </div>
          )}

          {price && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span className="mr-2">💰</span>
              <span>${price}</span>
            </div>
          )}

          {teacher && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span className="mr-2">👨‍🏫</span>
              <span className="truncate">{teacher}</span>
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      {showActions && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          {onViewMembers && (
            <button
              onClick={onViewMembers}
              className="p-2 rounded-[20px] bg-white/90 hover:bg-white transition-colors shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C95100" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-[20px] bg-white/90 hover:bg-white transition-colors shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C95100" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-[20px] bg-white/90 hover:bg-white transition-colors shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};