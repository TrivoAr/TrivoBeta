# Guía de Implementación de Mixpanel en Trivo

## Índice
1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [Uso Básico](#uso-básico)
4. [Eventos Predefinidos](#eventos-predefinidos)
5. [Mejores Prácticas](#mejores-prácticas)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Introducción

Trivo utiliza **Mixpanel** para análisis de producto y seguimiento de comportamiento de usuarios. Mixpanel reemplaza a Google Analytics y ofrece capacidades avanzadas como:

- 📊 **Análisis de cohortes**: Seguimiento de grupos de usuarios
- 🔍 **Embudos de conversión**: Visualizar el journey del usuario
- 📈 **Retención de usuarios**: Métricas de engagement
- 👤 **Perfiles de usuario**: Información detallada de cada usuario
- 🎯 **Eventos personalizados**: Tracking flexible para eventos específicos

---

## Configuración Inicial

### 1. Obtener Token de Mixpanel

1. Crear una cuenta en [Mixpanel](https://mixpanel.com/)
2. Crear un nuevo proyecto
3. Copiar el **Project Token** desde Settings → Project Settings

### 2. Configurar Variable de Entorno

Agregar el token en tu archivo `.env.local`:

```bash
NEXT_PUBLIC_MIXPANEL_TOKEN=tu_token_de_mixpanel_aqui
```

⚠️ **Importante**: El token debe comenzar con `NEXT_PUBLIC_` para estar disponible en el cliente.

### 3. Verificar Instalación

La instalación de Mixpanel ya está completa. Los componentes clave son:

- ✅ `src/libs/mixpanel.ts` - Configuración base
- ✅ `src/components/MixpanelProvider.tsx` - Provider de React
- ✅ `src/hooks/useMixpanel.ts` - Hook personalizado
- ✅ `src/utils/mixpanelEvents.ts` - Utilidades de eventos

---

## Uso Básico

### En Componentes Cliente

```tsx
'use client';

import { useMixpanel } from '@/hooks/useMixpanel';

export default function MyComponent() {
  const { trackEvent } = useMixpanel();

  const handleClick = () => {
    trackEvent('Button Clicked', {
      button_name: 'Sign Up',
      location: 'Homepage',
    });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}
```

### Tracking Automático

El `MixpanelProvider` automáticamente:

- ✅ Identifica usuarios cuando inician sesión
- ✅ Establece propiedades de usuario (email, nombre, rol, etc.)
- ✅ Trackea cambios de página
- ✅ Reset cuando el usuario cierra sesión

---

## Eventos Predefinidos

### Autenticación

```tsx
import { trackLogin, trackLogout, trackSignup } from '@/utils/mixpanelEvents';

// Login
trackLogin('credentials', userId);
trackLogin('google', userId);

// Signup
trackSignup('credentials', userId);

// Logout
trackLogout();
```

### Salidas Sociales

```tsx
import {
  trackSalidaSocialViewed,
  trackSalidaSocialCreated,
  trackSalidaSocialJoined,
} from '@/utils/mixpanelEvents';

// Ver salida social
trackSalidaSocialViewed('salida_id_123', {
  sport_type: 'running',
  location: 'Buenos Aires',
});

// Crear salida social
trackSalidaSocialCreated('salida_id_123', {
  sport_type: 'cycling',
  max_participants: 20,
});

// Unirse a salida social
trackSalidaSocialJoined('salida_id_123');
```

### Team Social

```tsx
import {
  trackTeamSocialViewed,
  trackTeamSocialCreated,
  trackTeamSocialJoined,
} from '@/utils/mixpanelEvents';

// Ver team social
trackTeamSocialViewed('team_id_456');

// Crear team social
trackTeamSocialCreated('team_id_456', {
  team_name: 'Runners BA',
  category: 'running',
});

// Unirse a team social
trackTeamSocialJoined('team_id_456');
```

### Pagos

```tsx
import {
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackPaymentFailed,
} from '@/utils/mixpanelEvents';

// Iniciar pago (también inicia un timer)
trackPaymentInitiated(1500, 'event_id', 'salida_social');

// Pago completado (calcula duración automáticamente)
trackPaymentCompleted(1500, 'event_id', 'salida_social', 'payment_id');

// Pago fallido
trackPaymentFailed(1500, 'event_id', 'salida_social', 'Tarjeta rechazada');
```

### Perfil

```tsx
import { trackProfileViewed, trackProfileUpdated } from '@/utils/mixpanelEvents';

// Ver perfil
trackProfileViewed('user_id', false); // false = perfil de otro usuario

// Actualizar perfil
trackProfileUpdated(['name', 'bio', 'location']);
```

### Strava

```tsx
import { trackStravaConnected } from '@/utils/mixpanelEvents';

// Conectar con Strava
trackStravaConnected();
```

### Favoritos

```tsx
import { trackFavorite } from '@/utils/mixpanelEvents';

// Marcar como favorito
trackFavorite('favorited', 'salida_social', 'salida_id');

// Desmarcar favorito
trackFavorite('unfavorited', 'team_social', 'team_id');
```

### Compartir

```tsx
import { trackShare } from '@/utils/mixpanelEvents';

// Compartir evento
trackShare('salida_social', 'salida_id', 'whatsapp');
trackShare('team_social', 'team_id', 'facebook');
```

---

## Mejores Prácticas

### 1. Nombres de Eventos Consistentes

✅ **Usar constantes predefinidas**:
```tsx
import { EVENTS } from '@/utils/mixpanelEvents';

trackEvent(EVENTS.SALIDA_SOCIAL.CREATED, { ... });
```

❌ **Evitar strings hardcodeados**:
```tsx
trackEvent('salida created', { ... }); // ❌ Inconsistente
```

### 2. Propiedades Descriptivas

✅ **Incluir contexto relevante**:
```tsx
trackEvent('Event Created', {
  event_type: 'salida_social',
  sport_type: 'running',
  max_participants: 20,
  has_price: true,
  location: 'Buenos Aires',
  created_from: 'mobile',
});
```

❌ **Evitar propiedades vagas**:
```tsx
trackEvent('Event Created', { type: 'event' }); // ❌ No informativo
```

### 3. Timing de Eventos

Para eventos que requieren medir duración:

```tsx
import { timeEvent } from '@/libs/mixpanel';

// Al iniciar la acción
timeEvent('Form Completion');

// Cuando complete (incluirá duración automáticamente)
trackEvent('Form Completion', { form_name: 'signup' });
```

### 4. Propiedades de Usuario

Actualizar propiedades cuando cambien:

```tsx
import { setUserProperties, incrementUserProperty } from '@/libs/mixpanel';

// Al completar un evento
setUserProperties({
  last_event_attended: new Date().toISOString(),
  favorite_sport: 'running',
});

// Incrementar contador
incrementUserProperty('events_attended', 1);
```

### 5. Super Properties

Para propiedades que deben incluirse en TODOS los eventos:

```tsx
import { registerSuperProperties } from '@/libs/mixpanel';

// Registrar una vez, se incluye en todos los eventos futuros
registerSuperProperties({
  app_version: '2.0.0',
  user_tier: 'premium',
});
```

---

## Ejemplos de Uso

### Ejemplo 1: Tracking de Creación de Evento

```tsx
'use client';

import { useMixpanel } from '@/hooks/useMixpanel';
import { trackSalidaSocialCreated } from '@/utils/mixpanelEvents';

export default function CreateEventForm() {
  const { timeEvent } = useMixpanel();

  const handleFormStart = () => {
    // Empezar a medir tiempo
    timeEvent('Event Creation');
  };

  const handleSubmit = async (formData) => {
    // Crear evento
    const response = await createEvent(formData);

    // Trackear creación (incluirá duración del formulario)
    trackSalidaSocialCreated(response.id, {
      sport_type: formData.sportType,
      max_participants: formData.maxParticipants,
      has_price: formData.price > 0,
      price: formData.price,
      location: formData.location,
      has_strava_route: !!formData.stravaRouteId,
    });
  };

  return (
    <form onFocus={handleFormStart} onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
}
```

### Ejemplo 2: Tracking de Flujo de Pago

```tsx
'use client';

import {
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackPaymentFailed,
} from '@/utils/mixpanelEvents';

export default function PaymentFlow() {
  const handlePaymentStart = (eventId: string, amount: number) => {
    // Inicia el pago y el timer
    trackPaymentInitiated(amount, eventId, 'salida_social');
  };

  const handlePaymentSuccess = (eventId: string, amount: number, paymentId: string) => {
    // Completa el pago (incluye duración)
    trackPaymentCompleted(amount, eventId, 'salida_social', paymentId);
  };

  const handlePaymentError = (eventId: string, amount: number, error: string) => {
    trackPaymentFailed(amount, eventId, 'salida_social', error);
  };

  return <PaymentComponent />;
}
```

### Ejemplo 3: Tracking de Navegación

```tsx
'use client';

import { trackTabClick } from '@/utils/mixpanelEvents';

export default function NavigationTabs() {
  const handleTabClick = (tabName: string) => {
    trackTabClick(tabName);
  };

  return (
    <nav>
      <button onClick={() => handleTabClick('home')}>Home</button>
      <button onClick={() => handleTabClick('events')}>Events</button>
      <button onClick={() => handleTabClick('profile')}>Profile</button>
    </nav>
  );
}
```

### Ejemplo 4: Actualización de Perfil de Usuario

```tsx
'use client';

import { useMixpanel } from '@/hooks/useMixpanel';
import { trackProfileUpdated } from '@/utils/mixpanelEvents';

export default function ProfileEditForm() {
  const { setUserProperties } = useMixpanel();

  const handleSubmit = async (updatedFields) => {
    // Actualizar en la base de datos
    await updateProfile(updatedFields);

    // Actualizar en Mixpanel
    setUserProperties({
      name: updatedFields.name,
      bio: updatedFields.bio,
      location: updatedFields.location,
      favorite_sports: updatedFields.sports,
    });

    // Trackear qué campos se actualizaron
    trackProfileUpdated(Object.keys(updatedFields));
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

---

## Debugging

### Modo Development

En desarrollo, Mixpanel imprimirá eventos en la consola:

```bash
Mixpanel Event: User Login { method: 'google', user_id: '123' }
```

### Verificar en Mixpanel Dashboard

1. Ir a Mixpanel Dashboard
2. Navegar a "Events" → "Live View"
3. Realizar acciones en tu app
4. Verificar que los eventos aparecen en tiempo real

---

## Notas Adicionales

- **Privacy**: Mixpanel respeta la configuración "Do Not Track" del navegador
- **Performance**: Los eventos se envían de forma asíncrona sin bloquear la UI
- **Persistence**: Por defecto usa `localStorage` para mantener el estado
- **GDPR**: Configurar según necesidades de compliance en `src/libs/mixpanel.ts`

---

## Soporte

Para preguntas o issues relacionados con Mixpanel:

- Documentación oficial: https://docs.mixpanel.com/
- Mixpanel Community: https://community.mixpanel.com/

Para issues específicos de la implementación en Trivo, contactar al equipo de desarrollo.
