# Club del Trekking - Documentación para Aplicación Administradora

Esta documentación detalla los endpoints y funcionalidades necesarias para integrar el Club del Trekking en la aplicación administradora de Trivo.

## 1. Endpoints para la App Administradora

### 1.1 Gestión de Membresías

#### `GET /api/admin/club-trekking/memberships`
Listar todas las membresías con filtros y paginación

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Params:**
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 20)
- `estado`: Filtrar por estado (activa, pausada, vencida, cancelada)
- `search`: Buscar por nombre o email de usuario
- `fechaDesde`: Filtrar desde fecha
- `fechaHasta`: Filtrar hasta fecha

**Response:**
```json
{
  "memberships": [
    {
      "_id": "string",
      "userId": {
        "_id": "string",
        "firstname": "string",
        "lastname": "string",
        "email": "string",
        "imagen": "string"
      },
      "estado": "activa",
      "fechaInicio": "ISO Date",
      "fechaFin": "ISO Date",
      "proximaFechaPago": "ISO Date",
      "usoMensual": {
        "salidasRealizadas": 2,
        "limiteSemanal": 2
      },
      "mercadoPago": {
        "status": "approved",
        "preapprovalId": "string"
      },
      "createdAt": "ISO Date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### `GET /api/admin/club-trekking/membership/:membershipId`
Obtener detalles completos de una membresía

**Response:**
```json
{
  "membership": {
    "_id": "string",
    "userId": { /* usuario completo */ },
    "estado": "activa",
    "fechaInicio": "ISO Date",
    "fechaFin": "ISO Date",
    "usoMensual": { /* uso mensual */ },
    "historialSalidas": [
      {
        "salidaId": {
          "_id": "string",
          "nombre": "string",
          "fecha": "string",
          "ubicacion": "string"
        },
        "fecha": "ISO Date",
        "checkInRealizado": true
      }
    ],
    "mercadoPago": { /* info de MP */ }
  }
}
```

#### `POST /api/admin/club-trekking/membership/:membershipId/cancel`
Cancelar una membresía (admin override)

**Request Body:**
```json
{
  "motivo": "Solicitud del usuario / Incumplimiento / Otro",
  "reembolsar": false
}
```

#### `POST /api/admin/club-trekking/membership/:membershipId/extend`
Extender membresía gratuitamente (compensación)

**Request Body:**
```json
{
  "dias": 7,
  "motivo": "Compensación por inconveniente técnico"
}
```

---

### 1.2 Estadísticas Generales

#### `GET /api/admin/club-trekking/stats`
Obtener estadísticas generales del Club del Trekking

**Query Params:**
- `periodo`: "dia", "semana", "mes", "año"

**Response:**
```json
{
  "stats": {
    "memberships": {
      "total": 150,
      "activas": 120,
      "pausadas": 10,
      "vencidas": 15,
      "canceladas": 5
    },
    "revenue": {
      "mensual": 3000000,
      "proyeccionAnual": 36000000,
      "tasaRetencion": 85.5,
      "tasaCancelacion": 3.2
    },
    "uso": {
      "salidasRealizadas": 450,
      "promedioSalidasPorUsuario": 3.75,
      "checkInsRealizados": 420,
      "tasaCheckIn": 93.3
    },
    "crecimiento": {
      "nuevasSuscripcionesEsteMes": 25,
      "cancelacionesEsteMes": 5,
      "tasaCrecimiento": 16.7
    }
  }
}
```

#### `GET /api/admin/club-trekking/stats/revenue`
Estadísticas detalladas de ingresos

**Response:**
```json
{
  "revenue": {
    "totalRecaudado": 15000000,
    "ingresosRecurrentes": 3000000,
    "promedioRetencion": 8.5,
    "valorTiempoVida": 212500,
    "historicoMensual": [
      {
        "mes": "2025-01",
        "ingresos": 2500000,
        "nuevos": 20,
        "cancelados": 3
      }
    ]
  }
}
```

---

### 1.3 Gestión de Salidas

#### `GET /api/admin/club-trekking/salidas`
Listar salidas del Club del Trekking

**Query Params:**
- `incluidas`: true/false (filtrar por incluidas en membresía)
- `fecha`: Filtrar por fecha
- `page`: Página
- `limit`: Límite

**Response:**
```json
{
  "salidas": [
    {
      "_id": "string",
      "nombre": "string",
      "fecha": "string",
      "precio": "string",
      "cupo": 20,
      "clubTrekking": {
        "incluidaEnMembresia": true,
        "cupoMiembros": 10,
        "miembrosActuales": 7
      },
      "inscripciones": {
        "total": 15,
        "miembrosClub": 7,
        "noMiembros": 8
      }
    }
  ]
}
```

#### `PATCH /api/admin/club-trekking/salida/:salidaId`
Actualizar configuración de Club Trekking en una salida

**Request Body:**
```json
{
  "clubTrekking": {
    "incluidaEnMembresia": true,
    "cupoMiembros": 10,
    "requiereCheckIn": true
  }
}
```

---

### 1.4 Reportes y Exportaciones

#### `GET /api/admin/club-trekking/reports/monthly`
Generar reporte mensual

**Query Params:**
- `mes`: YYYY-MM
- `format`: "json" | "csv" | "pdf"

**Response (JSON):**
```json
{
  "report": {
    "periodo": "2025-01",
    "memberships": {
      "inicioMes": 120,
      "nuevas": 25,
      "canceladas": 5,
      "finMes": 140
    },
    "salidas": {
      "total": 50,
      "participacionMiembros": 350,
      "promedioAsistencia": 7
    },
    "revenue": {
      "ingresosSuscripciones": 3500000,
      "tasaRetencion": 86.2
    },
    "topSalidas": [
      {
        "nombre": "Cascada de los Alisos",
        "participantes": 12,
        "fechas": 3
      }
    ]
  }
}
```

#### `GET /api/admin/club-trekking/export/members`
Exportar lista de miembros

**Query Params:**
- `format`: "csv" | "excel"
- `estado`: Filtrar por estado

**Response:**
CSV/Excel file con columnas:
- Nombre, Email, Estado, Fecha Inicio, Salidas Realizadas, Próximo Pago

---

### 1.5 Gestión de Beneficios

#### `POST /api/admin/club-trekking/benefits`
Crear beneficio especial para miembros

**Request Body:**
```json
{
  "nombre": "Descuento en tienda oficial",
  "descripcion": "20% de descuento en productos seleccionados",
  "tipo": "descuento",
  "valor": 20,
  "fechaInicio": "ISO Date",
  "fechaFin": "ISO Date",
  "activo": true
}
```

#### `GET /api/admin/club-trekking/benefits`
Listar beneficios activos

---

### 1.6 Notificaciones Masivas

#### `POST /api/admin/club-trekking/notify`
Enviar notificación a miembros

**Request Body:**
```json
{
  "titulo": "Nueva salida disponible",
  "mensaje": "Este fin de semana: Cascada Los Alisos",
  "tipo": "nueva_salida",
  "filtros": {
    "estado": ["activa"],
    "salidasEsteMes": { "min": 0, "max": 2 }
  },
  "accion": {
    "tipo": "link",
    "url": "/club-trekking/salida/123"
  }
}
```

---

## 2. Panel de Administración - Features

### 2.1 Dashboard Principal

**Métricas clave visibles:**
- Membresías activas
- Ingresos del mes
- Tasa de retención
- Salidas con mayor participación

**Gráficos:**
- Crecimiento de membresías (línea temporal)
- Distribución de estados (pie chart)
- Ingresos mensuales (barras)
- Uso de salidas (heatmap por día de semana)

### 2.2 Vista de Membresías

**Tabla con columnas:**
- Usuario (nombre, email, foto)
- Estado (badge de color)
- Fecha inicio
- Salidas usadas este mes
- Próximo pago
- Acciones (ver detalles, pausar, cancelar, extender)

**Filtros:**
- Estado
- Rango de fechas
- Búsqueda por nombre/email

**Acciones en lote:**
- Exportar seleccionados
- Enviar notificación
- Aplicar beneficio

### 2.3 Vista de Salidas

**Información mostrada:**
- Lista de salidas con indicador de inclusión en membresía
- % de cupo ocupado por miembros
- Opción de ajustar cupo para miembros
- Toggle para incluir/excluir de membresía

**Acciones:**
- Editar configuración de Club Trekking
- Ver lista de participantes
- Exportar asistentes

### 2.4 Reportes

**Tipos de reportes:**
1. **Reporte Mensual**: Resumen completo del mes
2. **Reporte de Retención**: Análisis de churn y retención
3. **Reporte de Uso**: Patrones de uso de salidas
4. **Reporte Financiero**: Ingresos y proyecciones

**Opciones de exportación:**
- PDF (para presentaciones)
- CSV (para análisis)
- Excel (completo con gráficos)

### 2.5 Configuración

**Settings editables:**
- Precio mensual
- Límite de salidas por semana
- Precio máximo de salida incluida
- Radio de check-in (metros)
- Tiempo permitido para check-in
- Mensajes de notificaciones
- Términos y condiciones

---

## 3. Queries Útiles para Análisis

### 3.1 Membresías por expirar (próximos 7 días con pago pendiente)

```javascript
db.clubtrekkingmemberships.find({
  estado: "activa",
  proximaFechaPago: {
    $gte: new Date(),
    $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
})
```

### 3.2 Usuarios con mayor uso

```javascript
db.clubtrekkingmemberships.aggregate([
  { $match: { estado: "activa" } },
  { $addFields: { totalSalidas: { $size: "$historialSalidas" } } },
  { $sort: { totalSalidas: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "usuario"
    }
  }
])
```

### 3.3 Tasa de retención mensual

```javascript
db.clubtrekkingmemberships.aggregate([
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
      nuevas: { $sum: 1 },
      canceladas: {
        $sum: {
          $cond: [
            { $ne: ["$fechaCancelacion", null] },
            1,
            0
          ]
        }
      }
    }
  },
  { $sort: { _id: 1 } }
])
```

---

## 4. Integración con MercadoPago (Admin)

### 4.1 Verificar estado de suscripciones en MP

```bash
GET https://api.mercadopago.com/preapproval/search
  ?payer_email=usuario@email.com
  &status=authorized
