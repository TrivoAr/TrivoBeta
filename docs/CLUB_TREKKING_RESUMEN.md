# Club del Trekking - Resumen de Implementación

## Visión General

El Club del Trekking es una membresía mensual de $25,000 ARS que permite acceso ilimitado a salidas low cost (≤ $10,000), con límite de 2 salidas por semana y sistema de check-in geolocalizado.

---

## Archivos Creados

### 📋 Modelos de Datos
- [src/models/ClubTrekkingMembership.ts](../src/models/ClubTrekkingMembership.ts) - Modelo principal de membresía
- **Modificados:**
  - [src/models/user.ts](../src/models/user.ts) - Campo `clubTrekking` agregado
  - [src/models/salidaSocial.ts](../src/models/salidaSocial.ts) - Campo `clubTrekking` agregado
  - [src/models/MiembroSalida.ts](../src/models/MiembroSalida.ts) - Campos `usaMembresiaClub` y `checkIn` agregados

### ⚙️ Configuración
- [src/config/clubTrekking.config.ts](../src/config/clubTrekking.config.ts) - Configuración centralizada

### 🔌 API Endpoints
- [src/app/api/club-trekking/subscribe/route.ts](../src/app/api/club-trekking/subscribe/route.ts) - Crear suscripción
- [src/app/api/club-trekking/membership/[userId]/route.ts](../src/app/api/club-trekking/membership/[userId]/route.ts) - Obtener membresía
- [src/app/api/club-trekking/cancel/route.ts](../src/app/api/club-trekking/cancel/route.ts) - Cancelar membresía
- [src/app/api/club-trekking/pause/route.ts](../src/app/api/club-trekking/pause/route.ts) - Pausar membresía
- [src/app/api/club-trekking/reactivate/route.ts](../src/app/api/club-trekking/reactivate/route.ts) - Reactivar membresía
- [src/app/api/club-trekking/salidas-disponibles/route.ts](../src/app/api/club-trekking/salidas-disponibles/route.ts) - Listar salidas
- [src/app/api/club-trekking/reservar/route.ts](../src/app/api/club-trekking/reservar/route.ts) - Reservar salida
- [src/app/api/club-trekking/check-in/route.ts](../src/app/api/club-trekking/check-in/route.ts) - Check-in
- [src/app/api/club-trekking/stats/[userId]/route.ts](../src/app/api/club-trekking/stats/[userId]/route.ts) - Estadísticas
- [src/app/api/webhooks/mercadopago/club-trekking/route.ts](../src/app/api/webhooks/mercadopago/club-trekking/route.ts) - Webhook MP

### 📊 Analytics
- [src/utils/mixpanelEvents.ts](../src/utils/mixpanelEvents.ts) - Eventos de Mixpanel agregados

### 🔧 Scripts
- [scripts/migrate-club-trekking.ts](../scripts/migrate-club-trekking.ts) - Script de migración
- **Modificado:** [package.json](../package.json) - Script `migrate:club-trekking` agregado

### 📖 Documentación
- [docs/CLUB_TREKKING.md](./CLUB_TREKKING.md) - Documentación técnica completa
- [docs/CLUB_TREKKING_ADMIN.md](./CLUB_TREKKING_ADMIN.md) - Documentación para app administradora
- [docs/CLUB_TREKKING_RESUMEN.md](./CLUB_TREKKING_RESUMEN.md) - Este archivo

---

## Próximos Pasos

### 1. Ejecutar Migración
```bash
npm run migrate:club-trekking
```

### 2. Variables de Entorno
Agregar a `.env`:
```env
# Club del Trekking
CLUB_TREKKING_PRICE=25000
CLUB_TREKKING_MAX_SALIDA_PRICE=10000
CLUB_TREKKING_WEEKLY_LIMIT=2
CLUB_TREKKING_CHECK_IN_RADIUS_METERS=100
```

### 3. Configurar Webhook en MercadoPago
URL: `https://tudominio.com/api/webhooks/mercadopago/club-trekking`

### 4. Frontend - Componentes Necesarios

#### Componentes UI a crear:
```
src/components/club-trekking/
├── ClubTrekkingBadge.tsx        # Badge visual para miembros
├── ClubTrekkingHero.tsx         # Hero section landing
├── ClubCalendar.tsx             # Calendario de salidas
├── MembershipStatus.tsx         # Widget estado de membresía
├── CheckInButton.tsx            # Botón check-in con geolocalización
└── StatsCard.tsx                # Card de estadísticas
```

#### Páginas a crear:
```
src/app/club-trekking/
├── page.tsx                     # Landing page
├── calendario/page.tsx          # Calendario de salidas
├── mi-membresia/page.tsx        # Panel personal
├── estadisticas/page.tsx        # Estadísticas personales
└── success/page.tsx             # Página de confirmación
```

