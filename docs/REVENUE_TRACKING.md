# Sistema de Revenue Tracking - Trivo

## Resumen Ejecutivo

Este documento describe el sistema de tracking de ingresos (revenue) implementado en Trivo para proporcionar métricas exactas y transparentes para inversores y stakeholders.

## Características Principales

### 🎯 Tracking Exacto por Usuario
- Cada pago se trackea **individualmente por usuario**
- Se registra el **monto exacto** pagado por cada miembro
- No se hacen estimaciones ni aproximaciones

### 💰 Dos Flujos de Pago

#### 1. MercadoPago (Automático)
- **Cuando**: Usuario paga con MercadoPago
- **Aprobación**: Automática al confirmar el pago
- **Tracking**: Se ejecuta en el webhook de MercadoPago
- **Archivo**: `src/app/api/mercadopago/webhook/route.ts`

#### 2. Transferencia Bancaria (Manual)
- **Cuando**: Usuario envía comprobante de transferencia
- **Aprobación**: Manual por el creador de la salida
- **Tracking**: Se ejecuta cuando se aprueba manualmente
- **Archivo**: `src/app/api/social/miembros/[id]/route.ts`

### 🔒 Protección contra Duplicados

El sistema incluye múltiples capas de protección:

1. **Campo `revenueTracked`** en el modelo de Pagos
2. **Verificación de estado anterior** del miembro
3. **Timestamp** de cuándo se trackeó (`revenueTrackedAt`)
4. **Logs detallados** para auditoría

## Estructura de Datos Trackeados

### Evento: "Payment Approved"

```javascript
{
  distinct_id: "userId",           // ID del usuario que pagó
  amount: 15000,                   // Monto exacto pagado
  revenue: 15000,                  // Propiedad especial de Mixpanel
  event_id: "salidaId",           // ID de la salida
  event_type: "salida_social",    // Tipo de evento
  event_name: "Trekking Cerro...", // Nombre de la salida
  payment_id: "paymentId",        // ID único del pago
  payment_method: "mercadopago",  // Método: "mercadopago" o "transferencia_bancaria"
  currency: "ARS",                // Moneda
  source: "webhook_mercadopago",  // Origen del tracking
  timestamp: "2025-01-12T..."     // Timestamp ISO
}
```

### Registro de Cargo (Lifetime Value)

Además del evento, se registra un "cargo" en el perfil del usuario:

```javascript
{
  $amount: 15000,                  // Monto del cargo
  event_id: "salidaId",
  event_type: "salida_social",
  payment_method: "mercadopago",
  currency: "ARS",
  timestamp: "2025-01-12T..."
}
```

Esto permite a Mixpanel calcular automáticamente:
- **Lifetime Value (LTV)** de cada usuario
- **Revenue total** por período
- **Average Revenue Per User (ARPU)**

## Flujo Técnico

### MercadoPago (Pago Automático)

```
Usuario paga → MercadoPago webhook →
  ↓
Verificar pago aprobado →
  ↓
Buscar/crear miembro →
  ↓
Obtener precio de salida (string → number) →
  ↓
Verificar si ya se trackeó →
  ↓
SI no trackeado:
  → Track evento "Payment Approved"
  → Track cargo en perfil usuario
  → Marcar como trackeado
  → Logs de confirmación
```

### Transferencia Bancaria (Aprobación Manual)

```
Usuario envía comprobante →
Creador revisa y aprueba →
  ↓
Verificar cambio de estado (pendiente → aprobado) →
  ↓
Obtener precio de salida (string → number) →
  ↓
Verificar si ya se trackeó →
  ↓
SI no trackeado:
  → Track evento "Payment Approved"
  → Track cargo en perfil usuario
  → Marcar como trackeado
  → Logs de confirmación
```

## Conversión de Precio (String → Number)

Los precios en la base de datos están en formato string. El sistema los convierte así:

