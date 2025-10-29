# Plan de Refactorización Responsive - Trivo

## Problema Identificado

La aplicación tiene **tamaños hardcodeados de 390px** en aproximadamente **50+ archivos**, lo que impide que se adapte correctamente a diferentes tamaños de pantalla. Esto afecta la experiencia en:

- Teléfonos más grandes (iPhone 14 Pro Max, Samsung Galaxy S23 Ultra)
- Teléfonos más pequeños (iPhone SE, Android compactos)
- Tablets y iPads
- Modo landscape/horizontal
- PWA en desktop

## Archivos Afectados

### Archivos con `w-[390px]` o `max-w-[390px]` (50+ ocurrencias)

#### Pages (Rutas principales)
- `src/app/home/page.tsx` - Página principal
- `src/app/dashboard/page.tsx` - Dashboard de usuario
- `src/app/dashboard/profile/page.tsx` - Perfil
- `src/app/dashboard/profile/editar/page.tsx` - Editar perfil
- `src/app/social/[id]/page.tsx` - Detalle de salida social
- `src/app/social/page.tsx` - Listado salidas
- `src/app/social/crear/page.tsx` - Crear salida
- `src/app/social/editar/[id]/page.tsx` - Editar salida
- `src/app/social/miembros/[id]/page.tsx` - Miembros de salida
- `src/app/team-social/[id]/page.tsx` - Detalle de team social
- `src/app/team-social/miembros/[id]/page.tsx` - Miembros de team
- `src/app/academias/page.tsx` - Listado academias
- `src/app/academias/[id]/page.tsx` - Detalle academia
- `src/app/academias/[id]/miembros/page.tsx` - Miembros academia
- `src/app/academias/[id]/resenas/page.tsx` - Reseñas
- `src/app/academias/[id]/editar/page.tsx` - Editar academia
- `src/app/academias/crear/page.tsx` - Crear academia
- `src/app/grupos/page.tsx` - Listado grupos
- `src/app/grupos/[id]/page.tsx` - Detalle grupo
- `src/app/grupos/[id]/editar/page.tsx` - Editar grupo
- `src/app/entrenamiento/page.tsx` - Entrenamientos
- `src/app/entrenamiento/[id]/page.tsx` - Detalle entrenamiento
- `src/app/notificaciones/page.jsx` - Notificaciones
- `src/app/buscar/page.tsx` - Búsqueda
- `src/app/club-del-trekking/page.tsx` - Club especial

#### Components
- `src/components/TopContainer.jsx` - Header principal
- `src/components/UserPublicProfile.tsx` - Perfil público
- `src/components/GrupoDetailSkeleton.jsx` - Skeleton de grupo
- `src/components/GrupoDetailSkeletonV2.tsx` - Skeleton V2
- `src/components/MatchLoadingSkeleton.jsx` - Skeleton de match
- `src/components/FormCreationSkeleton.tsx` - Skeleton de formulario
- `src/components/AcademiaDetailSkeleton.tsx` - Skeleton de academia
- `src/components/FilterModal.tsx` - Modal de filtros

#### Layout
- `src/app/layout.tsx` - Layout raíz (Toaster con maxWidth: 390px)

## Solución Propuesta

### 1. Sistema de Diseño Responsive

Implementar un sistema mobile-first con breakpoints estándar:

```
Mobile:     320px - 639px   (sm)
Tablet:     640px - 1023px  (md, lg)
Desktop:    1024px+         (xl, 2xl)
```

### 2. Contenedor de Aplicación (`app-container`)

Crear una clase utilitaria personalizada en Tailwind que reemplace `w-[390px]`:

```css
.app-container {
  width: 100%;
  max-width: 640px;  /* Máximo en móviles grandes */
  margin: 0 auto;
  padding: 0 1rem;   /* 16px de padding lateral */
}
```

**Ventajas:**
- ✅ Se adapta desde 320px hasta 640px
- ✅ Centrado automático en pantallas más grandes
- ✅ Padding lateral para evitar que el contenido toque los bordes
- ✅ Consistencia en toda la app
- ✅ Fácil de mantener (un solo lugar para ajustar)

### 3. Breakpoints para Tablets y Desktop

Para tablets y desktop, expandir el contenedor:

```css
@media (min-width: 768px) {
  .app-container-tablet {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .app-container-desktop {
    max-width: 1024px;
  }
}
```

### 4. Componentes Responsivos

#### Tarjetas y Cards
```jsx
// ❌ Antes
<div className="w-[390px]">

// ✅ Después
<div className="w-full max-w-[640px] mx-auto px-4">
// o simplemente
<div className="app-container">
```

#### Imágenes y Banners
```jsx
// ❌ Antes
<img className="w-[390px] h-[190px]" />

// ✅ Después
<img className="w-full aspect-[390/190] object-cover" />
// o
<img className="w-full h-48 object-cover" />
```