#### Hooks personalizados:
```typescript
// src/hooks/useClubMembership.ts
export function useClubMembership(userId: string) {
  // Gestión de membresía
}

// src/hooks/useCheckIn.ts
export function useCheckIn(salidaId: string) {
  // Lógica de check-in
}

// src/hooks/useClubStats.ts
export function useClubStats(userId: string) {
  // Estadísticas del usuario
}
```

### 5. Integración con Componentes Existentes

#### Modificar Perfil de Usuario
Mostrar badge si `user.clubTrekking.esMiembro === true`:

```tsx
import ClubTrekkingBadge from '@/components/club-trekking/ClubTrekkingBadge';

// En el perfil
{user.clubTrekking?.badge?.activo && (
  <ClubTrekkingBadge
    variant="medium"
    tipo={user.clubTrekking.badge.tipoMiembro}
    showLabel
  />
)}
```

#### Modificar Card de Salida Social
Indicar si está incluida en membresía:

```tsx
{salida.clubTrekking?.incluidaEnMembresia && (
  <Badge className="bg-green-500">
    <Icons.check className="w-4 h-4 mr-1" />
    Incluida en Club del Trekking
  </Badge>
)}
```

### 6. Notificaciones Push (Firebase FCM)

Crear funciones de notificación en [src/utils/notifications/clubTrekking.ts](../src/utils/notifications/clubTrekking.ts):

```typescript
// Bienvenida
export async function notificarBienvenida(userId: string)

// Nueva salida disponible
export async function notificarNuevaSalida(salidaId: string)

// Recordatorio de salida (24h antes)
export async function notificarRecordatorioSalida(salidaId: string)

// Recordatorio check-in (1h antes)
export async function notificarRecordatorioCheckIn(salidaId: string)

// Límite semanal alcanzado
export async function notificarLimiteAlcanzado(userId: string)

// Renovación exitosa
export async function notificarRenovacionExitosa(membershipId: string)

// Renovación fallida
export async function notificarRenovacionFallida(membershipId: string)

// Resumen mensual
export async function notificarResumenMensual(userId: string, stats: any)
```

### 7. Cron Jobs Necesarios

#### Reset mensual de contadores
```typescript
// Ejecutar el día 1 de cada mes a las 00:00
async function resetearContadoresMensuales() {
  const memberships = await ClubTrekkingMembership.find({
    estado: 'activa'
  });

  for (const membership of memberships) {
    membership.resetearContadorMensual();
    await membership.save();
  }
}
```

#### Recordatorios de salidas
```typescript
// Ejecutar cada hora
async function enviarRecordatoriosSalidas() {
  const manana = new Date();
  manana.setHours(manana.getHours() + 24);

  const salidasManana = await SalidaSocial.find({
    fecha: manana.toISOString().split('T')[0],
    'clubTrekking.incluidaEnMembresia': true
  });

  for (const salida of salidasManana) {
    await notificarRecordatorioSalida(salida._id);
  }
}
```

### 8. Testing

#### Tests unitarios a crear:
```
src/__tests__/club-trekking/
├── membership.test.ts           # Test del modelo
├── subscribe.test.ts            # Test de suscripción
├── reservar.test.ts             # Test de reserva
├── check-in.test.ts             # Test de check-in
├── webhook.test.ts              # Test de webhook MP
└── helpers.test.ts              # Test de funciones helper
```

#### Casos de prueba críticos:
- ✅ Usuario se suscribe exitosamente
- ✅ Usuario no puede reservar más de 2 salidas/semana
- ✅ Usuario no puede usar membresía en salida >$10,000
- ✅ Check-in falla si está lejos del punto (>100m)
- ✅ Contador se resetea correctamente cada mes
- ✅ Webhook procesa pago exitoso
- ✅ Webhook procesa pago rechazado
- ✅ Usuario pausa y reactiva membresía
- ✅ Usuario cancela y no puede acceder

---

## Arquitectura de Datos - Diagrama

```
User
├── clubTrekking
│   ├── esMiembro: boolean
│   ├── membershipId: ObjectId -> ClubTrekkingMembership
│   └── badge
│       ├── activo: boolean
│       └── tipoMiembro: 'bronce' | 'plata' | 'oro'

ClubTrekkingMembership
├── userId: ObjectId -> User
├── estado: 'activa' | 'pausada' | 'vencida' | 'cancelada'
├── fechaInicio, fechaFin, proximaFechaPago
├── mercadoPago
│   ├── preapprovalId
│   ├── payerId
│   └── status
├── usoMensual
│   ├── salidasRealizadas
│   ├── limiteSemanal
│   └── ultimaResetFecha
└── historialSalidas[]
    ├── salidaId: ObjectId -> SalidaSocial
    ├── fecha
    └── checkInRealizado

SalidaSocial
└── clubTrekking
    ├── incluidaEnMembresia: boolean (precio ≤ $10,000)
    ├── requiereCheckIn: boolean
    ├── cupoMiembros: number
    └── miembrosActuales: number

MiembroSalida
├── usaMembresiaClub: boolean
└── checkIn
    ├── realizado: boolean
    ├── fecha
    └── ubicacion {lat, lng}
```

