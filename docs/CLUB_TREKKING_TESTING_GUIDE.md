# 🧪 Guía de Testing - Club del Trekking

Esta guía te ayudará a testear todo el sistema de confirmación de asistencia y penalización paso a paso.

## 📋 Pre-requisitos

- ✅ Servidor en desarrollo corriendo: `npm run dev`
- ✅ MongoDB Compass o acceso a MongoDB
- ✅ Usuario con sesión activa en la app

---

## 🎯 Test 1: Verificar que Solo Trekking es Elegible

### Objetivo
Confirmar que solo salidas de Trekking aparecen como incluidas en la membresía.

### Pasos:

1. **Crear 3 salidas de prueba** (desde la app o MongoDB Compass):

**Salida A - Trekking (Elegible) ✅**
```json
{
  "titulo": "Test Trekking Low Cost",
  "deporte": "Trekking",
  "precio": "5000",
  "fecha": "2025-11-05T10:00:00.000Z",
  "cupo": 20,
  "clubTrekking": {
    "incluidaEnMembresia": true,
    "requiereCheckIn": false,
    "cupoMiembros": 10,
    "miembrosActuales": 0
  }
}
```

**Salida B - Ciclismo (NO Elegible) ❌**
```json
{
  "titulo": "Test Ciclismo Low Cost",
  "deporte": "Ciclismo",
  "precio": "5000",
  "fecha": "2025-11-06T10:00:00.000Z",
  "cupo": 20,
  "clubTrekking": {
    "incluidaEnMembresia": false,
    "requiereCheckIn": false,
    "cupoMiembros": 0,
    "miembrosActuales": 0
  }
}
```

**Salida C - Trekking Premium (NO Elegible por precio) ❌**
```json
{
  "titulo": "Test Trekking Premium",
  "deporte": "Trekking",
  "precio": "15000",
  "fecha": "2025-11-07T10:00:00.000Z",
  "cupo": 20,
  "clubTrekking": {
    "incluidaEnMembresia": false,
    "requiereCheckIn": false,
    "cupoMiembros": 0,
    "miembrosActuales": 0
  }
}
```

2. **Ir a `/club-del-trekking`**
3. **Verificar que:**
   - ✅ Salida A muestra badge verde "Incluida en Club"
   - ❌ Salida B NO muestra badge
   - ❌ Salida C NO muestra badge

**✅ Test 1 Pasó** si solo la Salida A (Trekking low cost) muestra el badge.

---

## 🎯 Test 2: Crear Membresía de Prueba

### Objetivo
Crear una membresía manualmente para testing (sin pasar por MercadoPago).

### Método A: Desde MongoDB Compass

1. Abrir MongoDB Compass
2. Conectar a tu base de datos
3. Ir a colección `clubtrekkingmemberships`
4. Click en "Insert Document"
5. Pegar este JSON (reemplazar `USER_ID` con tu ID de usuario):

```json
{
  "userId": {"$oid": "TU_USER_ID_AQUI"},
  "estado": "activa",
  "fechaInicio": {"$date": "2025-01-30T00:00:00.000Z"},
  "fechaFin": {"$date": "2025-02-28T23:59:59.999Z"},
  "proximaFechaPago": {"$date": "2025-02-28T00:00:00.000Z"},
  "mercadoPago": {
    "preapprovalId": "test-preapproval-123",
    "payerId": "test-payer",
    "payerEmail": "test@test.com",
    "status": "authorized"
  },
  "usoMensual": {
    "salidasRealizadas": 0,
    "limiteSemanal": 2,
    "ultimaResetFecha": {"$date": "2025-01-30T00:00:00.000Z"}
  },
  "historialSalidas": [],
  "pausa": {
    "vecesUsada": 0
  },
  "penalizacion": {
    "activa": false,
    "inasistenciasConsecutivas": 0,
    "diasRestantes": 0,
    "historialPenalizaciones": []
  }
}
```

### Método B: Desde MongoDB Shell

```javascript
db.clubtrekkingmemberships.insertOne({
  userId: ObjectId("TU_USER_ID_AQUI"),
  estado: "activa",
  fechaInicio: new Date("2025-01-30"),
  fechaFin: new Date("2025-02-28"),
  proximaFechaPago: new Date("2025-02-28"),
  mercadoPago: {
    preapprovalId: "test-preapproval-123",
    payerId: "test-payer",
    payerEmail: "test@test.com",
    status: "authorized"
  },
  usoMensual: {
    salidasRealizadas: 0,
    limiteSemanal: 2,
    ultimaResetFecha: new Date("2025-01-30")
  },
  historialSalidas: [],
  pausa: {
    vecesUsada: 0
  },
  penalizacion: {
    "activa": false,
    "inasistenciasConsecutivas": 0,
    "diasRestantes": 0,
    "historialPenalizaciones": []
  }
});
```

### Verificar:

