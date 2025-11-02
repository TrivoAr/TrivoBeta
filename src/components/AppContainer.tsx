/**
 * AppContainer - Componente wrapper responsive para la aplicación Trivo
 *
 * Reemplaza los divs con w-[390px] hardcodeado por un contenedor responsive
 * que se adapta a diferentes tamaños de pantalla.
 *
 * @example
 * // Uso básico (reemplaza: <div className="w-[390px] mx-auto px-4">)
 * <AppContainer>
 *   <YourContent />
 * </AppContainer>
 *
 * @example
 * // Con variante narrow para modals
 * <AppContainer variant="narrow">
 *   <ModalContent />
 * </AppContainer>
 *
 * @example
 * // Sin padding (cuando el contenido ya tiene su propio padding)
 * <AppContainer noPadding>
 *   <FullWidthContent />
 * </AppContainer>
 */

import React from 'react';
import { cn } from '@/libs/utils';

interface AppContainerProps {
  children: React.ReactNode;
  /** Variante del contenedor */
  variant?: 'default' | 'narrow' | 'wide' | 'fluid';
  /** Remover padding lateral */
  noPadding?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Props HTML adicionales del div */
  [key: string]: any;
}

export function AppContainer({
  children,
  variant = 'default',
  noPadding = false,
  className,
  ...props
}: AppContainerProps) {
  // Mapeo de variantes a clases de Tailwind
  const variantClasses = {
    default: noPadding ? 'app-container-no-padding' : 'app-container',
    narrow: 'app-container-narrow',
    wide: 'app-container-wide',
    fluid: 'app-container-fluid',
  };

  return (
    <div
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * AppPage - Wrapper para páginas completas
 * Incluye el contenedor y estilos comunes de páginas
 *
 * @example
 * export default function HomePage() {
 *   return (
 *     <AppPage>
 *       <h1>Mi Página</h1>
 *       <Content />
 *     </AppPage>
 *   );
 * }
 */
interface AppPageProps extends AppContainerProps {
  /** Agregar padding vertical */
  withPadding?: boolean;
  /** Altura mínima de pantalla completa */
  fullHeight?: boolean;
}

export function AppPage({
  children,
  withPadding = true,
  fullHeight = true,
  className,
  ...containerProps
}: AppPageProps) {
  return (
    <main
      className={cn(
        'bg-background text-foreground',
        fullHeight && 'min-h-screen',
        className
      )}
    >
      <AppContainer
        className={withPadding ? 'py-6 space-y-6' : ''}
        {...containerProps}
      >
        {children}
      </AppContainer>
    </main>
  );
}

// Exportación por defecto
export default AppContainer;
