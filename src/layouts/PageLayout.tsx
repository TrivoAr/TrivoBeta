'use client';

import React from 'react';
import { BaseCard } from '@/components/base/BaseCard';

/**
 * Interfaces para PageLayout
 */
export interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  backUrl?: string;
  actions?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

/**
 * Layout base para páginas
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  showBackButton = false,
  backUrl,
  actions,
  className = '',
  containerClassName = '',
  headerClassName = '',
  contentClassName = '',
  loading = false,
  error = null,
  onRetry
}) => {
  const handleBackClick = () => {
    if (backUrl) {
      window.location.href = backUrl;
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`page-layout min-h-screen bg-gray-50 ${className}`}>
      <div className={`container mx-auto px-4 py-6 max-w-sm ${containerClassName}`}>
        {/* Header */}
        {(title || subtitle || breadcrumbs || showBackButton || actions) && (
          <header className={`page-header mb-6 ${headerClassName}`}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="breadcrumbs mb-2" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm text-gray-500">
                  {breadcrumbs.map((item, index) => (
                    <li key={index} className="flex items-center">
                      {index > 0 && (
                        <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {item.href && !item.active ? (
                        <a
                          href={item.href}
                          className="hover:text-gray-700 transition-colors"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span className={item.active ? 'text-gray-900 font-medium' : ''}>
                          {item.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Título y controles */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {/* Botón de volver */}
                {showBackButton && (
                  <button
                    onClick={handleBackClick}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Volver"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Título y subtítulo */}
                <div>
                  {title && (
                    <h1 className="text-2xl font-bold text-gray-900">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-gray-600 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones */}
              {actions && (
                <div className="flex items-center space-x-2">
                  {actions}
                </div>
              )}
            </div>
          </header>
        )}

        {/* Contenido principal */}
        <main className={`page-content ${contentClassName}`}>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={onRetry} />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
};

/**
 * Estado de carga
 */
const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-600">Cargando...</p>
    </div>
  </div>
);

/**
 * Estado de error
 */
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <BaseCard className="text-center py-12">
    <div className="text-red-500 mb-4">
      <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
    <p className="text-gray-600 mb-4">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Reintentar
      </button>
    )}
  </BaseCard>
);

/**
 * Layout específico para dashboards
 */
export interface DashboardLayoutProps extends Omit<PageLayoutProps, 'title'> {
  user?: {
    firstname?: string;
    lastname?: string;
    imagen?: string;
  };
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
  }>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  stats,
  ...pageLayoutProps
}) => {
  const getUserDisplayName = () => {
    if (!user) return 'Usuario';
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    return user.firstname || user.lastname || 'Usuario';
  };

  const title = `¡Hola, ${getUserDisplayName()}!`;

  return (
    <PageLayout
      {...pageLayoutProps}
      title={title}
      subtitle="Bienvenido a tu dashboard"
    >
      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => (
            <BaseCard key={index} className="text-center">
              {stat.icon && (
                <div className={`text-2xl mb-2 ${stat.color || 'text-blue-500'}`}>
                  {stat.icon}
                </div>
              )}
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </BaseCard>
          ))}
        </div>
      )}

      {children}
    </PageLayout>
  );
};

/**
 * Layout para formularios
 */
export interface FormLayoutProps extends Omit<PageLayoutProps, 'children'> {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
  formClassName?: string;
  actionsClassName?: string;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  onSubmit,
  submitLabel = 'Guardar',
  submitDisabled = false,
  submitLoading = false,
  showCancelButton = false,
  onCancel,
  cancelLabel = 'Cancelar',
  formClassName = '',
  actionsClassName = '',
  ...pageLayoutProps
}) => {
  return (
    <PageLayout {...pageLayoutProps}>
      <form onSubmit={onSubmit} className={`space-y-6 ${formClassName}`}>
        {children}

        {/* Acciones del formulario */}
        <div className={`flex flex-col space-y-3 pt-6 border-t border-gray-200 ${actionsClassName}`}>
          <button
            type="submit"
            disabled={submitDisabled || submitLoading}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {submitLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Guardando...
              </>
            ) : (
              submitLabel
            )}
          </button>

          {showCancelButton && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </form>
    </PageLayout>
  );
};

/**
 * Layout para listas/grids
 */
export interface ListLayoutProps extends PageLayoutProps {
  emptyState?: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
  };
  itemCount?: number;
  showItemCount?: boolean;
}

export const ListLayout: React.FC<ListLayoutProps> = ({
  children,
  emptyState,
  itemCount = 0,
  showItemCount = false,
  subtitle,
  ...pageLayoutProps
}) => {
  const finalSubtitle = showItemCount
    ? `${subtitle || ''}${subtitle ? ' - ' : ''}${itemCount} elemento${itemCount !== 1 ? 's' : ''}`
    : subtitle;

  // Verificar si mostrar empty state
  const shouldShowEmptyState = itemCount === 0 && emptyState;

  return (
    <PageLayout {...pageLayoutProps} subtitle={finalSubtitle}>
      {shouldShowEmptyState ? (
        <EmptyState {...emptyState} />
      ) : (
        children
      )}
    </PageLayout>
  );
};

/**
 * Componente de estado vacío
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon
}) => (
  <BaseCard className="text-center py-12">
    {icon && (
      <div className="text-gray-400 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-gray-600 mb-6">
        {description}
      </p>
    )}
    {action && action}
  </BaseCard>
);