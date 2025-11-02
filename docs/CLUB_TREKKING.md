# Club del Trekking by Trivo - Documentación Técnica

## 1. Visión General

El Club del Trekking es una membresía mensual que permite a los usuarios acceder a todas las salidas low cost del mes en Tucumán, con un sistema de reserva, check-in y experiencia centralizada.

### Objetivos
- Convertir el trekking en un hábito recurrente y accesible
- Profesionalizar la industria del outdoor local
- Generar modelo sostenible para guías, usuarios y plataforma

### Precio y Acceso
- **Precio mensual**: $25,000 ARS
- **Acceso**: Ilimitado a salidas low cost (precio ≤ $10,000)
- **Deporte incluido**: Solo salidas de **Trekking** (excluye Ciclismo y Running)
- **Límite operativo**: 2 salidas por semana
- **Excluidas**: Salidas premium (alta montaña, travesías largas) y otros deportes

---

## 2. Arquitectura de Datos

### 2.1 Modelo `ClubTrekkingMembership`

```typescript
{
  // Identificación
  userId: ObjectId (ref: User) - Usuario miembro

  // Estado de membresía
  estado: enum ['activa', 'pausada', 'vencida', 'cancelada']

  // Período de suscripción
  fechaInicio: Date - Inicio de la membresía actual
  fechaFin: Date - Fin del período mensual
  proximaFechaPago: Date - Próxima fecha de renovación

  // Información de pago
  mercadoPago: {
    preapprovalId: String (unique) - ID de suscripción en MP
    payerId: String - ID del pagador
    status: String - Estado en MP
  }

  // Uso mensual
  usoMensual: {
    salidasRealizadas: Number - Contador de salidas del mes
    limiteSemanal: Number - Default: 2
    ultimaResetFecha: Date - Última vez que se reseteó el contador
  }

  // Historial
  historialSalidas: [{
    salidaId: ObjectId (ref: SalidaSocial)
    fecha: Date
    checkInRealizado: Boolean
  }]

  // Metadata
  fechaCancelacion: Date
  motivoCancelacion: String

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

### 2.2 Modificaciones en `User`

Agregar campos para identificación visual:

```typescript
clubTrekking: {
  esMiembro: Boolean - Flag rápido para queries
  membershipId: ObjectId (ref: ClubTrekkingMembership)
  badge: {
    activo: Boolean
    tipoMiembro: String - 'bronce', 'plata', 'oro' (futuro)
  }
}
```

### 2.3 Modificaciones en `SalidaSocial`

Agregar indicadores de elegibilidad:

```typescript
clubTrekking: {
  incluidaEnMembresia: Boolean - Si precio ≤ $10,000 Y deporte === "Trekking"
  requiereCheckIn: Boolean - Si requiere check-in presencial
  cupoMiembros: Number - Cupo reservado para miembros
  miembrosActuales: Number - Contador de miembros inscritos
}
```

**Criterios de inclusión:**
Una salida está incluida en la membresía si cumple:
1. ✅ `precio > 0` y `precio <= $10,000`
2. ✅ `deporte === "Trekking"` (NO Ciclismo ni Running)

### 2.4 Modificaciones en `MiembroSalida`

Agregar tracking de uso de membresía:

```typescript
usaMembresiaClub: Boolean - Si usa membresía en vez de pago individual
checkIn: {
  realizado: Boolean
  fecha: Date
  ubicacion: { lat: Number, lng: Number }
}
```

---

## 3. Lógica de Negocio

### 3.1 Reglas de Elegibilidad de Salidas

```javascript
function esElegibleParaMembresia(salida) {
  const precio = parseFloat(salida.precio || "0");
  return precio > 0 && precio <= 10000;
}
```

### 3.2 Control de Límite Semanal

```javascript
function puedeReservarSalida(membership, fechaSalida) {
  // Verificar si está en la misma semana
  const inicioSemana = getStartOfWeek(fechaSalida);
  const finSemana = getEndOfWeek(fechaSalida);

  // Contar salidas en esta semana
  const salidasEstaSemana = membership.historialSalidas.filter(h =>
    h.fecha >= inicioSemana && h.fecha <= finSemana
  ).length;

  return salidasEstaSemana < membership.usoMensual.limiteSemanal;
}
```

### 3.3 Reset Mensual

Ejecutar via cron job al inicio de cada mes:

```javascript
async function resetearContadoresMensuales() {
  const memberships = await ClubTrekkingMembership.find({
    estado: 'activa'
  });

  for (const membership of memberships) {
    const ahora = new Date();
    const unMesDespues = new Date(membership.fechaInicio);
    unMesDespues.setMonth(unMesDespues.getMonth() + 1);

    if (ahora >= unMesDespues) {
      membership.usoMensual.salidasRealizadas = 0;
      membership.usoMensual.ultimaResetFecha = ahora;
      membership.fechaInicio = ahora;
      membership.fechaFin = new Date(ahora.setMonth(ahora.getMonth() + 1));
      await membership.save();
    }
  }
}
```

### 3.4 Sistema de Check-In

```javascript
async function realizarCheckIn(membershipId, salidaId, ubicacion) {
  // Verificar proximidad geográfica (ej: 100m)
  const salida = await SalidaSocial.findById(salidaId);
  const distancia = calcularDistancia(
    ubicacion,
    salida.locationCoords
  );

  if (distancia > 100) {
    throw new Error("Debes estar en el punto de encuentro");
  }

  // Registrar check-in
  const miembro = await MiembroSalida.findOne({
    usuario_id: membership.userId,
    salida_id: salidaId
  });

  miembro.checkIn = {
    realizado: true,
    fecha: new Date(),
    ubicacion
  };

  await miembro.save();

  // Actualizar historial de membresía
  membership.historialSalidas.push({
    salidaId,
    fecha: new Date(),
    checkInRealizado: true
  });

  await membership.save();
}
```

---

## 4. API Endpoints

### 4.1 Gestión de Membresía

#### `POST /api/club-trekking/subscribe`
Crear nueva suscripción al Club del Trekking

**Request Body:**
```json
{
  "userId": "string",
  "paymentMethodId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "membership": {
    "_id": "string",
    "estado": "activa",
    "fechaInicio": "ISO Date",
    "fechaFin": "ISO Date"
  },
  "initPoint": "https://mercadopago.com/..."
}
```

#### `GET /api/club-trekking/membership/:userId`
Obtener membresía activa del usuario

**Response:**
```json
{
  "membership": {
    "_id": "string",
    "estado": "activa",
    "usoMensual": {
      "salidasRealizadas": 2,
      "limiteSemanal": 2
    },
    "proximaFechaPago": "ISO Date"
  }
}
```

#### `POST /api/club-trekking/cancel`
Cancelar membresía

**Request Body:**
```json
{
  "membershipId": "string",
  "motivo": "string"
}
```

#### `POST /api/club-trekking/pause`
Pausar membresía (máximo 1 vez cada 3 meses)

**Request Body:**
```json
{
  "membershipId": "string"
}
```

### 4.2 Salidas y Reservas

#### `GET /api/club-trekking/salidas-disponibles`
Listar salidas incluidas en la membresía

**Query Params:**
- `fecha`: Filtrar por fecha
- `dificultad`: Filtrar por dificultad
- `lugar`: Filtrar por ubicación

**Response:**
```json
{
  "salidas": [{
    "_id": "string",
    "nombre": "string",
    "fecha": "string",
    "precio": "string",
    "clubTrekking": {
      "incluidaEnMembresia": true,
      "cupoMiembros": 10,
      "miembrosActuales": 5
    }
  }]
}
```

#### `POST /api/club-trekking/reservar`
Reservar salida usando membresía

**Request Body:**
```json
{
  "membershipId": "string",
  "salidaId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "reserva": {
    "_id": "string",
    "usaMembresiaClub": true
  },
  "salidasRestantesEstaSemana": 1
}
```

#### `POST /api/club-trekking/check-in`
Realizar check-in en una salida

**Request Body:**
```json
{
  "membershipId": "string",
  "salidaId": "string",
  "ubicacion": {
    "lat": -26.8083,
    "lng": -65.2176
  }
}
```

### 4.3 Estadísticas

#### `GET /api/club-trekking/stats/:userId`
Obtener estadísticas del usuario en el club

**Response:**
```json
{
  "stats": {
    "totalSalidas": 12,
    "salidasEsteMes": 4,
    "diasConsecutivos": 3,
    "lugaresVisitados": 8,
    "kmRecorridos": 45.2
  }
}
```

---

## 5. Integración con Frontend

### 5.1 Componentes a Crear

#### `ClubTrekkingBadge.tsx`
Badge visual para usuarios miembros

```tsx
interface ClubTrekkingBadgeProps {
  variant: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}
