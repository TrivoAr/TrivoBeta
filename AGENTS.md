# AGENTS.md

Esta guía técnica documenta las reglas, patrones, arquitectura y funciones críticas del proyecto **Trivo/Klubo MVP**. Es una referencia completa para agentes de desarrollo y colaboradores.

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Reglas de Desarrollo](#reglas-de-desarrollo)
4. [Modelos de Base de Datos](#modelos-de-base-de-datos)
5. [Patrones de API](#patrones-de-api)
6. [Autenticación y Sesiones](#autenticación-y-sesiones)
7. [Sistema de Suscripciones](#sistema-de-suscripciones)
8. [Sistema de Notificaciones](#sistema-de-notificaciones)
9. [Funciones Reutilizables](#funciones-reutilizables)
10. [Hooks Personalizados](#hooks-personalizados)
11. [Componentes Principales](#componentes-principales)
12. [Integración con Terceros](#integración-con-terceros)
13. [Convenciones de Código](#convenciones-de-código)
14. [Variables de Entorno](#variables-de-entorno)

---

## 🏗️ Arquitectura General

### Estructura del Proyecto

```
Klubo_Mvp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # Endpoints REST
│   │   ├── (pages)/           # Páginas de la aplicación
│   │   └── layout.tsx         # Layout principal
│   ├── components/            # Componentes React reutilizables
│   ├── hooks/                 # Custom React Hooks
│   ├── libs/                  # Librerías y utilidades
│   ├── models/                # Modelos de Mongoose
│   ├── services/              # Lógica de negocio
│   ├── config/                # Configuraciones
│   └── utils/                 # Funciones auxiliares
├── server.js                  # Servidor personalizado con Socket.IO
├── public/                    # Archivos estáticos
└── scripts/                   # Scripts de mantenimiento
```

### Principios Arquitectónicos

1. **Separation of Concerns**: Modelos, servicios y controladores (API routes) separados
2. **Mobile-First**: Ancho fijo de 390px optimizado para móviles
3. **Real-time**: Socket.IO para notificaciones en tiempo real
4. **Serverless-Ready**: Compatible con despliegue en Vercel
5. **Type Safety**: TypeScript para mayor seguridad de tipos

---

## 🛠️ Stack Tecnológico

### Core
- **Framework**: Next.js 13 con App Router
- **Runtime**: Node.js
- **Lenguaje**: TypeScript 5.1.3
- **Styling**: Tailwind CSS 3.3.2 + shadcn/ui

### Base de Datos
- **ODM**: Mongoose 7.2.3
- **Database**: MongoDB (Atlas)
- **Conexión**: Pooling con máximo 10 conexiones

### Autenticación
- **Auth Provider**: NextAuth.js 4.22.1
- **Strategies**: Credentials, Google OAuth
- **Session**: JWT (10 minutos de expiración)

### Pagos
- **MercadoPago**: SDK React + backend integration
- **Suscripciones**: Sistema de preapproval

### Notificaciones
- **Real-time**: Socket.IO 4.8.1
- **Push**: Web Push (VAPID)
- **FCM**: Firebase Cloud Messaging

### Maps & GPS
- **Mapbox GL**: Mapas interactivos
- **MapLibre**: Alternativa open-source
- **Strava**: Integración de rutas y actividades

### File Storage
- **Firebase Storage**: Imágenes de perfil, eventos, academias
- **Fallback**: ui-avatars.com para avatares

### Otras Dependencias Clave
- **TanStack Query**: Data fetching y caché
- **React Hook Form**: Formularios
- **React Hot Toast**: Notificaciones UI
- **PDFKit**: Generación de PDFs
- **QRCode**: Generación de códigos QR
- **XLSX**: Exportación a Excel

---

## 📜 Reglas de Desarrollo

### 1. Conexión a Base de Datos

**SIEMPRE** usar `connectDB()` antes de operaciones de base de datos:

```typescript
import connectDB from "@/libs/mongodb";

export async function GET() {
  await connectDB();
  // ... operaciones de DB
}
```

**Características de la conexión:**
- Caché global para reutilización
- Pooling de conexiones (maxPoolSize: 10)
- Buffer de comandos deshabilitado
- Validación de MONGODB_URI obligatoria

**Ubicación**: `src/libs/mongodb.ts:12-24`

---

### 2. Autenticación en APIs

**Patrón estándar** para rutas protegidas:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const userId = session.user.id;
  // ... lógica protegida
}
```

**Ubicación de authOptions**: `src/libs/authOptions.ts:8-149`

---

### 3. Manejo de Errores

**Patrón recomendado:**

```typescript
export async function POST(request: Request) {
  try {
    await connectDB();
    // ... operaciones

    return Response.json({ success: true, data });
  } catch (error: any) {
    console.error("❌ Error en [ruta]:", error);

    // En producción, devolver errores genéricos
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

**Reglas:**
- Siempre usar try-catch en rutas API
- Log detallado con emoji para fácil búsqueda
- En producción, NO exponer detalles internos
- Para listas vacías, devolver `[]` en lugar de error 500

---

### 4. Registro de Modelos Mongoose

**Prevenir re-registro:**

```typescript
import { Schema, model, models } from "mongoose";

const MySchema = new Schema({...});

const MyModel = models.MyModel || model("MyModel", MySchema);
export default MyModel;
```

**Importante**: Siempre usar `models.NombreModelo || model()` para evitar errores en Hot Reload

---

### 5. Manejo de Imágenes

**Patrón de carga:**

1. **Frontend**: Subir a Firebase Storage
2. **Guardar URL** en MongoDB
3. **Fallback**: ui-avatars.com para avatares

```typescript
// Ejemplo de URL de fallback
const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
  firstname || "U"
)}&length=1&background=random&color=fff&size=128`;
```

**Dominios permitidos** (next.config.js):
- firebasestorage.googleapis.com
- ui-avatars.com

---

### 6. TypeScript Best Practices

- Usar tipos explícitos en parámetros de funciones
- Evitar `any` cuando sea posible
- Aprovechar tipos de Next.js (NextRequest, NextResponse)
- Definir interfaces para objetos complejos
- `strict: false` en tsconfig (por legado, mejorar gradualmente)

---

## 🗄️ Modelos de Base de Datos

### Diagrama de Relaciones

```
User (usuarios del sistema)
  │
  ├──> Academia (dueño_id)
  │     │
  │     ├──> Grupo (academia_id)
  │     │     │
  │     │     └──> Asistencia (grupoId)
  │     │           │
  │     │           └──> Suscripcion (suscripcionId)
  │     │
  │     └──> UsuarioAcademia (user_id, academia_id)
  │           └──> Pago (userId, academiaId)
  │
  ├──> SalidaSocial (creador_id)
  │     │
  │     └──> MiembroSalida (usuario_id, salida_id)
  │           └──> Pago (userId, salidaId)
  │
  ├──> TeamSocial (creadorId)
  │     │
  │     └──> MiembroTeamSocial (usuario_id, teamsocial_id)
  │
  ├──> Suscripcion (userId, academiaId)
  │
  ├──> Notificacion (userId, fromUserId)
  │
  └──> Subscription (user_id) [Web Push]
```

---

### User (Usuarios)

**Archivo**: `src/models/User.ts`

```typescript
{
  email: String (unique, required),
  fromOAuth: Boolean,
  password: String (required si no OAuth, select: false),
  firstname: String (required, 3-20 chars),
  lastname: String (required, 3-20 chars),
  rol: "alumno" | "profe" | "dueño de academia" | "admin",
  telnumber: String (7-19 chars),
  instagram: String,
  facebook: String,
  twitter: String,
  imagen: String (URL),
  bio: String,
  dni: String,

  // Strava Integration
  strava: {
    access_token: String,
    refresh_token: String,
    expires_at: Number,
    athlete_id: Number
  },

  // Favoritos
  favoritos: {
    salidas: [ObjectId -> SalidaSocial],
    academias: [ObjectId -> Academia],
    teamSocial: [ObjectId -> TeamSocial]
  },

  // Trial Configuration
  trialConfig: {
    haUsadoTrial: Boolean (default: false),
    tipoTrial: "global" | "por-academia",
    academiasConTrial: [ObjectId -> Academia]
  },

  // Password Reset
  resetPasswordToken: String (select: false),
  resetPasswordExpire: Date (select: false),
  resetPasswordAttempts: Number (default: 0)
}
```

**Índices**: email (unique)

---

### SalidaSocial (Eventos Sociales)

**Archivo**: `src/models/salidaSocial.ts`

```typescript
{
  nombre: String (required),
  ubicacion: String,
  deporte: String,
  fecha: String,
  hora: String,
  duracion: String,
  descripcion: String,
  whatsappLink: String,
  localidad: String,
  telefonoOrganizador: String,
  imagen: String (URL),
  locationCoords: {
    lat: Number,
    lng: Number
  },
  dificultad: String,
  precio: String,
  creador_id: ObjectId -> User (required),

  // Strava
  stravaActivity: ObjectId -> StravaActivity,
  stravaMap: {
    id: String,
    summary_polyline: String,
    polyline: String,
    resource_state: Number
  },

  cupo: Number (required),
  detalles: String,
  provincia: String,
  cbu: String,
  alias: String,
  profesorId: ObjectId -> User,
  shortId: String (unique, index),
  sponsors: [ObjectId -> Sponsors]
}
```

**Timestamps**: createdAt, updatedAt

---

### TeamSocial (Equipos/Grupos Recurrentes)

**Archivo**: `src/models/teamSocial.ts`

```typescript
{
  nombre: String (required),
  ubicacion: String (required),
  precio: String (required),
  deporte: String (required),
  fecha: String (required),
  hora: String (required),
  duracion: String (required),
  whatsappLink: String,
  telefonoOrganizador: String,
  localidad: String,
  descripcion: String,
  imagen: String,
  locationCoords: {
    lat: Number,
    lng: Number
  },
  creadorId: ObjectId -> User (required),
  cupo: Number (required),

  // Strava
  stravaActivity: ObjectId -> StravaActivity,
  stravaMap: {
    id: String,
    summary_polyline: String,
    polyline: String,
    resource_state: Number
  },

  cbu: String,
  bar: ObjectId -> Bares,
  sponsors: [ObjectId -> Sponsors],
  provincia: String,
  dificultad: String,
  alias: String
}
```

---

### Academia (Escuelas/Academias)

**Archivo**: `src/models/academia.ts`

```typescript
{
  dueño_id: ObjectId -> User (required),
  nombre_academia: String (required),
  pais: String (required),
  provincia: String (required),
  localidad: String (required),
  descripcion: String,
  tipo_disciplina: "Running" | "Trekking" | "Ciclismo" | "Otros" (required),
  telefono: String,
  imagen: String,
  clase_gratis: Boolean (required),
  precio: String,
  cbu: String,
  alias: String
}
```

**Relaciones**:
- Una academia tiene múltiples Grupos
- Una academia tiene múltiples miembros (UsuarioAcademia)
- Una academia tiene múltiples Suscripciones

---

### Grupo (Clases de Academia)

**Archivo**: `src/models/grupo.ts`

```typescript
{
  academia_id: ObjectId -> Academia (required),
  profesor_id: ObjectId -> User,
  nombre_grupo: String (required),
  nivel: String,
  ubicacion: String,
  horario: String,
  dias: [String] (Enum: Lun, Mar, Mie, Jue, Vie, Sab, Dom) (required),
  descripcion: String,
  imagen: String,
  tipo_grupo: String,
  tiempo_promedio: String,
  locationCoords: {
    lat: Number,
    lng: Number
  }
}
```

---

### Suscripcion (Sistema de Membresías)

**Archivo**: `src/models/Suscripcion.ts`

**Modelo híbrido**: Trial con límite de clases Y días (lo que ocurra primero)

```typescript
{
  // Relaciones
  userId: ObjectId -> User (required, index),
  academiaId: ObjectId -> Academia (required, index),
  grupoId: ObjectId -> Grupo,

  // Estado
  estado: "trial" | "trial_expirado" | "pendiente" | "activa" | "vencida" | "pausada" | "cancelada" (required, index, default: "trial"),

  // Trial
  trial: {
    estaEnTrial: Boolean (default: true),
    fechaInicio: Date (default: Date.now),
    fechaFin: Date,
    clasesAsistidas: Number (default: 0),
    fueUsado: Boolean (default: false)
  },

  // MercadoPago
  mercadoPago: {
    preapprovalId: String (unique, sparse),
    initPoint: String,
    status: String,
    payerId: String,
    payerEmail: String
  },

  // Pagos
  pagos: {
    monto: Number (required),
    moneda: String (default: "ARS"),
    frecuencia: Number (default: 1),
    tipoFrecuencia: "months" | "days" (default: "months"),
    proximaFechaPago: Date,
    ultimaFechaPago: Date
  },

  // Fechas importantes
  fechaActivacion: Date,
  fechaCancelacion: Date,
  fechaPausa: Date,
  motivoCancelacion: String,
  notas: String
}
```

**Índices compuestos**:
- { userId: 1, academiaId: 1 }
- { userId: 1, estado: 1 }
- { academiaId: 1, estado: 1 }
- { "mercadoPago.preapprovalId": 1 }

**Métodos**:
- `haExpiradoTrial()`: Verifica si el trial expiró
- `puedeAsistir()`: Verifica si puede asistir a clases
- `activarSuscripcion()`: Activa después del trial

**Ubicación métodos**: `src/models/Suscripcion.ts:138-177`

---

### MiembroSalida (Participantes de Eventos)

**Archivo**: `src/models/MiembroSalida.ts`

```typescript
{
  usuario_id: ObjectId -> User (required),
  salida_id: ObjectId -> SalidaSocial (required),
  fecha_union: Date (default: Date.now),
  rol: "miembro" | "organizador" (default: "miembro"),
  estado: "pendiente" | "aprobado" | "rechazado" (default: "pendiente"),
  pago_id: ObjectId -> Pago
}
```

---

### MiembroTeamSocial (Miembros de Equipos)

**Archivo**: `src/models/miembrosTeamSocial.ts`

```typescript
{
  usuario_id: ObjectId -> User (required),
  teamsocial_id: ObjectId -> TeamSocial (required),
  fecha_union: Date (default: Date.now),
  rol: "miembro" | "organizador" (default: "miembro")
}
```

---

### Pago (Transacciones)

**Archivo**: `src/models/pagos.ts`

```typescript
{
  // Referencias
  salidaId: ObjectId -> SalidaSocial,
  academiaId: ObjectId -> Academia,
  userId: ObjectId -> User (required),

  // Comprobante manual
  comprobanteUrl: String,
  estado: "pendiente" | "aprobado" | "rechazado" (default: "pendiente"),

  // MercadoPago
  mercadoPagoPaymentId: String (unique, sparse),
  amount: Number,
  currency: String (default: "ARS"),
  paymentMethod: String,
  status: String,
  statusDetail: String,
  externalReference: String,
  mercadoPagoData: Mixed,

  // Tipo
  tipoPago: "transferencia" | "mercadopago" (default: "transferencia")
}
```

---

### Asistencia (Registro de Clases)

**Archivo**: `src/models/Asistencia.ts`

```typescript
{
  userId: ObjectId -> User (required, index),
  academiaId: ObjectId -> Academia (required, index),
  grupoId: ObjectId -> Grupo (required, index),
  suscripcionId: ObjectId -> Suscripcion (required),
  fecha: Date (required, normalizada al inicio del día),
  asistio: Boolean (default: true),
  esTrial: Boolean (default: false),
  registradoPor: ObjectId -> User,
  notas: String
}
```

**Índice compuesto**: { userId: 1, grupoId: 1, fecha: 1 }

---

### Notificacion (Sistema de Notificaciones)

**Archivo**: `src/models/notificacion.ts`

```typescript
{
  userId: ObjectId -> User (required),
  fromUserId: ObjectId -> User,
  type: String (required),
  message: String (required),
  read: Boolean (default: false),
  readAt: Date,
  actionUrl: String,
  actionType: "navigate" | "modal" | "action" (default: "navigate"),
  metadata: Mixed (default: {}),

  // Referencias a entidades
  academiaId: ObjectId -> Academia,
  salidaId: ObjectId -> SalidaSocial,
  teamSocialId: ObjectId -> TeamSocial
}
```

**Tipos de notificaciones**:
- `miembro_aprobado`
- `miembro_rechazado`
- `joined_event`
- `nueva_salida`
- `pago_aprobado`
- `solicitud_academia`
- `solicitud_team`

---

## 🛣️ Patrones de API

### Estructura de Rutas

```
/api/
├── auth/
│   ├── [...nextauth]/          # NextAuth handler
│   ├── signup/                 # Registro de usuarios
│   ├── generate-reset-code/    # Generar código de reset
│   ├── send-reset-code/        # Enviar código por email
│   └── reset-password/         # Resetear contraseña
├── academias/
│   ├── GET/POST                # Listar/Crear academias
│   ├── [id]/
│   │   ├── GET/PUT/DELETE      # CRUD individual
│   │   ├── miembros/           # Gestión de miembros
│   │   ├── grupos/             # Grupos de la academia
│   │   └── editar/             # Edición
│   ├── unirse/                 # Unirse a academia
│   ├── solicitudes/            # Ver solicitudes
│   └── mis/                    # Mis academias
├── social/
│   ├── GET/POST                # Listar/Crear salidas sociales
│   ├── [id]/
│   │   ├── GET/PUT/DELETE      # CRUD individual
│   │   └── pago/               # Gestión de pagos
│   ├── unirse/                 # Unirse a salida
│   │   └── estado/             # Estado de unión
│   ├── miembros/               # Gestión de miembros
│   └── mis-match/              # Salidas en común
├── team-social/                # Similar a social
├── pagos/
│   ├── GET/POST                # Listar/Registrar pagos
│   ├── [id]/                   # Gestión individual
│   └── status/[id]/            # Estado del pago
├── subscriptions/
│   ├── user/                   # Suscripciones del usuario
│   └── [id]/                   # Gestión individual
├── asistencias/
│   ├── registrar/              # Registrar asistencia
│   ├── historial/[grupoId]/    # Historial de grupo
│   └── grupo/[grupoId]/        # Asistencias del grupo
├── notificaciones/
│   ├── GET                     # Listar notificaciones
│   └── [id]/markAsRead/        # Marcar como leída
├── strava/
│   ├── connect/                # Conectar cuenta
│   ├── callback/               # OAuth callback
│   ├── activities/             # Obtener actividades
│   ├── routes/                 # Obtener rutas
│   └── status/                 # Estado de conexión
├── mercadopago/
│   ├── preferences/            # Crear preferencia
│   ├── webhook/                # Webhook de notificaciones
│   └── test/                   # Testing
├── profile/
│   ├── GET/PUT                 # Perfil del usuario
│   └── [id]/                   # Perfil público
├── grupos/                     # CRUD de grupos
├── sponsors/                   # Gestión de sponsors
├── bares/                      # Gestión de bares/venues
└── search/
    ├── GET                     # Búsqueda general
    └── reverse/                # Geocodificación inversa
```

---

### Patrones Comunes

#### 1. GET - Listar Recursos

```typescript
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const filtro = searchParams.get("filtro");

    const recursos = await Modelo.find(filtro ? { campo: filtro } : {})
      .populate("referencia", "campos")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(recursos);
  } catch (error) {
    console.error("❌ Error:", error);
    return Response.json([], { status: 500 });
  }
}
```

---

#### 2. POST - Crear Recurso

```typescript
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("No autorizado", { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { campo1, campo2 } = body;

    // Validaciones
    if (!campo1) {
      return Response.json(
        { error: "campo1 es requerido" },
        { status: 400 }
      );
    }

    const nuevoRecurso = await Modelo.create({
      campo1,
      campo2,
      usuario_id: session.user.id
    });

    return Response.json(nuevoRecurso, { status: 201 });
  } catch (error) {
    console.error("❌ Error:", error);
    return Response.json(
      { error: "Error al crear recurso" },
      { status: 500 }
    );
  }
}
```

---

#### 3. PUT - Actualizar Recurso

```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("No autorizado", { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    // Verificar permisos
    const recurso = await Modelo.findById(params.id);
    if (!recurso) {
      return Response.json(
        { error: "Recurso no encontrado" },
        { status: 404 }
      );
    }

    if (recurso.usuario_id.toString() !== session.user.id) {
      return new Response("No autorizado", { status: 403 });
    }

    const actualizado = await Modelo.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );

    return Response.json(actualizado);
  } catch (error) {
    console.error("❌ Error:", error);
    return Response.json(
      { error: "Error al actualizar" },
      { status: 500 }
    );
  }
}
```

---

#### 4. DELETE - Eliminar Recurso

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("No autorizado", { status: 401 });
    }

    await connectDB();

    const recurso = await Modelo.findById(params.id);
    if (!recurso) {
      return Response.json(
        { error: "Recurso no encontrado" },
        { status: 404 }
      );
    }

    if (recurso.usuario_id.toString() !== session.user.id) {
      return new Response("No autorizado", { status: 403 });
    }

    await Modelo.findByIdAndDelete(params.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("❌ Error:", error);
    return Response.json(
      { error: "Error al eliminar" },
      { status: 500 }
    );
  }
}
```

---

### Códigos de Estado HTTP

| Código | Uso |
|--------|-----|
| 200 | Éxito general (GET, PUT) |
| 201 | Recurso creado (POST) |
| 400 | Bad Request (validación fallida) |
| 401 | No autenticado |
| 403 | No autorizado (sin permisos) |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

---

## 🔐 Autenticación y Sesiones

### NextAuth Configuration

**Archivo**: `src/libs/authOptions.ts`

#### Providers

1. **Credentials Provider**
   - Email + Password
   - Validación con bcrypt
   - Bloqueo si usuario es OAuth-only

2. **Google OAuth Provider**
   - Auto-registro de nuevos usuarios
   - Rol predeterminado: "alumno"
   - Avatar automático con ui-avatars.com

#### Session Strategy

- **Tipo**: JWT
- **Duración**: 10 minutos
- **Auto-refresh**: Mediante callbacks

#### Callbacks

**signIn**: Crea usuario OAuth si no existe

**jwt**: Carga datos completos del usuario desde DB

**session**: Expone datos al cliente + accessToken para Socket.IO

#### Datos de Sesión

```typescript
session.user = {
  id: string,
  email: string,
  firstname: string,
  lastname: string,
  rol: string,
  imagen: string,
  instagram?: string,
  facebook?: string,
  twitter?: string,
  bio?: string,
  favoritos: {
    salidas: ObjectId[],
    academias: ObjectId[],
    teamSocial: ObjectId[]
  },
  strava?: {
    access_token: string,
    refresh_token: string,
    expires_at: number,
    athlete_id: number
  }
}
```

#### Roles de Usuario

- **alumno**: Usuario estándar
- **profe**: Profesor/instructor
- **dueño de academia**: Propietario de academia
- **admin**: Administrador del sistema

---

### Protección de Rutas

#### En API Routes

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

const session = await getServerSession(authOptions);
if (!session) {
  return new Response("No autorizado", { status: 401 });
}
```

#### En Server Components

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // ... contenido protegido
}
```

#### En Client Components

```typescript
"use client";
import { useSession } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();

  if (status === "loading") return <Loader />;
  if (!session) return <LoginPrompt />;

  // ... contenido protegido
}
```

---

## 💳 Sistema de Suscripciones

### Configuración Central

**Archivo**: `src/config/subscription.config.ts`

```typescript
export const SUBSCRIPTION_CONFIG = {
  TRIAL: {
    TYPE: "global", // "global" | "por-academia"
    MAX_CLASES_GRATIS: 1,
    MAX_DIAS_GRATIS: 7,
    ENABLED: true
  },

  SUBSCRIPTION: {
    FREQUENCY: 1,
    FREQUENCY_TYPE: "months",
    CURRENCY: "ARS"
  },

  ESTADOS: {
    TRIAL: "trial",
    TRIAL_EXPIRADO: "trial_expirado",
    PENDIENTE: "pendiente",
    ACTIVA: "activa",
    VENCIDA: "vencida",
    PAUSADA: "pausada",
    CANCELADA: "cancelada"
  }
}
```

---

### Servicio de Suscripciones

**Archivo**: `src/services/subscriptionService.ts`

#### Funciones Principales

##### 1. `verificarElegibilidadTrial(userId, academiaId)`

Verifica si un usuario puede usar el trial gratuito.

**Retorna**:
```typescript
{
  puedeUsarTrial: boolean,
  razon?: string,
  yaUsoTrial: boolean
}
```

**Lógica**:
- Si trial global: verifica `user.trialConfig.haUsadoTrial`
- Si trial por academia: verifica si academiaId está en `user.trialConfig.academiasConTrial`

**Ubicación**: `src/services/subscriptionService.ts:32-80`

---

##### 2. `crearSuscripcion({ userId, academiaId, grupoId?, monto })`

Crea una nueva suscripción con o sin trial.

**Retorna**:
```typescript
{
  suscripcion: ISuscripcion,
  requiereConfiguracionPago: boolean
}
```

**Ubicación**: `src/services/subscriptionService.ts:85-127`

---

##### 3. `obtenerSuscripcionActiva(userId, academiaId)`

Obtiene la suscripción activa (trial o activa) de un usuario en una academia.

**Ubicación**: `src/services/subscriptionService.ts:132-145`

---

##### 4. `verificarPuedeAsistir(userId, grupoId)`

Verifica si un usuario puede asistir a una clase.

**Retorna**:
```typescript
{
  puedeAsistir: boolean,
  razon?: string,
  suscripcion?: ISuscripcion
}
```

**Lógica**:
1. Busca el grupo y su academia
2. Busca suscripción activa por academiaId (NO por grupoId)
3. Llama a `suscripcion.puedeAsistir()`

**Importante**: La suscripción es a nivel de academia, no de grupo individual.

**Ubicación**: `src/services/subscriptionService.ts:150-210`

---

##### 5. `registrarAsistencia({ userId, academiaId, grupoId, fecha?, registradoPor? })`

Registra una asistencia y maneja la lógica del trial.

**Retorna**:
```typescript
{
  asistencia: IAsistencia,
  requiereActivacion: boolean,
  suscripcion: ISuscripcion
}
```

**Lógica**:
1. Normaliza la fecha al inicio del día (evita duplicados)
2. Verifica si puede asistir
3. Verifica asistencia existente para hoy
4. Crea registro de asistencia
5. Si está en trial, incrementa contador
6. Verifica si expiró el trial (modelo híbrido)

**Ubicación**: `src/services/subscriptionService.ts:215-294`

---

##### 6. `activarSuscripcionPostTrial(suscripcionId)`

Activa una suscripción después del trial.

**Acciones**:
- Cambia estado a "activa"
- Marca trial como usado
- Actualiza `user.trialConfig` según tipo de trial

**Ubicación**: `src/services/subscriptionService.ts:299-331`

---

##### 7. `cancelarSuscripcion(suscripcionId, motivo?)`

Cancela una suscripción.

**Ubicación**: `src/services/subscriptionService.ts:336-350`

---

##### 8. `pausarSuscripcion(suscripcionId)`

Pausa una suscripción temporalmente.

**Ubicación**: `src/services/subscriptionService.ts:355-368`

---

##### 9. `obtenerSuscripcionesUsuario(userId)`

Obtiene todas las suscripciones de un usuario.

**Ubicación**: `src/services/subscriptionService.ts:373-380`

---

##### 10. `obtenerEstadisticasAsistencia(userId, suscripcionId)`

Obtiene estadísticas de asistencia.

**Retorna**:
```typescript
{
  totalAsistencias: number,
  asistenciasTrial: number,
  asistenciasPagas: number
}
```

**Ubicación**: `src/services/subscriptionService.ts:385-408`

---

### Modelo Híbrido de Trial

El trial expira cuando se cumple **cualquiera** de estas condiciones:

1. **Asistencias**: Usuario asiste a `MAX_CLASES_GRATIS` clases
2. **Días**: Transcurren `MAX_DIAS_GRATIS` días desde el inicio

**Configuración actual**: 1 clase GRATIS O 7 días (lo que ocurra primero)

---

### Flujo de Suscripción

```mermaid
graph TD
    A[Usuario se une a Academia] --> B{¿Puede usar trial?}
    B -->|Sí| C[Crear Suscripción en Trial]
    B -->|No| D[Crear Suscripción Activa]
    C --> E[Usuario asiste a clases]
    E --> F{¿Expiró trial?}
    F -->|No| E
    F -->|Sí| G[Requiere Activación]
    G --> H[Usuario configura pago]
    H --> I[Suscripción Activa]
    D --> I
    I --> J[Usuario puede asistir]
```

---

### APIs de Suscripciones

#### `POST /api/subscriptions/create`

Crea una nueva suscripción.

**Body**:
```json
{
  "academiaId": "...",
  "grupoId": "...",
  "monto": 5000
}
```

---

#### `GET /api/subscriptions/user`

Obtiene suscripciones del usuario autenticado.

---

#### `GET /api/subscriptions/[id]`

Obtiene detalles de una suscripción.

---

#### `PUT /api/subscriptions/[id]`

Actualiza o activa una suscripción.

---

#### `POST /api/asistencias/registrar`

Registra una asistencia.

**Body**:
```json
{
  "userId": "...",
  "grupoId": "...",
  "academiaId": "...",
  "fecha": "2025-01-15"
}
```

---

## 🔔 Sistema de Notificaciones

### Arquitectura

El sistema de notificaciones tiene 3 capas:

1. **Base de Datos**: Modelo `Notificacion`
2. **Real-time**: Socket.IO para notificaciones en vivo
3. **Push**: Web Push para notificaciones cuando el usuario está offline

---

### Notification Helpers

**Archivo**: `src/libs/notificationHelpers.ts`

#### `createNotification(params)`

Función central para crear notificaciones.

**Parámetros**:
```typescript
{
  userId: string,           // Receptor
  fromUserId: string,       // Emisor
  type: string,             // Tipo de notificación
  message: string,          // Mensaje
  salidaId?: string,        // Referencia a evento
  academiaId?: string,      // Referencia a academia
  teamSocialId?: string,    // Referencia a team
  actionUrl?: string,       // URL de acción
  actionType?: "navigate" | "modal" | "action",
  metadata?: any            // Datos adicionales
}
```

**Acciones**:
1. Crea registro en DB
2. Envía notificación push al dispositivo
3. Emite evento Socket.IO (si está conectado)

**Ubicación**: `src/libs/notificationHelpers.ts:80-120`

---

#### `sendPushNotification(userId, title, body, actionUrl?)`

Envía notificación push Web a todos los dispositivos del usuario.

**Acciones**:
1. Busca todas las suscripciones push del usuario
2. Envía notificación a cada endpoint
3. Elimina suscripciones inválidas (410/404)

**Ubicación**: `src/libs/notificationHelpers.ts:27-78`

---

#### Funciones Específicas

```typescript
// Miembro aprobado en evento
notifyMemberApproved(userId, fromUserId, salidaId, salidaNombre)

// Miembro rechazado
notifyMemberRejected(userId, fromUserId, salidaId, salidaNombre)

// Nuevo miembro se unió
notifyJoinedEvent(userId, fromUserId, salidaId, userName, salidaNombre)

// Nueva salida disponible
notifyNewSalida(userId, fromUserId, salidaId, salidaNombre)

// Pago aprobado
notifyPaymentApproved(userId, fromUserId, paymentInfo)

// Solicitud de academia
notifyAcademiaRequest(userId, fromUserId, academiaId, academiaNombre, userName)

// Solicitud de team
notifyTeamRequest(userId, fromUserId, teamSocialId, teamNombre, userName)
```

**Ubicación**: `src/libs/notificationHelpers.ts:145-258`

---

### Socket.IO Server

**Archivo**: `server.js`

#### Configuración

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});
```

---

#### Autenticación

**Middleware en Engine.IO** (más seguro):

1. Extrae token del query string o header Authorization
2. Verifica JWT con NEXTAUTH_SECRET
3. Extrae userId del token (decoded.sub)
4. Adjunta usuario al request

**Ubicación**: `server.js:34-80`

---

#### Eventos del Socket

**Conexión** (`connection`):
- Une al usuario a su sala personal: `user:${userId}`
- Envía notificaciones pendientes (últimas 24h)

**`get:notifications`**:
- Obtiene historial de notificaciones
- Soporta paginación y filtro de no leídas

**`notification:mark-read`**:
- Marca una notificación como leída

**`notifications:mark-all-read`**:
- Marca todas las notificaciones como leídas

**`disconnect`**:
- Log de desconexión

**Ubicación eventos**: `server.js:96-222`

---

#### `emitToUser(userId, event, data)`

Función auxiliar para emitir eventos a un usuario específico.

**Retorna**: `true` si el usuario está conectado, `false` si está offline

**Uso**:
```javascript
socketServer.emitToUser(userId, 'notification:new', notificationData);
```

**Ubicación**: `server.js:225-237`

---

### API Interna para Emit

**Ruta**: `POST /api/internal/socket/emit`

Endpoint interno para emitir eventos desde API routes.

**Body**:
```json
{
  "userId": "...",
  "event": "notification:new",
  "data": { ... }
}
```

**Respuesta**:
```json
{
  "success": true,
  "enviado": true,
  "message": "Notificación enviada en tiempo real"
}
```

**Ubicación**: `server.js:278-310`

---

### Web Push (VAPID)

#### Configuración

```typescript
import webPush from "web-push";

webPush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);
```

---

#### Modelo Subscription

```typescript
{
  user_id: ObjectId -> User,
  endpoint: String (required),
  keys: {
    p256dh: String (required),
    auth: String (required)
  },
  userAgent: String,
  createdAt: Date
}
```

---

#### Suscribir a Push Notifications

**API**: `POST /api/save-subscription`

**Body**:
```json
{
  "subscription": {
    "endpoint": "...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

---

### Tipos de Notificaciones

| Tipo | Título | Descripción |
|------|--------|-------------|
| `miembro_aprobado` | 🎉 Solicitud aprobada | Usuario aprobado en evento |
| `miembro_rechazado` | ❌ Solicitud rechazada | Usuario rechazado |
| `joined_event` | 👥 Nuevo miembro | Alguien se unió a tu evento |
| `nueva_salida` | 🚀 Nueva salida | Nueva salida disponible |
| `pago_aprobado` | 💰 Pago aprobado | Pago procesado correctamente |
| `solicitud_academia` | 🎓 Nueva solicitud | Solicitud de academia |
| `solicitud_team` | ⚽ Nueva solicitud | Solicitud de team |

**Ubicación**: `src/libs/notificationHelpers.ts:122-142`

---

## 🔧 Funciones Reutilizables

### Connection Utilities

#### `connectDB()`

**Archivo**: `src/libs/mongodb.ts`

Establece conexión con MongoDB usando pooling.

**Características**:
- Caché global de conexión
- Pooling (maxPoolSize: 10)
- Buffer de comandos deshabilitado
- Validación de MONGODB_URI

**Uso**:
```typescript
import connectDB from "@/libs/mongodb";

await connectDB();
```

**Ubicación**: `src/libs/mongodb.ts:12-24`

---

### Strava Helpers

**Archivo**: `src/libs/stravaHelpers.ts`

#### `refreshStravaToken(user)`

Refresca el token de Strava si está expirado.

**Retorna**: `access_token` válido

**Ubicación**: `src/libs/stravaHelpers.ts:59-82`

---

#### `getStravaRoutes(userId)`

Obtiene las rutas guardadas del atleta en Strava.

**Retorna**: Array de rutas

**Ubicación**: `src/libs/stravaHelpers.ts:85-106`

---

#### `getStravaActivities(userId)`

Obtiene las últimas 10 actividades con polylines detalladas.

**Retorna**: Array de actividades con mapas

**Ubicación**: `src/libs/stravaHelpers.ts:108-156`

---

### Confirmation Toast

**Archivo**: `src/app/utils/confirmActionToast.tsx`

#### `confirmActionToast(options)`

Muestra un toast de confirmación con acciones.

**Opciones**:
```typescript
{
  message?: string,              // "¿Estás seguro?"
  description?: string,
  confirmText?: string,          // "Confirmar"
  cancelText?: string,           // "Cancelar"
  loadingMessage?: string,       // "Procesando..."
  successMessage?: string,       // "Acción realizada con éxito"
  errorMessage?: string,         // "Ocurrió un error"
  onConfirm: () => Promise<void> | void,
  onCancel?: () => void
}
```

**Uso**:
```typescript
import { confirmActionToast } from "@/app/utils/confirmActionToast";

confirmActionToast({
  message: "¿Eliminar este evento?",
  confirmText: "Eliminar",
  onConfirm: async () => {
    await deleteEvent(eventId);
    router.push("/dashboard");
  }
});
```

**Ubicación**: `src/app/utils/confirmActionToast.tsx:16-96`

---

### Subscription Helpers

**Archivo**: `src/config/subscription.config.ts`

```typescript
// Verificar si trial está habilitado
subscriptionHelpers.isTrialEnabled()

// Verificar tipo de trial
subscriptionHelpers.isTrialGlobal()
subscriptionHelpers.isTrialPorAcademia()

// Obtener límites
subscriptionHelpers.getMaxClasesGratis()
subscriptionHelpers.getMaxDiasGratis()

// Cálculos
subscriptionHelpers.calcularFechaFinTrial(fechaInicio)
subscriptionHelpers.estaDentroDeTrial(fechaInicio, fechaActual?)
```

**Ubicación**: `src/config/subscription.config.ts:57-102`

---

## 🎣 Hooks Personalizados

### useSession (NextAuth)

```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
```

---

### useNotifications

**Archivo**: `src/hooks/useNotifications.ts`

Hook para gestionar notificaciones en tiempo real.

**Retorna**:
```typescript
{
  notifications: Notification[],
  unreadCount: number,
  isLoading: boolean,
  markAsRead: (id: string) => Promise<void>,
  markAllAsRead: () => Promise<void>,
  refetch: () => void
}
```

**Uso**:
```typescript
const { notifications, unreadCount, markAsRead } = useNotifications();
```

---

### useFavorites

**Archivo**: `src/hooks/useFavorites.ts`

Hook para gestionar favoritos del usuario.

**Retorna**:
```typescript
{
  favoritos: {
    salidas: string[],
    academias: string[],
    teamSocial: string[]
  },
  isFavorite: (id: string, type: "salidas" | "academias" | "teamSocial") => boolean,
  toggleFavorite: (id: string, type: string) => Promise<void>,
  isLoading: boolean
}
```

---

### usePaymentStatus / usePaymentStatusAcademia

**Archivos**:
- `src/hooks/usePaymentStatus.ts`
- `src/hooks/usePaymentStatusAcademia.ts`

Hooks para verificar estado de pago en eventos y academias.

**Retorna**:
```typescript
{
  estado: "pendiente" | "aprobado" | "rechazado" | null,
  isLoading: boolean,
  error: any
}
```

---

### useMapbox

**Archivo**: `src/hooks/useMapbox.ts`

Hook para integración con Mapbox.

**Características**:
- Inicialización de mapa
- Control de markers
- Geocodificación
- Dibujo de rutas

---

### useGeolocation / useGPS

**Archivos**:
- `src/hooks/useGeolocation.ts`
- `src/hooks/useGPS.ts`

Hooks para obtener ubicación del usuario.

**Retorna**:
```typescript
{
  location: { lat: number, lng: number } | null,
  error: string | null,
  isLoading: boolean
}
```

---

### useForm

**Archivo**: `src/hooks/useForm.ts`

Hook genérico para manejo de formularios.

**Retorna**:
```typescript
{
  values: T,
  errors: Record<string, string>,
  handleChange: (e: ChangeEvent) => void,
  handleSubmit: (e: FormEvent) => void,
  reset: () => void,
  setValues: (values: T) => void
}
```

---

## 🧩 Componentes Principales

### NotificationProvider

**Archivo**: `src/components/NotificationProvider.tsx`

Componente que envuelve la app para gestionar notificaciones en tiempo real.

**Características**:
- Conecta con Socket.IO
- Escucha eventos de notificaciones
- Muestra toasts para nuevas notificaciones
- Actualiza contador de no leídas

**Uso en layout**:
```typescript
<NotificationProvider>
  {children}
</NotificationProvider>
```

---

### ConfirmActionToast

Component renderizado por `confirmActionToast()`.

**Ver**: [Confirmation Toast](#confirmation-toast)

---

### EventCard / EventCardRefactored

**Archivos**:
- `src/components/EventCard.tsx`
- `src/components/EventCardRefactored.tsx`

Tarjetas para mostrar eventos (SalidaSocial, TeamSocial).

**Props**:
```typescript
{
  event: ISalidaSocial | ITeamSocial,
  onFavorite?: () => void,
  showActions?: boolean
}
```

---

### DashboardCard

**Archivo**: `src/components/Dashboard/DashboardCard.tsx`

Tarjeta genérica para el dashboard.

**Props**:
```typescript
{
  title: string,
  icon?: ReactNode,
  count?: number,
  children: ReactNode
}
```

---

### MapComponent / MapboxMap / LeafletMap

Componentes para mapas interactivos.

**Archivos**:
- `src/components/MapComponent.tsx`
- `src/components/MapboxMap.tsx`
- `src/components/LeafletMap.tsx`

---

### LocationPicker

**Archivo**: `src/components/forms/LocationPicker.tsx`

Selector de ubicación con mapa y geocodificación inversa.

**Props**:
```typescript
{
  onLocationSelect: (coords: { lat: number, lng: number }) => void,
  initialCoords?: { lat: number, lng: number }
}
```

---

### StravaMap

**Archivo**: `src/components/StravaMap.tsx`

Renderiza rutas de Strava en un mapa.

**Props**:
```typescript
{
  polyline: string,
  summaryPolyline?: string
}
```

---

### AsistenciasModal

**Archivo**: `src/components/AsistenciasModal.tsx`

Modal para registrar asistencias con QR scanner.

**Props**:
```typescript
{
  grupoId: string,
  academiaId: string,
  onClose: () => void
}
```

---

### PaymentModal / PaymentReviewModal

**Archivos**:
- `src/components/PaymentModal.tsx`
- `src/components/PaymentReviewModal.tsx`

Modales para gestionar pagos y revisión de comprobantes.

---

### BaseComponents

**Directorio**: `src/components/base/`

Componentes reutilizables:
- `BaseButton`: Botones con variantes
- `BaseCard`: Tarjetas
- `BaseInput`: Inputs
- `BaseModal`: Modales
- `AnimatedModal`: Modales con animaciones
- `PageTransition`: Transiciones de página

---

## 🔌 Integración con Terceros

### Strava

**OAuth Flow**:
1. Usuario clickea "Conectar Strava"
2. Redirige a `/api/strava/connect`
3. Strava callback en `/api/strava/callback`
4. Guarda tokens en `user.strava`

**Refresh de Tokens**:
- Automático en `refreshStravaToken()`
- Verifica `expires_at` antes de cada request

**Endpoints**:
- `/api/strava/status`: Estado de conexión
- `/api/strava/activities`: Obtener actividades
- `/api/strava/routes`: Obtener rutas guardadas
- `/api/strava/profile`: Perfil del atleta

**Variables de entorno**:
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI`

---

### MercadoPago

#### Configuración

**Variables**:
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_PUBLIC_KEY`

---

#### Crear Preferencia de Pago

**API**: `POST /api/mercadopago/preferences`

**Body**:
```json
{
  "title": "Salida XYZ",
  "price": 5000,
  "quantity": 1,
  "userId": "...",
  "salidaId": "..."
}
```

**Retorna**:
```json
{
  "id": "preference-id",
  "init_point": "https://www.mercadopago.com/checkout/v1/redirect?pref_id=..."
}
```

---

#### Webhook

**Endpoint**: `POST /api/mercadopago/webhook`

**Eventos manejados**:
- `payment.created`
- `payment.updated`

**Acciones**:
1. Verifica firma del webhook
2. Obtiene detalles del pago
3. Actualiza registro de Pago
4. Actualiza estado de MiembroSalida o UsuarioAcademia
5. Envía notificación al usuario

---

#### Suscripciones (Preapproval)

**Crear suscripción**:

```typescript
const preapproval = await mercadopago.preapproval.create({
  reason: `Suscripción a ${academiaNombre}`,
  payer_email: userEmail,
  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: monto,
    currency_id: "ARS"
  },
  back_url: `${baseUrl}/academias/${academiaId}`,
  external_reference: suscripcionId
});
```

---

### Firebase

#### Inicialización

**Client-side**:
```typescript
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

---

#### Storage

**Upload de imagen**:
```typescript
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebase";

const storageRef = ref(storage, `images/${filename}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
```

**Rutas de almacenamiento**:
- `/profile-images/${userId}`
- `/social-images/${salidaId}`
- `/academy-images/${academiaId}`
- `/group-images/${grupoId}`
- `/sponsors/${sponsorId}`
- `/bares/${barId}`

---

#### Cloud Messaging (FCM)

**Guardar token**:

**API**: `POST /api/save-fcm-token`

**Body**:
```json
{
  "token": "fcm-device-token"
}
```

**Enviar notificación**:

```typescript
import admin from "firebase-admin";

await admin.messaging().send({
  token: fcmToken,
  notification: {
    title: "Título",
    body: "Mensaje"
  },
  data: {
    url: "/ruta"
  }
});
```

---

### Mapbox

**Public Token**: `NEXT_PUBLIC_MAPBOX_TOKEN`

**Inicialización**:
```typescript
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const map = new mapboxgl.Map({
  container: mapRef.current,
  style: "mapbox://styles/mapbox/streets-v11",
  center: [lng, lat],
  zoom: 12
});
```

---

#### Geocodificación Inversa

**API**: `GET /api/search/reverse?lat={lat}&lng={lng}`

**Retorna**:
```json
{
  "display_name": "Dirección formateada",
  "address": {
    "road": "...",
    "city": "...",
    "state": "...",
    "country": "..."
  }
}
```

**Provider**: Nominatim (OpenStreetMap)

---

## 📝 Convenciones de Código

### Nombres de Archivos

- **Componentes**: PascalCase (`EventCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useFavorites.ts`)
- **Utilidades**: camelCase (`confirmActionToast.tsx`)
- **APIs**: camelCase o kebab-case (`route.ts`, `save-subscription.ts`)

---

### Importaciones

**Orden**:
1. Librerías de terceros
2. Aliases de Next.js (@/)
3. Imports relativos (./)

**Ejemplo**:
```typescript
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

import connectDB from "@/libs/mongodb";
import User from "@/models/user";

import { formatDate } from "./utils";
```

---

### Componentes

**Client Components**:
```typescript
"use client";

import { useState } from "react";

export default function MyComponent() {
  const [state, setState] = useState();

  return <div>...</div>;
}
```

**Server Components**:
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export default async function Page() {
  const session = await getServerSession(authOptions);

  return <div>...</div>;
}
```

---

### API Routes

**Naming**: `route.ts` o `route.{method}.ts`

**Exports**: Named exports para cada método HTTP

```typescript
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
export async function PUT(request: Request, { params }) { ... }
export async function DELETE(request: Request, { params }) { ... }
```

---

### Estilos con Tailwind

**Preferir**: Utility classes sobre CSS personalizado

**Responsive**: Mobile-first
```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
```

**Condicionales**:
```tsx
<button className={`btn ${loading ? 'opacity-50' : ''}`}>
```

**Con clsx**:
```tsx
import clsx from "clsx";

<div className={clsx(
  "base-class",
  condition && "conditional-class",
  { "active": isActive }
)}>
```

---

### TypeScript

**Interfaces para Props**:
```typescript
interface MyComponentProps {
  title: string;
  onAction: () => void;
  children?: ReactNode;
}

export default function MyComponent({ title, onAction, children }: MyComponentProps) {
  // ...
}
```

**Tipos para respuestas API**:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

### Logging

**Usar emojis** para fácil búsqueda en logs:

```typescript
console.log("✅ Usuario creado:", userId);
console.error("❌ Error en pago:", error);
console.warn("⚠️ Trial por expirar:", diasRestantes);
console.info("ℹ️ Suscripción activa:", suscripcionId);
```

**Otros emojis útiles**:
- 🔥 Acción crítica
- 📱 Notificación
- 💰 Pago
- 🎓 Academia
- 🚀 Evento
- 👤 Usuario
- 🔐 Autenticación
- 🗄️ Base de datos

---

## 🔒 Variables de Entorno

### Base de Datos
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

---

### Autenticación
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

### Firebase
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Admin SDK (server-side)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

### MercadoPago
```env
MERCADOPAGO_ACCESS_TOKEN=...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=...
```

---

### Strava
```env
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

---

### Mapbox
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk....
```

---

### Web Push (VAPID)
```env
VAPID_EMAIL=mailto:your-email@domain.com
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

### Email (Resend)
```env
RESEND_API_KEY=re_...
```

---

### Otros
```env
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🚀 Despliegue

### Vercel

**Características**:
- Serverless functions para API routes
- Edge runtime para performance
- Automatic deployments desde Git

**Configuraciones importantes**:
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

**Variables de entorno**: Configurar todas las anteriores en el dashboard de Vercel

---

### Custom Server (server.js)

**Para desarrollo local con Socket.IO**:

```bash
npm run dev    # Usa server.js con Socket.IO
npm run build
npm run start  # Production con server.js
```

**IMPORTANTE**: Vercel NO soporta custom servers. Socket.IO requiere alternativa en producción (ej: separar en servicio aparte).

---

## 📚 Referencias Adicionales

- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Mongoose Docs](https://mongoosejs.com)
- [Socket.IO Docs](https://socket.io/docs)
- [MercadoPago API](https://www.mercadopago.com.ar/developers)
- [Strava API](https://developers.strava.com)
- [Firebase Docs](https://firebase.google.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js)

---

## 🤝 Contribución

Al contribuir a este proyecto:

1. **Seguir las convenciones** documentadas en este archivo
2. **Usar el servicio de suscripciones** para cualquier lógica relacionada
3. **Conectar a DB** con `connectDB()` en todas las APIs
4. **Autenticar** rutas protegidas con NextAuth
5. **Documentar** cambios significativos en este archivo
6. **Probar** funcionalidad antes de commit
7. **No exponer** credenciales en el código

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

**Última actualización**: 2025-01-15

**Versión de documento**: 1.0.0
