# 🚀 Integración Rápida - Sistema de Confirmación de Asistencia

Esta guía te muestra exactamente qué archivos modificar para integrar el sistema en tu app.

---

## ✅ Paso 1: Agregar Provider al Layout Principal

### Archivo: `src/app/layout.tsx`

Busca el SessionProvider y envuélvelo con el ConfirmacionAsistenciaProvider:

```tsx
import { ConfirmacionAsistenciaProvider } from "@/components/club-trekking/ConfirmacionAsistenciaProvider";
import { Toaster } from "react-hot-toast"; // Si no lo tienes ya

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>
          {/* 👇 AGREGAR ESTE WRAPPER */}
          <ConfirmacionAsistenciaProvider>
            {children}
          </ConfirmacionAsistenciaProvider>
          {/* 👆 */}

          <Toaster position="top-center" />
        </SessionProvider>
      </body>
    </html>
  );
}
```

**Eso es todo!** El sistema ahora funciona automáticamente.

---

## 🎨 Paso 2 (Opcional): Mostrar Penalización en Panel de Membresía

### Archivo: `src/app/club-del-trekking/mi-membresia/page.tsx`

Agregar después de la sección de "Uso semanal":

```tsx
{/* Penalización activa */}
{membership.penalizacion?.activa && (
  <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-6 border border-red-200 dark:border-red-800">
    <div className="flex items-center gap-3 mb-3">
      <AlertTriangle className="w-6 h-6 text-red-600" />
      <h3 className="font-bold text-red-900 dark:text-red-100">
        Penalización Activa
      </h3>
    </div>
    <p className="text-sm text-red-800 dark:text-red-200 mb-3">
      No puedes reservar salidas por {membership.penalizacion.diasRestantes} días más
      debido a inasistencias consecutivas.
    </p>
    <p className="text-xs text-red-600 dark:text-red-400">
      Finaliza el {formatDate(membership.penalizacion.fechaFin)}
    </p>
  </div>
)}
```

No olvides importar:
```tsx
import { AlertTriangle } from "lucide-react";
```

---

## 🔄 Paso 3: Actualizar useClubMembership Hook

### Archivo: `src/hooks/useClubMembership.ts`

Asegúrate de que el hook incluya la información de penalización:

```tsx
const isActive =
  membership?.estado === "activa" &&
  new Date() < new Date(membership.fechaFin) &&
  !membership.penalizacion?.activa; // 👈 Agregar esto

return {
  membership,
  loading,
  error,
  isActive,
  salidasRestantes,
  puedeReservar: isActive && salidasRestantes > 0,
  refetch,
};
```

---

## 🧪 Testing Rápido

### Test Manual

1. **Crear una salida de prueba:**
   - Precio: $5,000 (incluida en membresía)
   - Fecha: Ayer

2. **Simular reserva:**
   ```js
   // En MongoDB Compass o mongo shell
   db.clubtrekkingmemberships.updateOne(
     { userId: ObjectId("TU_USER_ID") },
     {
       $push: {
         historialSalidas: {
           salidaId: ObjectId("TU_SALIDA_ID"),
           fecha: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
           checkInRealizado: false,
           asistenciaConfirmada: null
         }
       }
     }
   )
   ```

3. **Abrir la app:**
   - Deberías ver el modal bloqueante
   - Confirma asistencia
   - Verifica que se cierra el modal

---

## 📱 Flujo Visual del Usuario