```

#### `ClubTrekkingHero.tsx`
Hero section para landing del club

#### `ClubCalendar.tsx`
Calendario de salidas disponibles con filtros

#### `MembershipStatus.tsx`
Widget mostrando estado de membresía en el perfil

#### `CheckInButton.tsx`
Botón para realizar check-in con validación de ubicación

### 5.2 Hooks Personalizados

#### `useClubMembership.ts`
```typescript
export function useClubMembership(userId: string) {
  // Obtener membresía
  // Verificar estado
  // Métodos: subscribe, cancel, pause
}
```

#### `useCheckIn.ts`
```typescript
export function useCheckIn(salidaId: string) {
  // Obtener ubicación actual
  // Validar proximidad
  // Realizar check-in
}
```

### 5.3 Páginas a Crear

1. `/club-trekking` - Landing page
2. `/club-trekking/calendario` - Calendario de salidas
3. `/club-trekking/mi-membresia` - Panel de membresía
4. `/club-trekking/estadisticas` - Estadísticas personales

---

## 6. Integración con MercadoPago

### 6.1 Crear Suscripción

```javascript
async function crearSuscripcionMP(userId, email) {
  const preference = {
    reason: "Club del Trekking - Membresía Mensual",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 25000,
      currency_id: "ARS"
    },
    payer_email: email,
    back_url: `${process.env.NEXTAUTH_URL}/club-trekking/success`,
    external_reference: userId
  };

  const response = await mercadopago.preapproval.create(preference);
  return response.body;
}
```

### 6.2 Webhook Handler

```javascript
// POST /api/webhooks/mercadopago/club-trekking
async function handleWebhook(req, res) {
  const { type, data } = req.body;

  if (type === "payment") {
    const payment = await mercadopago.payment.get(data.id);
    const membership = await ClubTrekkingMembership.findOne({
      "mercadoPago.preapprovalId": payment.preapproval_id
    });

    if (payment.status === "approved") {
      membership.estado = "activa";
      membership.proximaFechaPago = calcularProximaFecha();
    } else if (payment.status === "rejected") {
      membership.estado = "vencida";
    }

    await membership.save();
  }
}
```

---

## 7. Sistema de Notificaciones

### 7.1 Eventos a Notificar

1. **Bienvenida al Club** - Al suscribirse
2. **Nueva salida disponible** - Cuando se publica salida elegible
3. **Recordatorio de salida** - 24h antes
4. **Recordatorio de check-in** - 1h antes
5. **Límite semanal alcanzado** - Al llegar al límite
6. **Renovación exitosa** - Cuando se procesa pago mensual
7. **Renovación fallida** - Si falla el pago
8. **Estadísticas mensuales** - Resumen fin de mes

### 7.2 Implementación con Firebase FCM

```typescript
async function enviarNotificacionClub(
  userId: string,
  tipo: string,
  data: any
) {
  const tokens = await FCMToken.find({ userId });

  const message = {
    notification: {
      title: getTitleByType(tipo),
      body: getBodyByType(tipo, data)
    },
    data: {
      tipo,
      ...data
    },
    tokens: tokens.map(t => t.token)
  };

  await admin.messaging().sendMulticast(message);
}
```

---

## 8. Tracking con Mixpanel

### 8.1 Eventos a Trackear

```typescript
// Suscripción
trackEvent('Club Trekking - Subscribed', {
  plan: 'monthly',
  price: 25000
});

