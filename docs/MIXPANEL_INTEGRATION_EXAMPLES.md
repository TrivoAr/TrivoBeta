# Ejemplos de Integración de Mixpanel en Trivo

Este documento proporciona ejemplos específicos de cómo integrar Mixpanel en diferentes partes de la aplicación Trivo.

---

## 📍 Componentes de Navegación

### Navbar.tsx

```tsx
'use client';

import { trackTabClick } from '@/utils/mixpanelEvents';

export default function Navbar() {
  const handleTabClick = (tabName: string) => {
    trackTabClick(tabName);
  };

  return (
    <nav>
      <button onClick={() => handleTabClick('home')}>
        <HomeIcon />
      </button>
      <button onClick={() => handleTabClick('events')}>
        <EventsIcon />
      </button>
      <button onClick={() => handleTabClick('profile')}>
        <ProfileIcon />
      </button>
    </nav>
  );
}
```

---

## 🏃 Salidas Sociales

### Crear Salida Social

```tsx
'use client';

import { useMixpanel } from '@/hooks/useMixpanel';
import { trackSalidaSocialCreated } from '@/utils/mixpanelEvents';

export default function CreateSalidaSocial() {
  const { timeEvent } = useMixpanel();

  const handleFormFocus = () => {
    // Iniciar medición de tiempo del formulario
    timeEvent('Salida Social Form Completion');
  };

  const handleSubmit = async (formData) => {
    const response = await fetch('/api/social', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    const newSalida = await response.json();

    // Trackear creación con detalles
    trackSalidaSocialCreated(newSalida._id, {
      sport_type: formData.sportType,
      max_participants: formData.maxParticipants,
      has_price: formData.price > 0,
      price: formData.price,
      location: formData.location,
      has_strava_route: !!formData.stravaRouteId,
      difficulty: formData.difficulty,
      distance_km: formData.distance,
    });
  };

  return (
    <form onFocus={handleFormFocus} onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
}
```

### Ver Salida Social

```tsx
'use client';

import { useEffect } from 'react';
import { trackSalidaSocialViewed } from '@/utils/mixpanelEvents';

export default function SalidaSocialDetail({ salida }) {
  useEffect(() => {
    // Trackear visualización
    trackSalidaSocialViewed(salida._id, {
      sport_type: salida.sportType,
      creator_id: salida.creator,
      participant_count: salida.miembros?.length || 0,
      has_price: salida.price > 0,
      location: salida.location,
    });
  }, [salida]);

  return <div>{/* Detalles de la salida */}</div>;
}
```

### Unirse a Salida Social

```tsx
'use client';

import { trackSalidaSocialJoined } from '@/utils/mixpanelEvents';

export default function JoinButton({ salidaId, sportType }) {
  const handleJoin = async () => {
    await fetch(`/api/social/${salidaId}/join`, {
      method: 'POST',
    });

    // Trackear unión
    trackSalidaSocialJoined(salidaId, {
      sport_type: sportType,
    });
  };

  return <button onClick={handleJoin}>Unirse</button>;
}
```

---

## 👥 Team Social

### Ver Team Social

```tsx
'use client';

import { useEffect } from 'react';
import { trackTeamSocialViewed } from '@/utils/mixpanelEvents';

export default function TeamSocialDetail({ team }) {
  useEffect(() => {
    trackTeamSocialViewed(team._id, {
      team_name: team.name,
      category: team.category,
      member_count: team.members?.length || 0,
      is_public: team.isPublic,
    });
  }, [team]);

  return <div>{/* Detalles del team */}</div>;
}
```

---

## 💳 Sistema de Pagos

### Flujo Completo de Pago

```tsx
'use client';

import {
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackPaymentFailed,
} from '@/utils/mixpanelEvents';

export default function PaymentFlow({ eventId, eventType, amount }) {
  const handlePaymentStart = () => {
    // Inicia el pago y el timer
    trackPaymentInitiated(amount, eventId, eventType);

    // Redirigir a MercadoPago...
  };

  const handlePaymentCallback = (status, paymentId, error) => {
    if (status === 'approved') {
      // Pago exitoso (incluye duración automáticamente)
      trackPaymentCompleted(amount, eventId, eventType, paymentId);
    } else {
      // Pago fallido
      trackPaymentFailed(amount, eventId, eventType, error || 'Unknown error');
    }
  };

  return (
    <div>
      <button onClick={handlePaymentStart}>
        Pagar ${amount}
      </button>
    </div>
  );
}
```