#### Grids y Listas
```jsx
// ❌ Antes
<div className="w-[390px] flex flex-col">

// ✅ Después
<div className="w-full max-w-[640px] mx-auto px-4 flex flex-col">
```

## Estrategia de Implementación

### Fase 1: Configuración Base (1 hora)

1. **Actualizar `tailwind.config.js`**
   - Agregar clase `app-container`
   - Definir breakpoints personalizados
   - Configurar max-width dinámico

2. **Crear componente wrapper `<AppContainer>`**
   - Componente reutilizable para layouts
   - Props para variantes (full-width, padded, etc.)

3. **Actualizar `layout.tsx`**
   - Ajustar Toaster a responsive
   - Aplicar contenedor base al body

### Fase 2: Refactorización de Pages (3-4 horas)

Orden sugerido por prioridad:

#### Alta Prioridad (Usuario final)
1. `src/app/home/page.tsx` - Página principal
2. `src/app/dashboard/page.tsx` - Dashboard
3. `src/app/social/[id]/page.tsx` - Detalle de eventos
4. `src/app/team-social/[id]/page.tsx` - Team socials
5. `src/app/notificaciones/page.jsx` - Notificaciones

#### Media Prioridad (Creación de contenido)
6. `src/app/social/crear/page.tsx`
7. `src/app/team-social/crear/page.tsx`
8. `src/app/academias/crear/page.tsx`
9. `src/app/grupos/crear/page.tsx`

#### Baja Prioridad (Admin/Settings)
10. `src/app/dashboard/profile/editar/page.tsx`
11. `src/app/academias/[id]/editar/page.tsx`
12. Demás páginas de edición

### Fase 3: Refactorización de Components (2 horas)

1. **TopContainer.jsx** - Header
2. **UserPublicProfile.tsx** - Perfil público
3. **Skeletons** (GrupoDetailSkeleton, FormCreationSkeleton, etc.)
4. **Modals** (FilterModal, EventModal)
5. **Cards** (EventCard, AirbnbCard, etc.)

### Fase 4: Testing y Ajustes (1-2 horas)

1. Probar en diferentes dispositivos:
   - iPhone SE (375px)
   - iPhone 12/13 (390px) - diseño base actual
   - iPhone 14 Pro Max (430px)
   - Samsung Galaxy S20+ (412px)
   - iPad Mini (768px)
   - Desktop (1024px+)

2. Verificar orientación landscape

3. Ajustar elementos específicos que se rompan

## Patrón de Refactorización

### Template de Cambio

```diff
// Página típica
- <main className="bg-background min-h-screen text-foreground px-4 py-6 space-y-6 w-[390px] mx-auto">
+ <main className="bg-background min-h-screen text-foreground">
+   <div className="app-container py-6 space-y-6">
      {/* Contenido */}
+   </div>
  </main>

// Contenedor de detalle
- <div className="flex flex-col w-[390px] items-center bg-background">
+ <div className="flex flex-col w-full max-w-[640px] mx-auto items-center bg-background px-4">

// Imagen de cover/banner
- <div className="w-[390px] h-[190px] bg-cover bg-center">
+ <div className="w-full aspect-[2/1] max-h-[300px] bg-cover bg-center">

// Skeleton/Loading
- <div className="flex flex-col w-[390px] items-center">
+ <div className="flex flex-col w-full max-w-[640px] mx-auto items-center px-4">
```

## Casos Especiales

### 1. TopContainer (Header)

El header debe ser full-width pero con contenido centrado:

```jsx
<div className="w-full bg-background border-b">
  <div className="app-container h-[50px] flex justify-between items-center">
    {/* Logo, ubicación, perfil */}
  </div>
</div>
```

### 2. Imágenes de Cover/Banner

Mantener aspect ratio pero permitir crecimiento:

```jsx
// Opción 1: Aspect ratio fijo
<div className="w-full aspect-[390/190] max-h-[250px]">

// Opción 2: Height fijo pero width responsive
<div className="w-full h-48 md:h-64">
```

### 3. Modals y Overlays

Los modals deben adaptarse pero no crecer demasiado en desktop:

```jsx
<div className="w-full max-w-md mx-auto p-4">
  {/* Modal content */}
</div>
```

### 4. Toaster/Notifications

```jsx
// En layout.tsx
toastOptions={{
  duration: 5000,
  style: {
    width: '100%',
    maxWidth: 'min(390px, 90vw)', // Responsive
  },
}}
```

### 5. Mapas (Mapbox)

Los mapas deben ocupar todo el ancho disponible:

```jsx
<div className="w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden">
  <MapboxMap {...props} />
</div>
```

## Utilidades de Tailwind Personalizadas