```

### 4.2 Forzar cancelación de suscripción en MP

```bash
PUT https://api.mercadopago.com/preapproval/{preapproval_id}
Body: { "status": "cancelled" }
```

---

## 5. Eventos de Auditoría

Todos los cambios realizados desde el admin deben registrarse:

```typescript
interface AuditLog {
  adminId: string;
  accion: string;
  entidad: "membership" | "salida" | "config";
  entidadId: string;
  cambios: any;
  timestamp: Date;
}
```

**Acciones auditables:**
- Cancelación de membresía
- Extensión de membresía
- Cambio de configuración de salida
- Modificación de precio
- Envío de notificación masiva

---

## 6. Alertas Automáticas

El sistema debe enviar alertas al equipo admin cuando:

1. **Tasa de cancelación > 5%** en el mes
2. **Pago fallido** en 3+ intentos para mismo usuario
3. **Salida popular** alcanza 80% de cupo de miembros
4. **Usuario reporta problema** con check-in
5. **Ingreso mensual** cae 10% vs mes anterior

---

## 7. Permisos y Roles

### Admin Full
- Acceso a todas las funcionalidades
- Puede modificar configuración
- Puede cancelar/extender membresías
- Acceso a reportes financieros

### Admin Support
- Ver membresías y usuarios
- Pausar/reactivar membresías (no cancelar)
- Ver estadísticas (no financieras)
- Enviar notificaciones

### Admin View Only
- Solo lectura
- Exportar reportes
- Ver estadísticas generales

---

## 8. Implementación Recomendada

### Tecnologías
- **Frontend**: Next.js con Server Components
- **UI**: Shadcn/ui + Tailwind CSS
- **Gráficos**: Recharts o Chart.js
- **Tablas**: TanStack Table
- **Exportación**: xlsx, jsPDF

### Estructura de carpetas
```
src/app/admin/
├── club-trekking/
│   ├── page.tsx (dashboard)
│   ├── memberships/
│   │   ├── page.tsx (lista)
│   │   └── [id]/page.tsx (detalle)
│   ├── salidas/
│   │   └── page.tsx
│   ├── reports/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
```

---

## 9. Siguiente Pasos

1. **Implementar endpoints de admin** en [src/app/api/admin/club-trekking/](src/app/api/admin/club-trekking/)
2. **Crear componentes de UI** para el panel de admin
3. **Implementar sistema de alertas** automáticas
4. **Crear reportes automatizados** mensuales
5. **Configurar permisos** basados en roles
6. **Testing** de todos los flows críticos
7. **Documentación** para el equipo de soporte
