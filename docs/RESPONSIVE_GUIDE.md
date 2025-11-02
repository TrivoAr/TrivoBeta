# Guía de Diseño Responsive - Trivo

## Introducción

Esta guía te muestra cómo implementar diseños responsive en Trivo, reemplazando los anchos hardcodeados de **390px** por un sistema flexible que se adapta a todos los dispositivos.

## Sistema de Contenedores

### Clases de Tailwind Personalizadas

Hemos creado clases utilitarias en Tailwind que reemplazan `w-[390px]`:

| Clase | Max Width | Uso |
|-------|-----------|-----|
| `app-container` | 640px | **Principal** - Usa esta por defecto |
| `app-container-narrow` | 480px | Modals, formularios estrechos |
| `app-container-wide` | 768px | Tablets, contenido extenso |
| `app-container-no-padding` | 640px | Sin padding lateral (para casos especiales) |
| `app-container-fluid` | 100%/640px | Full-width en móvil, centrado en desktop |

### Componentes React

También puedes usar componentes para mayor consistencia:

```tsx
import AppContainer, { AppPage } from '@/components/AppContainer';

// Opción 1: Componente AppContainer
<AppContainer>
  <YourContent />
</AppContainer>

// Opción 2: Componente AppPage (para páginas completas)
<AppPage>
  <YourContent />
</AppPage>
```

## Patrones de Refactorización

### 1. Página Principal

```tsx
// ❌ ANTES
export default function HomePage() {
  return (
    <main className="bg-background min-h-screen text-foreground px-4 py-6 space-y-6 w-[390px] mx-auto">
      <Content />
    </main>
  );
}

// ✅ DESPUÉS - Opción A: Con clases
export default function HomePage() {
  return (
    <main className="bg-background min-h-screen text-foreground">
      <div className="app-container py-6 space-y-6">
        <Content />
      </div>
    </main>
  );
}

// ✅ DESPUÉS - Opción B: Con componente AppPage
import { AppPage } from '@/components/AppContainer';

export default function HomePage() {
  return (
    <AppPage>
      <Content />
    </AppPage>
  );
}
```

### 2. Detalle de Evento/Academia

```tsx
// ❌ ANTES
export default function EventDetail() {
  return (
    <div className="flex flex-col w-[390px] items-center bg-background">
      <EventInfo />
    </div>
  );
}

// ✅ DESPUÉS
export default function EventDetail() {
  return (
    <div className="flex flex-col w-full max-w-app mx-auto items-center bg-background px-4">
      <EventInfo />
    </div>
  );
}

// O más simple con app-container-no-padding si ya tienes padding interno
export default function EventDetail() {
  return (
    <div className="app-container-no-padding flex flex-col items-center bg-background">
      <EventInfo />
    </div>
  );
}
```

### 3. Cover/Banner de Imagen

```tsx
// ❌ ANTES
<div
  className="w-[390px] h-[190px] bg-cover bg-center"
  style={{ backgroundImage: `url(${imageUrl})` }}
/>

// ✅ DESPUÉS - Con aspect-ratio
<div
  className="w-full aspect-cover max-h-[300px] bg-cover bg-center"
  style={{ backgroundImage: `url(${imageUrl})` }}
/>

// O con height fijo pero width responsive
<div
  className="w-full h-48 md:h-64 bg-cover bg-center"
  style={{ backgroundImage: `url(${imageUrl})` }}
/>
```

### 4. TopContainer (Header)

```tsx
// ❌ ANTES
<div className="containerTop bg-background h-[50px] w-[100%] max-w-[390px] flex justify-between items-center">
  <Logo />
  <Location />
  <Profile />
</div>

// ✅ DESPUÉS
<div className="w-full bg-background border-b">
  <div className="app-container h-[50px] flex justify-between items-center">
    <Logo />
    <Location />
    <Profile />
  </div>
</div>
```

### 5. Skeleton/Loading States

```tsx
// ❌ ANTES
<div className="flex flex-col w-[390px] items-center bg-[#FEFBF9] space-y-6">
  <Skeleton className="w-full h-[190px]" />
  <Skeleton className="w-full h-[100px]" />
</div>

// ✅ DESPUÉS
<div className="app-container flex flex-col items-center bg-[#FEFBF9] space-y-6">
  <Skeleton className="w-full h-[190px]" />
  <Skeleton className="w-full h-[100px]" />
</div>
```

### 6. Modals y Overlays

```tsx
// ❌ ANTES
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white w-[390px] rounded-lg p-6">
    <ModalContent />
  </div>
</div>

// ✅ DESPUÉS
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
  <div className="bg-white w-full max-w-md rounded-lg p-6">
    <ModalContent />
  </div>
</div>

// O con app-container-narrow
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="app-container-narrow bg-white rounded-lg p-6">
    <ModalContent />
  </div>
</div>
```

