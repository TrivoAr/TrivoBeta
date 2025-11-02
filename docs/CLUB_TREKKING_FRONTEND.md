# Club del Trekking - Frontend Implementado

## 🎨 Componentes Creados

### 1. **Página Principal Mejorada**
📁 `src/app/club-del-trekking/page.tsx`

**Cambios realizados:**
- ✅ Botón CTA en el banner: "Unirme al Club por $25.000"
- ✅ Diseño mejorado con patrón de montañas
- ✅ Stats pill mostrando salidas disponibles
- ✅ Integración con hook `useClubMembership`
- ✅ Preparado para mostrar badges en eventos

**Características:**
- Filtros avanzados (dificultad, localidad, horario)
- Búsqueda en tiempo real
- Chips de filtros activos
- Diseño responsivo para mobile (390px)

---

### 2. **Página de Suscripción**
📁 `src/app/club-del-trekking/suscribirse/page.tsx`

**Elementos visuales:**
- 🎨 Hero card con gradiente y patrón de montañas
- 💰 Precio destacado: $25.000/mes
- ✨ 5 beneficios con iconos y descripciones
- 📋 Sección "¿Cómo funciona?" (3 pasos)
- ⚠️ Card de información importante
- 🔘 Botón CTA con estado de carga

**Flujo:**
1. Usuario hace clic en "Suscribirme ahora"
2. Se verifica sesión (si no está logueado → redirect a /login)
3. POST a `/api/club-trekking/subscribe`
4. Redirige a MercadoPago (`initPoint`)
5. Después del pago → `/club-del-trekking/success`

---

### 3. **Página de Éxito**
📁 `src/app/club-del-trekking/success/page.tsx`

**Efectos:**
- 🎊 Animación de confeti automática (3 segundos)
- ✅ Icono de éxito con efecto glow
- ✨ Sparkles animados

**Contenido:**
- Card de bienvenida con badge "Miembro Bronce"
- 3 beneficios activados con iconos
- Próximos pasos numerados
- CTAs: "Ver calendario" y "Ir a mi perfil"

**Dependencia requerida:**
```bash
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

---

### 4. **Componente ClubTrekkingBadge**
📁 `src/components/club-trekking/ClubTrekkingBadge.tsx`

**3 variantes de badges:**

#### A. `ClubTrekkingBadge` (Principal)
```tsx
<ClubTrekkingBadge
  variant="medium"  // small | medium | large
  showLabel={true}
  tipo="bronce"     // bronce | plata | oro
  incluidaEnMembresia={true}  // Para salidas incluidas
/>
```

**Uso:**
- Salidas incluidas en membresía → Badge verde con ✓
- Miembro del club → Badge con nivel (bronce/plata/oro)

#### B. `UserClubBadge` (Para perfil)
```tsx
<UserClubBadge tipo="oro" />
```

**Características:**
- Card grande con gradiente
- Patrón de montañas de fondo
- Título y descripción del nivel
- Sparkles para nivel oro

#### C. `CompactClubBadge` (Para listas)
```tsx
<CompactClubBadge tipo="plata" />
```

**Características:**
- Badge circular compacto (24x24px)
- Solo icono de montaña
- Perfecto para lista de miembros

---

### 5. **Hook useClubMembership**
📁 `src/hooks/useClubMembership.ts`

**Retorna:**
```typescript
{
  membership: ClubMembership | null;
  loading: boolean;
  error: string | null;
  isActive: boolean;             // true si estado='activa' y no vencida
  salidasRestantes: number;      // limiteSemanal - salidasRealizadas
  puedeReservar: boolean;        // isActive && salidasRestantes > 0
  refetch: () => Promise<void>;  // Recargar datos
}
```

**Ejemplo de uso:**
```tsx
function MiComponente() {
  const { membership, isActive, salidasRestantes, puedeReservar } = useClubMembership();

  if (isActive) {
    return <p>Tienes {salidasRestantes} salidas disponibles esta semana</p>;
  }

  return <button>Suscribirme al Club</button>;
}
```

**Features:**
- Auto-fetch cuando usuario inicia sesión
- Maneja estados de carga y error
- Método `refetch()` para actualizar datos

---

## 🎯 Flujo de Usuario Completo

### Nuevo Usuario (No Miembro)
```
1. Entra a /club-del-trekking
2. Ve banner con CTA "Unirme al Club por $25.000"
3. Hace clic → /club-del-trekking/suscribirse
4. Lee beneficios y hace clic en "Suscribirme ahora"
5. POST /api/club-trekking/subscribe
6. Redirigido a MercadoPago
7. Autoriza pago
8. Webhook confirma pago
9. Redirigido a /club-del-trekking/success
10. Ve confeti y mensaje de bienvenida
11. Hace clic en "Ver calendario de salidas"
12. Puede reservar salidas incluidas
```

### Usuario Miembro Activo
```
1. Entra a /club-del-trekking
2. Hook detecta membresía activa
3. Banner muestra: "Miembro Activo - X salidas restantes"
4. Ve badges verdes en salidas incluidas
5. Puede hacer clic en "Reservar con membresía"
6. Sistema valida límite semanal
7. Crea reserva sin pago
```

---

## 🎨 Paleta de Colores

### Club del Trekking
- **Principal**: `#C95100` (Naranja quemado)
- **Hover**: `#A03D00`
- **Gradiente**: `from-[#C95100] via-[#A03D00] to-[#7A2D00]`