// Cancelación
trackEvent('Club Trekking - Cancelled', {
  reason: motivo,
  months_active: mesesActivos
});

// Reserva de salida
trackEvent('Club Trekking - Salida Reserved', {
  salida_id: salidaId,
  salidas_usadas_semana: salidasUsadas
});

// Check-in
trackEvent('Club Trekking - Check In', {
  salida_id: salidaId,
  on_time: esAPuntual
});

// Uso mensual
trackEvent('Club Trekking - Monthly Summary', {
  total_salidas: totalSalidas,
  km_recorridos: kmTotales
});
```

---

## 9. Migración y Despliegue

### 9.1 Script de Migración

```bash
npm run migrate:club-trekking
```

Tareas:
1. Crear índices en MongoDB
2. Actualizar salidas existentes con campo `clubTrekking.incluidaEnMembresia`
3. Crear membresías de prueba para testing

### 9.2 Variables de Entorno

```env
# Club del Trekking
CLUB_TREKKING_PRICE=25000
CLUB_TREKKING_MAX_SALIDA_PRICE=10000
CLUB_TREKKING_WEEKLY_LIMIT=2
CLUB_TREKKING_CHECK_IN_RADIUS_METERS=100
```

---

## 10. Testing

### 10.1 Casos de Prueba

1. ✅ Usuario se suscribe exitosamente
2. ✅ Usuario no puede reservar más de 2 salidas/semana
3. ✅ Usuario no puede usar membresía en salida >$10,000
4. ✅ Check-in falla si está lejos del punto de encuentro
5. ✅ Contador se resetea correctamente cada mes
6. ✅ Webhook procesa pago exitoso
7. ✅ Webhook procesa pago rechazado
8. ✅ Usuario pausa y reactiva membresía
9. ✅ Usuario cancela y no puede acceder a beneficios

### 10.2 Testing de Integración

```bash
# Crear membresía de prueba
npm run test:club-trekking:create

# Simular ciclo mensual completo
npm run test:club-trekking:cycle

# Probar webhooks de MP
npm run test:club-trekking:webhooks
```

---

## 11. Futuras Mejoras

### Fase 2
- [ ] Niveles de membresía (Bronce, Plata, Oro)
- [ ] Sistema de referidos y descuentos
- [ ] Integración con Strava para badges automáticos
- [ ] Gamificación: logros, desafíos mensuales
- [ ] Comunidad: chat grupal, foro

### Fase 3
- [ ] Expansión a otras provincias
- [ ] Membresía anual con descuento
- [ ] Modalidad familiar
- [ ] Eventos exclusivos para miembros
- [ ] Tienda de merchandising

---

## 12. Soporte y Mantenimiento

### Monitoreo
- Dashboard de métricas clave: suscripciones activas, tasa de cancelación, uso promedio
- Alertas automáticas: pagos fallidos, check-ins anormales
- Logs detallados de todas las transacciones

### Documentación para Administradores
- Guía de gestión de membresías
- Procedimientos de soporte al cliente
- FAQ para usuarios del club
