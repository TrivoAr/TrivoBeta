'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  identifyUser,
  setUserProperties,
  trackPageView,
  resetUser,
  trackEvent,
  registerSuperProperties,
  incrementUserProperty,
  appendUserProperty,
  setUserPropertiesOnce,
  trackCharge,
  timeEvent,
  getDistinctId,
  aliasUser,
} from '@/libs/mixpanel';
import { trackLogin, trackLogout } from '@/utils/mixpanelEvents';
import type { Dict, RequestOptions } from 'mixpanel-browser';

interface MixpanelContextValue {
  identifyUser: (userId: string) => void;
  setUserProperties: (properties: Dict) => void;
  trackEvent: (eventName: string, properties?: Dict, options?: RequestOptions) => void;
  trackPageView: (pageName?: string, properties?: Dict) => void;
  registerSuperProperties: (properties: Dict) => void;
  incrementUserProperty: (property: string, amount?: number) => void;
  appendUserProperty: (property: string, value: any) => void;
  setUserPropertiesOnce: (properties: Dict) => void;
  resetUser: () => void;
  trackCharge: (amount: number, properties?: Dict) => void;
  timeEvent: (eventName: string) => void;
  getDistinctId: () => string | undefined;
  aliasUser: (alias: string) => void;
}

const MixpanelContext = createContext<MixpanelContextValue | undefined>(undefined);

export const useMixpanelContext = () => {
  const context = useContext(MixpanelContext);
  if (!context) {
    throw new Error('useMixpanelContext debe usarse dentro de MixpanelProvider');
  }
  return context;
};

interface MixpanelProviderProps {
  children: ReactNode;
}

export default function MixpanelProvider({ children }: MixpanelProviderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const lastIdentifiedUser = useRef<string | null>(null);
  const hasTrackedLogin = useRef(false);

  // Identificar usuario cuando la sesión cambia
  useEffect(() => {
    if (session?.user) {
      const userId = session.user.id || session.user.email;
      if (userId && userId !== lastIdentifiedUser.current) {
        // Obtener distinct_id anónimo antes de identificar
        const anonymousId = getDistinctId();

        // Identificar usuario
        identifyUser(userId);

        // Si había un ID anónimo diferente, crear alias para fusionar perfiles
        if (anonymousId && anonymousId !== userId) {
          aliasUser(userId);
        }

        lastIdentifiedUser.current = userId;

        // Establecer propiedades del usuario
        const userProperties: Dict = {
          $email: session.user.email,
          $name: session.user.name || `${session.user.firstname || ''} ${session.user.lastname || ''}`.trim(),
          firstname: session.user.firstname,
          lastname: session.user.lastname,
          rol: session.user.rol,
        };

        // Agregar propiedades adicionales si existen
        if (session.user.imagen) {
          userProperties.$avatar = session.user.imagen;
        }

        if (session.user.bio) {
          userProperties.bio = session.user.bio;
        }

        if (session.user.instagram) {
          userProperties.instagram = session.user.instagram;
        }

        if (session.user.facebook) {
          userProperties.facebook = session.user.facebook;
        }

        if (session.user.twitter) {
          userProperties.twitter = session.user.twitter;
        }

        setUserProperties(userProperties);

        // Establecer propiedades que no deben sobrescribirse
        setUserPropertiesOnce({
          first_seen: new Date().toISOString(),
        });

        // Trackear login (solo una vez por sesión)
        if (!hasTrackedLogin.current) {
          // Determinar método de login basado en fromOAuth o provider
          const method = session.user.fromOAuth ? 'google' : 'credentials';
          trackLogin(method, userId);
          hasTrackedLogin.current = true;
        }
      }
    } else {
      // Reset cuando el usuario cierra sesión
      if (lastIdentifiedUser.current) {
        trackLogout();
        lastIdentifiedUser.current = null;
        hasTrackedLogin.current = false;
      }
      resetUser();
    }
  }, [session]);

  // Trackear cambios de página (solo si realmente cambió)
  useEffect(() => {
    if (pathname && pathname !== lastTrackedPath.current) {
      trackPageView(pathname, {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
      lastTrackedPath.current = pathname;
    }
  }, [pathname]);

  // Registrar propiedades globales al montar
  useEffect(() => {
    registerSuperProperties({
      app_version: '1.0.0',
      platform: 'web',
      environment: process.env.NODE_ENV,
    });
  }, []);

  const value: MixpanelContextValue = {
    identifyUser,
    setUserProperties,
    trackEvent,
    trackPageView,
    registerSuperProperties,
    incrementUserProperty,
    appendUserProperty,
    setUserPropertiesOnce,
    resetUser,
    trackCharge,
    timeEvent,
    getDistinctId,
    aliasUser,
  };

  return (
    <MixpanelContext.Provider value={value}>
      {children}
    </MixpanelContext.Provider>
  );
}
