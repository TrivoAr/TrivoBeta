# 🧪 Guía Completa: Testing de Webhooks en Local

Esta guía te explica **cómo probar webhooks de MercadoPago en tu computadora local** (localhost).

---

## ❌ El Problema

MercadoPago **NO puede enviar webhooks a `localhost`** porque:
- `localhost` solo existe en tu computadora
- MercadoPago necesita una URL pública accesible desde internet
- No puede llegar a `http://localhost:3000`

---

## ✅ Las Soluciones

Tienes **3 opciones** para probar webhooks localmente:

### **Opción 1: ngrok (RECOMENDADA)** ⭐⭐⭐⭐⭐

ngrok crea un túnel público que redirige a tu localhost.

#### Ventajas:
- ✅ Gratis
- ✅ Fácil de usar
- ✅ URL HTTPS automática
- ✅ Dashboard para ver requests en tiempo real

#### Desventajas:
- ⚠️ La URL cambia cada vez que reinicias ngrok (en plan free)
- ⚠️ Requiere actualizar el webhook en MercadoPago cada vez

---

### **Opción 2: Simulación Manual (SIN INTERNET)** ⭐⭐⭐⭐

No necesitas ngrok, simulas el webhook manualmente con curl o Postman.

#### Ventajas:
- ✅ No requiere internet
- ✅ No requiere configurar nada en MercadoPago
- ✅ Control total del payload

#### Desventajas:
- ⚠️ No prueba la firma secreta real de MercadoPago
- ⚠️ Debes crear el payload manualmente

---

### **Opción 3: Deploy en Servidor de Testing** ⭐⭐⭐

Despliegas tu app en un servidor público temporal (Railway, Vercel preview, etc.)

#### Ventajas:
- ✅ URL permanente
- ✅ Prueba el flujo real completo

#### Desventajas:
- ⚠️ Más complejo
- ⚠️ Requiere deploy cada vez que cambias código

---

## 🚀 Guía Detallada: Opción 1 - ngrok

### Paso 1: Instalar ngrok

#### Windows:
```bash
# Opción A: Con Chocolatey
choco install ngrok

# Opción B: Descargar directamente
# Ve a: https://ngrok.com/download
# Descargar el .zip, extraer ngrok.exe
```

#### Mac:
```bash
brew install ngrok/ngrok/ngrok
```

#### Linux:
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

### Paso 2: Crear cuenta en ngrok (Gratis)

1. Ve a: https://dashboard.ngrok.com/signup
2. Regístrate gratis
3. Copia tu **Authtoken**
4. Ejecuta:
   ```bash
   ngrok config add-authtoken TU_AUTHTOKEN_AQUI
   ```

### Paso 3: Ejecutar tu servidor Next.js

```bash
# En terminal 1:
cd c:\Users\matia\Documents\GitHub\Trivo\Klubo_Mvp
npm run dev
```

Deberías ver:
```
> klubo-mvp@0.1.0 dev
> next dev

  ▲ Next.js 13.x
  - Local:        http://localhost:3000
  - Ready in X.Xs
```

### Paso 4: Iniciar ngrok

```bash
# En terminal 2 (nueva ventana):
ngrok http 3000
```

Verás algo como:

```
ngrok                                                                (Ctrl+C to quit)

Build better APIs with ngrok. Early access: ngrok.com/early-access

Session Status                online
Account                       tu_email@email.com (Plan: Free)
Version                       3.0.0
Region                        United States (us)
Latency                       50ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**IMPORTANTE**: Copia la URL del **Forwarding** (ej: `https://abc123def456.ngrok-free.app`)

### Paso 5: Configurar webhook en MercadoPago

Ahora usa esa URL para configurar el webhook de **Sandbox**:

```bash
# Ejemplo con la URL de ngrok:
# https://abc123def456.ngrok-free.app/api/webhooks/mercadopago
```

Puedes hacerlo:

**A) Manualmente en el panel:**
1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu app → Webhooks
3. En **"URL de prueba"** pega: `https://TU_URL_NGROK.ngrok-free.app/api/webhooks/mercadopago`
4. Guarda

**B) O pedirle a Claude que lo configure:**
```
Claude, configura el webhook de sandbox con mi URL de ngrok: https://abc123def456.ngrok-free.app
```

### Paso 6: Verificar que funciona

```bash
# En tu navegador o curl:
curl https://abc123def456.ngrok-free.app/api/webhooks/mercadopago
```

Deberías ver:
```json
{
  "service": "MercadoPago Webhook Handler",
  "status": "active",
  "timestamp": "2025-10-23T..."
}
```

### Paso 7: Probar con simulación

Ahora puedes simular un webhook desde MercadoPago:

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Webhooks → **"Simular notificación"**
3. Selecciona tipo: `payment`
4. Ingresa un Payment ID de prueba (ej: `12345678`)
5. Click **"Enviar"**

O pídele a Claude:
```
Claude, simula un webhook de payment con ID 12345678 al sandbox
```

### Paso 8: Ver los logs en tiempo real

**Dashboard de ngrok:**
- Abre en tu navegador: http://localhost:4040
- Verás todos los requests HTTP que llegan
- Puedes ver el payload completo, headers, respuesta

**Logs de tu app:**
- En la terminal donde corre `npm run dev`
- Deberías ver:
  ```
  📥 Webhook MercadoPago recibido
  📦 Webhook body: {...}
  🔍 Procesando pago MP ID: 12345678
  ...
  ```

---

## 🔧 Guía Detallada: Opción 2 - Simulación Manual (Sin Internet)

Esta opción **NO requiere ngrok ni internet**. Simulas el webhook localmente.

### Paso 1: Ejecutar tu servidor

```bash
npm run dev
# Corre en http://localhost:3000
```

### Paso 2: Crear un archivo de test

Crea `test-webhook.sh` (o `.bat` en Windows):

```bash
#!/bin/bash

# URL de tu webhook local
URL="http://localhost:3000/api/webhooks/mercadopago"

# Payload simulado de MercadoPago
PAYLOAD='{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "12345678"
  },
  "date_created": "2025-10-23T10:00:00Z",
  "id": 123456,
  "live_mode": false,
  "type": "payment",
  "user_id": 123456789
}'

# Headers simulados (firma NO será válida)
curl -X POST $URL \
  -H "Content-Type: application/json" \
  -H "x-request-id: test-request-123" \
  -H "x-signature: ts=1234567890,v1=fakehash123" \
  -d "$PAYLOAD"
```

### Paso 3: Modificar temporalmente la validación de firma

**IMPORTANTE**: Solo para testing local, desactiva temporalmente la validación:

Edita `src/app/api/webhooks/mercadopago/route.ts`:

```typescript
// TEMPORAL: Comentar validación para testing local
function validarFirmaMP(signature: string | null, requestId: string | null): boolean {
  // return false; // ❌ Original

  // ✅ SOLO PARA TESTING LOCAL - BORRAR DESPUÉS
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ TESTING MODE: Saltando validación de firma");
    return true; // Permitir todo en desarrollo
  }

  // ... resto del código original
}
```

### Paso 4: Ejecutar el test

```bash
# Linux/Mac:
bash test-webhook.sh

# Windows (PowerShell):
Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/mercadopago" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"type":"payment","data":{"id":"12345678"}}'
```

### Paso 5: Ver los logs

En tu terminal deberías ver:

```
⚠️ TESTING MODE: Saltando validación de firma
📥 Webhook MercadoPago recibido
📦 Webhook body: {"type":"payment","data":{"id":"12345678"}}
🔍 Procesando pago MP ID: 12345678
❌ Error consultando pago en MP: ... (normal, es un ID falso)
```

### Paso 6: IMPORTANTE - Revertir cambios

**Antes de hacer commit o deploy**:

1. **Borra** la línea que saltea validación
2. **Restaura** la validación original
3. **Verifica** que no quede código de testing

