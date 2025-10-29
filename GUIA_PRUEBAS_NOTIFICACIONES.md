# Guía de Pruebas - Sistema de Notificaciones PWA

## 🔧 PASO 1: Configurar Credenciales de Firebase Admin

### Obtener Service Account Key

1. **Ve a Firebase Console:**
   - URL: https://console.firebase.google.com/
   - Selecciona tu proyecto (Trivo)

2. **Navega a Service Accounts:**
   - Click en el ⚙️ (engranaje) arriba a la izquierda
   - Selecciona **"Project Settings"**
   - Ve a la pestaña **"Service Accounts"**

3. **Genera una nueva clave:**
   - Click en el botón **"Generate new private key"**
   - Confirma en el diálogo
   - Se descargará un archivo JSON (ej: `trivo-firebase-adminsdk-xxxxx.json`)

4. **Agrega las credenciales al .env.local:**

Abre tu archivo `.env.local` y agrega:

```env
# Firebase Admin SDK (REQUERIDO para enviar notificaciones)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto",...}
```

**IMPORTANTE:** Copia TODO el contenido del JSON descargado en una sola línea.

**Ejemplo de formato correcto:**
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"trivo-abc123","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@trivo-abc123.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40trivo-abc123.iam.gserviceaccount.com"}
```

### Alternativa: Credenciales Individuales

Si preferís usar credenciales separadas:

```env
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

---

## 🚀 PASO 2: Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Verifica que inicie sin errores. El servidor debería estar en:
- http://localhost:3000

---

## 🧪 PASO 3: Verificar Service Workers

### 3.1. Abrir Chrome DevTools

1. Abre tu app en Chrome: http://localhost:3000
2. Abre DevTools (F12)
3. Ve a la pestaña **"Application"**
4. En el menú izquierdo, selecciona **"Service Workers"**

### 3.2. Verificar Registro de SWs

Deberías ver **2 Service Workers registrados:**

1. **`/sw.js`** → Service Worker de Cache
   - Scope: `/`
   - Status: `activated and running`

2. **`/api/firebase-sw`** → Service Worker de Firebase FCM
   - Scope: `/`
   - Status: `activated and running`

### 3.3. Verificar Logs en Consola

En la consola de DevTools deberías ver:

```
[SW] Cache SW registrado correctamente
[Cache SW] Service Worker de Cache iniciando
[Cache SW] Installing...
[Cache SW] Precaching App Shell
[Cache SW] Activating...
[Cache SW] Service Worker de Cache configurado
```

Y cuando actives las notificaciones:

```
[Firebase] SW registrado correctamente: /
[FCM SW] Inicializando Firebase Messaging Service Worker
[FCM SW] Firebase inicializado correctamente
[FCM SW] Firebase Messaging Service Worker configurado completamente
```

---

## 🔔 PASO 4: Activar Notificaciones Push

### 4.1. Iniciar Sesión

1. Inicia sesión en la aplicación
2. Ve a tu perfil o página de configuración

### 4.2. Activar Notificaciones (PushManager)

Busca el componente PushManager (debería estar en tu perfil o una página de settings):

1. Click en **"🔔 Activar notificaciones"**
2. El navegador pedirá permisos → Click en **"Permitir"**
3. Deberías ver: **"✅ Notificaciones activadas"**
4. Ahora aparecerá el botón **"🧪 Enviar prueba"**

### 4.3. Verificar Token FCM Guardado

En la consola deberías ver:

```
[Firebase] Token FCM obtenido: eJy8x...
```

---

## 🧪 PASO 5: Probar Notificaciones

### 5.1. Enviar Notificación de Prueba (Método 1: Botón)

1. Click en **"🧪 Enviar prueba"**
2. Deberías ver un toast: **"🧪 Notificación de prueba enviada"**
3. Si la app está abierta (foreground):
   - Aparecerá un toast de Sonner con el mensaje
4. Si la app está en background o cerrada:
   - Aparecerá notificación nativa del sistema

### 5.2. Enviar Notificación de Prueba (Método 2: API directa)

Usa Postman, Thunder Client o curl:

```bash
# Endpoint: POST /api/test-notification
curl -X POST http://localhost:3000/api/test-notification \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=TU_SESSION_TOKEN"
```

**Para obtener tu session token:**
1. Abre DevTools → Application → Cookies
2. Copia el valor de `next-auth.session-token`

### 5.3. Generar Notificación Real (Método 3: Acción en la app)

Simula una acción que genere notificación:

**Opción A: Usuario se une a un evento**
1. Crea un evento público
2. Con otro usuario (o en otra sesión), únete al evento
3. El creador del evento debería recibir notificación

**Opción B: Aprobar/Rechazar pago**
1. Un usuario envía comprobante de pago
2. El organizador lo aprueba
3. El usuario que pagó recibe notificación

---

## 🔍 PASO 6: Verificar en la Base de Datos

### 6.1. Verificar FCMTokens

Abre MongoDB Compass o tu cliente de MongoDB:

```javascript
// Buscar tokens FCM del usuario
db.fcmtokens.find({ userId: ObjectId("TU_USER_ID") })
```

Deberías ver:
```json
{
  "_id": "...",
  "userId": "...",
  "token": "eJy8x...", // Token FCM
  "isActive": true,
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32"
  },
  "lastUsed": "2025-10-28T...",
  "createdAt": "2025-10-28T...",
  "updatedAt": "2025-10-28T..."
}
```

### 6.2. Verificar Notificaciones

```javascript
// Buscar notificaciones del usuario
db.notificacions.find({ userId: ObjectId("TU_USER_ID") })
```

Deberías ver:
```json
{
  "_id": "...",
  "userId": "...",
  "fromUserId": "...",
  "type": "joined_event",
  "message": "Usuario se unió a tu salida...",
  "salidaId": "...",
  "actionUrl": "/social/...",
  "read": false,
  "createdAt": "2025-10-28T..."
}
```

---

## 🧪 PASO 7: Probar Notificaciones en Background

### 7.1. Cerrar la Pestaña/App

1. Cierra la pestaña de tu app (o minimiza el navegador)
2. Asegúrate que el navegador sigue corriendo en background

### 7.2. Generar una Notificación

Usa cualquiera de estos métodos:

**Método A: Desde otra sesión/dispositivo**
- Inicia sesión con otro usuario
- Realiza una acción que genere notificación

**Método B: Usando la API directamente**
```bash
curl -X POST http://localhost:3000/api/send-test-notification \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=TU_SESSION_TOKEN"
```

### 7.3. Verificar Notificación Nativa

Deberías ver una **notificación del sistema operativo** con:
- Título: "🧪 Notificación de Prueba" (o el título apropiado)
- Cuerpo: El mensaje de la notificación
- Icono: Logo de Trivo
- Botones: **"Abrir"** y **"Cerrar"**

### 7.4. Probar Click en Notificación

1. Click en la notificación
2. Debería abrir la app y navegar a la URL correcta
3. En la consola deberías ver:
   ```
   [FCM SW] Notification clicked
   [FCM SW] Enfocando ventana existente (o Abriendo nueva ventana)
   ```

---

## 🔍 PASO 8: Debugging y Troubleshooting

### Verificar Service Workers en DevTools

**Application → Service Workers:**
- ✅ Ambos SW deben estar "activated and running"
- ❌ Si dice "redundant", actualiza la página
- ❌ Si hay errores, revisa la consola

### Verificar Permisos de Notificación

**Application → Permissions → Notifications:**
- Debe estar en **"Allowed"**
- Si está en "Denied", necesitás:
  1. Click en el candado en la barra de direcciones
  2. Click en "Site Settings"
  3. Cambiar Notifications a "Allow"

### Verificar Firebase Config

En la consola, ejecuta:

```javascript
// Verificar que Firebase está inicializado
console.log(firebase.apps.length > 0 ? 'Firebase OK' : 'Firebase NO OK');
```

### Ver Logs de Firebase Admin (Backend)

En tu terminal donde corre `npm run dev`:

```
✅ Firebase Admin inicializado correctamente
[FCM] Notificaciones enviadas a 1 dispositivo(s)
[FCM] Notificación enviada a token 67a8b2...
```

### Errores Comunes