### En `tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      maxWidth: {
        'app': '640px',        // Contenedor principal
        'app-sm': '480px',      // Contenedor pequeño (modals)
        'app-lg': '768px',      // Contenedor grande (tablets)
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      aspectRatio: {
        'cover': '390 / 190',   // Para covers de eventos
        'card': '4 / 3',        // Para cards de eventos
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.app-container': {
          width: '100%',
          maxWidth: '640px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        },
        '.app-container-narrow': {
          width: '100%',
          maxWidth: '480px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        },
        '.app-container-wide': {
          width: '100%',
          maxWidth: '768px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        },
      })
    },
  ],
}
```

## Scripts de Ayuda

### Script de Búsqueda y Reemplazo

```bash
#!/bin/bash
# find-and-replace-390px.sh

# Buscar todos los archivos con w-[390px]
echo "Archivos con w-[390px]:"
grep -r "w-\[390px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" -l

# Contar ocurrencias
echo ""
echo "Total de ocurrencias:"
grep -r "w-\[390px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" | wc -l

# Buscar max-w-[390px]
echo ""
echo "Archivos con max-w-[390px]:"
grep -r "max-w-\[390px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" -l
```

### Script de Verificación Post-Refactor

```bash
#!/bin/bash
# verify-responsive.sh

echo "Verificando que no queden anchos hardcodeados..."

# Buscar w-[XXXpx] (cualquier número)
echo "Anchos hardcodeados restantes:"
grep -r "w-\[[0-9]\+px\]" src/ --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules

# Buscar max-w-[XXXpx]
echo ""
echo "Max-width hardcodeados restantes:"
grep -r "max-w-\[[0-9]\+px\]" src/ --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules

echo ""
echo "Excepciones permitidas (verificar manualmente):"
echo "- Iconos pequeños (w-[24px], w-[32px])"
echo "- Elementos UI específicos (avatars, badges)"
```

## Checklist de Refactorización

### Por cada archivo modificado:

- [ ] Reemplazar `w-[390px]` con `app-container` o `w-full max-w-[640px] mx-auto px-4`
- [ ] Verificar imágenes: usar `w-full` + `aspect-ratio` o `h-XX`
- [ ] Ajustar paddings: usar sistema de spacing de Tailwind
- [ ] Probar en DevTools con diferentes viewports
- [ ] Verificar que no se rompa el layout en móvil pequeño (320px)
- [ ] Verificar que no se rompa en móvil grande (430px)
- [ ] Verificar en tablet (768px)
- [ ] Commit con mensaje descriptivo

### Testing por página:

- [ ] Probar scroll vertical
- [ ] Probar interacciones táctiles
- [ ] Verificar que modals/overlays funcionen
- [ ] Verificar que imágenes no se distorsionen
- [ ] Verificar que textos no se corten
- [ ] Verificar botones accesibles (min 44px de altura)

## Beneficios Esperados

### UX/UI
- ✅ Mejor experiencia en todos los dispositivos
- ✅ Aprovechamiento de pantallas más grandes
- ✅ Menos scroll en móviles grandes
- ✅ Contenido no se ve "encajonado" en tablets
- ✅ Preparado para iPad/tablet view

### Técnicos
- ✅ Código más mantenible
- ✅ Consistencia en estilos
- ✅ Fácil ajustar tamaños globalmente
- ✅ Mejor preparado para PWA en desktop
- ✅ Cumple con mejores prácticas de responsive design

### SEO y Accessibility
- ✅ Mejor puntuación en Lighthouse (responsive)
- ✅ Cumple con Google Mobile-Friendly Test
- ✅ Mejor accesibilidad en diferentes dispositivos

## Riesgos y Mitigaciones

### Riesgo 1: Romper layouts existentes
**Mitigación:** Probar cada página después de refactorizar antes de continuar.

### Riesgo 2: Diseño se ve mal en tablets
**Mitigación:** Implementar breakpoint `md:` para ajustar en tablets si es necesario.

### Riesgo 3: Imágenes distorsionadas
**Mitigación:** Usar siempre `object-cover` o `object-contain` con aspect-ratio.

### Riesgo 4: Modals muy anchos en desktop
**Mitigación:** Usar `max-w-md` o `max-w-lg` en vez de `app-container` para modals.

## Próximos Pasos

1. **Revisión de este plan** con el equipo
2. **Crear branch** `feat/responsive-refactor`
3. **Fase 1:** Configuración base (1h)
4. **Fase 2:** Refactorizar páginas críticas (3h)
5. **Testing inicial** en dispositivos reales
6. **Fase 3:** Refactorizar componentes (2h)
7. **Testing completo** y ajustes (1-2h)
8. **PR y review**
9. **Deploy a staging**
10. **Testing final** y merge a main

## Recursos

### Testing Responsive
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- BrowserStack (testing en dispositivos reales)
- iOS Simulator (Mac)
- Android Emulator

### Documentación
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)

---

**Estimación total:** 7-9 horas de desarrollo + 2-3 horas de testing
**Prioridad:** Alta (afecta UX en todos los dispositivos)
**Impacto:** Alto (mejora significativa en experiencia de usuario)