---

## 🎯 Guía Detallada: Opción 3 - Deploy Temporal

### Vercel (GRATIS y FÁCIL)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# Te dará una URL como: https://klubo-mvp-abc123.vercel.app
```

Ahora configura el webhook con esa URL:
```
https://klubo-mvp-abc123.vercel.app/api/webhooks/mercadopago
```

### Railway (GRATIS)

1. Ve a: https://railway.app
2. Conecta tu repo de GitHub
3. Deploy automático
4. Te da una URL como: `https://klubo-mvp-production.up.railway.app`

---

## 📋 Comparación de Opciones

| Aspecto | ngrok | Simulación Manual | Deploy Temporal |
|---------|-------|-------------------|-----------------|
| **Dificultad** | Fácil | Muy Fácil | Media |
| **Tiempo setup** | 5 min | 2 min | 10 min |
| **Internet requerido** | Sí | No | Sí |
| **Prueba firma real** | ✅ Sí | ❌ No | ✅ Sí |
| **URL permanente** | ❌ No (free) | N/A | ✅ Sí |
| **Costo** | Gratis | Gratis | Gratis |
| **Mejor para** | Testing completo | Testing rápido | Testing final |

---

## 🔍 Cómo Debuggear

### Ver logs detallados

En tu código de webhook, los logs importantes son:

```typescript
// Busca estos mensajes en tu terminal:
console.log("📥 Webhook MercadoPago recibido");        // ✅ Llegó
console.log("📦 Webhook body:", body);                 // Ver payload
console.log("🔍 Procesando pago MP ID:", paymentId);   // ID recibido
console.log("✅ Pago encontrado en BD:", pago._id);    // Encontrado
console.log("✅ Pago APROBADO - Procesando...");       // Aprobación OK
console.error("❌ Firma inválida");                    // Error firma
```

### Usar el dashboard de ngrok

Si usas ngrok, abre: http://localhost:4040

Verás:
- Todos los HTTP requests
- Headers completos
- Payload JSON
- Response de tu servidor
- Tiempo de respuesta

### Herramientas útiles

**Postman**: Para simular webhooks manualmente
**RequestBin**: Para ver qué envía MercadoPago
**ngrok inspector**: Dashboard en localhost:4040

---

## ⚠️ Checklist Antes de Producción

Antes de usar webhooks en producción, verifica:

- [ ] Quitar/comentar código de bypass de validación
- [ ] Configurar URL de producción real (no ngrok)
- [ ] Configurar `MERCADOPAGO_WEBHOOK_SECRET` real
- [ ] Probar con credenciales de PRODUCCIÓN
- [ ] Verificar que HTTPS funciona
- [ ] Monitorear logs en servidor de producción

---

## 🆘 Problemas Comunes

### "Firma inválida"
- Verifica que `MERCADOPAGO_WEBHOOK_SECRET` sea correcto
- Asegúrate de copiar el secret COMPLETO (no asteriscos)
- En testing local, puedes desactivar temporalmente (ver Opción 2)

### "Endpoint offline" en ngrok
- Asegúrate que `npm run dev` esté corriendo
- Verifica que ngrok apunte al puerto correcto (3000)
- Prueba acceder a la URL de ngrok en tu navegador

### "No se procesa el pago"
- Verifica que el `paymentId` exista en tu BD
- Asegúrate de tener el pago creado antes de recibir webhook
- Revisa los logs para ver dónde falla

### ngrok dice "Connection refused"
- Tu servidor Next.js no está corriendo
- Ejecuta `npm run dev` primero
- Verifica que escuche en puerto 3000

---

## 📚 Recursos

- [ngrok Docs](https://ngrok.com/docs)
- [MercadoPago Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [Postman](https://www.postman.com/)
- [RequestBin](https://requestbin.com/)

---

**¡Listo para probar! 🚀**

Mi recomendación: **Empieza con ngrok** (Opción 1), es la más completa y fácil.