### 7. Forms y Inputs

```tsx
// ❌ ANTES
<div className="w-[390px] flex flex-col items-center gap-5">
  <input className="w-full" />
  <button className="w-full">Submit</button>
</div>

// ✅ DESPUÉS
<div className="app-container flex flex-col items-center gap-5">
  <input className="w-full" />
  <button className="w-full">Submit</button>
</div>
```

### 8. Cards y Listas

```tsx
// ❌ ANTES
<div className="w-[390px] flex flex-col gap-4">
  {events.map(event => (
    <EventCard key={event.id} event={event} />
  ))}
</div>

// ✅ DESPUÉS
<div className="app-container flex flex-col gap-4">
  {events.map(event => (
    <EventCard key={event.id} event={event} />
  ))}
</div>

// O con grid para tablets
<div className="app-container grid grid-cols-1 md:grid-cols-2 gap-4">
  {events.map(event => (
    <EventCard key={event.id} event={event} />
  ))}
</div>
```

## Imágenes Responsive

### Next.js Image Component

```tsx
import Image from 'next/image';

// ✅ Con aspect-ratio fijo
<div className="w-full aspect-cover relative overflow-hidden rounded-lg">
  <Image
    src={imageUrl}
    alt="Event cover"
    fill
    className="object-cover"
    sizes="(max-width: 640px) 100vw, 640px"
  />
</div>

// ✅ Con height fijo
<div className="w-full h-48 relative overflow-hidden rounded-lg">
  <Image
    src={imageUrl}
    alt="Event cover"
    fill
    className="object-cover"
  />
</div>
```

### Background Images

```tsx
// ✅ Responsive background
<div
  className="w-full aspect-cover bg-cover bg-center rounded-lg"
  style={{
    backgroundImage: `url(${imageUrl})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  }}
