# UI de Registro de Asistencias

Interfaz completa para que profesores y dueños de academias registren asistencias de alumnos.

## 📍 Ubicación

El botón de **"Asistencias"** aparece en:
- **Vista de Academia** (`/academias/[id]`) - En cada tarjeta de grupo

## 👁️ Visibilidad

El botón **solo es visible** para:
- ✅ Dueño de la academia
- ✅ Profesor asignado al grupo específico

Los alumnos regulares **NO ven** el botón de asistencias.

## 🎯 Funcionalidades

### Modal de Asistencias

Al hacer clic en "Asistencias" se abre un modal con:

1. **Selector de Fecha**
   - Navegación día a día (← →)
   - Muestra "Hoy" cuando corresponde
   - Formato: "lunes, 1 de octubre"

2. **Lista de Miembros del Grupo**
   - Avatar del usuario
   - Nombre completo
   - Estado de asistencia
   - Badges informativos:
     - 🔵 **Trial** - Usuario en período gratuito
     - 🟢 **activa** - Suscripción pagada activa
     - 🔵 **trial** - Estado de suscripción
     - ⚪ **vencida/pausada/cancelada**

3. **Acciones**
   - **Marcar asistencia**: Botón para registrar que el alumno asistió
   - **Ya marcada**: Muestra ✓ verde si ya asistió
   - Estado en tiempo real

4. **Contador**
   - "X / Y asistencias" - Total de presentes vs total de miembros

## 🔄 Flujo de Uso

### Paso 1: Acceder al Grupo
```
1. Profesor/Dueño entra a la academia
2. Ve la lista de grupos
3. Cada grupo tiene botón "Asistencias" (solo visible para él)
```

### Paso 2: Abrir Modal
```
4. Click en "Asistencias"
5. Se abre modal con fecha de HOY por defecto
6. Carga lista de miembros del grupo
```

### Paso 3: Registrar Asistencia
```
7. Busca al alumno en la lista
8. Click en "Marcar"
9. Sistema registra asistencia
10. Muestra ✓ verde "Asistió"
```

### Paso 4: Gestión del Trial
```
Si el alumno está en trial y supera el límite:
- Sistema detecta automáticamente
- Muestra toast: "Trial expirado. Se ha creado suscripción de pago"
- Alumno debe completar pago en Mercado Pago
- Badge cambia de "trial" a "activa" cuando paga
```

### Paso 5: Cambiar Fecha
```
11. Si necesita registrar asistencia de otro día:
    - Click en flechas ← o →
    - Selecciona fecha deseada
    - Repite proceso de marcado
```

## 💡 Casos de Uso

### Caso 1: Clase del Día
**Situación**: Es lunes y hay clase a las 18:00

```
1. Profesor abre modal de asistencias
2. Fecha ya está en HOY (lunes 1/10)
3. Va marcando alumno por alumno según llegan
4. Sistema cuenta: "5 / 12 asistencias"
```

### Caso 2: Olvidó Registrar Clase Pasada
**Situación**: Es miércoles, olvidó marcar asistencias del lunes

```
1. Profesor abre modal
2. Click en flecha ← dos veces
3. Llega al lunes pasado
4. Marca todas las asistencias de ese día
5. Vuelve a HOY con flecha →
```

### Caso 3: Alumno Agota Trial
**Situación**: Alumno en trial asiste a su 2da clase (límite: 1 clase gratis)

```
1. Profesor marca asistencia
2. Sistema detecta: trial.clasesAsistidas = 2 > MAX_CLASES_GRATIS (1)
3. Toast naranja: "Trial de Juan expirado. Suscripción creada."
4. Se crea preapproval en Mercado Pago automáticamente
5. Badge cambia: "Trial" → "trial" (estado pendiente de pago)
6. Alumno recibe notificación para pagar
7. Cuando paga, badge cambia a "activa" 🟢
```

## 🎨 Componentes Visuales