Ir a `/club-del-trekking/mi-membresia` y verificar que:
- ✅ Muestra "Membresía Activa"
- ✅ Muestra "2 salidas restantes esta semana"
- ✅ Badge "Bronce" visible

**✅ Test 2 Pasó** si ves tu panel de membresía activa.

---

## 🎯 Test 3: Modal de Confirmación de Asistencia

### Objetivo
Verificar que el modal bloqueante aparece cuando hay salidas pendientes de confirmar.

### Pasos:

1. **Agregar salida al historial con fecha de ayer**

En MongoDB Compass, editar tu membresía y agregar esto al array `historialSalidas`:

```json
{
  "salidaId": {"$oid": "ID_DE_TU_SALIDA_TEST_TREKKING"},
  "fecha": {"$date": "2025-01-29T10:00:00.000Z"},
  "checkInRealizado": false,
  "asistenciaConfirmada": null
}
```

O desde MongoDB Shell:

```javascript
db.clubtrekkingmemberships.updateOne(
  { userId: ObjectId("TU_USER_ID") },
  {
    $push: {
      historialSalidas: {
        salidaId: ObjectId("ID_DE_TU_SALIDA_TEST"),
        fecha: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
        checkInRealizado: false,
        asistenciaConfirmada: null
      }
    }
  }
);
```

2. **Refrescar la app** (F5 o cerrar/abrir)

### Resultado Esperado:

- 🚨 **Modal bloqueante aparece inmediatamente**
- 📋 Muestra el título de la salida
- 📅 Muestra la fecha de ayer
- 🔘 Dos botones: "Sí, asistí" (verde) y "No asistí" (gris)
- 🚫 NO se puede cerrar el modal (sin X, sin click afuera)

**✅ Test 3 Pasó** si el modal aparece y bloquea la app.

---

## 🎯 Test 4: Confirmar Asistencia Positiva

### Objetivo
Probar que al confirmar asistencia el contador se resetea.

### Pasos:

1. Con el modal abierto del Test 3
2. Click en **"Sí, asistí"**

### Resultado Esperado:

- 🎉 Confetti aparece
- ✅ Toast verde: "¡Gracias por confirmar tu asistencia! 🎉"
- 🔓 Modal se cierra
- ✨ Puedes usar la app normalmente

### Verificar en MongoDB:

```javascript
db.clubtrekkingmemberships.findOne({ userId: ObjectId("TU_USER_ID") });
```

Debe mostrar:
```json
{
  "historialSalidas": [{
    "asistenciaConfirmada": true,  // ✅ Confirmado
    "checkInRealizado": true       // ✅ Marcado como completado
  }],
  "penalizacion": {
    "inasistenciasConsecutivas": 0  // ✅ Contador en 0
  }
}
```

**✅ Test 4 Pasó** si el contador está en 0 y asistenciaConfirmada es true.

---

## 🎯 Test 5: Primera Inasistencia (Advertencia)

### Objetivo
Probar que la primera inasistencia muestra advertencia pero no penaliza.

### Pasos:

1. **Agregar otra salida de ayer** (repetir paso del Test 3 con nueva salida)
2. **Refrescar la app** → Modal aparece
3. Click en **"No asistí"**

### Resultado Esperado:

- ⚠️ Toast naranja: "Recuerda que 2 inasistencias consecutivas resultan en penalización"
- 🔓 Modal se cierra
- ✅ Puedes usar la app normalmente

### Verificar en MongoDB:

```json
{
  "penalizacion": {
    "activa": false,                    // ❌ NO penalizado todavía
    "inasistenciasConsecutivas": 1,     // ⚠️ Primera inasistencia
    "diasRestantes": 0
  }
}
```

**✅ Test 5 Pasó** si `inasistenciasConsecutivas: 1` y `activa: false`.

---

## 🎯 Test 6: Segunda Inasistencia (Penalización)

### Objetivo
Probar que 2 inasistencias consecutivas activan la penalización de 3 días.

### Pasos:

1. **Agregar OTRA salida de ayer** (tercera salida)
2. **Refrescar la app** → Modal aparece
3. Click en **"No asistí"**

### Resultado Esperado - Primer Modal (Advertencia Extra):

- 🚨 Modal NO se cierra
- ⚠️ Cambia a pantalla de "Última advertencia"
- 📝 Mensaje: "Ya tienes 1 inasistencia registrada. Si confirmas que no asististe... serás penalizado por 3 días"
- 🔘 Dos opciones: "Volver atrás" o "Confirmar que NO asistí"

4. Click en **"Confirmar que NO asistí"**

### Resultado Esperado - Segundo Modal:

- 🚫 Toast rojo: "Has sido penalizado por 3 días por 2 inasistencias consecutivas"
- 🔓 Modal se cierra

### Verificar en MongoDB:

```javascript
db.clubtrekkingmemberships.findOne({ userId: ObjectId("TU_USER_ID") });
```

