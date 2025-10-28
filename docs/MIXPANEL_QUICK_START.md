# Mixpanel Quick Start - Trivo

## ✅ Resumen Ejecutivo

Has configurado exitosamente Mixpanel en Trivo. Este documento te guía en los próximos pasos para obtener insights valiosos de tu aplicación.

---

## 🎯 Acciones Inmediatas (Esta Semana)

### 1. Verificar que Mixpanel está Funcionando ✓

- [x] Token configurado en `.env`
- [x] Eventos implementados en el código
- [x] Página de prueba funcionando (`/test-mixpanel`)
- [x] Eventos llegando a Mixpanel Dashboard

**Status**: ✅ COMPLETADO

---

### 2. Configurar Dashboards en Mixpanel (Hoy)

#### Dashboard Principal - "Overview"

**Tiempo estimado**: 15 minutos

1. Ve a Mixpanel → **Boards** → **Create New Board**
2. Nombre: "Trivo - Overview"
3. Agrega estos widgets:

| Widget | Tipo | Configuración |
|--------|------|---------------|
| **Usuarios Activos** | Insights | Evento: Any event, Métrica: Unique users, Last 30 days |
| **Nuevos Registros** | Insights | Evento: User Signup, Métrica: Total, Last 30 days, Group by: day |
| **Eventos Creados** | Insights | Eventos: Salida Social Created + Team Social Created, Last 30 days |
| **Revenue Total** | Insights | Evento: Payment Completed, Métrica: Sum of amount, Last 30 days |
| **Top 5 Eventos** | Insights | All events, Métrica: Total, Last 7 days, Show top 5 |

**Status**: ⏳ PENDIENTE

---

### 3. Configurar Funnel Crítico #1 (Hoy)

#### Funnel: "Registro y Primera Participación"

**Tiempo estimado**: 10 minutos

**Pasos**:

1. Mixpanel → **Reports** → **Funnels** → **Create Funnel**
2. Nombre: "Registro → Primera Participación"
3. Agregar pasos:
   ```
   Paso 1: User Signup
   Paso 2: User Login
   Paso 3: Salida Social Viewed
   Paso 4: Salida Social Joined
   ```
4. Conversion window: **7 days**
5. Breakdown by: **method** (signup method)
6. **Save** y agregar al Dashboard "Overview"

**Métrica objetivo**: >25% de conversión total

**Status**: ⏳ PENDIENTE

---

### 4. Configurar Alertas Críticas (Hoy)

**Tiempo estimado**: 5 minutos

1. Mixpanel → **Alerts** → **Create Alert**

#### Alerta 1: Signups Diarios Bajos
- Evento: `User Signup`
- Condición: Total count < 5
- Periodo: Last 24 hours
- Notificar por: Email

#### Alerta 2: Payment Failed Rate Alto
- Evento: `Payment Failed`
- Condición: Total count > 10
- Periodo: Last 24 hours
- Notificar por: Email

**Status**: ⏳ PENDIENTE

---

## 📊 Acciones de Mediano Plazo (Esta Semana)

### 5. Implementar Eventos Faltantes

Agregar tracking en estos lugares clave:

#### A. Botón "Crear Evento"

**Archivo**: Componente del feed de eventos

```typescript
import { useMixpanel } from '@/hooks/useMixpanel';

const { trackEvent } = useMixpanel();

const handleCreateClick = () => {
  trackEvent('Create Event Button Clicked', {
    source: 'events_feed',
    timestamp: new Date().toISOString(),
  });
  // ... navegar a crear evento
};
```

#### B. Filtros de Búsqueda

**Archivo**: Componente de filtros

```typescript
import { trackFiltersApplied } from '@/utils/mixpanelEvents';

const handleApplyFilters = (filters: any) => {
  trackFiltersApplied({
    sport_type: filters.sportType,
    location: filters.location,
    price_range: filters.priceRange,
  });
  // ... aplicar filtros
};
```

#### C. Notificaciones

**Archivo**: Hook de notificaciones

```typescript
import {
  trackNotificationPermission,
  trackNotificationClick
} from '@/utils/mixpanelEvents';

// Cuando el usuario acepta/rechaza permisos
const handlePermissionResponse = (granted: boolean) => {
  trackNotificationPermission(granted);
};

// Cuando hace click en una notificación
const handleNotificationClick = (type: string) => {
  trackNotificationClick(type);
};
```

**Status**: ⏳ PENDIENTE

---

### 6. Configurar Retention Report

**Tiempo estimado**: 5 minutos

1. Mixpanel → **Reports** → **Retention**
2. Configurar:
   - Birth Event: `User Signup`
   - Return Event: Any event
   - Measured as: % of users
   - Group by: Week
   - Show: 12 weeks
3. Guardar en Dashboard

**Objetivo**: D7 retention >30%, D30 retention >15%

**Status**: ⏳ PENDIENTE

---

### 7. Crear Cohortes Clave

#### Cohorte 1: Active Users (Last 7 Days)
- Condición: Any event in last 7 days
- Uso: Análisis de engagement

#### Cohorte 2: Event Creators
- Condición: Did "Salida Social Created" at least 1 time
- Uso: Comparar comportamiento vs participants

#### Cohorte 3: Paying Users
- Condición: Did "Payment Completed" at least 1 time
- Uso: Análisis de LTV y monetización

