# 🧪 Testing del Webhook de Transferencia Automática

Esta guía explica cómo probar el flujo de aprobación automática de pagos por transferencia a CVU de MercadoPago **sin necesidad de hacer transferencias reales**.

## ⚠️ Problema con emails diferentes

Si probaste el flujo y no funcionó, probablemente fue porque:

1. **Email de Trivo:** `juan@gmail.com`
2. **Email de MercadoPago:** `juan.trabajo@empresa.com`
3. **Resultado:** ❌ El webhook no encuentra match por email

**Solución:** Usar el endpoint de testing para simular el webhook sin necesidad de transferir.

---

## 🎯 Endpoint de Testing

### URL
```
POST http://localhost:3000/api/webhooks/mercadopago/test
```

### Características
- ✅ Solo funciona en **desarrollo** (NODE_ENV !== "production")
- ✅ Simula webhook de MercadoPago sin transferencia real
- ✅ Usa el mismo algoritmo de matching que el webhook real
- ✅ Procesa aprobación completa: ticket, email, notificación push

---

## 📋 Cómo Probar el Flujo Completo

### Paso 1: Crear un pago pendiente

1. Abre la app en `http://localhost:3000`
2. Ingresa con tu usuario (ej: `matias@trivo.com`)
3. Ve a una salida con precio
4. Selecciona "Transferencia a CVU MercadoPago ⚡ Automático"
5. Haz clic en **"Entendido, voy a transferir"**

Esto crea:
- Un registro de `Pago` con estado "pendiente"
- Un `MiembroSalida` con estado "pendiente"
- ✅ Notificación al creador de la salida

### Paso 2: Simular el webhook de MercadoPago

En lugar de transferir dinero real, haz una llamada POST al endpoint de testing:

#### Usando curl:
```bash
curl -X POST http://localhost:3000/api/webhooks/mercadopago/test \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "matias@trivo.com",
    "amount": 5000,
    "salidaId": "64abc123def456..."
  }'
```

#### Usando Postman o Thunder Client:
```json
POST http://localhost:3000/api/webhooks/mercadopago/test

{
  "userEmail": "matias@trivo.com",
  "amount": 5000,
  "salidaId": "64abc123def456..."
}
```

#### Parámetros:
- **userEmail** (required): Email del usuario registrado en Trivo
- **amount** (required): Monto del pago pendiente (debe coincidir exactamente)
- **salidaId** (optional): ID de la salida social
- **academiaId** (optional): ID de la academia

### Paso 3: Verificar el resultado

Si todo funciona correctamente, recibirás:

```json
{
  "success": true,
  "message": "Webhook simulado procesado correctamente",
  "pago": {
    "id": "67abc123...",
    "userId": "64def456...",
    "userEmail": "matias@trivo.com",
    "amount": 5000,
    "estado": "aprobado",
    "salidaId": "64abc123..."
  }
}
```

Y automáticamente:
- ✅ Pago actualizado a estado "aprobado"
- ✅ MiembroSalida actualizado a estado "aprobado"
- ✅ Ticket creado con código QR
- ✅ Email enviado con ticket
- ✅ Notificación push al usuario

---

## 🔍 Algoritmo de Matching (Testing)

El endpoint de testing usa **exactamente el mismo algoritmo** que el webhook real:

### Estrategia de búsqueda:
1. **Buscar usuario por email** en BD
2. **Buscar pago pendiente** que coincida:
   - ✅ `userId` = usuario encontrado
   - ✅ `amount` = monto enviado (exacto)
   - ✅ `estado` = "pendiente"
   - ✅ `tipoPago` = "mercadopago_automatico"
   - ✅ `salidaId` = si se proporcionó
   - ✅ Ordenado por más reciente primero

3. **Procesar aprobación** igual que webhook real

---

## ❌ Errores Comunes

### Error 1: Usuario no encontrado
```json
{
  "error": "No se encontró usuario con email matias@trivo.com",
  "hint": "Verifica que el email esté registrado en Trivo"
}
```

**Solución:** Verifica que el email esté escrito correctamente y que el usuario exista en la BD.

