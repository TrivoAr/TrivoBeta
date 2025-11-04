# Sistema de Notificaciones Push - Implementación Completa

## 📋 Resumen

Sistema de notificaciones push completamente funcional usando Firebase Cloud Messaging (FCM) integrado con la PWA de Trivo.

## ✅ Estado: COMPLETADO Y FUNCIONANDO

Fecha de implementación: 28 de Octubre, 2025

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Service Worker Unificado** (`/api/firebase-sw`)
   - Maneja Firebase Cloud Messaging
   - Maneja cache de recursos estáticos
   - Registrado en scope `/`

2. **Cliente (Frontend)**
   - `PushManager.tsx` - Componente para activar notificaciones
   - `firebaseConfig.js` - Configuración de Firebase cliente
   - `ServiceWorkerRegistration.tsx` - Registro del SW

3. **Servidor (Backend)**
   - `firebaseAdmin.ts` - Firebase Admin SDK
   - `notificationHelpers.ts` - Funciones para enviar notificaciones
   - Endpoints API para gestión de tokens y envío

4. **Base de Datos**
   - `FCMToken` model - Almacena tokens FCM de usuarios
   - Campos: userId, token, deviceInfo, isActive, lastUsed

---

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Firebase Cliente (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

# Firebase Admin (Backend)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=...
```

### Archivos de Credenciales

- **Service Account Key JSON**: `klubo-8dc4d-firebase-adminsdk-*.json`
- ⚠️ Este archivo está en `.gitignore` y NO debe subirse al repositorio

---

## 📁 Estructura de Archivos

```
src/
├── app/
│   └── api/
│       ├── firebase-sw/route.ts           # Service Worker unificado
│       ├── check-fcm-subscription/route.ts # Verifica estado de suscripción
│       ├── save-fcm-token/route.ts        # Guarda token FCM
│       └── send-test-notification/route.ts # Envío de prueba (dev)
│
├── components/
│   ├── PushManager.tsx                    # UI para activar notificaciones
│   └── ServiceWorkerRegistration.tsx      # Registra SW al cargar
│
├── libs/
│   ├── firebaseConfig.js                  # Config Firebase cliente
│   ├── firebaseAdmin.ts                   # Firebase Admin SDK
│   └── notificationHelpers.ts             # Funciones de envío
│
└── models/
    └── FCMToken.ts                        # Modelo MongoDB para tokens
```

---

## 🔄 Flujo de Funcionamiento

### 1. Activación de Notificaciones (Usuario)

```
Usuario → Click "Activar notificaciones"
    ↓
Solicitar permisos del navegador
    ↓
Obtener token FCM de Firebase
    ↓
Guardar token en MongoDB (FCMToken)
    ↓
Actualizar UI → "✅ Notificaciones activadas"
```

### 2. Envío de Notificaciones (Sistema)

```
Evento del sistema (pago aprobado, nuevo miembro, etc.)
    ↓
Llamar función en notificationHelpers.ts
    ↓
Buscar tokens FCM activos del usuario
    ↓
Enviar via Firebase Admin SDK
    ↓
Firebase entrega al navegador/dispositivo
    ↓
Service Worker muestra notificación
```

### 3. Recepción de Notificaciones

**En primer plano (app abierta):**
- `onMessageListener()` captura el mensaje
- Muestra toast con Sonner

**En background (app cerrada/minimizada):**
- Service Worker recibe `onBackgroundMessage`
- Muestra notificación nativa del navegador
- Click en notificación abre la app en la URL especificada

---

## 🎯 Eventos que Generan Notificaciones

Actualmente implementados en `notificationHelpers.ts`:

1. **notifyMemberApproved** - Miembro aprobado en evento
2. **notifyPaymentApproved** - Pago aprobado
3. **notifyNewMemberRequest** - Nueva solicitud de miembro
4. **notifyEventCreated** - Evento creado
5. **notifyEventUpdated** - Evento actualizado
6. **notifyEventCancelled** - Evento cancelado
7. **notifyEventReminder** - Recordatorio de evento
8. **notifyNewMessage** - Nuevo mensaje

---

## 🔑 Service Worker Unificado

### Características Clave

1. **importScripts de Firebase al principio** (requerimiento crítico)
2. **Manejo de mensajes en background**
3. **Cache de recursos estáticos**
4. **Click handlers para notificaciones**

### Por qué UN SOLO Service Worker

- Firebase requiere que sus `importScripts` estén al principio
- Múltiples SWs con el mismo scope causan conflictos
- Mejor performance y mantenibilidad

---

## 🐛 Problemas Resueltos

### 1. Error: "Registration failed - push service error"

**Causa:** Múltiples Service Workers compitiendo por el mismo scope

**Solución:** Service Worker unificado con Firebase al principio

### 2. Error: "Invalid grant: account not found"

**Causa:** Credenciales de Firebase Admin vencidas/inválidas

**Solución:** Generar nueva Service Account Key desde Firebase Console

### 3. Botón no cambia de estado

**Causa:** Estado no se verificaba después de activar

**Solución:** `setSubscribed(true)` después de guardar token exitosamente

### 4. Toast aparecía en desarrollo

**Causa:** SW update notification mostrándose en dev

**Solución:** Auto-update en desarrollo, toast solo en producción

---

## 📊 Modelo de Datos

### FCMToken Schema

```typescript
{
  userId: ObjectId,          // Referencia al usuario
  token: String,             // Token FCM único
  deviceInfo: {
    userAgent: String,       // Info del navegador
    platform: String         // Sistema operativo
  },
  isActive: Boolean,         // Token válido/inválido
  lastUsed: Date,           // Última vez usado
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Cómo Probar

### En Desarrollo

1. Iniciar servidor: `npm run dev`
2. Ir a: http://localhost:3000/dashboard/profile
3. Click en "🔔 Activar notificaciones"
4. Aceptar permisos del navegador
5. Verificar que el botón cambie a "✅ Notificaciones activadas"

### Verificar Service Workers

En DevTools → Application → Service Workers:
- Debe haber UN solo SW registrado
- Scope: `http://localhost:3000/`
- ScriptURL: `http://localhost:3000/api/firebase-sw`

### Enviar Notificación de Prueba (Solo Dev)

Temporalmente puedes descomentar y usar el endpoint:
```bash
POST http://localhost:3000/api/send-test-notification
Headers: Cookie con sesión activa
```

---

## 🚀 Despliegue a Producción

### Checklist Pre-Deploy

- [ ] Verificar que todas las variables de entorno estén configuradas
- [ ] Confirmar que Service Account Key NO está en el repo
- [ ] Probar en diferentes navegadores (Chrome, Firefox, Safari)
- [ ] Verificar permisos de notificaciones en cada navegador
- [ ] Confirmar que las notificaciones llegan en background

### Variables de Entorno en Producción

Configurar en Vercel/plataforma de deploy:
- Todas las variables `NEXT_PUBLIC_FIREBASE_*`
- Variables `FIREBASE_*` para Admin SDK
- **IMPORTANTE:** Usar valores de producción, no de desarrollo

---

## 📈 Monitoreo y Mantenimiento

### Logs Importantes

**Cliente:**
```
[Firebase] Iniciando getFCMToken...
[Firebase] Token FCM obtenido exitosamente
[PushManager] Token guardado exitosamente
```

**Servidor:**
```
✅ Firebase Admin inicializado con credenciales individuales
[Test Notification] Sent successfully
```

### Limpieza de Tokens

Los tokens se marcan como `isActive: false` cuando:
- Firebase devuelve error de token inválido
- El token ha expirado o sido revocado

Considerar tarea periódica para eliminar tokens inactivos viejos.

---

## 🔐 Seguridad

### Buenas Prácticas Implementadas

1. ✅ Credenciales en variables de entorno
2. ✅ Service Account Key en `.gitignore`
3. ✅ Validación de sesión en endpoints
4. ✅ Verificación userId en backend
5. ✅ Tokens FCM únicos por dispositivo
6. ✅ Manejo de tokens inválidos/expirados

---

## 📚 Recursos y Documentación

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 🎉 Resultado Final

### ✅ Características Implementadas

- [x] Activación de notificaciones con un solo click
- [x] Service Worker unificado (Firebase + Cache)
- [x] Tokens FCM almacenados en MongoDB
- [x] Firebase Admin SDK configurado
- [x] Funciones helper para todos los tipos de notificaciones
- [x] Manejo de notificaciones en foreground y background
- [x] UI limpia sin botones de desarrollo
- [x] Logs detallados para debugging
- [x] Manejo de errores robusto
- [x] Verificación automática de estado al cargar

### 🎯 Sistema Listo para Producción

El sistema de notificaciones push está completamente funcional y listo para usar en producción. Los usuarios pueden activar notificaciones con un click y recibirán notificaciones push para todos los eventos importantes de la aplicación.

---

**Última actualización:** 28 de Octubre, 2025
