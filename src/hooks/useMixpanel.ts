import { useMixpanelContext } from '@/components/MixpanelProvider';

/**
 * Hook personalizado para acceder a las funciones de Mixpanel
 * Proporciona una interfaz simplificada para tracking de eventos
 *
 * @example
 * ```tsx
 * const { trackEvent } = useMixpanel();
 *
 * const handleClick = () => {
 *   trackEvent('Button Clicked', { button_name: 'Sign Up' });
 * };
 * ```
 */
export const useMixpanel = () => {
  return useMixpanelContext();
};

export default useMixpanel;
