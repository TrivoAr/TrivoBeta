# Sistema de Suscripciones con Trial Gratuito

Sistema completo de suscripciones mensuales para academias con período de prueba gratuito (estilo Netflix) integrado con Mercado Pago.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Configuración](#configuración)
- [Arquitectura](#arquitectura)
- [Flujo de Usuario](#flujo-de-usuario)
- [API Endpoints](#api-endpoints)
- [Modelos de Datos](#modelos-de-datos)
- [Cambiar Modelo de Negocio](#cambiar-modelo-de-negocio)

---

## Descripción General

### Características Principales

✅ **Trial Gratuito Híbrido**: 1 clase gratis O 7 días (lo que suceda primero)
✅ **Trial Global**: Usuario puede usar trial solo una vez en su vida (configurable a "por academia")
✅ **Cobro Automático**: Integración con Mercado Pago Preapproval
✅ **Sistema de Asistencias**: Registro y control de clases
✅ **Gestión de Suscripciones**: Pausar, cancelar, reactivar
✅ **Webhooks**: Sincronización automática con Mercado Pago

---

## Configuración

### 1. Archivo de Configuración Central

**Ubicación**: `src/config/subscription.config.ts`

```typescript
export const SUBSCRIPTION_CONFIG = {
  TRIAL: {
    TYPE: "global",              // "global" o "por-academia"
    MAX_CLASES_GRATIS: 1,        // Número de clases gratis
    MAX_DIAS_GRATIS: 7,          // Días de trial gratuito
    ENABLED: true,               // Activar/desactivar trial
  },

  SUBSCRIPTION: {
    FREQUENCY: 1,                // Frecuencia de cobro
    FREQUENCY_TYPE: "months",    // "months" o "days"
    CURRENCY: "ARS",             // Moneda
  },

  ESTADOS: {
    TRIAL: "trial",
    ACTIVA: "activa",
    VENCIDA: "vencida",
    PAUSADA: "pausada",
    CANCELADA: "cancelada",
  },
};
```

### 2. Variables de Entorno

Asegúrate de tener configuradas:

```env
MONGODB_URI=<tu_mongodb_uri>
NEXTAUTH_URL=<tu_url_base>
NEXTAUTH_SECRET=<tu_secret>
```

### 3. Configurar Webhook en Mercado Pago

1. Ir a https://www.mercadopago.com.ar/developers/panel/app
2. Seleccionar tu aplicación
3. Ir a "Webhooks"
4. Agregar URL: `https://tu-dominio.com/api/webhooks/mercadopago-subscriptions`
5. Seleccionar eventos:
   - `subscription_preapproval`
   - `payment.created`
   - `payment.updated`

---

## Arquitectura

### Estructura de Archivos

```
src/
├── config/
│   └── subscription.config.ts          # Configuración central
├── models/
│   ├── Suscripcion.ts                  # Modelo de suscripción
│   ├── Asistencia.ts                   # Modelo de asistencias
│   └── User.ts                         # Extendido con trialConfig
├── services/
│   ├── subscriptionService.ts          # Lógica de negocio de suscripciones
│   └── mercadopagoService.ts           # Integración con Mercado Pago
└── app/api/
    ├── subscriptions/
    │   ├── create/route.ts             # Crear suscripción
    │   ├── user/route.ts               # Listar suscripciones
    │   └── [id]/route.ts               # Obtener/Actualizar/Cancelar
    ├── asistencias/
    │   ├── registrar/route.ts          # Registrar asistencia
    │   └── grupo/[grupoId]/route.ts    # Ver asistencias de grupo
    └── webhooks/
        └── mercadopago-subscriptions/route.ts  # Webhook de MP
```

---

## Flujo de Usuario

### 1. Usuario se Une a Academia

```
Usuario → Ver Academia → Botón "Unirse"
    ↓
Sistema verifica elegibilidad para trial
    ↓
┌─────────────────────────────────────┐
│ ¿Ya usó trial anteriormente?       │
└─────────────────────────────────────┘
        ↓                    ↓
       NO                   SÍ
        ↓                    ↓
Crear suscripción       Crear preapproval MP
   en "trial"           + Cobrar primer mes
        ↓                    ↓
Trial activado         Suscripción "activa"
```

### 2. Asistencia a Clases (Trial)

```
Usuario asiste a clase 1 → Gratis ✓
    ↓
Usuario asiste a clase 2
    ↓
Trial expirado (1 clase usada)
    ↓
Sistema crea preapproval en MP
    ↓
Usuario completa pago
    ↓
Suscripción → "activa"
User.trialConfig.haUsadoTrial = true
```

### 3. Modelo Híbrido

El trial expira cuando se cumple **cualquiera** de estas condiciones:

- ✅ Asiste a más de `MAX_CLASES_GRATIS` clases
- ✅ Han pasado más de `MAX_DIAS_GRATIS` días desde el inicio

**Ejemplo**:
- Usuario se une el día 1
- Asiste a 1 clase el día 3 (trial válido)
- No asiste más → día 8 expira por tiempo
- O asiste a clase 2 antes del día 8 → expira por clases

---

## API Endpoints

### Suscripciones

#### `POST /api/subscriptions/create`

Crea una nueva suscripción.

**Body**:
```json
{
  "academiaId": "676d77e5f3f8a00014d9d3e4",
  "grupoId": "676d77e5f3f8a00014d9d3e5"  // opcional
}
```

**Response (con trial)**:
```json
{
  "success": true,
  "suscripcion": { ... },
  "elegibilidad": {
    "puedeUsarTrial": true,
    "yaUsoTrial": false
  },
  "message": "Suscripción creada con trial gratuito"
}
```

**Response (sin trial)**:
```json
{
  "success": true,
  "suscripcion": { ... },
  "mercadoPago": {
    "initPoint": "https://www.mercadopago.com.ar/...",
    "preapprovalId": "2c9380848d2e1234"
  },
  "message": "Suscripción creada, completa el pago para activarla"
}
```

#### `GET /api/subscriptions/user`

Obtiene todas las suscripciones del usuario.

**Response**:
```json
{
  "suscripciones": [
    {
      "_id": "...",
      "academiaId": { "nombre_academia": "...", "imagen": "..." },
      "estado": "activa",
      "trial": { ... },
      "pagos": { "proximaFechaPago": "2025-11-01" }
    }
  ]
}
```

#### `GET /api/subscriptions/[id]`

Obtiene detalles de una suscripción específica.

**Response**:
```json
{
  "suscripcion": { ... },
  "estadisticas": {
    "totalAsistencias": 12,
    "asistenciasTrial": 1,
    "asistenciasPagas": 11
  }
}
```

#### `PUT /api/subscriptions/[id]`

Pausa o cancela una suscripción.

**Body**:
```json
{
  "action": "pause"  // o "cancel"
}
```

**Response**:
```json
{
  "success": true,
  "suscripcion": { ... },
  "message": "Suscripción pausada correctamente"
}
```

### Asistencias

#### `POST /api/asistencias/registrar`

Registra la asistencia de un alumno (solo profesor/dueño).

**Body**:
```json
{
  "userId": "676d77e5f3f8a00014d9d3e6",
  "grupoId": "676d77e5f3f8a00014d9d3e5",
  "fecha": "2025-10-01T10:00:00Z"  // opcional, default: ahora
}
```

**Response (trial activo)**:
```json
{
  "success": true,
  "asistencia": { ... },
  "suscripcion": { ... },
  "message": "Asistencia registrada correctamente"
}
```

**Response (trial expirado)**:
```json
{
  "success": true,
  "asistencia": { ... },
  "trialExpirado": true,
  "mercadoPago": {
    "initPoint": "https://www.mercadopago.com.ar/...",
    "preapprovalId": "..."
  },
  "message": "Asistencia registrada. Trial expirado, se requiere configurar pago."
}
```

#### `GET /api/asistencias/grupo/[grupoId]?fecha=2025-10-01`

Obtiene asistencias de un grupo en una fecha.

**Response**:
```json
{
  "grupo": { ... },
  "fecha": "2025-10-01T00:00:00Z",
  "asistencias": [
    {
      "userId": { "firstname": "Juan", "imagen": "..." },
      "asistio": true,
      "esTrial": false,
      "suscripcionId": { "estado": "activa" }
    }
  ],
  "miembros": [ ... ],  // solo si es profesor/dueño
  "permisos": {
    "puedeRegistrarAsistencias": true
  }
}
```

---

## Modelos de Datos

### Suscripcion

```typescript
{
  userId: ObjectId,
  academiaId: ObjectId,
  grupoId: ObjectId,
  estado: "trial" | "activa" | "vencida" | "pausada" | "cancelada",

  trial: {
    estaEnTrial: boolean,
    fechaInicio: Date,
    fechaFin: Date,
    clasesAsistidas: number,
    fueUsado: boolean
  },

  mercadoPago: {
    preapprovalId: string,
    initPoint: string,
    status: string,
    payerEmail: string
  },

  pagos: {
    monto: number,
    moneda: string,
    frecuencia: number,
    tipoFrecuencia: "months" | "days",
    proximaFechaPago: Date,
    ultimaFechaPago: Date
  }
}
```

### Asistencia

```typescript
{
  userId: ObjectId,
  academiaId: ObjectId,
  grupoId: ObjectId,
  suscripcionId: ObjectId,
  fecha: Date,
  asistio: boolean,
  esTrial: boolean,
  notas: string,
  registradoPor: ObjectId
}
```

### User (extensión)

```typescript
{
  // ... campos existentes

  trialConfig: {
    haUsadoTrial: boolean,
    tipoTrial: "global" | "por-academia",
    academiasConTrial: [ObjectId]
  }
}
```

---

## Cambiar Modelo de Negocio

### Cambiar de Trial Global a Trial por Academia

**Archivo**: `src/config/subscription.config.ts`

```typescript
export const SUBSCRIPTION_CONFIG = {
  TRIAL: {
    TYPE: "por-academia",  // ← Cambiar esto
    // ...
  },
};
```

El sistema automáticamente:
- ✅ Permite trial en cada academia nueva
- ✅ Registra en `user.trialConfig.academiasConTrial`
- ✅ Valida que no haya usado trial en ESA academia específica

### Cambiar Límites de Trial

```typescript
export const SUBSCRIPTION_CONFIG = {
  TRIAL: {
    MAX_CLASES_GRATIS: 2,      // 2 clases gratis
    MAX_DIAS_GRATIS: 14,       // 14 días de trial
    // ...
  },
};
```

### Desactivar Trial Completamente

```typescript
export const SUBSCRIPTION_CONFIG = {
  TRIAL: {
    ENABLED: false,  // ← Desactivar trial
    // ...
  },
};
```

Todos los nuevos usuarios pagarán desde el inicio.

### Cambiar Frecuencia de Cobro

```typescript
export const SUBSCRIPTION_CONFIG = {
  SUBSCRIPTION: {
    FREQUENCY: 3,                // Cada 3 meses
    FREQUENCY_TYPE: "months",
    // ...
  },
};
```

---

## Servicios Reutilizables

### subscriptionService

Todas las operaciones de suscripciones deben usar este servicio:

```typescript
import { subscriptionService } from "@/services/subscriptionService";

// Verificar elegibilidad
const elegibilidad = await subscriptionService.verificarElegibilidadTrial(
  userId,
  academiaId
);

// Crear suscripción
const { suscripcion, requiereConfiguracionPago } =
  await subscriptionService.crearSuscripcion({
    userId,
    academiaId,
    grupoId,
    monto: 5000
  });

// Registrar asistencia
const resultado = await subscriptionService.registrarAsistencia({
  userId,
  academiaId,
  grupoId,
  fecha: new Date()
});

// Activar post-trial
await subscriptionService.activarSuscripcionPostTrial(suscripcionId);
```

### mercadopagoService

Integración con Mercado Pago:

```typescript
import { mercadopagoService } from "@/services/mercadopagoService";

// Crear preapproval
const mpResult = await mercadopagoService.crearPreapproval(
  duenioId,
  {
    userId,
    academiaId,
    userEmail,
    razon: "Suscripción a...",
    monto: 5000,
    conTrial: false,
    externalReference: "sub_123_456_789"
  }
);

// Cancelar suscripción
await mercadopagoService.cancelarPreapproval(
  duenioId,
  preapprovalId
);
```

---

## Métodos del Modelo Suscripcion

```typescript
// Verificar si trial expiró (modelo híbrido)
suscripcion.haExpiradoTrial()  // → boolean

// Verificar si puede asistir a clases
suscripcion.puedeAsistir()     // → boolean

// Activar suscripción post-trial
suscripcion.activarSuscripcion()
```

---

## Testing del Sistema

### 1. Verificar Trial Primera Vez

```bash
# Usuario nuevo se une a academia
POST /api/subscriptions/create
{
  "academiaId": "..."
}

# Debe recibir trial gratuito
```

### 2. Asistir a Clase en Trial

```bash
# Registrar asistencia (como profesor)
POST /api/asistencias/registrar
{
  "userId": "...",
  "grupoId": "..."
}

# Verificar que esTrial: true
```

### 3. Expirar Trial

```bash
# Registrar segunda asistencia
POST /api/asistencias/registrar
{
  "userId": "...",
  "grupoId": "..."
}

# Debe recibir trialExpirado: true + initPoint de MP
```

### 4. Webhook de Pago

Simular webhook de Mercado Pago:

```bash
POST /api/webhooks/mercadopago-subscriptions
{
  "type": "subscription_preapproval",
  "action": "payment.created",
  "data": {
    "id": "preapproval_id",
    "payment_id": "payment_123",
    "status": "approved"
  }
}

# Verificar que suscripción pase a "activa"
```

---

## Troubleshooting

### Usuario no puede asistir

```typescript
const { puedeAsistir, razon } = await subscriptionService.verificarPuedeAsistir(
  userId,
  grupoId
);

console.log(puedeAsistir, razon);
// false, "Trial expirado, debe activar suscripción"
```

### Suscripción no se activa

1. Verificar que webhook esté configurado en Mercado Pago
2. Ver logs del webhook: `/api/webhooks/mercadopago-subscriptions`
3. Verificar que `preapprovalId` coincida

### Trial no funciona

1. Verificar `SUBSCRIPTION_CONFIG.TRIAL.ENABLED = true`
2. Verificar `user.trialConfig.haUsadoTrial = false`
3. Ver logs de elegibilidad

---

## Próximos Pasos

- [ ] Implementar UI de gestión de suscripciones
- [ ] Dashboard para profesores con asistencias
- [ ] Notificaciones de pagos
- [ ] Sistema de reportes y métricas

---

## Soporte

Para dudas o problemas:
- Revisar logs en consola
- Verificar configuración en `subscription.config.ts`
- Consultar documentación de Mercado Pago: https://www.mercadopago.com.ar/developers/es/docs/subscriptions

---

**Versión**: 1.0.0
**Última actualización**: 2025-10-01