### Error 2: Pago no encontrado
```json
{
  "error": "No se encontró pago pendiente que coincida",
  "details": {
    "userEmail": "matias@trivo.com",
    "userId": "64abc...",
    "amount": 5000,
    "salidaId": "64def..."
  },
  "hint": "Asegúrate de crear primero el pago pendiente desde el PaymentModal"
}
```

**Posibles causas:**
- No creaste el pago pendiente primero (Paso 1)
- El monto no coincide exactamente (ej: enviaste 5000 pero el pago es por 5500)
- El pago ya fue aprobado anteriormente
- El salidaId no coincide

**Solución:**
1. Verifica que hiciste clic en "Entendido, voy a transferir" primero
2. Verifica que el monto sea exactamente igual (sin decimales)
3. Si probaste antes, crea un nuevo pago pendiente

### Error 3: Endpoint solo en desarrollo
```json
{
  "error": "Este endpoint solo está disponible en desarrollo"
}
```

**Solución:** Este endpoint NO funciona en producción por seguridad. Solo úsalo en local.

---

## 🌐 Probar con Email Diferente

El endpoint de testing te permite probar qué pasa cuando el email del pagador es diferente:

### Escenario:
- Usuario registrado en Trivo: `juan@gmail.com`
- "Transfiere" desde MercadoPago: `juan.trabajo@empresa.com`

### Prueba:
```bash
curl -X POST http://localhost:3000/api/webhooks/mercadopago/test \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "juan.trabajo@empresa.com",
    "amount": 5000
  }'
```

**Resultado esperado:**
```json
{
  "error": "No se encontró usuario con email juan.trabajo@empresa.com"
}
```

Esto demuestra que **el matching por email requiere que los emails coincidan**.

---

## 🔄 Flujo Real vs Testing

### Flujo Real (con transferencia):
1. Usuario hace clic "Entendido, voy a transferir"
2. Usuario transfiere desde MercadoPago (email: `juan@gmail.com`)
3. MercadoPago recibe transferencia
4. **MercadoPago envía webhook** a `https://tuapp.com/api/webhooks/mercadopago`
5. Webhook busca usuario por `paymentDetails.payer.email` = `juan@gmail.com`
6. Aprobación automática

### Flujo Testing (sin transferencia):
1. Usuario hace clic "Entendido, voy a transferir"
2. ~~Usuario transfiere~~ → **Salteamos este paso**
3. ~~MercadoPago recibe~~ → **Salteamos**
4. **TÚ llamas manualmente** a `/api/webhooks/mercadopago/test`
5. Test busca usuario por `userEmail` que TÚ envías
6. Aprobación automática (igual que real)

---

## 🚀 Verificar en la UI

Después de llamar al endpoint de testing, verifica en la app:

### Como usuario que pagó:
1. Ve a "Mis Salidas" → deberías ver la salida
2. Tu estado debería ser "Aprobado" ✅
3. Deberías tener un ticket con QR
4. Deberías haber recibido un email con el ticket

### Como creador de la salida:
1. Ve a "Gestionar Miembros" de la salida
2. Deberías ver al usuario que "pagó"
3. Su estado debería ser "Aprobado" ✅
4. Deberías haber recibido 2 notificaciones:
   - "Juan se unió a tu salida" (cuando hizo clic en "voy a transferir")
   - "Pago aprobado" (cuando el webhook se procesó)

---

## 🎓 Resumen

**Para testing local (sin transferir dinero):**
1. Crea pago pendiente desde la UI
2. Llama a `/api/webhooks/mercadopago/test` con el email del usuario
3. Verifica que todo se aprobó correctamente

**Para producción (con transferencias reales):**
1. Configura CVU y Alias reales en Vercel
2. Configura webhook en MercadoPago
3. Usuario transfiere con email que coincida con su registro en Trivo
4. MercadoPago envía webhook automáticamente
5. Aprobación automática en 5-30 segundos

---

## 📞 Debugging

Si algo no funciona, revisa los logs de consola:

```bash
npm run dev
```

Busca mensajes como:
- `🧪 TEST: Buscando pago pendiente para usuario...`
- `✅ TEST: Pago encontrado: ...`
- `💾 Pago actualizado a estado: aprobado`
- `✅ MiembroSalida aprobado`
- `🎫 Ticket creado: ...`
- `📧 Email enviado a ...`
- `🔔 Notificación push enviada`