---

## 👤 Perfil de Usuario

### Actualizar Perfil

```tsx
'use client';

import { useMixpanel } from '@/hooks/useMixpanel';
import { trackProfileUpdated } from '@/utils/mixpanelEvents';

export default function EditProfile() {
  const { setUserProperties } = useMixpanel();

  const handleSubmit = async (formData) => {
    // Actualizar en la base de datos
    const response = await fetch('/api/usuarios/update', {
      method: 'PUT',
      body: JSON.stringify(formData),
    });

    // Actualizar propiedades en Mixpanel
    setUserProperties({
      firstname: formData.firstname,
      lastname: formData.lastname,
      bio: formData.bio,
      instagram: formData.instagram,
    });

    // Trackear qué campos se actualizaron
    const updatedFields = Object.keys(formData);
    trackProfileUpdated(updatedFields);
  };

  return <form onSubmit={handleSubmit}>{/* Campos */}</form>;
}
```

### Ver Perfil de Otro Usuario

```tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trackProfileViewed } from '@/utils/mixpanelEvents';

export default function UserProfile({ userId }) {
  const { data: session } = useSession();

  useEffect(() => {
    const isOwnProfile = session?.user?.id === userId;
    trackProfileViewed(userId, isOwnProfile);
  }, [userId, session]);

  return <div>{/* Contenido del perfil */}</div>;
}
```

---

## 🔐 Autenticación

### Login

```tsx
'use client';

import { signIn } from 'next-auth/react';
import { trackLogin } from '@/utils/mixpanelEvents';

export default function LoginForm() {
  const handleCredentialsLogin = async (email, password) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      trackLogin('credentials', email);
    }
  };

  const handleGoogleLogin = async () => {
    await signIn('google');
    // El tracking se hará automáticamente en el callback
  };

  return (
    <div>
      <form onSubmit={handleCredentialsLogin}>
        {/* Form fields */}
      </form>
      <button onClick={handleGoogleLogin}>
        Login with Google
      </button>
    </div>
  );
}
```

### Callback de Google OAuth

```tsx
// En el callback después de OAuth exitoso
import { trackLogin } from '@/utils/mixpanelEvents';

export default function AuthCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      trackLogin('google');
    }
  }, []);

  return <div>Redirigiendo...</div>;
}
```

### Logout

```tsx
'use client';

import { signOut } from 'next-auth/react';
import { trackLogout } from '@/utils/mixpanelEvents';

export default function LogoutButton() {
  const handleLogout = async () => {
    trackLogout();
    await signOut();
  };

  return <button onClick={handleLogout}>Cerrar Sesión</button>;
}
```

---

## ⭐ Favoritos

### Agregar/Quitar Favorito

```tsx
'use client';

import { trackFavorite } from '@/utils/mixpanelEvents';

export default function FavoriteButton({ itemId, itemType, isFavorited }) {
  const handleToggleFavorite = async () => {
    const action = isFavorited ? 'unfavorited' : 'favorited';

    await fetch('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType, action }),
    });

    trackFavorite(action, itemType, itemId);
  };

  return (
    <button onClick={handleToggleFavorite}>
      {isFavorited ? '❤️' : '🤍'}
    </button>
  );
}
```

---

## 🔗 Strava

### Conectar con Strava

```tsx
'use client';

import { trackStravaConnected } from '@/utils/mixpanelEvents';

export default function StravaConnect() {
  const handleConnect = async () => {
    // Redirigir a OAuth de Strava
    window.location.href = '/api/strava/authorize';
  };

  const handleCallback = () => {
    // En el callback después de autorización exitosa
    trackStravaConnected();
  };

  return <button onClick={handleConnect}>Conectar Strava</button>;
}
```

---

## 🔍 Búsqueda

### Búsqueda de Eventos

```tsx
'use client';

import { trackSearch } from '@/utils/mixpanelEvents';
import { useState } from 'react';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSearch = async (searchQuery) => {
    const response = await fetch(`/api/search?q=${searchQuery}`);
    const results = await response.json();

    // Trackear búsqueda con resultados
    trackSearch(searchQuery, 'events', results.length);
  };

  return (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSearch(query);
        }
      }}
    />
  );
}
```

---

