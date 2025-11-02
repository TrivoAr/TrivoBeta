# Ejemplo Práctico de Refactorización Responsive

Este documento muestra un ejemplo real de cómo refactorizar una página de Trivo de hardcodeada (390px) a completamente responsive.

## 📄 Archivo de Ejemplo: HomePage

Vamos a refactorizar `src/app/home/page.tsx` paso a paso.

---

## ❌ ANTES: Código Hardcodeado

```tsx
"use client";

import { useState } from "react";
import TopContainer from "@/components/TopContainer";
import EventCard from "@/components/EventCard";
import AirbnbCard from "@/components/AirbnbCard";

export default function HomePage() {
  const [selectedLocalidad, setSelectedLocalidad] = useState("");

  return (
    <>
      {/* Header con ancho fijo */}
      <TopContainer
        selectedLocalidad={selectedLocalidad}
        setSelectedLocalidad={setSelectedLocalidad}
      />

      {/* Main con ancho fijo de 390px */}
      <main className="bg-background min-h-screen text-foreground px-4 py-6 space-y-6 w-[390px] mx-auto">

        {/* Banner promocional - ancho fijo */}
        <div className="w-[390px] h-[190px] bg-cover bg-center rounded-lg"
          style={{ backgroundImage: 'url(/banner.jpg)' }}>
          <h1 className="text-white text-2xl font-bold p-6">
            Encuentra tu tribu
          </h1>
        </div>

        {/* Sección de Salidas Sociales */}
        <section>
          <h2 className="text-xl font-bold mb-4">Salidas Sociales</h2>

          {/* Grid de eventos - ancho fijo */}
          <div className="flex flex-col w-[390px] gap-4">
            {salidas.map(salida => (
              <EventCard key={salida.id} event={salida} />
            ))}
          </div>
        </section>

        {/* Sección de Academias */}
        <section>
          <h2 className="text-xl font-bold mb-4">Academias</h2>

          {/* Grid de academias - ancho fijo */}
          <div className="flex flex-col w-[390px] gap-4">
            {academias.map(academia => (
              <AirbnbCard key={academia.id} academia={academia} />
            ))}
          </div>
        </section>

        {/* Modal de filtros - ancho fijo */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white w-[390px] rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Filtros</h3>
              {/* Contenido del modal */}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
```

### Problemas Identificados:

1. ❌ Main tiene `w-[390px]` hardcodeado
2. ❌ Banner tiene dimensiones fijas `w-[390px] h-[190px]`
3. ❌ Grids tienen `w-[390px]` en vez de `w-full`
4. ❌ Modal tiene `w-[390px]` fijo
5. ❌ No se adapta a pantallas más grandes o pequeñas
6. ❌ TopContainer internamente también tiene 390px

---

## ✅ DESPUÉS: Código Responsive

```tsx
"use client";

import { useState } from "react";
import TopContainer from "@/components/TopContainer";
import EventCard from "@/components/EventCard";
import AirbnbCard from "@/components/AirbnbCard";
import { AppPage } from "@/components/AppContainer"; // ← Importar AppPage

export default function HomePage() {
  const [selectedLocalidad, setSelectedLocalidad] = useState("");

  return (
    <>
      {/* Header - TopContainer manejará su propio responsive */}
      <TopContainer
        selectedLocalidad={selectedLocalidad}
        setSelectedLocalidad={setSelectedLocalidad}
      />

      {/* Main responsive con AppPage */}
      <AppPage>
        {/* Banner promocional - responsive */}
        <div
          className="w-full aspect-cover max-h-[300px] bg-cover bg-center rounded-lg relative overflow-hidden"
          style={{ backgroundImage: 'url(/banner.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <h1 className="relative text-white text-2xl md:text-3xl font-bold p-6">
            Encuentra tu tribu
          </h1>
        </div>

        {/* Sección de Salidas Sociales */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Salidas Sociales
          </h2>

          {/* Grid responsive - 1 columna en móvil, puede expandir en tablet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salidas.map(salida => (
              <EventCard key={salida.id} event={salida} />
            ))}
          </div>
        </section>

        {/* Sección de Academias */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Academias</h2>

          {/* Grid responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academias.map(academia => (
              <AirbnbCard key={academia.id} academia={academia} />
            ))}
          </div>
        </section>

        {/* Modal de filtros - responsive con max-width */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-lg p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Filtros</h3>
              {/* Contenido del modal */}
            </div>
          </div>
        )}
      </AppPage>
    </>
  );
}
```

### Mejoras Aplicadas:

1. ✅ Usar `<AppPage>` para el main (maneja responsive automáticamente)
2. ✅ Banner usa `w-full aspect-cover` para mantener proporción
3. ✅ Grids ahora usan `grid grid-cols-1 md:grid-cols-2` (responsive)
4. ✅ Textos más grandes en tablets/desktop (`md:text-2xl`)
5. ✅ Modal usa `max-w-md` en vez de ancho fijo
6. ✅ Agregado padding al modal container (`p-4`)
7. ✅ Modal tiene max-height y scroll si es necesario

---

## 🎨 Refactorización del TopContainer

