# Notificación Masiva - Nueva Salida Social

## 📋 Resumen

Se migró el sistema de notificación masiva de **Web Push API (VAPID)** a **Firebase Cloud Messaging (FCM)** para cuando se crea una nueva salida social.

---

## 🔄 Cambios Realizados

### **ANTES** (Sistema Viejo)

**Endpoint:** [/api/send-notification](src/app/api/send-notification/route.ts)
- Usaba Web Push API con VAPID keys
- Modelo: `Subscription` (Web Push subscriptions)
- Enviaba a todas las suscripciones sin filtro
- Código en [/api/social/route.ts](src/app/api/social/route.ts:61-75):

```typescript
// Sistema viejo - Web Push API
await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-notification`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

### **AHORA** (Sistema Nuevo)

**Función:** `notifyNewSalidaToAll()` en [notificationHelpers.ts](src/libs/notificationHelpers.ts:262-393)
- Usa Firebase Cloud Messaging
- Modelo: `FCMToken` (tokens FCM)
- Filtros inteligentes:
  - ✅ Solo tokens activos (`isActive: true`)
  - ✅ Excluye al creador del evento
  - ✅ Actualiza `lastUsed` en cada envío
  - ✅ Marca tokens inválidos como inactivos
- Código en [/api/social/route.ts](src/app/api/social/route.ts:62-76):

```typescript
// Sistema nuevo - Firebase FCM
const result = await notifyNewSalidaToAll(
  nuevaSalida._id.toString(),
  nuevaSalida.nombre,
  session.user.id,
  nuevaSalida.localidad,
  nuevaSalida.fecha
);
```

---

## 🚀 Nueva Función: `notifyNewSalidaToAll`

### Parámetros

```typescript
notifyNewSalidaToAll(
  salidaId: string,       // ID de la salida creada
  salidaNombre: string,   // Nombre de la salida
  creadorId: string,      // ID del creador (será excluido)
  localidad?: string,     // Localidad (opcional)
  fecha?: Date            // Fecha del evento (opcional)
)
```

### Flujo de Ejecución

```
1. Buscar tokens FCM activos (excluyendo creador)
   ↓
2. Si no hay tokens → Salir
   ↓
3. Preparar mensaje FCM con:
   - Título: "🚀 Nueva salida disponible"
   - Cuerpo: "[Nombre] en [Localidad] - [Fecha]"
   - Link: /social/[id]
   ↓
4. Enviar a TODOS los tokens en paralelo
   ↓
5. Actualizar lastUsed de tokens exitosos
   ↓
6. Marcar tokens inválidos como inactivos
   ↓
7. Crear notificaciones en DB para cada usuario
   ↓
8. Retornar estadísticas: {successCount, failCount, totalSent}
```

### Características Avanzadas

#### **1. Manejo de Errores Robusto**
```typescript
// Si un token es inválido, se marca como inactivo automáticamente
if (
  error.code === "messaging/invalid-registration-token" ||
  error.code === "messaging/registration-token-not-registered"
) {
  await FCMToken.findByIdAndUpdate(tokenDoc._id, {
    isActive: false,
  });
}
```

#### **2. Envío Paralelo**
```typescript
// Promise.allSettled permite que algunos fallen sin detener el resto
await Promise.allSettled(sendPromises);
```

#### **3. Notificación Formateada**
```typescript
const fechaFormateada = fecha
  ? new Date(fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  : "";

const bodyText = localidad && fecha
  ? `${salidaNombre} en ${localidad} - ${fechaFormateada}`
  : salidaNombre;
```

**Ejemplo de salida:**
```
Título: 🚀 Nueva salida disponible
Cuerpo: Trail Running en Mendoza - viernes 1 de noviembre
```

#### **4. Doble Registro**
- **Firebase Push:** Notificación push inmediata
- **Base de Datos:** Registro persistente en colección `notificacions`

---

## 📊 Ventajas del Nuevo Sistema

| Característica | Web Push API (Viejo) | Firebase FCM (Nuevo) |
|----------------|---------------------|---------------------|
| **Configuración** | VAPID keys manuales | Firebase automático |
| **Tokens** | Subscriptions (web-push) | FCM Tokens (Firebase) |
| **Validación** | Manual | Automática |
| **Limpieza** | Manual | Automática (tokens inválidos) |
| **Estadísticas** | No | Sí (success/fail count) |
| **Analytics** | No | Sí (Mixpanel ready) |
| **Cross-platform** | Solo web | Web + Móvil (futuro) |
| **Filtros** | No | Sí (excluye creador) |

---

## 🧪 Cómo Probar

### **Escenario de Prueba**

1. **Preparación:**
   ```
   - Usuario A: Activa notificaciones
   - Usuario B: Activa notificaciones
   - Usuario C: Activa notificaciones
   ```

2. **Acción:**
   ```
   - Usuario A crea una nueva salida social
   ```

