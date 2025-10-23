# 🔔 Configuración de Webhooks de MercadoPago

Este documento explica cómo configurar la automatización de pagos mediante transferencias a CVU de MercadoPago con webhooks.

## 📋 Índice

1. [¿Qué hace esto?](#qué-hace-esto)
2. [Requisitos previos](#requisitos-previos)
3. [Configuración paso a paso](#configuración-paso-a-paso)
4. [Pruebas](#pruebas)
5. [Troubleshooting](#troubleshooting)

---

## ¿Qué hace esto?

Este sistema automatiza completamente el proceso de aprobación de pagos cuando los usuarios transfieren dinero al **CVU de MercadoPago de Trivo**.

### Flujo anterior (Manual):
```
Usuario → Transfiere al banco → Sube comprobante → Espera aprobación manual → Organizador aprueba → Usuario recibe acceso
⏱️ Tiempo: Horas o días
```

### Flujo nuevo (Automático):
```
Usuario → Transfiere al CVU MP → MercadoPago detecta → Webhook notifica → Sistema aprueba automáticamente → Usuario recibe acceso
⏱️ Tiempo: 5-30 segundos
```

---

## Requisitos previos

✅ Tener una cuenta de MercadoPago activa
✅ Tener una aplicación creada en [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel/app)
✅ Conocer tu CVU y Alias de MercadoPago
✅ Acceso al servidor para configurar variables de entorno

---

## Configuración paso a paso

### 1️⃣ Obtener el Secret Key del Webhook

1. Ve a [MercadoPago Developers Panel](https://www.mercadopago.com.ar/developers/panel/app)
2. Selecciona tu aplicación
3. En el menú lateral, ve a **Webhooks**
4. Verás tu **Secret Key** (se ve algo como: `25802da...`)
5. **Copia el secret completo** (no solo los primeros caracteres)

### 2️⃣ Obtener tu CVU y Alias de MercadoPago

1. Abre la app de MercadoPago en tu celular
2. Ve a **Tu dinero** o **Cuenta**
3. Toca en **CVU**
4. Copia:
   - **CVU**: número de 22 dígitos (ej: `0000003100012345678900`)
   - **Alias**: tu alias personalizado (ej: `trivo.mp`)

### 3️⃣ Configurar variables de entorno

Edita el archivo `.env.local` y completa:

```env
# MERCADOPAGO WEBHOOK
MERCADOPAGO_WEBHOOK_SECRET=tu_secret_key_completo_aqui

# CVU/ALIAS de tu cuenta MercadoPago
NEXT_PUBLIC_MP_CVU=0000003100012345678900  # ← Tu CVU real
NEXT_PUBLIC_MP_ALIAS=trivo.mp               # ← Tu alias real
```

### 4️⃣ Configurar URL del webhook en MercadoPago

El webhook ya está configurado para:
- **URL Production**: `https://tudominio.com/api/webhooks/mercadopago`
- **URL Sandbox**: `https://tudominio.com/api/webhooks/mercadopago`
- **Evento suscrito**: `payment` ✅

Si necesitas cambiar la URL:

```bash
# Opción 1: Usar el MCP de MercadoPago (desde Claude)
# Ya está configurado automáticamente

# Opción 2: Manualmente desde el panel
# 1. Ve a https://www.mercadopago.com.ar/developers/panel/app
# 2. Selecciona tu app → Webhooks → Configurar notificaciones
# 3. Ingresa la URL de tu servidor
# 4. Selecciona el evento "Pagos"
```

### 5️⃣ Desplegar a producción

```bash
# 1. Asegúrate de que las variables de entorno estén configuradas en tu servidor
npm run build

# 2. Reinicia tu aplicación
npm run start
```

### 6️⃣ Verificar que el endpoint esté activo

```bash
# Abre en el navegador o curl:
curl https://tudominio.com/api/webhooks/mercadopago

# Respuesta esperada:
{
  "service": "MercadoPago Webhook Handler",
  "status": "active",
  "timestamp": "2025-10-23T..."
}
```

---

## Pruebas

### Prueba 1: Verificar endpoint

```bash
curl https://tudominio.com/api/webhooks/mercadopago
```

Debe responder con status `active`.

### Prueba 2: Simular webhook desde MercadoPago

Puedes usar el MCP de MercadoPago para simular un webhook:

```
# En Claude Code:
Simula un webhook de MercadoPago con payment ID 123456789
```

O manualmente desde el panel de MercadoPago:
1. Ve a **Webhooks** → **Simulador de notificaciones**
2. Selecciona tipo `payment`
3. Ingresa un ID de pago de prueba
4. Envía

### Prueba 3: Transferencia real (Sandbox)

1. Usa tus credenciales de TEST en `.env.local`
2. Crea un pago de prueba en MercadoPago Sandbox
3. Simula una transferencia
4. Verifica que el pago se apruebe automáticamente

### Prueba 4: Transferencia real (Producción)

1. Configura las credenciales de PRODUCCIÓN
2. Pide a un usuario de prueba que transfiera un monto pequeño a tu CVU
3. Monitorea los logs del servidor:

```bash
# Ver logs en tiempo real
tail -f /var/log/app.log

# O en Vercel/Railway/etc:
# Ve al dashboard → Logs
```

4. Deberías ver:
   - `📥 Webhook MercadoPago recibido`
   - `✅ Pago encontrado en BD: ...`
   - `✅ Pago APROBADO - Procesando...`
   - `✅ MiembroSalida aprobado`
   - `🎫 Ticket creado: ...`
   - `📧 Email enviado a ...`
   - `🔔 Notificación push enviada`

---

## Troubleshooting

### ❌ Error: "Invalid signature"

**Causa**: El secret del webhook no coincide.

**Solución**:
1. Ve a https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu app → Webhooks
3. Copia el secret completo (no solo los primeros caracteres)
4. Pégalo en `.env.local` → `MERCADOPAGO_WEBHOOK_SECRET`
5. Reinicia el servidor

### ❌ Error: "CVU_NO_CONFIGURADO" en el modal

**Causa**: Las variables de entorno no están configuradas.

**Solución**:
1. Edita `.env.local`
2. Completa `NEXT_PUBLIC_MP_CVU` y `NEXT_PUBLIC_MP_ALIAS`
3. Reinicia el servidor: `npm run dev`

### ❌ El webhook no recibe notificaciones

**Posibles causas**:

1. **URL incorrecta**: Verifica que la URL esté configurada en MercadoPago
2. **Servidor no accesible**: El webhook debe ser público (no localhost)
3. **Firewall bloqueando**: Asegúrate de que el puerto esté abierto
4. **Evento no suscrito**: Verifica que estés suscrito al evento `payment`

**Verificación**:
```bash
# Test 1: Endpoint accesible desde internet
curl https://tudominio.com/api/webhooks/mercadopago

# Test 2: Ver configuración del webhook
# Ve a: https://www.mercadopago.com.ar/developers/panel/app
# → Webhooks → Ver URLs configuradas

# Test 3: Logs del servidor
# Verifica que no haya errores de CORS, permisos, etc.
```

### ❌ Pago no se aprueba automáticamente

**Verifica**:

1. **Logs del servidor**: ¿Llegó el webhook?
   ```bash
   grep "Webhook MercadoPago recibido" /var/log/app.log
   ```

2. **Estado del pago en MercadoPago**:
   - Ve a https://www.mercadopago.com.ar/activities
   - Busca la transacción
   - Verifica que el estado sea `approved`

3. **BD correcta**: ¿El pago existe en tu base de datos?
   ```javascript
   // En MongoDB:
   db.pagos.findOne({ mercadopagoId: "PAYMENT_ID" })
   ```

4. **External reference**: Verifica que el pago tenga una referencia que coincida
   ```javascript
   // El pago debe tener:
   { externalReference: "pago_XXXXX" }
   ```

### ❌ Usuario no recibe notificación

**Verifica**:

1. **Email enviado**: Busca en logs: `📧 Email enviado a ...`
2. **Notificación push**: Busca: `🔔 Notificación push enviada`
3. **Ticket creado**: Busca: `🎫 Ticket creado: ...`

Si los logs muestran errores, verifica:
- Configuración de Firebase (push notifications)
- Configuración de email (sendTicketEmail)
- Permisos de usuario para recibir notificaciones

---

## Monitoreo

### Logs importantes a monitorear

```bash
# Webhooks recibidos
grep "Webhook MercadoPago recibido" app.log

# Pagos aprobados
grep "Pago APROBADO" app.log

# Errores de firma
grep "Firma inválida" app.log

# Pagos no encontrados
grep "Pago .* no encontrado" app.log
```

### Dashboard de MercadoPago

1. Ve a https://www.mercadopago.com.ar/activities
2. Filtra por fecha
3. Verifica transacciones recientes
4. Compara con los registros de tu BD

---

## Seguridad

### ✅ Implementado

- ✅ Validación de firma secreta HMAC-SHA256
- ✅ Verificación de request-id único
- ✅ Consulta directa a API de MercadoPago (no confiar solo en webhook)
- ✅ Logs detallados para auditoría
- ✅ Variables de entorno seguras

### 🔒 Recomendaciones

- 🔐 Nunca expongas el `MERCADOPAGO_WEBHOOK_SECRET` públicamente
- 🔐 Usa HTTPS siempre (no HTTP)
- 🔐 Monitorea logs de webhooks inválidos
- 🔐 Implementa rate limiting si es necesario

---

## Contacto y soporte

Si tienes problemas:

1. Revisa esta guía de troubleshooting
2. Verifica los logs del servidor
3. Consulta la [documentación oficial de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
4. Abre un issue en el repositorio

---

**¡Listo! 🎉** Ahora las transferencias a tu CVU de MercadoPago se aprueban automáticamente.
