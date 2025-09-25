'use client';

import React from 'react';
import { BaseCard } from '@/components/base/BaseCard';

/**
 * Interfaces para CardLayout
 */
export interface CardLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  loading?: boolean;
  skeleton?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

/**
 * Layout base para tarjetas de contenido
 */
export const CardLayout: React.FC<CardLayoutProps> = ({
  children,
  title,
  subtitle,
  header,
  footer,
  actions,
  className = '',
  headerClassName = '',
  contentClassName = '',
  footerClassName = '',
  loading = false,
  skeleton = false,
  onClick,
  hoverable = false
}) => {
  const isClickable = !!onClick;
  const shouldHover = hoverable || isClickable;

  return (
    <BaseCard
      className={`${shouldHover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Header personalizado o título/subtitle */}
      {(header || title || subtitle) && (
        <div className={`card-header ${headerClassName}`}>
          {header || (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && (
                  <h3 className={`text-lg font-semibold text-gray-900 ${loading || skeleton ? 'animate-pulse bg-gray-200 h-6 rounded' : ''}`}>
                    {loading || skeleton ? '' : title}
                  </h3>
                )}
                {subtitle && (
                  <p className={`text-sm text-gray-600 mt-1 ${loading || skeleton ? 'animate-pulse bg-gray-200 h-4 rounded mt-2' : ''}`}>
                    {loading || skeleton ? '' : subtitle}
                  </p>
                )}
              </div>
              {actions && !loading && !skeleton && (
                <div className="flex items-center space-x-2 ml-4">
                  {actions}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contenido principal */}
      <div className={`card-content ${contentClassName} ${(header || title || subtitle) && (footer || actions) ? 'py-4' : ''}`}>
        {loading || skeleton ? (
          <SkeletonContent />
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {footer && !loading && !skeleton && (
        <div className={`card-footer border-t border-gray-200 pt-4 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </BaseCard>
  );
};

/**
 * Componente de contenido skeleton
 */
const SkeletonContent: React.FC = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-full"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

/**
 * Layout para tarjetas de eventos sociales
 */
export interface SocialEventCardProps {
  event: {
    _id: string;
    nombreSalida: string;
    fechaHora: string;
    ubicacion?: {
      address?: string;
      city?: string;
    };
    precio?: number;
    limitePersonas?: number;
    miembros?: any[];
    imagen?: string;
    creador?: {
      firstname?: string;
      lastname?: string;
      imagen?: string;
    };
  };
  onViewDetails?: (eventId: string) => void;
  onJoin?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
  currentUserId?: string;
  showActions?: boolean;
  className?: string;
}

export const SocialEventCard: React.FC<SocialEventCardProps> = ({
  event,
  onViewDetails,
  onJoin,
  onLeave,
  currentUserId,
  showActions = true,
  className = ''
}) => {
  const isUserJoined = currentUserId && event.miembros?.some(
    (miembro: any) => miembro.usuario?._id === currentUserId || miembro.usuario === currentUserId
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCreatorName = () => {
    if (!event.creador) return 'Usuario';
    return `${event.creador.firstname || ''} ${event.creador.lastname || ''}`.trim() || 'Usuario';
  };

  const getMembersCount = () => {
    return event.miembros?.length || 0;
  };

  const getLocationText = () => {
    if (!event.ubicacion) return 'Ubicación no especificada';
    const { address, city } = event.ubicacion;
    return address || city || 'Ubicación no especificada';
  };

  return (
    <CardLayout
      className={className}
      onClick={() => onViewDetails?.(event._id)}
      hoverable
      header={
        <div className="flex items-start space-x-3">
          {/* Imagen del evento */}
          <div className="w-16 h-16 flex-shrink-0">
            {event.imagen ? (
              <img
                src={event.imagen}
                alt={event.nombreSalida}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </div>

          {/* Información del evento */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {event.nombreSalida}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              📅 {formatDate(event.fechaHora)}
            </p>
            <p className="text-sm text-gray-600 truncate">
              📍 {getLocationText()}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          {/* Info del creador y miembros */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>👤 {getCreatorName()}</span>
            <span>
              👥 {getMembersCount()}
              {event.limitePersonas && `/${event.limitePersonas}`}
            </span>
            {event.precio && event.precio > 0 && (
              <span className="font-medium text-green-600">
                ${event.precio}
              </span>
            )}
          </div>

          {/* Acciones */}
          {showActions && (
            <div className="flex items-center space-x-2">
              {isUserJoined ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeave?.(event._id);
                  }}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                >
                  Salir
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoin?.(event._id);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  Unirse
                </button>
              )}
            </div>
          )}
        </div>
      }
    >
      {/* Contenido adicional si es necesario */}
      <div className="space-y-2">
        {/* Tags o categorías */}
        <div className="flex flex-wrap gap-1">
          {event.precio === 0 && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              Gratis
            </span>
          )}
          {event.limitePersonas && getMembersCount() >= event.limitePersonas && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
              Completo
            </span>
          )}
        </div>
      </div>
    </CardLayout>
  );
};

/**
 * Layout para tarjetas de usuario/perfil
 */
export interface UserCardProps {
  user: {
    _id: string;
    firstname?: string;
    lastname?: string;
    imagen?: string;
    email?: string;
    rol?: string;
  };
  onViewProfile?: (userId: string) => void;
  showRole?: boolean;
  showEmail?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onViewProfile,
  showRole = false,
  showEmail = false,
  actions,
  className = ''
}) => {
  const getUserName = () => {
    return `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Usuario sin nombre';
  };

  const getUserImage = () => {
    if (user.imagen) return user.imagen;

    // Fallback a ui-avatars
    const name = getUserName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=80&background=3B82F6&color=ffffff`;
  };

  return (
    <CardLayout
      className={className}
      onClick={() => onViewProfile?.(user._id)}
      hoverable
      header={
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 flex-shrink-0">
            <img
              src={getUserImage()}
              alt={getUserName()}
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          {/* Información del usuario */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {getUserName()}
            </h3>
            {showEmail && user.email && (
              <p className="text-sm text-gray-600 truncate">
                {user.email}
              </p>
            )}
            {showRole && user.rol && (
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full mt-1">
                {user.rol}
              </span>
            )}
          </div>

          {/* Acciones */}
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      }
    />
  );
};

/**
 * Layout para tarjetas de estadísticas
 */
export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  trend?: {
    value: number;
    label?: string;
    direction: 'up' | 'down' | 'neutral';
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  trend,
  onClick,
  className = ''
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    gray: 'text-gray-600 bg-gray-100'
  };

  const trendIcons = {
    up: (
      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: (
      <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    )
  };

  return (
    <CardLayout
      className={className}
      onClick={onClick}
      hoverable={!!onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">
            {value}
          </div>
          <div className="text-sm text-gray-600">
            {title}
          </div>
          {trend && (
            <div className="flex items-center mt-2 text-xs">
              {trendIcons[trend.direction]}
              <span className="ml-1">{trend.value}%</span>
              {trend.label && (
                <span className="ml-1 text-gray-500">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </CardLayout>
  );
};