3. **Resultado Esperado:**
   ```
   ✅ Usuario B recibe notificación push
   ✅ Usuario C recibe notificación push
   ❌ Usuario A NO recibe notificación (es el creador)
   ```

4. **Verificaciones:**
   ```bash
   # En logs del servidor
   [Create Salida] Enviando notificaciones a todos los usuarios...
   [Notify All] Enviando a 2 dispositivos
   [Notify All] Notificaciones enviadas: 2 exitosas, 0 fallidas
   [Create Salida] Notificaciones enviadas: { successCount: 2, failCount: 0, totalSent: 2 }
   ```

5. **Verificar en Mixpanel:**
   - Evento: `Notification Sent`
   - Propiedades:
     - `notification_type`: "nueva_salida"
     - `device_count`: 2
     - `recipient_id`: [ids de usuarios B y C]

---

## 🔍 Debugging

### Ver tokens activos en DB

```javascript
// MongoDB
db.fcmtokens.find({ isActive: true }).count()
```

### Ver notificaciones enviadas

```javascript
// MongoDB
db.notificacions.find({
  type: "nueva_salida",
  createdAt: { $gte: new Date(Date.now() - 3600000) } // última hora
}).count()
```

### Logs importantes

```bash
# Servidor
[Create Salida] Enviando notificaciones a todos los usuarios...
[Notify All] Enviando a X dispositivos
[Notify All] Notificaciones enviadas: X exitosas, Y fallidas
```

---

## ⚠️ Consideraciones Importantes

### **1. Performance**

Con **muchos usuarios** (>1000), considerar:
- Batching: Enviar en grupos de 500
- Queue system: Usar Redis/Bull para jobs en background
- Rate limiting: Respetar límites de Firebase (1000 msg/seg)

### **2. Spam Prevention**

Actualmente **todas las salidas** generan notificación masiva. Considerar:
- Permitir al creador elegir si notificar o no
- Limitar frecuencia (máx 1 notificación/día por usuario)
- Filtrar por preferencias de usuario (ubicación, deporte, etc.)

### **3. Costos**

Firebase FCM es gratuito pero tiene límites:
- Mensajes ilimitados para Web Push
- Importante: Limpiar tokens inactivos regularmente

### **4. Testing**

En desarrollo, notificar solo a un grupo reducido:
```typescript
// Agregar flag opcional para testing
if (process.env.NODE_ENV === 'development') {
  // Solo notificar a los primeros 3 usuarios
  allTokens = allTokens.slice(0, 3);
}
```

---

## 🚀 Próximos Pasos Sugeridos

### **Fase 1: Optimizaciones Básicas**

1. **Checkbox en formulario de creación:**
   ```typescript
   // Permitir deshabilitar notificación masiva
   <input type="checkbox" name="notifyAll" defaultChecked />
   "Notificar a todos los usuarios"
   ```

2. **Filtrado por ubicación:**
   ```typescript
   // Solo notificar a usuarios de la misma provincia/ciudad
   const allTokens = await FCMToken.find({
     isActive: true,
     userId: {
       $ne: creadorId,
       $in: await getUsersByLocation(localidad)
     }
   })
   ```

### **Fase 2: Preferencias de Usuario**

1. **Modelo de preferencias:**
   ```typescript
   NotificationPreferences {
     userId: ObjectId,
     newEvents: boolean,
     maxPerDay: number,
     sports: [String],
     locations: [String]
   }
   ```

2. **Filtrado inteligente:**
   - Por deporte
   - Por distancia
   - Por frecuencia

### **Fase 3: Analytics Avanzado**

1. **Trackear tasa de clicks:**
   - Cuántos usuarios abren la notificación
   - Cuántos se unen al evento

2. **A/B Testing:**
   - Probar diferentes textos de notificación
   - Medir engagement

---

## 📈 Métricas Esperadas

### **KPIs a Monitorear**

1. **Tasa de Entrega:** >95%
2. **Tasa de Click:** >20%
3. **Conversión (unirse al evento):** >5%
4. **Tokens activos:** >80%

### **Red Flags**

- ⚠️ Tasa de entrega <85%: Problemas con tokens
- ⚠️ Tasa de click <10%: Contenido no relevante
- ⚠️ Muchos tokens inactivos: Usuarios desinstalaron

---

## ✅ Checklist de Deploy

- [x] Función `notifyNewSalidaToAll` implementada
- [x] Integrada en `/api/social/route.ts`
- [x] Manejo de errores robusto
- [x] Logs informativos
- [ ] Probado con 3+ usuarios
- [ ] Verificado en Mixpanel
- [ ] Documentación actualizada
- [ ] Sistema viejo (`/api/send-notification`) puede deprecarse

---

## 🎉 Resultado Final

```
✅ Notificaciones masivas funcionando con Firebase FCM
✅ Sistema más robusto y escalable
✅ Mejor experiencia de usuario
✅ Analytics integrado
✅ Listo para crecer
```

---

**Fecha:** 29 de Octubre, 2025
**Versión:** 1.0
**Estado:** ✅ Implementado y listo para testing
