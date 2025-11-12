📊 ANÁLISIS DE PERFORMANCE - Página de Detalle de Salida
He completado el análisis exhaustivo de la página de detalle de salida en http://localhost:3000/social/691472bfa370eba8a4eab6bc. Aquí están los hallazgos y el plan de acción:
🔴 Problemas Críticos Encontrados
1. Latencia del Documento (CRÍTICO)
Tiempo de respuesta inicial: 940ms (debería ser <600ms, idealmente ~100ms)
Tiempo total de procesamiento: 1,584ms
Impacto estimado: FCP -835ms, LCP -835ms
Estado: ❌ FAILED
2. Error 500 en API de Notificaciones (CRÍTICO)
Endpoint: /api/notificaciones
Frecuencia: Se llama múltiples veces y falla constantemente
Impacto: Genera errores en consola y afecta la experiencia del usuario
3. Polling Excesivo de Payment Status
Endpoint: /api/pagos/status/691472bfa370eba8a4eab6bc
Frecuencia: Se llama 4 veces durante la carga inicial
Impacto: Carga innecesaria en el servidor y base de datos
4. Requests Duplicados
/api/auth/session - llamado 2 veces
/api/themes/global - llamado 2 veces
/api/entrenamientos?user=... - llamado 2 veces (en la primera prueba)
📈 Métricas Core Web Vitals
CLS (Cumulative Layout Shift): 0.00 ✅ EXCELENTE
FCP (First Contentful Paint): Necesita mejorar ~835ms
LCP (Largest Contentful Paint): Necesita mejorar ~835ms
🎯 PLAN DE ACCIÓN - Priorizado por Impacto
FASE 1: Soluciones Críticas (Impacto Alto - Esfuerzo Bajo)
1.1 Arreglar el endpoint de notificaciones
Archivo: src/app/api/notificaciones/route.ts
Investigar y corregir el error 500
Agregar manejo de errores apropiado
Considerar agregar logging para debugging
1.2 Implementar Request Deduplication
Archivos: Múltiples componentes y hooks
Usar React Query's staleTime y cacheTime efectivamente
Evitar múltiples llamadas simultáneas a los mismos endpoints
Implementar request deduplication en tanstack-query
1.3 Optimizar Polling de Payment Status
Archivo: src/hooks/usePaymentStatus.ts
Reducir frecuencia de polling (actualmente parece muy agresivo)
Usar refetchInterval más largo o estrategia de backoff exponencial
Considerar WebSockets para updates en tiempo real
FASE 2: Optimizaciones de Carga (Impacto Alto - Esfuerzo Medio)
2.1 Optimizar Server Response Time
Archivo: src/app/social/[id]/page.tsx
Implementar ISR (Incremental Static Regeneration) para páginas de salidas
Agregar caching en el servidor con cache-control headers apropiados
Actualmente usa no-store, must-revalidate que previene todo caching
// Ejemplo de mejora en page.tsx
export const revalidate = 60; // Revalidar cada 60 segundos
2.2 Implementar Prefetching Estratégico
Archivo: src/app/social/[id]/page.tsx
Prefetch de datos críticos en el servidor (SSR)
Reducir waterfall de requests cliente-servidor
// Server-side data fetching
async function EventPage({ params }: PageProps) {
  // Fetch critical data on server
  const event = await fetchEvent(params.id);
  const miembros = await fetchMiembros(params.id);
  
  return <ClientComponent initialData={{ event, miembros }} />;
}
2.3 Code Splitting Mejorado
Archivos: Componentes dinámicos en page.tsx
Ya tienes dynamic imports (✅), pero puedes optimizar más:
MapComponent y StravaMap solo cargar cuando sean visibles
Usar Intersection Observer para lazy loading
const MapComponent = dynamic(
  () => import("@/components/MapComponent"),
  { 
    ssr: false,
    loading: () => <MapSkeleton /> 
  }
);
FASE 3: Optimizaciones de Assets (Impacto Medio - Esfuerzo Bajo)
3.1 Optimizar Imágenes
Las imágenes de Firebase Storage no tienen optimización
Considerar usar Next.js Image Optimization API
Implementar formatos modernos (WebP, AVIF)
// En lugar de:
<img src={event.imagen} alt="..." />

// Usar:
<Image 
  src={event.imagen} 
  alt="..."
  width={800}
  height={600}
  placeholder="blur"
  quality={80}
/>
3.2 Reducir Third-Party Scripts
Mapbox API: 3 requests durante la carga inicial
Mixpanel: 2 requests
Considerar cargar estos scripts de forma diferida o solo cuando sean necesarios
3.3 Implementar Resource Hints
Archivo: src/app/layout.tsx o metadata
// Ya tienes preconnect para Firebase ✅
// Agregar para otros servicios:
<link rel="preconnect" href="https://api.mapbox.com" />
<link rel="dns-prefetch" href="https://api-js.mixpanel.com" />
FASE 4: Optimizaciones de Base de Datos (Impacto Alto - Esfuerzo Alto)
4.1 Optimizar Queries de MongoDB
Archivos: src/app/api/social/[id]/route.ts
Agregar índices apropiados en MongoDB
Usar projection para retornar solo campos necesarios
Implementar caching a nivel de base de datos
// Ejemplo de projection
const event = await Social.findById(id)
  .select('nombre ubicacion fecha hora precio cupo imagen creador_id')
  .populate('creador_id', 'firstname lastname imagen')
  .lean(); // Retorna plain objects, más rápido
4.2 Implementar Database Connection Pooling
Verificar configuración de mongoose
Asegurar reuso de conexiones en serverless environment
FASE 5: Monitoreo y Medición (Impacto Largo Plazo)
5.1 Implementar Real User Monitoring (RUM)
Configurar Web Vitals tracking
Enviar métricas a analytics (ya tienes Mixpanel)
// En _app.tsx o layout
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  mixpanel.track('Web Vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
5.2 Performance Budgets
Establecer presupuestos de performance
FCP < 1.8s
LCP < 2.5s
TTI < 3.8s
📋 Resumen de Impacto Esperado
Optimización	Impacto en FCP	Impacto en LCP	Esfuerzo
Arreglar API notificaciones	Bajo	Bajo	Bajo
Request deduplication	Medio	Medio	Bajo
Optimizar polling	Bajo	Bajo	Bajo
Server Response Time	Alto	Alto	Medio
Prefetching estratégico	Alto	Alto	Medio
Code splitting mejorado	Medio	Medio	Bajo
Optimizar imágenes	Medio	Alto	Bajo
Optimizar DB queries	Alto	Alto	Alto
🎯 Quick Wins (Implementar Primero)
✅ Arreglar /api/notificaciones (Error 500)
✅ Eliminar requests duplicados
✅ Optimizar frecuencia de polling de payment status
✅ Agregar caching headers apropiados
✅ Implementar ISR para páginas de salidas
🚀 Mejora Esperada Total
Con todas estas optimizaciones, deberías lograr:
FCP: ~1.5s (mejora de ~800ms)
LCP: ~2.0s (mejora de ~800ms)
Reducción de requests: ~30%
Reducción de errores: 100% (eliminando el error 500)