```javascript
// Ejemplo: "$15.000" → 15000
const precioStr = String(salida.precio)
  .replace(/[^\d.,]/g, "")  // Eliminar caracteres no numéricos
  .replace(",", ".");        // Normalizar separador decimal

const precioNumerico = parseFloat(precioStr);
```

## Métricas Disponibles en Mixpanel

### 1. Revenue Total
```
Evento: Payment Approved
Propiedad: revenue
```

### 2. Revenue por Método de Pago
```
Filtro: payment_method = "mercadopago" | "transferencia_bancaria"
```

### 3. Revenue por Salida
```
Grupo por: event_name
```

### 4. Lifetime Value (LTV)
```
Perfil de usuario → Transactions → Total
```

### 5. Average Revenue Per User (ARPU)
```
Total Revenue / Unique Users
```

## Validación y Auditoría

### Logs Implementados

El sistema genera logs detallados:

```bash
# Tracking exitoso
💰 Tracking revenue: $15000 ARS para usuario 507f1f77bcf86cd799439011
✅ Revenue tracking completado y marcado para usuario 507f1f77bcf86cd799439011

# Duplicado detectado
ℹ️ Revenue ya trackeado para pago 507f1f77bcf86cd799439012, evitando duplicado

# Error en tracking
⚠️ Revenue tracking puede haber fallado para usuario 507f1f77bcf86cd799439011
❌ Error al trackear revenue de transferencia: [error details]
```

### Verificación de Integridad

Para verificar que el tracking funciona correctamente:

1. **En desarrollo**: Los logs se muestran en consola
2. **En producción**: Los logs están en Vercel logs
3. **En Mixpanel**: Verificar que los eventos aparecen con la propiedad `revenue`

## API de Mixpanel Server-Side

### Archivo: `src/libs/mixpanel.server.ts`

Funciones disponibles:

```typescript
// Trackear evento
trackEventServer({
  event: "Payment Approved",
  distinctId: userId,
  properties: { ... }
})

// Registrar cargo
trackChargeServer({
  distinctId: userId,
  amount: 15000,
  properties: { ... }
})
```

## Modelo de Base de Datos

### Campos agregados a `Pagos`:

```typescript
{
  // ... campos existentes

  // Revenue tracking
  revenueTracked: Boolean,      // ¿Ya se trackeó el revenue?
  revenueTrackedAt: Date,       // ¿Cuándo se trackeó?
}
```

## Casos de Uso para Inversores

### 1. Revenue Mensual
```
Mixpanel → Insights → Event "Payment Approved"
→ Agrupar por mes
→ Sum(revenue)
```

### 2. Tasa de Conversión
```
Usuarios que vieron salida / Usuarios que pagaron
```

### 3. Revenue por Tipo de Evento
```
Filtrar por: event_type = "salida_social"
Agrupar por: event_name
```

### 4. Método de Pago Preferido
```
Count por: payment_method
Distribución: mercadopago vs transferencia_bancaria
```

### 5. Análisis de Cohortes
```
Usuarios agrupados por fecha de primer pago
Revenue acumulado por cohorte
```

## Próximos Pasos Sugeridos

1. **Dashboard en Mixpanel**: Crear dashboards específicos para inversores
2. **Alertas**: Configurar alertas cuando el revenue diario supere ciertos umbrales
3. **Reportes Automáticos**: Enviar reportes semanales/mensuales por email
4. **A/B Testing**: Trackear revenue por diferentes variantes de precios

## Soporte y Contacto

Para preguntas sobre el sistema de tracking:
- Archivo principal webhook: `src/app/api/mercadopago/webhook/route.ts`
- Archivo aprobación manual: `src/app/api/social/miembros/[id]/route.ts`
- Librería server-side: `src/libs/mixpanel.server.ts`
- Eventos frontend: `src/utils/mixpanelEvents.ts`

---

**Última actualización**: 2025-01-12
**Versión**: 1.0
**Estado**: ✅ Implementado y probado