### Botón de Asistencias (en grupo)
```tsx
[Imagen del grupo]
Running Principiantes
Lun, Mie, Vie, 18:00hs
Buenos Aires

[📋 Asistencias]  ← Botón naranja/primario
```

### Modal de Asistencias
```
┌─────────────────────────────────────┐
│  Registro de Asistencias            │
│  Running Principiantes              │
├─────────────────────────────────────┤
│  ←   lunes, 1 de octubre   →       │
│        Hoy                          │
├─────────────────────────────────────┤
│  👤 Juan Pérez          [Marcar]   │
│  👤 María García        ✓ Asistió  │
│     🔵 Trial                        │
│  👤 Pedro López         ✓ Asistió  │
│     🟢 activa                       │
│  👤 Ana Martínez        [Marcar]   │
│     ⚪ vencida                      │
├─────────────────────────────────────┤
│  3 / 4 asistencias        [Cerrar] │
└─────────────────────────────────────┘
```

## 🔧 Personalización

### Cambiar Permisos
Si quieres agregar más roles con acceso, edita:

**Archivo**: `src/app/academias/[id]/page.tsx:472`

```typescript
const puedeGestionarAsistencias = (grupo: Grupo) => {
  if (!session?.user?.id) return false;

  // Dueño de la academia
  if (academia?.dueño_id._id === session.user.id) return true;

  // Profesor del grupo
  if (grupo.profesor_id) {
    const profesorId = typeof grupo.profesor_id === "string"
      ? grupo.profesor_id
      : grupo.profesor_id._id;
    if (profesorId === session.user.id) return true;
  }

  // AGREGAR: Nuevo rol con permisos
  // if (session.user.rol === "admin") return true;

  return false;
};
```

### Cambiar Estilo del Botón
**Archivo**: `src/app/academias/[id]/page.tsx:798`

```tsx
className="mt-2 w-full h-[28px] bg-primary text-primary-foreground ..."
// Cambiar bg-primary por otro color
```

## 📱 Responsive

- Ancho fijo: 390px (optimizado para mobile)
- Modal responsivo: `sm:max-w-md`
- Scroll automático si hay muchos miembros
- Touch-friendly: botones grandes, fácil de tocar

## 🔗 Integración con Backend

### Endpoints Utilizados

1. **GET** `/api/asistencias/grupo/[grupoId]?fecha=YYYY-MM-DD`
   - Carga miembros del grupo
   - Carga asistencias del día seleccionado
   - Verifica permisos

2. **POST** `/api/asistencias/registrar`
   ```json
   {
     "userId": "676d77e5f3f8a00014d9d3e6",
     "grupoId": "676d77e5f3f8a00014d9d3e5",
     "fecha": "2025-10-01T18:00:00.000Z"
   }
   ```
   - Registra asistencia
   - Gestiona trial automáticamente
   - Crea suscripción si expira trial

## 🐛 Troubleshooting

### El botón no aparece
**Problema**: Profesor no ve el botón de asistencias

**Solución**:
1. Verificar que `grupo.profesor_id` está asignado en la BD
2. Verificar que `session.user.id` coincide con `profesor_id`
3. Revisar que el usuario es el dueño de la academia

### Modal vacío / sin miembros
**Problema**: Modal se abre pero no muestra miembros

**Solución**:
1. Verificar que hay miembros en `users_grupo` para ese grupo
2. Verificar permisos en `/api/asistencias/grupo/[grupoId]`
3. Revisar console del navegador para errores

### Error al marcar asistencia
**Problema**: Click en "Marcar" da error

**Solución**:
1. Verificar que el usuario tiene suscripción al grupo
2. Verificar que la suscripción está activa o en trial
3. Si trial expiró, verificar credenciales de Mercado Pago del dueño

## 🚀 Próximas Mejoras

- [ ] Búsqueda de alumnos por nombre
- [ ] Filtros (solo trial, solo activos, etc.)
- [ ] Exportar asistencias a Excel
- [ ] Estadísticas por alumno
- [ ] Notificaciones push cuando se marca asistencia

---

**Última actualización**: 2025-10-01
