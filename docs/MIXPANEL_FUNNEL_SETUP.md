# Guía de Configuración de Funnels en Mixpanel para Trivo

## 📋 Índice
1. [Introducción a Funnels](#introducción-a-funnels)
2. [Funnels Críticos para Trivo](#funnels-críticos-para-trivo)
3. [Paso a Paso: Configuración](#paso-a-paso-configuración)
4. [Interpretación de Resultados](#interpretación-de-resultados)
5. [Optimización de Conversiones](#optimización-de-conversiones)

---

## 🎯 Introducción a Funnels

Los **funnels** (embudos de conversión) te permiten visualizar el recorrido del usuario a través de una serie de pasos y medir dónde abandonan el proceso.

### ¿Por qué son importantes?

- Identificar **puntos de fricción** en el user journey
- Medir **tasas de conversión** en cada paso
- Comparar el **rendimiento entre segmentos** de usuarios
- Priorizar **optimizaciones** basadas en datos

---

## 🔥 Funnels Críticos para Trivo

### 1. **Funnel de Registro y Activación** (CRÍTICO)

**Objetivo**: Medir cuántos usuarios nuevos completan su primera acción significativa.

**Pasos del Funnel**:
```
1. User Signup
2. User Login (primer login)
3. Events Feed Viewed
4. Salida Social Viewed (al menos 1 evento)
5. Salida Social Joined (primera participación)
```

**Métricas Clave**:
- Conversión total: % de signups que llegan a joined
- Drop-off crítico: Entre qué pasos pierdes más usuarios
- Time to convert: Tiempo desde signup hasta joined

**Segmentaciones Recomendadas**:
- Por método de registro (credentials vs google)
- Por fuente (utm_source)
- Por dispositivo (mobile vs desktop)

---

### 2. **Funnel de Creación de Eventos** (ALTO VALOR)

**Objetivo**: Identificar fricciones en el proceso de crear eventos.

**Pasos del Funnel**:
```
1. Events Feed Viewed
2. Click en "Crear Evento" (evento custom a agregar)
3. Salida Social Created
4. Payment Initiated (si aplica)
5. Payment Completed (si aplica)
```

**Métricas Clave**:
- % de usuarios que intentan crear evento
- % de eventos creados con éxito
- % de eventos con pago completado

**Segmentaciones Recomendadas**:
- Por tipo de deporte
- Por si tiene precio o no
- Por si tiene ruta de Strava

---

### 3. **Funnel de Pago** (MONETIZACIÓN)

**Objetivo**: Optimizar la conversión de pagos.

**Pasos del Funnel**:
```
1. Salida Social Viewed (eventos con precio)
2. Salida Social Joined (intent to pay)
3. Payment Initiated
4. Payment Completed
```

**Métricas Clave**:
- Payment success rate
- Average time to complete payment
- Drop-off en cada paso

**Segmentaciones Recomendadas**:
- Por rango de precio (0-500, 500-1000, 1000+)
- Por método de pago
- Por tipo de evento

---

### 4. **Funnel de Engagement con Strava** (FEATURE ADOPTION)

**Objetivo**: Medir adopción de integración con Strava.

**Pasos del Funnel**:
```
1. User Login
2. Profile Viewed (Own)
3. Strava Connected
4. Strava Route Imported
5. Salida Social Created (con ruta Strava)
```

**Métricas Clave**:
- % de usuarios que conectan Strava
- % que realmente usan rutas de Strava

---

### 5. **Funnel de Retención** (USER LIFECYCLE)

**Objetivo**: Entender el path de usuarios recurrentes.

**Pasos del Funnel**:
```
1. Salida Social Joined (primer evento)
2. User Login (segundo día)
3. Salida Social Viewed (segundo evento)
4. Salida Social Joined (segundo evento)
5. Salida Social Favorited
```

**Métricas Clave**:
- % de usuarios que vuelven después del primer evento
- Tiempo promedio entre eventos

---

## 🛠️ Paso a Paso: Configuración en Mixpanel

### Configuración del Funnel 1: Registro y Activación

#### Paso 1: Crear Nuevo Funnel

1. En Mixpanel, ve a **Reports** → **Funnels**
2. Click en **+ Create Funnel**
3. Nombra el funnel: "Registro y Activación"

#### Paso 2: Agregar Eventos

1. **Evento 1**: `User Signup`
   - Click en "+ Add Step"
   - Busca "User Signup"
   - Selecciona el evento

2. **Evento 2**: `User Login`
   - Click en "+ Add Step"
   - Busca "User Login"
   - Selecciona el evento

3. **Evento 3**: `Events Feed Viewed`
   - "+ Add Step" → "Events Feed Viewed"

4. **Evento 4**: `Salida Social Viewed`
   - "+ Add Step" → "Salida Social Viewed"

5. **Evento 5**: `Salida Social Joined`
   - "+ Add Step" → "Salida Social Joined"

#### Paso 3: Configurar Ventana de Conversión

1. En "Conversion window", selecciona: **7 days**
   - Esto significa que el usuario tiene 7 días para completar todos los pasos

2. Para análisis de activación rápida, puedes crear otra versión con **24 hours**

#### Paso 4: Agregar Segmentaciones

1. Click en **"Breakdown"**
2. Agregar segmentación por:
   - **method** (signup method)
   - **utm_source** (canal de adquisición)
   - **Device Type** (mobile vs desktop)

#### Paso 5: Configurar Filtros (Opcional)

Si quieres analizar solo ciertos usuarios:

1. Click en **"Where"**
2. Por ejemplo: Filtrar solo usuarios de Argentina
   - Property: `country`
   - Operator: `equals`
   - Value: `Argentina`

#### Paso 6: Guardar y Compartir

1. Click en **"Save"**
2. Asigna a un Dashboard
3. Comparte con el equipo

---

### Configuración del Funnel 2: Creación de Eventos

**IMPORTANTE**: Primero necesitas agregar un evento custom para "Click en Crear Evento"

#### Opción A: Agregar evento custom en el código

En el componente donde está el botón "Crear Evento":

```typescript
import { useMixpanel } from '@/hooks/useMixpanel';

const { trackEvent } = useMixpanel();

const handleCreateEventClick = () => {
  trackEvent('Create Event Button Clicked', {
    source: 'events_feed', // o donde esté el botón
    timestamp: new Date().toISOString(),
  });
  // ... resto de la lógica
};
```

#### Luego en Mixpanel:

1. Crear funnel "Creación de Eventos"
2. Agregar pasos:
   ```
   1. Events Feed Viewed
   2. Create Event Button Clicked
   3. Salida Social Created
   ```
3. Ventana de conversión: **1 hour** (proceso rápido)
4. Segmentar por: `sport_type`, `has_price`

---

### Configuración del Funnel 3: Pago

1. Crear funnel "Pago Completo"
2. Agregar pasos:
   ```
   1. Salida Social Viewed
      - Filtrar: has_price = true
   2. Salida Social Joined
   3. Payment Initiated
   4. Payment Completed
   ```
3. Ventana de conversión: **1 hour**
4. Segmentar por:
   - `amount` (rangos: 0-500, 500-1000, 1000+)
   - `event_type`

**Configuración de Filtros**:
- En el paso 1, agregar filtro:
  - Where `price` > 0

---

### Configuración del Funnel 4: Strava Adoption

1. Crear funnel "Adopción de Strava"
2. Agregar pasos:
   ```
   1. User Login
   2. Profile Viewed (Own)
      - Filtrar: is_own_profile = true
   3. Strava Connected
   4. Strava Route Imported
   5. Salida Social Created
      - Filtrar: has_strava_route = true
   ```
3. Ventana de conversión: **30 days**
4. Comparar con cohorte de usuarios sin Strava

---

## 📊 Interpretación de Resultados

### Cómo Leer un Funnel

Ejemplo de resultado:
```
1. User Signup:         1,000 usuarios (100%)
2. User Login:            800 usuarios (80%)   ← -20% drop
3. Events Feed Viewed:    600 usuarios (60%)   ← -25% drop
4. Salida Social Viewed:  480 usuarios (48%)   ← -20% drop
5. Salida Social Joined:  240 usuarios (24%)   ← -50% drop ⚠️
```

### Análisis:

1. **Conversión Total**: 24% (240/1000)
   - ¿Es bueno? Depende del benchmark de tu industria

2. **Drop-off más grande**: Entre "Viewed" y "Joined" (-50%)
   - 🚨 **ACCIÓN CRÍTICA**: Investigar por qué los usuarios no se unen

3. **Posibles causas del drop-off**:
   - Proceso de join muy complejo
   - Falta de eventos atractivos
   - Problemas con UI/UX
   - Precio muy alto
   - Falta de confianza

### Métricas de Benchmark

**Funnel de Registro**:
- Excelente: >40%
- Bueno: 25-40%
- Mejorable: 10-25%
- Crítico: <10%

**Funnel de Pago**:
- Excelente: >70%
- Bueno: 50-70%
- Mejorable: 30-50%
- Crítico: <30%

---

## 🎯 Optimización de Conversiones

### Estrategias por Tipo de Drop-off

#### 1. Drop-off entre Signup y Login
**Problema**: Usuarios no completan su primer login.

**Soluciones**:
- Enviar email de bienvenida
- Simplificar proceso de verificación
- Auto-login después de signup

#### 2. Drop-off entre Feed Viewed y Event Viewed
**Problema**: Usuarios no encuentran eventos interesantes.

**Soluciones**:
- Mejorar algoritmo de recomendaciones
- Mejor diseño de cards de eventos
- Filtros más intuitivos

#### 3. Drop-off entre Event Viewed y Joined
**Problema**: Usuarios ven eventos pero no se unen.

**Soluciones**:
- CTA más clara
- Mostrar testimonials/reviews
- Reducir fricción en proceso de join
- Mostrar quién más se unió (social proof)

#### 4. Drop-off entre Payment Initiated y Completed
**Problema**: Usuarios abandonan el pago.

**Soluciones**:
- Simplificar formulario de pago
- Agregar más métodos de pago
- Mostrar seguridad del pago
- Reducir pasos

---

## 🔬 Análisis Avanzado

### A/B Testing con Funnels

1. Crear variante del funnel para experimentos:
   - Ejemplo: "Registro v2 (con onboarding)"
   - Comparar conversión entre versiones

2. Segmentar por feature flag:
   ```
   Funnel: Registro y Activación
   Segmentar por: feature_onboarding_enabled
   ```

### Análisis de Tiempo

1. En el funnel, click en **"Time to Convert"**
2. Ver distribución de tiempo:
   - Median time: Tiempo típico
   - 90th percentile: Outliers

**Ejemplo de insights**:
- Si median time = 5 minutos pero 90th percentile = 3 días
  → Hay dos tipos de usuarios: rápidos y lentos
  → Crear estrategias diferentes para cada grupo

---

## 📌 Checklist de Implementación

- [ ] **Funnel 1**: Registro y Activación configurado
- [ ] **Funnel 2**: Creación de Eventos configurado
- [ ] **Funnel 3**: Pago configurado
- [ ] **Funnel 4**: Strava Adoption configurado
- [ ] Todos los funnels agregados a Dashboard principal
- [ ] Alertas configuradas para drop-offs críticos
- [ ] Reunión semanal de revisión de funnels agendada
- [ ] Experimentos de optimización planificados

---

## 🚀 Próximos Pasos

1. **Configurar funnels básicos** (esta semana)
2. **Analizar drop-offs** más significativos
3. **Crear hipótesis** de optimización
4. **Implementar mejoras** basadas en datos
5. **Medir impacto** de cambios
6. **Iterar** constantemente

---

## 💡 Tips Finales

1. **No optimices todo a la vez**: Enfócate en el drop-off más grande
2. **Segmenta siempre**: Diferentes usuarios se comportan diferente
3. **Compara periodos**: Semana vs semana, mes vs mes
4. **Documenta cambios**: Anota qué cambios hiciste y cuándo
5. **Celebra victorias**: Mejoras del 5% son significativas

---

**Última actualización**: 2025-01-27
