# Estrategia de Análisis con Mixpanel para Trivo

## 📊 Índice
1. [Métricas Clave (KPIs)](#métricas-clave-kpis)
2. [Funnels de Conversión](#funnels-de-conversión)
3. [Análisis de Cohortes](#análisis-de-cohortes)
4. [Dashboards Recomendados](#dashboards-recomendados)
5. [Eventos Críticos a Implementar](#eventos-críticos-a-implementar)
6. [Configuración en Mixpanel](#configuración-en-mixpanel)

---

## 📈 Métricas Clave (KPIs)

### 1. **Adquisición de Usuarios**
- **Nuevos Usuarios Registrados** (por día/semana/mes)
  - Evento: `User Signup`
  - Segmentar por: `method` (credentials vs google)

- **Tasa de Conversión de Registro**
  - Funnel: Página de Landing → Sign Up → Primer Login

- **Canales de Adquisición**
  - Propiedad: `utm_source`, `utm_campaign`

### 2. **Activación**
- **Usuarios que Crean su Primer Evento** (dentro de 7 días)
  - Eventos: `Salida Social Created` o `Team Social Created`

- **Usuarios que se Unen a su Primer Evento**
  - Eventos: `Salida Social Joined` o `Team Social Joined`

- **Usuarios que Conectan Strava**
  - Evento: `Strava Connected`

- **Time to First Action**
  - Tiempo desde registro hasta primera acción significativa

### 3. **Engagement**
- **DAU/WAU/MAU** (Daily/Weekly/Monthly Active Users)
  - Usuarios que realizan cualquier acción en la app

- **Eventos Creados por Usuario**
  - Promedio de eventos creados por usuario activo

- **Eventos a los que se Une el Usuario**
  - Promedio de eventos joined por usuario

- **Tasa de Retención**
  - % de usuarios que regresan después de D1, D7, D30

- **Engagement Score**
  - Fórmula personalizada: (eventos creados × 3) + (eventos joined × 2) + (favoritos × 1)

### 4. **Monetización**
- **Revenue por Usuario** (ARPU)
  - Suma de todos los pagos / total usuarios

- **Tasa de Conversión de Pago**
  - Funnel: `Payment Initiated` → `Payment Completed`

- **Ticket Promedio**
  - Promedio de monto pagado por transacción

- **Lifetime Value (LTV)**
  - Total gastado por usuario desde registro

- **Payment Success Rate**
  - `Payment Completed` / (`Payment Completed` + `Payment Failed`)

### 5. **Retención**
- **Retention por Cohorte**
  - % de usuarios que regresan D1, D7, D30 por cohorte de registro

- **Churn Rate**
  - Usuarios que no regresan en 30 días

- **Usuarios Activos Recurrentes**
  - Usuarios que participan en eventos regularmente

---

## 🎯 Funnels de Conversión

### Funnel 1: **Registro y Activación**
```
1. Page View (Landing)
   ↓
2. User Signup
   ↓
3. User Login
   ↓
4. Profile Viewed (Own)
   ↓
5. Salida Social Viewed o Team Social Viewed
   ↓
6. Salida Social Joined o Team Social Joined
```

**Objetivo**: Medir el % de usuarios que completan su primera participación en un evento.

**Configurar en Mixpanel**:
- Dashboard → Funnels → Create Funnel
- Agregar eventos en orden
- Segmentar por método de registro (credentials vs google)

### Funnel 2: **Creación de Evento**
```
1. Salida Social Viewed (múltiples eventos)
   ↓
2. Click en "Crear Evento" (agregar evento custom)
   ↓
3. Salida Social Created
   ↓
4. Payment Initiated (si tiene precio)
   ↓
5. Payment Completed
```

**Objetivo**: Identificar fricciones en el proceso de creación de eventos.

### Funnel 3: **Pago Completo**
```
1. Salida Social Viewed (con precio)
   ↓
2. Salida Social Joined (intent)
   ↓
3. Payment Initiated
   ↓
4. Payment Completed
```

**Objetivo**: Optimizar la conversión de pagos.

**Analizar**:
- Drop-off entre `Payment Initiated` → `Payment Completed`
- Razones de falla (propiedad `reason` en `Payment Failed`)

### Funnel 4: **Social Sharing**
```
1. Salida Social Viewed
   ↓
2. Salida Social Favorited
   ↓
3. Salida Social Shared
```

**Objetivo**: Medir viralidad y engagement social.

---

## 👥 Análisis de Cohortes

### Cohorte 1: **Usuarios por Fecha de Registro**
- **Agrupar por**: Semana de registro
- **Medir**: Retención D1, D7, D30
- **Acción**: Cualquier evento de engagement

**Configurar**:
- Insights → Retention
- Birth Event: `User Signup`
- Return Event: Cualquier evento
- Agrupar por: semana

### Cohorte 2: **Usuarios que Crearon Eventos vs. Solo Joined**
- **Segmentar usuarios** por:
  - Creators: Han hecho `Salida Social Created`
  - Participants: Solo han hecho `Salida Social Joined`

- **Comparar**:
  - Retención entre ambos grupos
  - LTV entre ambos grupos
  - Engagement score

### Cohorte 3: **Usuarios con Strava vs. Sin Strava**
- **Segmentar por**: `Strava Connected`
- **Medir**:
  - Engagement
  - Eventos creados con rutas de Strava
  - Retención

---

## 📊 Dashboards Recomendados

### Dashboard 1: **Overview General**
Widgets:
1. **MAU/WAU/DAU** (gráfico de línea)
2. **Nuevos Registros** (por día, últimos 30 días)
3. **Eventos Creados** (total y por tipo)
4. **Revenue Total** (acumulado)
5. **Tasa de Retención D7** (%)
6. **Top 5 Eventos Más Populares** (tabla)

### Dashboard 2: **User Acquisition**
Widgets:
1. **Signups por Método** (credentials vs google)
2. **Funnel de Registro** (landing → signup → first action)
3. **Signups por Fuente** (utm_source)
4. **Time to First Action** (histogram)
5. **Tasa de Activación** (% usuarios que completan primera acción)

### Dashboard 3: **Engagement**
Widgets:
1. **Eventos por Usuario** (promedio)
2. **Distribución de Usuarios Activos** (power users vs casual)
3. **Eventos Creados vs Joined** (comparación)
4. **Favoritos Agregados** (trending)
5. **Sessions por Usuario** (promedio)
6. **Tiempo en App** (promedio)

### Dashboard 4: **Monetización**
Widgets:
1. **Revenue por Día** (gráfico de barras)
2. **Funnel de Pago** (initiated → completed)
3. **ARPU** (Average Revenue Per User)
4. **Ticket Promedio** (por evento)
5. **Payment Success Rate** (%)
6. **Top Eventos que Generan Revenue**

### Dashboard 5: **Retención**
Widgets:
1. **Retention Curve** (D1, D7, D30)
2. **Churn Rate** (mensual)
3. **Usuarios Recurrentes** (participan en múltiples eventos)
4. **Cohort Analysis** (por semana de registro)

---

## 🚨 Eventos Críticos a Implementar

Basándome en el análisis de tu código, estos son eventos **importantes que faltan**:

### 1. **Navegación y Descubrimiento**
```typescript
// Agregar a mixpanelEvents.ts

// Cuando un usuario explora eventos
export const trackEventsFeed = (filters?: Dict) => {
  trackEvent('Events Feed Viewed', {
    filters_applied: filters ? Object.keys(filters) : [],
    ...filters,
    timestamp: new Date().toISOString(),
  });
};

// Cuando usa el buscador
export const trackSearch = (query: string, category?: string, resultsCount?: number) => {
  trackEvent(EVENTS.NAVIGATION.SEARCH_PERFORMED, {
    query,
    category,
    results_count: resultsCount,
    timestamp: new Date().toISOString(),
  });
};

// Cuando aplica filtros
export const trackFiltersApplied = (filters: Dict) => {
  trackEvent('Filters Applied', {
    filter_types: Object.keys(filters),
    ...filters,
    timestamp: new Date().toISOString(),
  });
};
```

### 2. **Interacciones Sociales**
```typescript
// Cuando ve el perfil de otro usuario
export const trackProfileViewed = (userId: string, isOwnProfile: boolean) => {
  trackEvent(EVENTS.PROFILE.VIEWED, {
    viewed_user_id: userId,
    is_own_profile: isOwnProfile,
    timestamp: new Date().toISOString(),
  });
};

// Cuando envía mensaje/comentario
export const trackComment = (targetType: string, targetId: string) => {
  trackEvent('Comment Added', {
    target_type: targetType,
    target_id: targetId,
    timestamp: new Date().toISOString(),
  });
};
```

### 3. **Onboarding**
```typescript
// Cuando completa tutorial/onboarding
export const trackOnboardingStep = (step: number, stepName: string) => {
  trackEvent('Onboarding Step Completed', {
    step_number: step,
    step_name: stepName,
    timestamp: new Date().toISOString(),
  });
};

export const trackOnboardingCompleted = () => {
  trackEvent('Onboarding Completed', {
    timestamp: new Date().toISOString(),
  });
};
```

### 4. **Errores y Problemas**
```typescript
// Cuando hay un error en la app
export const trackError = (errorType: string, errorMessage: string, context?: Dict) => {
  trackEvent('Error Occurred', {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
    timestamp: new Date().toISOString(),
  });
};

// Cuando un formulario falla validación
export const trackFormError = (formName: string, errors: string[]) => {
  trackEvent('Form Validation Error', {
    form_name: formName,
    error_fields: errors,
    timestamp: new Date().toISOString(),
  });
};
```

### 5. **Push Notifications**
```typescript
// Cuando acepta/rechaza permisos de notificaciones
export const trackNotificationPermission = (granted: boolean) => {
  trackEvent('Notification Permission', {
    permission_granted: granted,
    timestamp: new Date().toISOString(),
  });
};

// Cuando hace click en una notificación
export const trackNotificationClick = (notificationType: string) => {
  trackEvent('Notification Clicked', {
    notification_type: notificationType,
    timestamp: new Date().toISOString(),
  });
};
```

---

## ⚙️ Configuración en Mixpanel

### Paso 1: **Crear Custom Events**

Algunos eventos requieren configuración manual en Mixpanel:

1. Ir a **Data Management → Events**
2. Crear eventos calculados:
   - **"Active User"**: Usuario que hace cualquier acción significativa
   - **"Power User"**: Usuario que crea > 5 eventos/mes
   - **"Paying User"**: Usuario que completó al menos 1 pago

### Paso 2: **Configurar Funnels**

1. Ir a **Reports → Funnels**
2. Crear los funnels mencionados arriba
3. Guardar en Dashboard

### Paso 3: **Crear Cohorts**

1. Ir a **Users → Cohorts**
2. Crear cohortes:
   - **"Active Last 7 Days"**: Usuarios con actividad en últimos 7 días
   - **"Event Creators"**: Usuarios que han creado al menos 1 evento
   - **"Strava Users"**: Usuarios con Strava conectado
   - **"Paying Users"**: Usuarios que han completado pago

### Paso 4: **Configurar Retention Reports**

1. Ir a **Reports → Retention**
2. Configurar:
   - **Birth Event**: `User Signup`
   - **Return Event**: Cualquier evento
   - **Agrupación**: Por semana
   - **Período**: 12 semanas

### Paso 5: **Crear Dashboards**

1. Ir a **Boards → Create Board**
2. Agregar widgets según los dashboards recomendados
3. Compartir con equipo

### Paso 6: **Configurar Alerts**

Configurar alertas para métricas críticas:

1. Ir a **Settings → Notifications**
2. Crear alertas para:
   - **Payment Failed Rate > 20%**
   - **DAU cae > 10%** en un día
   - **Signups < 10** en un día
   - **Churn Rate > 30%** mensual

---

## 🎯 Plan de Implementación (Próximos Pasos)

### Semana 1: **Eventos Básicos**
- [ ] Implementar eventos de navegación y descubrimiento
- [ ] Agregar tracking a todos los botones críticos
- [ ] Implementar eventos de error y validación

### Semana 2: **Funnels y Dashboards**
- [ ] Crear funnels de conversión en Mixpanel
- [ ] Construir dashboards principales
- [ ] Configurar alertas

### Semana 3: **Análisis Avanzado**
- [ ] Configurar cohorts
- [ ] Implementar retention reports
- [ ] Análisis de comportamiento de power users

### Semana 4: **Optimización**
- [ ] Identificar drop-offs en funnels
- [ ] A/B testing setup
- [ ] Optimización basada en datos

---

## 📚 Recursos Útiles

- [Mixpanel Funnels Guide](https://docs.mixpanel.com/docs/analysis/funnels)
- [Retention Analysis](https://docs.mixpanel.com/docs/analysis/retention)
- [Cohort Analysis](https://docs.mixpanel.com/docs/users/cohorts)
- [Dashboard Best Practices](https://mixpanel.com/blog/dashboard-design-best-practices/)

---

## 💡 Preguntas Clave a Responder con Mixpanel

### Adquisición
- ¿Qué canal de marketing trae más usuarios de calidad?
- ¿Cuál método de registro (credentials vs Google) tiene mejor retención?
- ¿Cuánto tiempo tarda un usuario en completar su primera acción?

### Activación
- ¿Qué % de usuarios crea su primer evento en los primeros 7 días?
- ¿Los usuarios que conectan Strava tienen mayor engagement?
- ¿Qué features usan más los usuarios activos?

### Engagement
- ¿Cuántos eventos atiende un usuario promedio por mes?
- ¿Qué tipo de eventos son más populares (salidas sociales vs team social)?
- ¿Cuál es el patrón de uso semanal?

### Monetización
- ¿Qué % de usuarios pagan por eventos?
- ¿Cuál es el ticket promedio?
- ¿Hay correlación entre precio y participación?

### Retención
- ¿Cuál es la retención D7 y D30?
- ¿Qué hace que un usuario regrese?
- ¿Los power users tienen características en común?

---

**Última actualización**: 2025-01-27