El TopContainer también necesita ser responsive:

### ❌ ANTES: TopContainer Hardcodeado

```jsx
// src/components/TopContainer.jsx
export default function TopContainer({ selectedLocalidad, setSelectedLocalidad }) {
  return (
    <div className="containerTop bg-background h-[50px] w-[100%] max-w-[390px] flex justify-between items-center mt-0">
      <Link href="/dashboard">
        <Image src="/logo.svg" alt="Logo" width={100} height={30} />
      </Link>

      <div className="flex items-center gap-2">
        <button onClick={handleLocationClick}>
          <MapPin size={20} />
          <span>{selectedLocalidad || "Ubicación"}</span>
        </button>

        <Link href="/dashboard/profile">
          <Image
            src={profileImage}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-full"
          />
        </Link>
      </div>
    </div>
  );
}
```

### ✅ DESPUÉS: TopContainer Responsive

```jsx
// src/components/TopContainer.jsx
export default function TopContainer({ selectedLocalidad, setSelectedLocalidad }) {
  return (
    // Wrapper full-width con border
    <div className="w-full bg-background border-b sticky top-0 z-40">
      {/* Contenedor interno centrado y responsive */}
      <div className="app-container h-[50px] flex justify-between items-center">
        <Link href="/dashboard">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={100}
            height={30}
            className="h-[30px] w-auto" // Mantiene aspect ratio
          />
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={handleLocationClick}
            className="flex items-center gap-1 text-sm md:text-base"
          >
            <MapPin size={20} className="md:w-6 md:h-6" />
            <span className="hidden sm:inline">
              {selectedLocalidad || "Ubicación"}
            </span>
          </button>

          <Link href="/dashboard/profile">
            <Image
              src={profileImage}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full w-8 h-8 md:w-10 md:h-10"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Mejoras en TopContainer:

1. ✅ Wrapper full-width para que ocupe todo el ancho
2. ✅ Contenedor interno usa `app-container` para centrarse
3. ✅ Sticky top para que se quede fijo al hacer scroll
4. ✅ Logo mantiene aspect ratio con `w-auto`
5. ✅ Texto de ubicación oculto en móvil pequeño (`hidden sm:inline`)
6. ✅ Avatar más grande en tablets (`md:w-10 md:h-10`)
7. ✅ Gap entre elementos aumenta en desktop (`md:gap-4`)

---

## 🖼️ Refactorización de EventCard

### ❌ ANTES: EventCard con Imagen Hardcodeada

```tsx
// src/components/EventCard.tsx
export default function EventCard({ event }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Imagen con dimensiones fijas */}
      <div
        className="w-[390px] h-[190px] bg-cover bg-center"
        style={{ backgroundImage: `url(${event.image})` }}
      />

      <div className="p-4">
        <h3 className="font-bold text-lg">{event.title}</h3>
        <p className="text-gray-600">{event.date}</p>
        <p className="text-gray-800 mt-2">{event.description}</p>
      </div>
    </div>
  );
}
```

### ✅ DESPUÉS: EventCard Responsive

```tsx
// src/components/EventCard.tsx
import Image from 'next/image';

export default function EventCard({ event }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagen responsive con Next.js Image */}
      <div className="relative w-full aspect-cover overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, 640px"
        />
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg md:text-xl line-clamp-2">
          {event.title}
        </h3>
        <p className="text-gray-600 text-sm">{event.date}</p>
        <p className="text-gray-800 text-sm md:text-base line-clamp-3">
          {event.description}
        </p>
      </div>
    </div>
  );
}
```

### Mejoras en EventCard:

1. ✅ Usar Next.js `<Image>` para optimización
2. ✅ Imagen usa `aspect-cover` para mantener proporción
3. ✅ Hover effects para mejor UX
4. ✅ Textos con `line-clamp` para evitar desbordamiento
5. ✅ Tamaños de texto responsive
6. ✅ `sizes` attribute para optimizar carga de imágenes

---

## 📝 Proceso Paso a Paso

### 1. Preparación

```bash
# Crear branch
git checkout -b refactor/responsive-home

# Verificar estado actual
bash scripts/find-hardcoded-widths.sh
```

### 2. Refactorizar HomePage

```bash
# Abrir archivo
code src/app/home/page.tsx

# Hacer cambios según el ejemplo de arriba
```

### 3. Refactorizar TopContainer

```bash
code src/components/TopContainer.jsx
```

### 4. Refactorizar EventCard

```bash
code src/components/EventCard.tsx
```

### 5. Testing

```bash
# Iniciar dev server
npm run dev

# Abrir en navegador
# http://localhost:3000/home

# Testing en DevTools:
# 1. F12 para abrir DevTools
# 2. Ctrl+Shift+M para Device Mode
# 3. Probar estos tamaños:
#    - iPhone SE (375px)
#    - iPhone 12 (390px)
#    - iPhone 14 Pro Max (430px)
#    - iPad Mini (768px)
#    - Desktop (1024px+)
```

### 6. Verificar y Commit

```bash
# Ver progreso
bash scripts/find-hardcoded-widths.sh
bash scripts/verify-responsive.sh