**Status**: ⏳ PENDIENTE

---

## 🔍 Preguntas a Responder (Semana 1)

Después de configurar todo lo anterior, responde estas preguntas:

### Adquisición
- [ ] ¿Cuántos usuarios nuevos tenemos por día?
- [ ] ¿Qué método de signup prefieren? (credentials vs google)
- [ ] ¿De dónde vienen los usuarios? (utm_source)

### Activación
- [ ] ¿Qué % de usuarios se unen a su primer evento en 7 días?
- [ ] ¿Cuánto tiempo tarda un usuario en hacer su primera acción?
- [ ] ¿Hay diferencias entre usuarios de Google vs credentials?

### Engagement
- [ ] ¿Cuántos usuarios activos diarios tenemos?
- [ ] ¿Qué tipo de eventos son más populares?
- [ ] ¿Cuántos eventos crea/participa un usuario promedio?

### Monetización
- [ ] ¿Cuánto revenue generamos por día?
- [ ] ¿Cuál es el ticket promedio?
- [ ] ¿Qué % de pagos se completan exitosamente?

### Retención
- [ ] ¿Cuál es nuestra retention D7 y D30?
- [ ] ¿Los usuarios que crean eventos tienen mejor retention?

---

## 📚 Documentación Disponible

Ya tienes estos documentos creados para referencia:

1. **[MIXPANEL.md](MIXPANEL.md)** - Guía completa de implementación
2. **[MIXPANEL_ANALYTICS_STRATEGY.md](MIXPANEL_ANALYTICS_STRATEGY.md)** - Estrategia de análisis y KPIs
3. **[MIXPANEL_FUNNEL_SETUP.md](MIXPANEL_FUNNEL_SETUP.md)** - Configuración detallada de funnels
4. **[MIXPANEL_INTEGRATION_EXAMPLES.md](MIXPANEL_INTEGRATION_EXAMPLES.md)** - Ejemplos de código

---

## 🎓 Recursos de Aprendizaje

### Mixpanel Academy
- [Funnels Basics](https://mixpanel.com/academy/funnels)
- [Retention Analysis](https://mixpanel.com/academy/retention)
- [Dashboard Design](https://mixpanel.com/academy/dashboards)

### Videos Recomendados
- "Mixpanel for Product Managers" (15 min)
- "How to Build Your First Funnel" (10 min)
- "Understanding Retention" (12 min)

---

## ✨ Eventos Disponibles en Trivo

### Autenticación
- `User Login`, `User Logout`, `User Signup`, `Google Login`

### Salidas Sociales
- `Salida Social Viewed`, `Created`, `Joined`, `Left`, `Shared`, `Favorited`

### Team Social
- `Team Social Viewed`, `Created`, `Joined`, `Left`, `Shared`, `Favorited`

### Academias
- `Academia Viewed`, `Created`, `Joined`, `Favorited`

### Pagos
- `Payment Initiated`, `Payment Completed`, `Payment Failed`

### Perfil
- `Profile Viewed`, `Profile Updated`, `Profile Image Uploaded`

### Strava
- `Strava Connected`, `Strava Route Imported`

### Navegación
- `Tab Clicked`, `Search Performed`, `Events Feed Viewed`, `Filters Applied`

### Errores
- `Error Occurred`, `Form Validation Error`, `API Error`

### Notificaciones
- `Notification Permission Granted/Denied`, `Notification Clicked`, `Notification Received`

**Eventos totales**: 40+ eventos disponibles

---

## 🚀 Plan de 30 Días

### Semana 1: Setup (Esta Semana)
- [x] Configurar Mixpanel
- [ ] Crear Dashboard principal
- [ ] Configurar funnel crítico
- [ ] Configurar alertas
- [ ] Implementar eventos faltantes

### Semana 2: Análisis
- [ ] Revisar métricas diarias
- [ ] Identificar drop-offs principales
- [ ] Crear hipótesis de optimización
- [ ] Configurar funnels adicionales

### Semana 3: Optimización
- [ ] Implementar mejoras basadas en datos
- [ ] A/B testing de cambios
- [ ] Medir impacto

### Semana 4: Scale
- [ ] Configurar cohortes avanzadas
- [ ] Análisis de segmentos
- [ ] Reportes ejecutivos
- [ ] Planning para siguiente mes

---

## 💬 Soporte

Si tienes dudas sobre:

- **Implementación técnica**: Ver [MIXPANEL.md](MIXPANEL.md)
- **Estrategia de análisis**: Ver [MIXPANEL_ANALYTICS_STRATEGY.md](MIXPANEL_ANALYTICS_STRATEGY.md)
- **Configuración de funnels**: Ver [MIXPANEL_FUNNEL_SETUP.md](MIXPANEL_FUNNEL_SETUP.md)
- **Ejemplos de código**: Ver [MIXPANEL_INTEGRATION_EXAMPLES.md](MIXPANEL_INTEGRATION_EXAMPLES.md)

---

## 🎉 ¡Felicitaciones!

Has configurado una infraestructura robusta de analytics. Ahora tienes:

- ✅ 40+ eventos implementados
- ✅ Sistema de tracking automático
- ✅ Documentación completa
- ✅ Estrategia de análisis clara

**Próximo paso**: Configurar tu primer dashboard y funnel en Mixpanel (15 minutos).

---

**Última actualización**: 2025-01-27