### Badges de Nivel
- **Bronce**: `#CD7F32` → `#8B5A2B`
- **Plata**: `#C0C0C0` → `#808080`
- **Oro**: `#FFD700` → `#DAA520`

### Estados
- **Incluida**: Verde `#10B981` / `#059669`
- **Éxito**: Verde `#22C55E` / `#16A34A`
- **Advertencia**: Ámbar `#F59E0B` / `#D97706`

---

### 6. **Panel de Membresía**
📁 `src/app/club-del-trekking/mi-membresia/page.tsx`

**Características:**
- 🎯 Detección automática de membresía activa
- 📊 Uso semanal con barra de progreso
- 📅 Información de pagos (próximo pago, precio)
- 📜 Historial completo de salidas con check-ins
- 🎨 UserClubBadge con nivel (bronce/plata/oro)
- ⚙️ Acciones: Pausar, Reactivar, Cancelar

**Estados manejados:**
- Sin membresía → CTA para suscribirse
- Activa → Stats + historial + acciones
- Pausada → Botón para reactivar
- Vencida/Cancelada → Botón para renovar

**Funciones:**
```typescript
handlePauseMembership()     // POST /api/club-trekking/pause/:id
handleReactivateMembership() // POST /api/club-trekking/reactivate/:id
handleCancelMembership()    // POST /api/club-trekking/cancel/:id
```

---

### 7. **Componente CheckInButton**
📁 `src/components/club-trekking/CheckInButton.tsx`

**Props:**
```typescript
interface CheckInButtonProps {
  salidaId: string;
  locationCoords?: { lat: number; lng: number };
  requiereCheckIn?: boolean;
  onCheckInSuccess?: () => void;
  className?: string;
}
```

**Características:**
- 📍 Solicita ubicación GPS del navegador
- 📏 Calcula distancia con fórmula de Haversine
- ✅ Valida proximidad (100m) en cliente y servidor
- ⏰ Valida ventana de tiempo (30 min antes - 15 min después)
- 🎉 Muestra mensaje de éxito con estadísticas
- ⚠️ Maneja todos los errores de geolocalización

**Flujo:**
1. Usuario hace clic en "Hacer Check-in"
2. Se solicita permiso de ubicación
3. Se calcula distancia al punto de encuentro
4. Si está dentro de 100m → POST `/api/club-trekking/check-in`
5. Servidor valida tiempo y ubicación nuevamente
6. Actualiza membresía con check-in registrado
7. Muestra confirmación con stats

**Manejo de errores:**
- Error 1 (PERMISSION_DENIED) → "Activa permisos de ubicación"
- Error 2 (POSITION_UNAVAILABLE) → "No se pudo obtener ubicación"
- Error 3 (TIMEOUT) → "Tiempo agotado"
- Distancia > 100m → Muestra distancia exacta

---

## 📱 Componentes Completados

### ✅ Implementados

1. **EventCard Mejorado** ✅
   - ✅ Muestra badge si `clubTrekking.incluidaEnMembresia === true`
   - ✅ Badge verde con check "Incluida en Club"
   - ✅ Integrado en [EventCard.tsx](../src/components/EventCard.tsx)

