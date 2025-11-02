# Configuración del Webhook de MercadoPago para Club del Trekking

Este documento explica cómo configurar el webhook de MercadoPago para recibir notificaciones de pagos de la membresía del Club del Trekking.

## 📋 Índice

1. [Información General](#información-general)
2. [URL del Webhook](#url-del-webhook)
3. [Pasos de Configuración](#pasos-de-configuración)
4. [Eventos a Escuchar](#eventos-a-escuchar)
5. [Verificación](#verificación)
6. [Troubleshooting](#troubleshooting)

---

## Información General

El webhook es necesario para recibir notificaciones en tiempo real cuando:
- Se aprueba un pago de suscripción
- Se rechaza un pago
- El usuario cancela la suscripción
- Se produce una renovación automática mensual

**Endpoint implementado:** `/api/webhooks/mercadopago/club-trekking/route.ts`

---

## URL del Webhook

### Producción
```
https://tu-dominio.com/api/webhooks/mercadopago/club-trekking
```

### Testing (ngrok recomendado)
Para probar en desarrollo local:

1. Instala ngrok: `npm install -g ngrok`
2. Ejecuta tu servidor local: `npm run dev`
3. En otra terminal: `ngrok http 3000`
4. Usa la URL generada: `https://xxxxx.ngrok.io/api/webhooks/mercadopago/club-trekking`

---

## Pasos de Configuración

### 1. Acceder al Dashboard de MercadoPago

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel)
2. Inicia sesión con tu cuenta
3. Selecciona tu aplicación o crea una nueva

### 2. Configurar Webhooks

1. En el menú lateral, ve a **"Integraciones"** > **"Webhooks"**
2. O accede directamente a: `https://www.mercadopago.com.ar/developers/panel/app/{APP_ID}/webhooks`

### 3. Crear Nuevo Webhook

#### Opción A: Configuración Manual

1. Click en **"Crear webhook"** o **"+ Nuevo webhook"**
2. Completa los campos:

   **URL de producción:**
   ```
   https://tu-dominio.com/api/webhooks/mercadopago/club-trekking
   ```

   **Eventos a recibir:**
   - ✅ `subscription_preapproval` (Suscripciones)
   - ✅ `subscription_preapproval_plan` (Planes de suscripción)
   - ✅ `subscription_authorized_payment` (Pagos autorizados)

3. Click en **"Guardar"**

#### Opción B: Usando la API de MercadoPago

```bash
curl -X POST \
  'https://api.mercadopago.com/v1/webhooks' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://tu-dominio.com/api/webhooks/mercadopago/club-trekking",
    "events": [
      {
        "topic": "subscription_preapproval"
      },
      {
        "topic": "subscription_authorized_payment"
      }
    ]
  }'
```

### 4. Verificar Webhook

MercadoPago enviará una petición de verificación al webhook. El endpoint responderá automáticamente con status 200.

---

## Eventos a Escuchar

### `subscription_preapproval`
Se dispara cuando:
- Se crea una nueva suscripción
- Se actualiza el estado de la suscripción
- El usuario cancela la suscripción

**Payload de ejemplo:**
```json
{
  "action": "created",
  "api_version": "v1",
  "data": {
    "id": "2c93808471jada481017"
  },
  "date_created": "2021-11-01T02:00:00Z",
  "id": 12345678,
  "live_mode": true,
  "type": "subscription_preapproval",
  "user_id": "123456789"
}
```

### `subscription_authorized_payment`
Se dispara cuando:
- Se procesa un pago mensual
- Se aprueba o rechaza el pago

**Payload de ejemplo:**
```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "1234567890"
  },
  "date_created": "2021-11-01T02:00:00Z",
  "id": 12345678,
  "live_mode": true,
  "type": "subscription_authorized_payment",
  "user_id": "123456789"
}
```

---

## Verificación

### 1. Verificar que el Webhook está Activo

En el dashboard de MercadoPago:
1. Ve a **Webhooks**
2. Verifica que el estado sea **"Activo"** (color verde)
3. Revisa la fecha de la última notificación recibida

### 2. Probar el Webhook Manualmente

#### Opción 1: Desde el Dashboard
1. En la configuración del webhook, click en **"Enviar prueba"**
2. MercadoPago enviará una notificación de prueba
3. Revisa los logs de tu servidor

#### Opción 2: Con una Suscripción de Prueba
1. Crea una suscripción usando las [credenciales de prueba](https://www.mercadopago.com.ar/developers/panel/credentials)
2. Usa las [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/integration-test/test-cards)
3. Completa el flujo de pago
4. Verifica que llegue la notificación

### 3. Verificar Logs

En tu servidor, verifica los logs:
```bash
# Si usas Vercel
vercel logs

# Si usas logs locales
tail -f logs/webhook-mp.log
```

El endpoint logea:
- ✅ Notificaciones recibidas: `📩 Webhook MP Club Trekking - Tipo: {tipo}`
- ✅ Procesamiento exitoso: `✅ Membresía actualizada: {membershipId}`
- ❌ Errores: `❌ Error en webhook MP Club Trekking: {error}`

---

## Troubleshooting

### Problema: El webhook no recibe notificaciones

**Soluciones:**

1. **Verificar URL accesible**
   ```bash
   curl https://tu-dominio.com/api/webhooks/mercadopago/club-trekking
   # Debe responder con status 200 o 405 (método no permitido para GET)
   ```

2. **Verificar SSL/HTTPS**
   - MercadoPago solo envía a URLs HTTPS
   - Verifica que tu certificado SSL sea válido

3. **Verificar Firewall/CORS**
   - Asegúrate de que las IPs de MercadoPago no estén bloqueadas
   - El endpoint debe aceptar POSTs desde cualquier origen

4. **Revisar logs del servidor**
   - Verifica si hay errores en la ejecución del webhook

### Problema: El webhook recibe notificaciones pero no actualiza la membresía

**Soluciones:**

1. **Verificar que el `preapprovalId` está guardado en la membresía**
   ```javascript
   // En MongoDB
   db.clubtrekkingmemberships.findOne({ preapprovalId: "PREAPPROVAL_ID" })
   ```

2. **Verificar que el endpoint obtiene los datos correctamente**
   - Revisa los logs para ver qué datos está recibiendo
   - Verifica que el `data.id` corresponda al `preapprovalId` en la DB

3. **Verificar conexión a MongoDB**
   - El webhook debe conectarse correctamente a la base de datos
   - Revisa los logs de conexión

### Problema: Notificaciones duplicadas

**Solución implementada:**
El código ya maneja duplicados verificando el estado actual antes de actualizar:

```typescript
if (preapproval.status === estado) {
  return new Response("Estado sin cambios", { status: 200 });
}
```

### Problema: Timeout del webhook

MercadoPago espera respuesta en **menos de 10 segundos**.

**Solución:**
1. El endpoint responde inmediatamente con status 200
2. El procesamiento se hace de forma asíncrona
3. Si necesitas operaciones largas, usa una cola (ej: Bull, BullMQ)

---

## URLs Importantes

- **Dashboard de Webhooks:** `https://www.mercadopago.com.ar/developers/panel/webhooks`
- **Credenciales de Prueba:** `https://www.mercadopago.com.ar/developers/panel/credentials`
- **Documentación Oficial:** `https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/notifications`
- **Tarjetas de Prueba:** `https://www.mercadopago.com.ar/developers/es/docs/checkout-api/integration-test/test-cards`

---

## Checklist de Configuración

- [ ] Webhook creado en el dashboard de MercadoPago
- [ ] URL del webhook es HTTPS
- [ ] URL del webhook es accesible públicamente
- [ ] Eventos configurados: `subscription_preapproval` y `subscription_authorized_payment`
- [ ] Webhook probado con notificación de prueba
- [ ] Webhook verificado con suscripción de prueba
- [ ] Logs del servidor verificados
- [ ] Membresías se actualizan correctamente
- [ ] Webhook configurado en **producción** (no solo en sandbox)

---

## Código de Referencia

El webhook está implementado en:
```
src/app/api/webhooks/mercadopago/club-trekking/route.ts
```

Modelo de membresía:
```
src/models/ClubTrekkingMembership.ts
```

Configuración:
```
src/config/clubTrekking.config.ts
```

---

## Notas Adicionales

1. **Seguridad:** Considera agregar verificación de firma HMAC para validar que las notificaciones vienen de MercadoPago
2. **Logs:** Implementa un sistema de logs robusto para debugging
3. **Monitoreo:** Configura alertas si el webhook falla repetidamente
4. **Retry:** MercadoPago reintenta hasta 3 veces si el webhook falla

---

## Contacto

Si tienes problemas con la configuración del webhook:
1. Revisa la [documentación oficial de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/notifications)
2. Contacta al soporte de MercadoPago Developers
3. Revisa los logs del servidor para identificar el error específico