Debe mostrar:
```json
{
  "penalizacion": {
    "activa": true,                           // 🚫 PENALIZADO
    "fechaInicio": "2025-01-30T...",
    "fechaFin": "2025-02-02T...",            // 3 días después
    "diasRestantes": 3,
    "inasistenciasConsecutivas": 0,           // ✅ Reseteo después de penalizar
    "historialPenalizaciones": [              // 📜 Guardado en historial
      {
        "fechaInicio": "2025-01-30T...",
        "fechaFin": "2025-02-02T...",
        "motivo": "2 inasistencias consecutivas",
        "inasistenciasConsecutivas": 2
      }
    ]
  }
}
```

**✅ Test 6 Pasó** si `activa: true` y `diasRestantes: 3`.

---

## 🎯 Test 7: Intentar Reservar con Penalización

### Objetivo
Verificar que no puede reservar salidas mientras está penalizado.

### Pasos:

1. Ir a `/club-del-trekking`
2. Intentar reservar la "Salida A - Trekking Low Cost"

### Resultado Esperado:

- 🚫 Error 403
- 📝 Mensaje: "Tienes una penalización activa por X días más por inasistencias consecutivas"
- ❌ La reserva NO se crea

**✅ Test 7 Pasó** si no puede reservar.

---

## 🎯 Test 8: Expiración Automática de Penalización

### Objetivo
Verificar que la penalización expira automáticamente después de 3 días.

### Pasos:

1. **Cambiar fechaFin a ayer** en MongoDB:

```javascript
db.clubtrekkingmemberships.updateOne(
  { userId: ObjectId("TU_USER_ID") },
  {
    $set: {
      "penalizacion.fechaFin": new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  }
);
```

2. **Intentar reservar de nuevo** la "Salida A"

### Resultado Esperado:

- ✅ Reserva exitosa
- 🔓 Penalización desactivada automáticamente

### Verificar en MongoDB:

```json
{
  "penalizacion": {
    "activa": false,        // ✅ Desactivada automáticamente
    "diasRestantes": 0
  }
}
```

**✅ Test 8 Pasó** si puede reservar y `activa: false`.

---

## 🎯 Test 9: Reseteo de Contador al Asistir

### Objetivo
Verificar que asistir a una salida resetea el contador de inasistencias.

### Pasos:

1. Tener `inasistenciasConsecutivas: 1` (del Test 5)
2. Agregar salida de ayer
3. Modal aparece
4. Click en **"Sí, asistí"**

### Resultado Esperado:

```json
{
  "penalizacion": {
    "inasistenciasConsecutivas": 0  // ✅ Reseteo a 0
  }
}
```

**✅ Test 9 Pasó** si el contador vuelve a 0.

---

## 🎯 Test 10: Validación de Deporte en API

### Objetivo
Verificar que la API rechaza salidas que no son Trekking.

### Pasos:

1. Usar Postman o fetch desde consola del navegador:

```javascript
fetch('/api/club-trekking/reservar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    membershipId: 'TU_MEMBERSHIP_ID',
    salidaId: 'ID_DE_SALIDA_B_CICLISMO'
  })
});
```

### Resultado Esperado:

- 🚫 Status 400
- 📝 Error: "El Club del Trekking solo incluye salidas de Trekking. Esta salida es de Ciclismo"

**✅ Test 10 Pasó** si la API rechaza correctamente.

---

## 📊 Checklist Completo de Testing

- [ ] Test 1: Solo Trekking es elegible ✅
- [ ] Test 2: Crear membresía de prueba ✅
- [ ] Test 3: Modal aparece con salidas pendientes ✅
- [ ] Test 4: Confirmar asistencia positiva resetea contador ✅
- [ ] Test 5: Primera inasistencia muestra advertencia ✅
- [ ] Test 6: Segunda inasistencia activa penalización ✅
- [ ] Test 7: No puede reservar con penalización activa ✅
- [ ] Test 8: Penalización expira automáticamente ✅
- [ ] Test 9: Asistir resetea contador ✅
- [ ] Test 10: API rechaza deportes no-Trekking ✅

---

## 🐛 Troubleshooting

### El modal no aparece

1. Verificar que la salida está en `historialSalidas`
2. Verificar que `asistenciaConfirmada === null`
3. Verificar que `fecha < hoy`
4. Abrir DevTools → Console para ver errores

### Error "No autorizado"

- Verificar que estás logueado
- Verificar que la sesión está activa

### La penalización no se aplica

- Verificar que tiene exactamente 2 inasistencias consecutivas
- Revisar logs del servidor en la terminal

### El modal aparece pero no cierra

- Verificar que la API `/api/club-trekking/confirmar-asistencia` responde 200
- Revisar Network tab en DevTools

---

## 📝 Notas Finales

- **Producción**: Recuerda configurar el webhook de MercadoPago
- **Datos de prueba**: Puedes eliminar las membresías de prueba después
- **MongoDB**: Haz backup antes de hacer cambios manuales

---

**Última actualización**: 2025-01-30