```
┌─────────────────────────────────────┐
│  Usuario reserva salida incluida    │
│  (Sistema agrega a historialSalidas)│
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Pasa el día del evento             │
│  (fecha < hoy)                      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Usuario abre la app                │
│  (Provider detecta salida pendiente)│
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  MODAL BLOQUEANTE                   │
│  "¿Asististe a esta salida?"        │
│                                     │
│  [Sí, asistí]   [No asistí]        │
└──────────┬──────────┬───────────────┘
           │          │
    SÍ ◄───┘          └───► NO
           │                │
           ▼                ▼
   ┌──────────────┐  ┌──────────────────┐
   │ ✅ Confirmado │  │ Incrementa       │
   │ Resetea      │  │ contador (1 o 2) │
   │ contador a 0 │  │                  │
   └──────────────┘  └────────┬─────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
         contador = 1                contador = 2
                  │                       │
                  ▼                       ▼
          ┌──────────────┐        ┌──────────────┐
          │ ⚠️ Advertencia│        │ 🚫 PENALIZACIÓN│
          │ mostrada     │        │ 3 días activa│
          └──────────────┘        └──────────────┘
```

---

## 🛠️ Archivos Creados (Ya Listos)

### ✅ Modelos
- [x] `src/models/ClubTrekkingMembership.ts` (actualizado con penalización)

### ✅ APIs
- [x] `src/app/api/club-trekking/confirmar-asistencia/route.ts`
- [x] `src/app/api/club-trekking/salidas-pendientes/route.ts`
- [x] `src/app/api/club-trekking/reservar/route.ts` (actualizado con validación)

### ✅ Componentes
- [x] `src/components/club-trekking/ConfirmacionAsistenciaModal.tsx`
- [x] `src/components/club-trekking/ConfirmacionAsistenciaProvider.tsx`

### ✅ Hooks
- [x] `src/hooks/useSalidasPendientesConfirmacion.ts`

### ✅ Documentación
- [x] `docs/CLUB_TREKKING_CONFIRMACION_ASISTENCIA.md`

---

## ⚠️ IMPORTANTE

### El único cambio que DEBES hacer:

**Agregar el Provider en `src/app/layout.tsx`** (Paso 1 arriba)

Sin esto, el sistema no funcionará. Los demás pasos son opcionales para mejorar la UX.

---

## 🎯 Checklist de Integración

- [ ] Provider agregado al layout principal
- [ ] Compilar sin errores: `npm run dev`
- [ ] Test manual con salida de ayer
- [ ] Verificar que modal aparece
- [ ] Confirmar asistencia positiva funciona
- [ ] Confirmar asistencia negativa funciona
- [ ] Penalización se aplica a las 2 inasistencias
- [ ] Penalización bloquea reservas
- [ ] Penalización expira después de 3 días

---

## 💡 Tips

1. **Durante desarrollo**, puedes forzar que aparezca el modal modificando fechas en la DB
2. **En producción**, el sistema funciona automáticamente sin intervención
3. **Para testing**, usa MongoDB Compass para ver el estado de `historialSalidas` y `penalizacion`
4. **El modal solo aparece para usuarios con membresía activa**

---

## 🆘 Troubleshooting

### El modal no aparece

1. Verificar que el usuario tiene membresía activa
2. Verificar que hay salidas con `asistenciaConfirmada: null` y `fecha < hoy`
3. Verificar que el Provider está correctamente agregado
4. Revisar console del navegador por errores

### El modal no se cierra después de confirmar

1. Verificar que la API `/api/club-trekking/confirmar-asistencia` responde 200
2. Verificar que `refetch()` se está llamando correctamente
3. Revisar network tab para ver la respuesta

### La penalización no se aplica

1. Verificar que tiene exactamente 2 inasistencias consecutivas
2. Verificar que el método `aplicarPenalizacion()` se está ejecutando
3. Revisar logs del servidor

---

## 📞 Soporte

Para más detalles técnicos, consulta:
- [CLUB_TREKKING_CONFIRMACION_ASISTENCIA.md](./CLUB_TREKKING_CONFIRMACION_ASISTENCIA.md)
- [CLUB_TREKKING.md](./CLUB_TREKKING.md)
- [CLUB_TREKKING_FRONTEND.md](./CLUB_TREKKING_FRONTEND.md)

---

Última actualización: 2025-01-30