# Si todo está bien:
git add .
git commit -m "refactor(responsive): hacer HomePage y componentes responsive

- HomePage usa AppPage para layout responsive
- Banner usa aspect-cover para mantener proporción
- Grids son responsive con grid-cols-1 md:grid-cols-2
- TopContainer ahora es full-width con contenido centrado
- EventCard usa Next.js Image con optimización
- Agregados hover effects y transiciones
- Probado en múltiples dispositivos (320px-1024px)

Archivos modificados:
- src/app/home/page.tsx
- src/components/TopContainer.jsx
- src/components/EventCard.tsx
"
```

---

## 🧪 Checklist de Verificación

Después de refactorizar, verifica:

### Visual:
- [ ] Página se ve bien en 320px (móvil muy pequeño)
- [ ] Página se ve bien en 390px (diseño original)
- [ ] Página se ve bien en 430px (móvil grande)
- [ ] Página se ve bien en 768px (tablet)
- [ ] Página se ve bien en 1024px+ (desktop)
- [ ] Contenido centrado en pantallas grandes
- [ ] No hay scroll horizontal
- [ ] Imágenes no se distorsionan
- [ ] Espaciados son consistentes

### Funcional:
- [ ] Todos los links funcionan
- [ ] Botones son clickeables (min 44px de altura)
- [ ] Modal se abre y cierra correctamente
- [ ] Scroll funciona suavemente
- [ ] Navegación funciona
- [ ] Imágenes cargan correctamente

### Performance:
- [ ] No hay console errors
- [ ] Imágenes optimizadas (Next.js Image)
- [ ] No hay layout shifts al cargar
- [ ] Transiciones suaves

---

## 🎯 Resultado Esperado

### Comparación Visual:

**Antes (390px fijo):**
```
┌─────────────────────────────┐
│     Logo    Location  👤    │ ← 390px fijo
├─────────────────────────────┤
│                             │
│   ┌───────────────────┐    │
│   │   Banner 390x190  │    │
│   └───────────────────┘    │
│                             │
│   Salidas Sociales          │
│   ┌───────────────────┐    │
│   │   Event Card      │    │
│   └───────────────────┘    │
│                             │
│   Se ve "encajonado" en     │
│   pantallas más grandes     │
└─────────────────────────────┘
```

**Después (Responsive):**
```
Móvil (390px):
┌──────────────────────────────────┐
│      Logo    Location  👤        │ ← Full width
├──────────────────────────────────┤
│                                  │
│   ┌──────────────────────────┐  │
│   │   Banner (mantiene ratio)│  │
│   └──────────────────────────┘  │
│                                  │
│   Salidas Sociales               │
│   ┌──────────────────────────┐  │
│   │   Event Card             │  │
│   └──────────────────────────┘  │
└──────────────────────────────────┘

Tablet (768px):
┌──────────────────────────────────────────────┐
│         Logo       Location       👤         │
├──────────────────────────────────────────────┤
│                                              │
│   ┌──────────────────────────────────────┐  │
│   │   Banner más grande                  │  │
│   └──────────────────────────────────────┘  │
│                                              │
│   Salidas Sociales                           │
│   ┌──────────────┐  ┌──────────────┐       │
│   │ Event Card 1 │  │ Event Card 2 │       │
│   └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────┘

Desktop (1024px+):
┌───────────────────────────────────────────────────┐
│                                                   │
│   ┌─────────────────────────────────────────┐   │
│   │     Logo       Location       👤        │   │
│   ├─────────────────────────────────────────┤   │
│   │                                         │   │
│   │   ┌─────────────────────────────────┐  │   │
│   │   │   Banner centrado max 640px     │  │   │
│   │   └─────────────────────────────────┘  │   │
│   │                                         │   │
│   │   Salidas Sociales                      │   │
│   │   ┌──────────┐  ┌──────────┐          │   │
│   │   │  Card 1  │  │  Card 2  │          │   │
│   │   └──────────┘  └──────────┘          │   │
│   └─────────────────────────────────────────┘   │
│                                                   │
└───────────────────────────────────────────────────┘
   Contenido centrado, aprovecha espacio
```

---

## 🚀 Siguiente Archivo

Una vez completada la HomePage, continúa con:

1. **Dashboard** (`src/app/dashboard/page.tsx`)
2. **Detalle de Evento** (`src/app/social/[id]/page.tsx`)
3. **Notificaciones** (`src/app/notificaciones/page.jsx`)

Usa este mismo proceso para cada archivo.

---

## 💡 Tips Finales

1. **No tengas miedo de experimentar** - El sistema responsive es muy flexible
2. **Usa Chrome DevTools constantemente** - Prueba cada cambio en múltiples tamaños
3. **Commitea frecuentemente** - Un archivo a la vez, un commit a la vez
4. **Consulta la guía** - [RESPONSIVE_GUIDE.md](./RESPONSIVE_GUIDE.md) tiene más ejemplos
5. **Pide ayuda** - Si algo no funciona, revisa la documentación o pregunta

---

**¡Buena suerte con la refactorización!** 🎉
