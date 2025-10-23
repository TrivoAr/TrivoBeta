# Sistema de Notificaciones con Polling

## Descripción General

Este sistema utiliza **polling** (consultas periódicas cada 20 segundos) para obtener notificaciones en tiempo real, compatible con Vercel y otros servicios serverless.

## Arquitectura

### Frontend (Cliente)
- **Hook**: [useNotifications.ts](src/hooks/useNotifications.ts)
- **Componente Toast**: [NotificationToast.tsx](src/components/NotificationToast.tsx)
- **Polling Interval**: 20 segundos
- **Detección de nuevas notificaciones**: Compara IDs de notificaciones entre requests

### Backend (API)
- **GET /api/notificaciones**: Obtiene todas las notificaciones del usuario
- **PATCH /api/notificaciones/[id]/markAsRead**: Marca una notificación como leída
- **PATCH /api/notificaciones/mark-all-read**: Marca todas las notificaciones como leídas

### Base de Datos
- **Modelo**: [Notificacion](src/models/notificacion.ts)
- **Helpers**: [notificationHelpers.ts](src/libs/notificationHelpers.ts)

## Flujo de Funcionamiento

1. **Creación de Notificación**:
   ```typescript
   await createNotification({
     userId: "destinatarioId",
     fromUserId: "origenId",
     type: "joined_event",
     message: "Usuario se unió a tu salida",
     salidaId: "salidaId",
     actionUrl: "/social/miembros/salidaId"
   });
   ```

2. **Polling en el Cliente**:
   - El hook `useNotifications` inicia un interval de 20 segundos
   - Cada 20 segundos hace un `fetch('/api/notificaciones')`
   - Compara las notificaciones nuevas con las anteriores
   - Si hay notificaciones no leídas nuevas, muestra un toast

3. **Mostrar Toast**:
   - Se muestra automáticamente cuando se detecta una nueva notificación no leída
   - El toast incluye el tipo, mensaje y acción
   - Duración: 10 segundos
   - Posición: Top-center

4. **Marcar como Leída**:
   ```typescript
   const { markAsRead } = useNotifications();
   markAsRead(notificationId);
   ```

## Ventajas del Polling vs Socket.io

### ✅ Ventajas
- **Compatible con Vercel**: No requiere servidor custom
- **Compatible con serverless**: Funciona con cualquier plataforma serverless
- **Simplicidad**: Menos código, más fácil de mantener
- **Sin estado**: No hay gestión de conexiones
- **Escalabilidad**: Funciona bien con balanceadores de carga

### ⚠️ Limitaciones
- **Latencia**: Máximo 20 segundos de delay (vs tiempo real)
- **Tráfico**: Más requests al servidor (cada 20 segundos por usuario activo)
- **Batería**: Puede consumir más batería en dispositivos móviles

## Optimizaciones Implementadas

1. **Prevención de Duplicados**:
   - Set global de IDs de notificaciones mostradas
   - Evita mostrar el mismo toast dos veces

2. **Detección Inteligente de Nuevas**:
   - Solo muestra toasts para notificaciones que no estaban en el request anterior
   - No muestra toasts en la carga inicial

3. **Cleanup Automático**:
   - El polling se detiene cuando el usuario cierra sesión
   - Limpieza de intervals en el unmount del componente

4. **Estado Global**:
   - Event Emitter para comunicación entre componentes
   - Un solo punto de verdad para el estado de notificaciones

## Uso en Componentes

### Obtener notificaciones y contador
```typescript
import { useNotifications } from "@/hooks/useNotifications";

function MyComponent() {
  const { notifications, unreadCount, isLoading } = useNotifications();

  return (
    <div>
      <p>Notificaciones no leídas: {unreadCount}</p>
      {notifications.map(n => (
        <div key={n._id}>{n.message}</div>
      ))}
    </div>
  );
}
```

### Marcar como leída
```typescript
const { markAsRead, markAllAsRead } = useNotifications();

// Marcar una notificación
markAsRead(notificationId);

// Marcar todas
markAllAsRead();
```

### Recargar manualmente
```typescript
const { reload } = useNotifications();

// Forzar recarga
reload();
```

## Configuración del Intervalo de Polling

El intervalo está configurado en 20 segundos. Para modificarlo:

```typescript
// En src/hooks/useNotifications.ts, línea 271
pollingIntervalRef.current = setInterval(() => {
  fetchNotifications(true);
}, 20000); // Cambiar este valor (en milisegundos)
```

## Push Notifications

El sistema también soporta **Web Push Notifications** para notificaciones cuando el usuario no está activo en la app:

- Configurado en [notificationHelpers.ts](src/libs/notificationHelpers.ts)
- Requiere VAPID keys configuradas en `.env`
- Se envía automáticamente al crear una notificación

## Migración desde Socket.io

Este sistema reemplaza Socket.io. Los cambios principales fueron:

1. ✅ Eliminado `socket.io` y `socket.io-client`
2. ✅ Eliminado `server.js` (servidor custom)
3. ✅ Eliminado `socketEmitter.ts` y `socketServer.ts`
4. ✅ Actualizado `package.json` para usar `next dev` en lugar de `node server.js`
5. ✅ Implementado polling cada 20 segundos
6. ✅ Mantenida compatibilidad con todos los tipos de notificaciones existentes

## Troubleshooting

### Las notificaciones no se actualizan
- Verificar que el usuario esté autenticado
- Revisar la consola del navegador para errores en el polling
- Verificar que el endpoint `/api/notificaciones` responde correctamente

### Toasts duplicados
- Verificar que solo hay una instancia de `useNotifications` activa
- El sistema ya incluye prevención de duplicados

### Latencia alta
- El intervalo de polling es de 20 segundos
- Para notificaciones más "en tiempo real", reducir el intervalo (con precaución en el uso de recursos)