---

## Flujos Principales

### Flujo 1: Suscripción
1. Usuario visita `/club-trekking`
2. Hace clic en "Unirme al Club"
3. POST `/api/club-trekking/subscribe`
4. Se crea `ClubTrekkingMembership` en estado "activa"
5. Se crea suscripción en MercadoPago
6. Usuario es redirigido a MP para autorizar pago
7. Webhook confirma pago
8. Se actualiza `user.clubTrekking.esMiembro = true`
9. Notificación de bienvenida

### Flujo 2: Reserva de Salida
1. Usuario miembro ve salida incluida en `/club-trekking/calendario`
2. Hace clic en "Reservar con membresía"
3. POST `/api/club-trekking/reservar`
4. Sistema verifica:
   - Membresía activa ✓
   - Salida incluida ✓
   - Límite semanal no alcanzado ✓
   - Hay cupo ✓
5. Se crea `MiembroSalida` con `usaMembresiaClub = true`
6. Se actualiza contador de miembros en salida
7. Notificación de confirmación

### Flujo 3: Check-In
1. Usuario llega al punto de encuentro
2. Abre app y presiona "Check-In"
3. App solicita ubicación
4. POST `/api/club-trekking/check-in` con coordenadas
5. Sistema verifica:
   - Está dentro del radio (100m) ✓
   - Está dentro del tiempo permitido (30 min antes - 15 min después) ✓
6. Se registra check-in en `MiembroSalida`
7. Se agrega al historial de membresía
8. Se incrementa contador mensual
9. Notificación de confirmación con stats

### Flujo 4: Renovación Mensual
1. MercadoPago cobra automáticamente el día de renovación
2. Webhook POST `/api/webhooks/mercadopago/club-trekking`
3. Si pago aprobado:
   - Mantener `estado = 'activa'`
   - Actualizar `proximaFechaPago`
   - Notificar renovación exitosa
4. Si pago rechazado:
   - Cambiar `estado = 'vencida'`
   - Actualizar `user.clubTrekking.esMiembro = false`
   - Notificar renovación fallida con opción de actualizar método de pago

---

## Configuración Recomendada

### Precio y Límites
```typescript
PRECIO_MENSUAL: 25000          // ARS
MAX_PRECIO_SALIDA: 10000       // Salidas ≤ $10k incluidas
SALIDAS_POR_SEMANA: 2          // Límite operativo
PAUSAS_POR_MES: 1              // Puede pausar 1 vez al mes
```

### Check-In
```typescript
RADIO_METROS: 100              // Distancia máxima del punto
TIEMPO_ANTES_MINUTOS: 30       // Check-in desde 30 min antes
TIEMPO_DESPUES_MINUTOS: 15     // Hasta 15 min después
```

### Gamificación
```typescript
BADGES: {
  BRONCE: { minimoSalidas: 0 },
  PLATA: { minimoSalidas: 10 },
  ORO: { minimoSalidas: 25 }
}
```

---

## Métricas de Éxito a Trackear

### Adopción
- Nuevas suscripciones por mes
- Tasa de conversión de visitantes -> suscriptores
- Tiempo promedio desde visita -> suscripción

### Retención
- Tasa de renovación mensual (objetivo: >85%)
- Tasa de cancelación (objetivo: <5%)
- Tiempo promedio de vida del cliente (objetivo: >6 meses)

### Uso
- Promedio de salidas por usuario al mes (objetivo: 4-6)
- Tasa de check-in (objetivo: >90%)
- % de usuarios que alcanzan límite semanal

### Revenue
- MRR (Monthly Recurring Revenue)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)
- Churn rate

### Engagement
- Días hasta primera salida post-suscripción
- Salidas más populares entre miembros
- Horarios/días preferidos

---

## Soporte y Troubleshooting

### Problemas Comunes

**Usuario no puede hacer check-in**
- Verificar permisos de ubicación
- Verificar que está dentro del radio (100m)
- Verificar que está dentro del tiempo permitido

**Pago rechazado**
- Usuario debe actualizar método de pago en MP
- Enviar link de actualización vía notificación
- Dar período de gracia de 3 días

**Límite semanal alcanzado**
- Mostrar mensaje claro con fecha de reset
- Sugerir salidas para la próxima semana

**Membresía vencida**
- Ofrecer reactivación con link directo a MP
- Si es por fallo de pago único, ofrecer extensión de cortesía

---

## Contacto y Siguiente Sprint

Para implementar el frontend y features adicionales, el próximo sprint debería incluir:

1. ✅ Componentes UI del Club del Trekking
2. ✅ Páginas de usuario (landing, calendario, panel)
3. ✅ Sistema de notificaciones push
4. ✅ Cron jobs para automatización
5. ✅ Panel de administración
6. ✅ Testing completo
7. ✅ Deploy y configuración de webhooks

**Estimación:** 2-3 semanas para MVP completo con frontend.

---

Creado por Claude Code - $(date +'%Y-%m-%d')