#### Error: "Firebase Admin: Credenciales no configuradas"
- **Solución:** Revisa que `FIREBASE_SERVICE_ACCOUNT_KEY` esté en `.env.local`

#### Error: "messaging/invalid-registration-token"
- **Solución:** El token FCM expiró. Reactiva las notificaciones.

#### Error: "Service Worker registration failed"
- **Solución:**
  1. Desregistra todos los SW en DevTools
  2. Clear storage
  3. Recarga la página

#### Las notificaciones no llegan
1. Verifica que hay tokens FCM activos en DB
2. Revisa logs del backend para errores de FCM
3. Verifica que Firebase Admin está inicializado correctamente

---

## ✅ Checklist de Pruebas Completo

### Service Workers
- [ ] `/sw.js` registrado correctamente
- [ ] `/api/firebase-sw` registrado correctamente
- [ ] No hay conflictos entre SWs
- [ ] Logs en consola sin errores

### Activación de Notificaciones
- [ ] Botón "Activar notificaciones" funciona
- [ ] Permisos de navegador otorgados
- [ ] Token FCM obtenido y guardado en DB
- [ ] Mensaje de éxito mostrado

### Notificaciones en Foreground
- [ ] Toast de Sonner aparece
- [ ] Mensaje correcto mostrado
- [ ] Notificación guardada en DB

### Notificaciones en Background
- [ ] Notificación nativa del SO aparece
- [ ] Título y cuerpo correctos
- [ ] Icono de la app visible
- [ ] Botones "Abrir" y "Cerrar" funcionan

### Clicks en Notificaciones
- [ ] Click abre la app
- [ ] Navega a la URL correcta
- [ ] Si la app ya está abierta, enfoca y navega
- [ ] Si la app está cerrada, abre nueva ventana

### Base de Datos
- [ ] FCMToken creado con userId correcto
- [ ] Token marcado como activo
- [ ] Notificacion creada con tipo y mensaje correctos
- [ ] actionUrl presente

---

## 🎯 Casos de Prueba por Tipo de Notificación

### 1. Usuario se une a evento
```
Acción: Usuario B se une a evento de Usuario A
Esperado: Usuario A recibe "👥 Nuevo miembro: [Nombre] se unió a tu salida..."
```

### 2. Solicitud aprobada
```
Acción: Usuario A aprueba solicitud de Usuario B
Esperado: Usuario B recibe "🎉 Solicitud aprobada: ¡Tu solicitud para unirte a..."
```

### 3. Pago aprobado
```
Acción: Usuario A aprueba pago de Usuario B
Esperado: Usuario B recibe "💰 Pago aprobado: Tu pago para la salida..."
```

### 4. Pago pendiente
```
Acción: Usuario B sube comprobante de pago
Esperado: Usuario A recibe "⏳ Pago pendiente: [Nombre] ha enviado comprobante..."
```

---

## 📊 Métricas a Observar

### Performance
- Tiempo de registro de SW: < 500ms
- Tiempo de obtención de token FCM: < 2s
- Latencia de notificación push: < 1s

### Confiabilidad
- Tasa de entrega de notificaciones: > 95%
- Tokens FCM válidos: > 90%
- Errores de Firebase Admin: < 1%

---

## 🔄 Reset Completo (Si algo sale mal)

```bash
# 1. Detener servidor
Ctrl+C

# 2. Limpiar Service Workers en DevTools
Application → Service Workers → Unregister (todos)
Application → Storage → Clear site data

# 3. Limpiar navegador
Cerrar y reabrir Chrome

# 4. Reiniciar servidor
npm run dev

# 5. Recargar página con Ctrl+Shift+R (hard reload)
```

---

## 🚀 Próximos Pasos Después de las Pruebas

Si todo funciona correctamente:

1. ✅ FASE 1 y 2 confirmadas
2. ➡️ Continuar con FASE 3: Auto-suscripción
3. ➡️ Continuar con FASE 4: Eventos faltantes (recordatorios, cancelaciones)
4. ➡️ Continuar con FASE 5: Acciones interactivas

---

**Fecha:** 2025-10-28
**Versión:** 1.0
**Estado:** Listo para pruebas en desarrollo
