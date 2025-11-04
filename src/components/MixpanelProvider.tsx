'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
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

  // Identificar usuario cuando la sesión cambia
  useEffect(() => {
    if (session?.user) {
      const userId = session.user.id || session.user.email;
      if (userId) {
        identifyUser(userId);

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
      }
    } else {
      // Reset cuando el usuario cierra sesión
      resetUser();
    }
  }, [session]);

  // Trackear cambios de página
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname, {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
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
