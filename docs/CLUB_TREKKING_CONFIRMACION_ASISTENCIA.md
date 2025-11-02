# Sistema de Confirmación de Asistencia y Penalización - Club del Trekking

Este documento describe el sistema de confirmación de asistencia post-evento y el sistema de penalización por inasistencias consecutivas.

## ⚠️ Importante

El **Club del Trekking** solo incluye salidas de **Trekking**. Las salidas de Ciclismo y Running NO están incluidas en la membresía.

## 📋 Índice

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Flujo de Usuario](#flujo-de-usuario)
3. [Reglas de Penalización](#reglas-de-penalización)
4. [Implementación Técnica](#implementación-técnica)
5. [Componentes](#componentes)
6. [APIs](#apis)
7. [Integración](#integración)
8. [Testing](#testing)

---

## Resumen del Sistema

### ¿Por qué este sistema?

En lugar de usar geolocalización GPS (check-in), implementamos un sistema más amigable que:

1. **Pregunta al usuario después del evento** si asistió o no
2. **Bloquea la aplicación** hasta que confirme (modal no cerrable)
3. **Penaliza por 2 inasistencias consecutivas** con 3 días de suspensión
4. **Resetea el contador** cuando el usuario asiste

### Ventajas

- ✅ No requiere permisos de ubicación
- ✅ Funciona sin GPS o señal
- ✅ Más simple y user-friendly
- ✅ Educa al usuario sobre responsabilidad
- ✅ Previene abuso del sistema (reservar sin asistir)

---

## Flujo de Usuario

### 1. Usuario Reserva Salida

```
Usuario → Reserva salida incluida en membresía
Sistema → Agrega al historial con asistenciaConfirmada: null
```

### 2. Día Después de la Salida

```
Usuario → Abre la app
Sistema → Detecta salida pendiente de confirmar (fecha < hoy)
Sistema → Muestra modal bloqueante "¿Asististe a esta salida?"
Usuario → NO puede cerrar el modal ni usar la app
```

### 3. Usuario Confirma Asistencia

#### Caso A: Usuario asistió ✅

```
Usuario → Click en "Sí, asistí"
Sistema → Marca asistenciaConfirmada: true
Sistema → Marca checkInRealizado: true
Sistema → Resetea contador de inasistencias a 0
Sistema → Muestra confetti 🎉
Sistema → Permite usar la app normalmente
```

#### Caso B: Usuario NO asistió ❌

```
Usuario → Click en "No asistí"
Sistema → Incrementa contador de inasistencias consecutivas
Sistema → Marca asistenciaConfirmada: false

SI inasistenciasConsecutivas < 2:
  Sistema → Muestra advertencia
  Sistema → Permite usar la app

SI inasistenciasConsecutivas >= 2:
  Sistema → Aplica penalización de 3 días
  Sistema → Bloquea reservas por 3 días
  Sistema → Muestra mensaje de penalización
  Sistema → Resetea contador a 0
```

### 4. Usuario con Penalización Activa

```
Usuario → Intenta reservar nueva salida
Sistema → Rechaza con error "Penalización activa por X días más"
Sistema → Muestra fecha de fin de penalización
```

### 5. Fin de Penalización

```
Sistema → Detecta que pasaron 3 días
Sistema → Desactiva penalización automáticamente
Usuario → Puede volver a reservar salidas
```

---

## Reglas de Penalización

### Contador de Inasistencias

| Inasistencias Consecutivas | Acción                                    |
|----------------------------|-------------------------------------------|
| 0                          | Normal - puede reservar                   |
| 1                          | ⚠️ Advertencia al confirmar NO asistencia |
| 2                          | 🚫 Penalización de 3 días activada        |

### Reseteo del Contador

El contador se resetea a **0** cuando:
- ✅ El usuario confirma que **SÍ asistió** a una salida
- ✅ Se aplica la penalización (después de 2 inasistencias)

### Penalización de 3 Días

Durante la penalización:
- 🚫 **NO puede reservar** nuevas salidas
- ✅ **SÍ puede** ver el calendario
- ✅ **SÍ puede** usar otras funciones de la app
- ⏰ **Cuenta regresiva** de días restantes visible

---

## Implementación Técnica

### Modelo de Datos

#### ClubTrekkingMembership

```typescript
{
  // ... otros campos ...

  historialSalidas: [
    {
      salidaId: ObjectId,
      fecha: Date,
      checkInRealizado: boolean,          // true si asistió
      asistenciaConfirmada: boolean | null, // null = pendiente, true = asistió, false = no asistió
      fechaConfirmacion: Date              // cuando confirmó
    }
  ],

  penalizacion: {
    activa: boolean,                       // true si está penalizado ahora
    fechaInicio: Date,                     // cuando empezó la penalización
    fechaFin: Date,                        // cuando termina (fechaInicio + 3 días)
    diasRestantes: number,                 // días que faltan
    inasistenciasConsecutivas: number,     // contador actual (0, 1, o 2)
    historialPenalizaciones: [             // historial completo
      {
        fechaInicio: Date,
        fechaFin: Date,
        motivo: string,
        inasistenciasConsecutivas: number
      }
    ]
  }
}
```

### Métodos del Modelo

#### `confirmarAsistencia(salidaId, asistio)`

```typescript
// Marca la asistencia y maneja el contador
membership.confirmarAsistencia("65f1234...", true);
await membership.save();
```

**Lógica:**
1. Busca la salida en el historial
2. Verifica que no esté ya confirmada
3. Marca `asistenciaConfirmada` con el valor recibido
4. Si `asistio === false`: incrementa contador
5. Si `asistio === true`: resetea contador a 0 y marca `checkInRealizado: true`
6. Si contador llega a 2: llama a `aplicarPenalizacion()`

#### `aplicarPenalizacion()`

```typescript
// Aplica penalización de 3 días
membership.aplicarPenalizacion();
await membership.save();
```

**Lógica:**
1. Marca `penalizacion.activa = true`
2. Establece `fechaInicio = ahora`
3. Calcula `fechaFin = ahora + 3 días`
4. Agrega al historial de penalizaciones
5. Resetea contador de inasistencias a 0

#### `tienePenalizacionActiva()`

```typescript
// Verifica si tiene penalización y actualiza días restantes
const penalizado = membership.tienePenalizacionActiva();
```

**Lógica:**
1. Si `penalizacion.activa === false` → return false
2. Si `ahora >= fechaFin` → desactiva penalización, return false
3. Si no → calcula días restantes, return true

#### `getSalidasPendientesConfirmacion()`

```typescript
// Obtiene salidas que pasaron y no están confirmadas
const pendientes = membership.getSalidasPendientesConfirmacion();
```

**Lógica:**
1. Filtra salidas donde `fecha < ahora`
2. Y `asistenciaConfirmada === null`
3. Y `fecha >= ayer` (no más antiguas de 24hrs)
4. Return array de salidas pendientes

---

## Componentes

### 1. ConfirmacionAsistenciaModal

Modal bloqueante que muestra una salida y pide confirmación.

**Props:**
```typescript
interface ConfirmacionAsistenciaModalProps {
  salida: SalidaPendiente;
  inasistenciasConsecutivas: number;
  onConfirmar: (asistio: boolean) => Promise<void>;
}
```

**Características:**
- Modal de pantalla completa no cerrable
- Muestra detalles de la salida (título, fecha, ubicación)
- 2 botones grandes: "Sí, asistí" (verde) y "No asistí" (outline)
- Si tiene 1 inasistencia previa → muestra advertencia en banner
- Si va a ser la 2da inasistencia → muestra modal de confirmación adicional

**Estados:**
- Normal: pregunta simple
- Advertencia: muestra advertencia de que será penalizado si confirma NO

### 2. ConfirmacionAsistenciaProvider

Provider que envuelve la app y detecta automáticamente salidas pendientes.

**Uso:**
```tsx
// En app/layout.tsx
<ConfirmacionAsistenciaProvider>
  {children}
</ConfirmacionAsistenciaProvider>
```

**Lógica:**
1. Hook `useSalidasPendientesConfirmacion()` obtiene pendientes
2. Si hay salidas pendientes → muestra modal
3. Usuario confirma → llama API
4. Si hay más pendientes → pasa a la siguiente
5. Si no hay más → cierra modal y permite uso normal

### 3. useSalidasPendientesConfirmacion Hook

Hook para obtener y confirmar salidas pendientes.

**Return:**
```typescript
{
  salidasPendientes: SalidaPendiente[];
  tienePenalizacion: boolean;
  diasPenalizacion: number;
  inasistenciasConsecutivas: number;
  loading: boolean;
  error: string | null;
  confirmarAsistencia: (salidaId, asistio) => Promise<result>;
  refetch: () => Promise<void>;
}
```

---

## APIs

### POST `/api/club-trekking/confirmar-asistencia`

Confirma si el usuario asistió o no a una salida.

**Request:**
```json
{
  "salidaId": "65f123...",
  "asistio": true
}
```

**Response (asistió):**
```json
{
  "success": true,
  "asistio": true,
  "penalizacionAplicada": false,
  "diasPenalizacion": 0,
  "inasistenciasConsecutivas": 0,
  "mensaje": "¡Gracias por confirmar tu asistencia!"
}
```

**Response (NO asistió - 2da vez):**
```json
{
  "success": true,
  "asistio": false,
  "penalizacionAplicada": true,
  "diasPenalizacion": 3,
  "inasistenciasConsecutivas": 0,
  "mensaje": "Has acumulado 2 inasistencias consecutivas. No podrás reservar salidas por 3 días."
}
```

### GET `/api/club-trekking/salidas-pendientes`

Obtiene las salidas pendientes de confirmación del usuario.

**Response:**
```json
{
  "salidasPendientes": [
    {
      "_id": "65f123...",
      "titulo": "Trekking a Piedra Parada",
      "fecha": "2025-01-29T10:00:00.000Z",
      "locationName": "Piedra Parada, Chubut",
      "imagen": "https://..."
    }
  ],
  "tienePenalizacion": false,
  "diasPenalizacion": 0,
  "inasistenciasConsecutivas": 1
}
```

### POST `/api/club-trekking/reservar`

**Actualización:** Ahora valida penalización antes de permitir reserva.

**Error si está penalizado:**
```json
{
  "error": "Tienes una penalización activa por 2 días más por inasistencias consecutivas",
  "penalizacionActiva": true,
  "diasRestantes": 2,
  "fechaFin": "2025-02-01T15:30:00.000Z"
}
```
Status: 403

---

## Integración

### Paso 1: Agregar Provider al Layout Principal

```tsx
// src/app/layout.tsx
import { ConfirmacionAsistenciaProvider } from "@/components/club-trekking/ConfirmacionAsistenciaProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <ConfirmacionAsistenciaProvider>
            {children}
          </ConfirmacionAsistenciaProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

### Paso 2: Ya Está!

El sistema funciona automáticamente:
- Detecta salidas pasadas sin confirmar
- Muestra modal bloqueante
- Maneja confirmación y penalización
- No requiere código adicional

### (Opcional) Mostrar Estado de Penalización

```tsx
// En cualquier componente
import { useClubMembership } from "@/hooks/useClubMembership";

function MiComponente() {
  const { membership } = useClubMembership();

  if (membership?.penalizacion?.activa) {
    return (
      <Alert>
        Tienes una penalización activa por {membership.penalizacion.diasRestantes} días más.
      </Alert>
    );
  }

  return <>{/* contenido normal */}</>;
}
```

---

## Testing

### Test 1: Confirmación de Asistencia (Positiva)

1. Usuario reserva salida incluida en membresía
2. Cambiar fecha de la salida a ayer (en DB)
3. Abrir la app
4. Debe aparecer modal "¿Asististe a esta salida?"
5. Click en "Sí, asistí"
6. Debe mostrar confetti y cerrar modal
7. Verificar en DB: `asistenciaConfirmada: true`, `checkInRealizado: true`

### Test 2: Primera Inasistencia

1. Seguir pasos 1-4 del Test 1
2. Click en "No asistí"
3. Debe mostrar advertencia
4. Debe cerrar modal
5. Verificar en DB:
   - `asistenciaConfirmada: false`
   - `inasistenciasConsecutivas: 1`
   - `penalizacion.activa: false`

### Test 3: Segunda Inasistencia → Penalización

1. Repetir Test 2 (tener 1 inasistencia previa)
2. Reservar otra salida
3. Cambiar fecha a ayer
4. Abrir app → modal aparece
5. Click "No asistí"
6. Debe mostrar modal de advertencia adicional
7. Confirmar "No asistí"
8. Debe mostrar mensaje de penalización
9. Verificar en DB:
   - `penalizacion.activa: true`
   - `penalizacion.diasRestantes: 3`
   - `penalizacion.inasistenciasConsecutivas: 0` (reseteo)

### Test 4: Intentar Reservar con Penalización

1. Tener penalización activa (Test 3)
2. Intentar reservar nueva salida
3. Debe mostrar error 403
4. Mensaje: "Tienes una penalización activa por X días más"

### Test 5: Fin de Penalización

1. Tener penalización activa
2. Cambiar `fechaFin` a hace 1 día (en DB)
3. Intentar reservar salida
4. Sistema debe desactivar penalización automáticamente
5. Reserva debe ser exitosa

### Test 6: Reseteo de Contador al Asistir

1. Tener 1 inasistencia consecutiva
2. Reservar salida y confirmar que SÍ asistió
3. Verificar: `inasistenciasConsecutivas: 0`
4. Próxima inasistencia debe ser "la primera" de nuevo

---

## Casos Edge

### ¿Qué pasa si el usuario tiene múltiples salidas pendientes?

El modal muestra una a la vez. Después de confirmar la primera, pasa automáticamente a la siguiente.

### ¿Puede cerrar el modal?

NO. Es bloqueante. No hay X para cerrar, no se cierra con ESC o click afuera.

### ¿Qué pasa con salidas muy antiguas?

El método `getSalidasPendientesConfirmacion()` solo retorna salidas de las últimas 24 horas. Salidas más antiguas no se piden confirmar.

### ¿Puede cambiar su respuesta después?

NO. Una vez confirmada, no se puede cambiar (`asistenciaConfirmada !== null`).

### ¿Qué pasa si cierra la app antes de confirmar?

Al volver a abrir, el modal aparece de nuevo. No puede escapar.

### ¿La penalización se puede quitar manualmente?

Sí, el admin puede modificar la DB:
```js
db.clubtrekkingmemberships.updateOne(
  { userId: ObjectId("...") },
  { $set: { "penalizacion.activa": false } }
)
```

---

## Mixpanel Tracking

Eventos trackeados:

```typescript
trackClubTrekkingEvent("asistencia_confirmada", {
  userId: "...",
  salidaId: "...",
  asistio: true | false,
  penalizacionAplicada: true | false,
  diasPenalizacion: 0 | 3,
  inasistenciasConsecutivas: 0 | 1 | 2
});
```

---

## Archivos Creados

### Modelo
- `src/models/ClubTrekkingMembership.ts` (actualizado)

### APIs
- `src/app/api/club-trekking/confirmar-asistencia/route.ts`
- `src/app/api/club-trekking/salidas-pendientes/route.ts`
- `src/app/api/club-trekking/reservar/route.ts` (actualizado)

### Componentes
- `src/components/club-trekking/ConfirmacionAsistenciaModal.tsx`
- `src/components/club-trekking/ConfirmacionAsistenciaProvider.tsx`

### Hooks
- `src/hooks/useSalidasPendientesConfirmacion.ts`

### Docs
- `docs/CLUB_TREKKING_CONFIRMACION_ASISTENCIA.md` (este archivo)

---

## Mejoras Futuras

1. **Notificación Push** cuando pasa el evento (en lugar de esperar a que abra la app)
2. **Email de recordatorio** si no confirma en 48hrs
3. **Sistema de apelación** para casos excepcionales
4. **Penalización progresiva** (3 días → 7 días → 15 días)
5. **Recompensas por racha** de asistencia perfecta
6. **Dashboard de estadísticas** de asistencia en el admin panel

---

Creado: 2025-01-30
Última actualización: 2025-01-30