2. **Panel de Membresía** ✅
   - ✅ Estado actual (activa/pausada/vencida/cancelada)
   - ✅ Salidas restantes esta semana con barra de progreso
   - ✅ Historial de salidas con check-ins
   - ✅ Botones: Pausar, Reactivar, Cancelar
   - ✅ Próxima fecha de pago y datos de suscripción

3. **Botón de Check-In** ✅
   - ✅ Solicita ubicación GPS
   - ✅ Valida proximidad (100m)
   - ✅ Valida tiempo (30 min antes - 15 min después)
   - ✅ POST `/api/club-trekking/check-in`
   - ✅ Manejo completo de errores

### ⬜ Pendientes

4. **Calendario de Salidas** (`/club-del-trekking/calendario`)
   - Vista calendario mensual
   - Filtro solo salidas incluidas
   - Click en día → lista de salidas
   - Badges visuales de inclusión

5. **Estadísticas** (`/club-del-trekking/estadisticas`)
   - Total de salidas realizadas
   - Km recorridos (integración Strava)
   - Lugares visitados (únicos)
   - Racha de semanas consecutivas
   - Progreso hacia siguiente badge

---

## 🔧 Integración con EventCard Existente

Para mostrar el badge en las cards de eventos existentes:

```tsx
// En EventCard.tsx
import { ClubTrekkingBadge } from "@/components/club-trekking/ClubTrekkingBadge";

// Dentro del componente, arriba del precio:
{event.clubTrekking?.incluidaEnMembresia && (
  <ClubTrekkingBadge
    variant="small"
    incluidaEnMembresia={true}
    className="mb-2"
  />
)}
```

---

## 📦 Dependencias Adicionales Necesarias

### Instalar:
```bash
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

### Ya disponibles (verificar):
- `next-auth` ✅
- `react-hot-toast` ✅
- `lucide-react` ✅
- `shadcn/ui` components ✅

---

## 🚀 Estado de Implementación

### ✅ Completadas (Alta Prioridad)
1. ✅ Instalar `canvas-confetti`
2. ✅ Modificar `EventCard` para mostrar badges
3. ✅ Crear página `/club-del-trekking/mi-membresia`
4. ✅ Implementar botón de check-in con geolocalización
5. ✅ Documentar configuración webhook en MercadoPago → [CLUB_TREKKING_WEBHOOK_MP.md](./CLUB_TREKKING_WEBHOOK_MP.md)

### ⬜ Pendientes (Media Prioridad)
6. ⬜ Configurar webhook en MercadoPago Dashboard (seguir [CLUB_TREKKING_WEBHOOK_MP.md](./CLUB_TREKKING_WEBHOOK_MP.md))
7. ⬜ Crear calendario visual
8. ⬜ Página de estadísticas personales
9. ⬜ Sistema de notificaciones push
10. ⬜ Integración con Strava (km recorridos)

### ⬜ Futuras (Baja Prioridad)
11. ⬜ Gamificación avanzada
12. ⬜ Logros y desafíos
13. ⬜ Comunidad/chat grupal
14. ⬜ Merchandising del club

---

## 🐛 Testing Checklist

- [ ] Suscripción funciona correctamente
- [ ] Webhook de MP actualiza estado
- [ ] Badges se muestran en salidas incluidas
- [ ] Hook detecta membresía activa
- [ ] Límite semanal se respeta
- [ ] Página de éxito muestra confeti
- [ ] Responsive en mobile (390px)
- [ ] Dark mode funciona correctamente
- [ ] Estados de carga se muestran
- [ ] Errores se manejan con toast

---

## 📝 Notas de Implementación

### Variables de Entorno (`.env`)
```env
# Club del Trekking
CLUB_TREKKING_PRICE=25000
CLUB_TREKKING_MAX_SALIDA_PRICE=10000
CLUB_TREKKING_WEEKLY_LIMIT=2
CLUB_TREKKING_CHECK_IN_RADIUS_METERS=100

# MercadoPago
MP_ACCESS_TOKEN=tu_access_token
NEXTAUTH_URL=https://tudominio.com
```

### Webhook de MercadoPago
**URL:** `https://tudominio.com/api/webhooks/mercadopago/club-trekking`

**Configurar en:** MercadoPago Dashboard → Webhooks

---

Creado: 2025-01-30
Última actualización: 2025-01-30