## 📤 Compartir

### Compartir Evento

```tsx
'use client';

import { trackShare } from '@/utils/mixpanelEvents';

export default function ShareButton({ eventId, eventType }) {
  const handleShare = async (method: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
    const shareUrl = `${window.location.origin}/events/${eventId}`;

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        break;
    }

    // Trackear el share
    trackShare(eventType, eventId, method);
  };

  return (
    <div>
      <button onClick={() => handleShare('whatsapp')}>WhatsApp</button>
      <button onClick={() => handleShare('facebook')}>Facebook</button>
      <button onClick={() => handleShare('twitter')}>Twitter</button>
      <button onClick={() => handleShare('copy')}>Copiar Link</button>
    </div>
  );
}
```

---

## 🎓 Academia

### Ver Academia

```tsx
'use client';

import { useEffect } from 'react';
import { trackAcademiaViewed } from '@/utils/mixpanelEvents';

export default function AcademiaDetail({ academia }) {
  useEffect(() => {
    trackAcademiaViewed(academia._id, {
      academia_name: academia.name,
      sport_type: academia.sportType,
      student_count: academia.students?.length || 0,
      has_trial: academia.hasTrial,
    });
  }, [academia]);

  return <div>{/* Detalles de la academia */}</div>;
}
```

---

## 📊 Analytics Avanzados

### Medir Tiempo de Completado de Formularios

```tsx
'use client';

import { useMixpanel } from '@/hooks/useMixpanel';

export default function ComplexForm() {
  const { timeEvent, trackEvent } = useMixpanel();
  const [step, setStep] = useState(1);

  const handleFormStart = () => {
    timeEvent('Multi-Step Form Completion');
  };

  const handleStepChange = (newStep) => {
    trackEvent('Form Step Changed', {
      from_step: step,
      to_step: newStep,
    });
    setStep(newStep);
  };

  const handleFormSubmit = () => {
    // Incluirá duración automáticamente
    trackEvent('Multi-Step Form Completion', {
      total_steps: 3,
      completed: true,
    });
  };

  return (
    <form onFocus={handleFormStart} onSubmit={handleFormSubmit}>
      {/* Form steps */}
    </form>
  );
}
```

### Incrementar Contadores de Usuario

```tsx
'use client';

import { useMixpanel } from '@/hooks/useMixpanel';

export default function EventAttendance() {
  const { incrementUserProperty } = useMixpanel();

  const handleAttendEvent = () => {
    // Incrementar contador de eventos atendidos
    incrementUserProperty('events_attended', 1);
    incrementUserProperty('total_kilometers_run', 10);
  };

  return <button onClick={handleAttendEvent}>Marcar Asistencia</button>;
}
```

---

## 🎯 Mejores Prácticas

### 1. Usar Constantes

```tsx
import { EVENTS } from '@/utils/mixpanelEvents';

// ✅ Bueno
trackEvent(EVENTS.SALIDA_SOCIAL.CREATED, { ... });

// ❌ Evitar
trackEvent('salida social created', { ... });
```

### 2. Incluir Contexto

```tsx
// ✅ Bueno - Incluye contexto útil
trackEvent('Button Clicked', {
  button_name: 'Create Event',
  location: 'Homepage',
  user_tier: 'premium',
  timestamp: new Date().toISOString(),
});

// ❌ Evitar - Muy genérico
trackEvent('Button Clicked');
```

### 3. Timing Correcto

```tsx
// ✅ Bueno - Trackear después de acción exitosa
const handleSave = async () => {
  try {
    await saveData();
    trackEvent('Data Saved'); // Solo si fue exitoso
  } catch (error) {
    trackEvent('Save Failed', { error: error.message });
  }
};

// ❌ Evitar - Trackear antes de confirmar
const handleSave = async () => {
  trackEvent('Data Saved'); // Puede no ser exitoso
  await saveData();
};
```

---

## 📝 Notas Finales

- Todos los eventos se envían de forma **asíncrona**
- Los eventos **no bloquean** la UI
- En **desarrollo**, los eventos se logean en consola
- En **producción**, se envían silenciosamente a Mixpanel
- Usar **helper functions** cuando estén disponibles
- Mantener **nombres consistentes** de eventos
- Incluir **propiedades descriptivas**

---

Para más información, ver [docs/MIXPANEL.md](./MIXPANEL.md)