/>
```

## Breakpoints y Media Queries

Usa los breakpoints de Tailwind para ajustes específicos:

```tsx
<div className="app-container">
  {/* Móvil: 1 columna, Tablet: 2 columnas, Desktop: 3 columnas */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card />
    <Card />
    <Card />
  </div>
</div>

{/* Texto más grande en tablets/desktop */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Título Responsive
</h1>

{/* Padding diferente según tamaño */}
<div className="p-4 md:p-6 lg:p-8">
  <Content />
</div>

{/* Mostrar/ocultar según dispositivo */}
<div className="hidden md:block">
  Solo visible en tablets y desktop
</div>
```

## Safe Area (iOS/PWA)

Para PWAs en iOS con notch:

```tsx
// Padding seguro en la parte superior
<div className="pt-safe-top">
  <Header />
</div>

// Padding seguro en la parte inferior (para botones)
<div className="pb-safe-bottom">
  <BottomNav />
</div>

// Completo
<div className="min-h-screen pt-safe-top pb-safe-bottom">
  <Content />
</div>
```

## Testing Responsive

### En Chrome DevTools

1. Abre DevTools (F12)
2. Click en el icono de dispositivo móvil (Ctrl+Shift+M)
3. Prueba estos dispositivos:
   - iPhone SE (375px) - Móvil pequeño
   - iPhone 12/13 (390px) - Diseño base actual
   - iPhone 14 Pro Max (430px) - Móvil grande
   - iPad Mini (768px) - Tablet
   - Responsive (arrastra para probar diferentes tamaños)

### Checklist de Testing

Para cada página refactorizada:

- [ ] **320px** - Funciona en móviles muy pequeños
- [ ] **375px** - iPhone SE y similares
- [ ] **390px** - iPhone 12/13 (diseño original)
- [ ] **430px** - iPhone 14 Pro Max
- [ ] **640px** - Límite del app-container
- [ ] **768px** - Tablets (iPad Mini)
- [ ] **1024px** - Desktop
- [ ] **Landscape** - Modo horizontal funciona bien
- [ ] **Imágenes** - No se distorsionan
- [ ] **Textos** - Legibles en todos los tamaños
- [ ] **Botones** - Accesibles (min 44px altura)
- [ ] **Scroll** - Funciona correctamente

## Errores Comunes

### ❌ Error 1: Usar width fijo en imágenes

```tsx
// Mal
<img src={url} className="w-[390px] h-[190px]" />

// Bien
<img src={url} className="w-full aspect-cover" />
```

### ❌ Error 2: No centrar el contenedor

```tsx
// Mal - no se centra
<div className="w-full max-w-[640px] px-4">

// Bien - usa mx-auto
<div className="w-full max-w-[640px] mx-auto px-4">

// Mejor - usa app-container
<div className="app-container">
```

### ❌ Error 3: Olvidar padding lateral

```tsx
// Mal - contenido toca los bordes
<main>
  <div className="w-full max-w-app mx-auto">
    <Content />
  </div>
</main>

// Bien - agrega padding
<main>
  <div className="w-full max-w-app mx-auto px-4">
    <Content />
  </div>
</main>

// Mejor - usa app-container (ya incluye padding)
<main>
  <div className="app-container">
    <Content />
  </div>
</main>
```

### ❌ Error 4: Mezclar width fijo con responsive

```tsx
// Mal
<div className="w-[390px] md:w-[640px]">

// Bien
<div className="app-container">
// o
<div className="w-full max-w-[640px] mx-auto px-4">
```

## Migración Paso a Paso

### Para un archivo nuevo:

1. Usa `<AppPage>` o `app-container` desde el inicio
2. No uses nunca `w-[390px]`
3. Prueba en múltiples tamaños de pantalla

### Para refactorizar un archivo existente:

1. **Buscar** todos los `w-[390px]` y `max-w-[390px]`
2. **Reemplazar** con `app-container` o equivalente
3. **Ajustar** imágenes a `w-full` + `aspect-ratio`
4. **Probar** en Chrome DevTools con diferentes dispositivos
5. **Verificar** que no se rompa nada
6. **Commit** con mensaje descriptivo

### Ejemplo de commit:

```bash
git add src/app/home/page.tsx
git commit -m "refactor(responsive): hacer HomePage responsive

- Reemplazar w-[390px] con app-container
- Ajustar imágenes de cover con aspect-ratio
- Probar en múltiples dispositivos (320px - 1024px)
- Verificado que no se rompe el layout existente"
```

## Scripts de Ayuda

### Encontrar anchos hardcodeados

```bash
# Ejecutar script de auditoría
bash scripts/find-hardcoded-widths.sh

# Ver archivos específicos
grep -r "w-\[390px\]" src/app/ -l
```

### Verificar progreso

```bash
# Ver cuántos componentes ya son responsive
bash scripts/verify-responsive.sh
```

## FAQ

### ¿Debo refactorizar todos los archivos de una vez?

No. Hazlo gradualmente:
1. Prioriza páginas de usuario (home, dashboard, eventos)
2. Luego páginas de creación de contenido
3. Finalmente páginas de admin/configuración

### ¿Qué hago con componentes compartidos?

Refactorízalos primero. Componentes como `TopContainer`, `EventCard`, `FilterModal` se usan en muchas páginas.

### ¿Puedo usar max-w-[640px] directamente?

Sí, pero es mejor usar `app-container` o `max-w-app` para consistencia.

### ¿Qué pasa con el diseño en desktop?

En desktop (>1024px), el contenido se centrará con el max-width de 640px, manteniendo la experiencia "mobile-first" pero adaptada.

### ¿Debo preocuparme por tablets?

Para la mayoría de casos, el diseño mobile escalará bien a tablets. Si necesitas ajustes, usa breakpoints `md:` y `lg:`.

## Recursos

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [CSS Aspect Ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)

---

## Ejemplos Completos

### Ejemplo 1: Página de Listado Simple

```tsx
// src/app/events/page.tsx
import { AppPage } from '@/components/AppContainer';
import EventCard from '@/components/EventCard';

export default function EventsPage() {
  return (
    <AppPage>
      <h1 className="text-2xl font-bold mb-6">Eventos</h1>

      <div className="grid grid-cols-1 gap-4">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </AppPage>
  );
}
```

### Ejemplo 2: Página de Detalle con Cover

```tsx
// src/app/events/[id]/page.tsx
import AppContainer from '@/components/AppContainer';

export default function EventDetailPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Cover - full width */}
      <div
        className="w-full aspect-cover max-h-[300px] bg-cover bg-center"
        style={{ backgroundImage: `url(${event.coverImage})` }}
      />

      {/* Contenido - centrado con padding */}
      <AppContainer className="py-6 space-y-6">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p>{event.description}</p>

        <button className="w-full py-3 bg-primary text-white rounded-lg">
          Unirse al Evento
        </button>
      </AppContainer>
    </div>
  );
}
```

### Ejemplo 3: Formulario de Creación

```tsx
// src/app/events/create/page.tsx
import { AppPage } from '@/components/AppContainer';

export default function CreateEventPage() {
  return (
    <AppPage variant="narrow">
      <h1 className="text-2xl font-bold mb-6">Crear Evento</h1>

      <form className="space-y-4">
        <div>
          <label className="block mb-2">Título</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Nombre del evento"
          />
        </div>

        <div>
          <label className="block mb-2">Descripción</label>
          <textarea
            className="w-full px-4 py-2 border rounded-lg"
            rows={4}
            placeholder="Describe tu evento..."
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-primary text-white rounded-lg"
        >
          Crear Evento
        </button>
      </form>
    </AppPage>
  );
}
```

---

**¿Dudas?** Consulta el [Plan Completo de Refactorización](./RESPONSIVE_REFACTOR_PLAN.md) o abre un issue en el repositorio.
