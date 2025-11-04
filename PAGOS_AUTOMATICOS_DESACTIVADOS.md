# ⚠️ Sistema de Pagos Automáticos - TEMPORALMENTE DESACTIVADO

**Fecha de desactivación:** 2025-11-04
**Razón:** Problemas con el procesamiento de pagos automáticos

## 🔴 Funcionalidades Desactivadas

### 1. Endpoint de Registro de Pagos Pendientes
**Archivo:** `src/app/api/pagos/pending-transfer/route.ts`

- **Método:** POST
- **Ruta:** `/api/pagos/pending-transfer`
- **Estado:** Responde con 503 Service Unavailable
- **Mensaje:** "Los pagos automáticos están en mantenimiento. Por favor, contacta con soporte para alternativas de pago."

### 2. Webhook de MercadoPago
**Archivo:** `src/app/api/webhooks/mercadopago/route.ts`

- **Método:** POST
- **Ruta:** `/api/webhooks/mercadopago`
- **Estado:** Recibe requests pero NO procesa pagos
- **Comportamiento:**
  - Responde 200 OK para evitar reintentos de MP
  - Loggea las notificaciones recibidas para debugging
  - NO aprueba pagos automáticamente

### 3. Endpoint de Testing de Webhook
**Archivo:** `src/app/api/webhooks/mercadopago/test/route.ts`

- **Método:** POST
- **Ruta:** `/api/webhooks/mercadopago/test`
- **Estado:** Responde con 503 Service Unavailable
- **Nota:** Endpoint solo para desarrollo

### 4. Frontend - Opción de Transferencia Automática
**Archivo:** `src/components/PaymentModal.tsx`

- **Cambio:** Opción "Transferencia a CVU MercadoPago ⚡ Automático" ocultada
- **Líneas:** 442-492
- **Implementación:** Wrapped con `{false && (...)}`

## ✅ Funcionalidades que SÍ Funcionan

### Pagos que SIGUEN ACTIVOS:
1. **MercadoPago directo** - Checkout con tarjeta/efectivo ✅
2. **Transferencia manual** - Con comprobante manual ✅
3. **Suscripciones de academias** - MercadoPago subscription ✅

## 🔧 Para Reactivar el Sistema

Cuando se resuelvan los problemas, seguir estos pasos:

### 1. Backend - Descomentar código
```bash
# Archivo: src/app/api/pagos/pending-transfer/route.ts
# Remover el return early y descomentar el bloque /* CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE */

# Archivo: src/app/api/webhooks/mercadopago/route.ts
# Remover el return early y descomentar el bloque /* CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE */

# Archivo: src/app/api/webhooks/mercadopago/test/route.ts
# Remover el return early y descomentar el bloque /* CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE */
```

### 2. Frontend - Mostrar opción
```typescript
// Archivo: src/components/PaymentModal.tsx
// Línea 442: Cambiar {false && (
//           por      {true && (
// O directamente remover el condicional
```

### 3. Testing
- Crear pago pendiente desde PaymentModal
- Simular webhook con `/api/webhooks/mercadopago/test`
- Verificar que se apruebe correctamente
- Verificar que se cree ticket
- Verificar que se envíe email
- Verificar que se envíe notificación push

### 4. Verificar Variables de Entorno
```env
MERCADOPAGO_ACCESS_TOKEN=        # Para consultar pagos en API de MP
MERCADOPAGO_WEBHOOK_SECRET=      # Para validar firma de webhooks
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=  # Para SDK frontend
```

## 📊 Impacto en Usuarios

### Usuarios NO afectados:
- Usuarios que paguen con MercadoPago directo (tarjeta/efectivo)
- Usuarios que paguen con transferencia manual + comprobante
- Suscripciones de academias

### Usuarios afectados:
- Usuarios que intentaban usar "Transferencia a CVU MercadoPago Automático"
- La opción ya no aparece en el frontend, por lo que no deberían intentarlo

## 🐛 Problemas Identificados (Para Investigar)

1. **Campos duplicados en modelo Pago:**
   - `mercadoPagoPaymentId` (unique)
   - `mercadopagoId` (sin unique)
   - **Recomendación:** Consolidar en uno solo

2. **Estrategia de matching puede fallar:**
   - Si usuario usa email diferente en MP vs Trivo
   - Si dos usuarios transfieren mismo monto mismo día
   - **Recomendación:** Forzar uso de `externalReference`

3. **Duplicación de notificaciones:**
   - Dos endpoints crean `MiembroSalida`:
     - `/api/social/[id]/pago` (manual)
     - `/api/pagos/pending-transfer` (automático)
   - Pueden causar duplicados

## 📝 Logs para Monitorear

Cuando esté desactivado, revisar logs con:
```bash
# Buscar intentos de acceso bloqueados
grep "⚠️ Intento de acceso a endpoint desactivado" logs

# Buscar webhooks descartados
grep "⚠️ Webhook MercadoPago desactivado" logs
```

## 🔗 Referencias

- [Webhook MercadoPago - Documentación](https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks)
- [API de Pagos MercadoPago](https://www.mercadopago.com/developers/es/reference/payments/_payments_id/get)

---

**Última actualización:** 2025-11-04
**Responsable:** Claude Code Assistant
