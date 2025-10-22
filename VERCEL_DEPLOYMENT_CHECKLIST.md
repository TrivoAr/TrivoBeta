# Checklist para Despliegue en Vercel - Trivo Klubo

## ⚠️ PROBLEMAS CRÍTICOS DETECTADOS

### 🚨 1. Socket.IO NO es Compatible con Vercel Serverless
**Severidad: CRÍTICA**

El archivo `server.js` implementa un servidor Node.js customizado con Socket.IO para notificaciones en tiempo real. **Esto NO funcionará en Vercel** porque:

- Vercel usa funciones serverless (sin estado)
- Socket.IO requiere conexiones WebSocket persistentes
- El servidor HTTP customizado no se ejecuta en producción en Vercel

**Soluciones:**

**Opción A: Migrar a Pusher o Ably (Recomendado para Vercel)**
```bash
npm install pusher-js pusher
# o
npm install ably
```

**Opción B: Desplegar en plataforma con soporte de WebSockets**
- Railway.app
- Render.com
- DigitalOcean App Platform
- AWS EC2/ECS
- Heroku

**Opción C: Implementar polling para notificaciones en Vercel**
- Reemplazar WebSockets con endpoints REST
- Usar `/api/notifications/poll` con intervalo de tiempo
- Menos eficiente pero funcional en serverless

### 🚨 2. Variables de Entorno Faltantes

**Google OAuth no configurado:**
```bash
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

**NEXTAUTH_SECRET debe cambiar en producción:**
```bash
# Generar con: openssl rand -base64 32
NEXTAUTH_SECRET=secret  # ⚠️ CAMBIAR EN PRODUCCIÓN
```

---

## ✅ CONFIGURACIÓN ACTUAL

### 1. Archivos de Configuración

#### `vercel.json` ✅
```json
{
  "regions": ["gru1"],  // São Paulo - Buena región para Argentina
  "functions": {
    "app/**/route.ts": {
      "maxDuration": 15,    // Límite de plan gratuito: 10s, Pro: 15s
      "memory": 1024        // 1GB memoria
    }
  }
}
```

#### `next.config.js` ✅
- PDFKit configurado para serverless ✅
- Webpack fallbacks para MongoDB ✅
- Imágenes optimizadas ✅
- ESLint/TypeScript ignore durante build ✅

### 2. Variables de Entorno Requeridas

#### Crear en Vercel Dashboard:

**Base:**
```bash
MONGODB_URI=mongodb+srv://trivo:ONZXFNums7xjLZAh@cluster0.kc1vpsx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
NEXTAUTH_SECRET=<generar_nuevo_secret_en_produccion>
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

**OAuth Google:**
```bash
GOOGLE_CLIENT_ID=<tu_google_client_id>
GOOGLE_CLIENT_SECRET=<tu_google_client_secret>
```

**Firebase (Push Notifications):**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAb5UAUf3HWbxRR5scRZFuCI5erAg41DUs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=klubo-8dc4d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=klubo-8dc4d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=klubo-8dc4d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=683853180564
NEXT_PUBLIC_FIREBASE_APP_ID=1:683853180564:web:783a6127fcd47802c28e81
VAPID_PUBLIC_KEY=BCjSUP00WkZV3hicPUaAAnsPc5xjs6C4LQEF7V7-rjOJRu6RorExCCnmI0UGs2BKn04s8GIGhVsUvbpsDM6uns0
VAPID_PRIVATE_KEY=xj4takWy2yb5cjKFavZYnu79yQ-xjvyipyVeqxnpOhA
VAPID_EMAIL=mailto:medinaestban31@gmail.com
```

**MercadoPago:**
```bash
MP_ACCESS_TOKEN=APP_USR-4970861093465590-010315-67d54047f2b166ed4a4b294ad01bf781-2190675569
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-366c753d-bfc0-4863-b3dc-9103cbcf8bc0
```

**Email (Nodemailer):**
```bash
EMAIL_USER=piovesanmatias@gmail.com
EMAIL_PASS=zzlo gksf mnrb uhya
RESEND_API_KEY=re_jbXmePrp_6p3trLmxArKF8RtQQ7Lviyo7
RESEND_FROM="Soporte Trivo <noreply@trivo.com.ar>"
```

**Maps & Geolocation:**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCn9rPwGiz0-7HveeFb_WCYbZrG4ZWnO1c
LOCATIONIQ_API_KEY=pk.27dbe67f9a2116f1269efd640ec85c88
HERE_API_KEY=JHGzYIUpYg2PqknoGl6gYTz_dNLYs2txKKM0U55F1Fw
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWF0cGlvdmVzYW4iLCJhIjoiY21lOHplMDYyMGk3ajJucTJ6MHpvYnN3ZSJ9.mLpO1KDL65xz6sp44aVgpg
MAPBOX_TOKEN=sk.eyJ1IjoibWF0cGlvdmVzYW4iLCJhIjoiY21lOTB3aG5qMG03ODJtcTVua3BxaHJmNiJ9.SJcjVnG7w2_QLvF2PICacg
```

**Strava Integration:**
```bash
STRAVA_CLIENT_ID=172532
STRAVA_CLIENT_SECRET=073d45386c141219fd8c5fbb03271b39d10d2983
STRAVA_REDIRECT_URI=https://tu-dominio.vercel.app/api/strava/callback
```

**Other:**
```bash
SCANNER_KEY=pon_una_clave_larga_unica_y_segura_aqui
```

---

## 📋 PASOS PARA DESPLEGAR

### Paso 1: Resolver Socket.IO (CRÍTICO)

**Antes de desplegar, debes decidir:**

1. ¿Migrar a Pusher/Ably? (Recomendado)
2. ¿Desplegar en plataforma diferente? (Railway, Render)
3. ¿Implementar polling? (Menos óptimo)

### Paso 2: Configurar Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear credenciales OAuth 2.0
3. Agregar URIs autorizados:
   - `https://tu-dominio.vercel.app`
   - `https://tu-dominio.vercel.app/api/auth/callback/google`
4. Copiar Client ID y Secret a variables de entorno

### Paso 3: Actualizar Variables de Producción

En `.env` local, actualizar:
```bash
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
STRAVA_REDIRECT_URI=https://tu-dominio.vercel.app/api/strava/callback
```

### Paso 4: Conectar Repositorio en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Importar repositorio de GitHub
4. Configurar:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### Paso 5: Agregar Variables de Entorno

1. En el dashboard de Vercel → Settings → Environment Variables
2. Copiar todas las variables listadas arriba
3. Marcar "Production", "Preview", y "Development" según corresponda

### Paso 6: Modificar package.json

Asegurar scripts de producción:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**⚠️ IMPORTANTE:** Si mantienes Socket.IO, el script `"dev": "node server.js"` causará problemas. Vercel ignorará `server.js` y usará el servidor Next.js estándar.

### Paso 7: Deploy

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Deploy desde CLI
vercel

# O push a GitHub y Vercel auto-desplegará
git push origin main
```

---

## 🔧 ARCHIVOS A MODIFICAR PARA SERVERLESS

### 1. Eliminar/Adaptar server.js

**Opción A:** Comentar y mantener para desarrollo local
```javascript
// Este archivo NO se usa en producción Vercel
// Solo para desarrollo local con Socket.IO
```

**Opción B:** Crear archivos separados
```
server.development.js  // Para local
package.json scripts:
  "dev": "node server.development.js"
  "start": "next start"  // Vercel usa esto
```

### 2. Adaptar Sistema de Notificaciones

Si decides usar polling en lugar de WebSockets:

**Crear:** `src/app/api/notifications/poll/route.ts`
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Notificacion from "@/models/notificacion";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();

  const notifications = await Notificacion.find({
    userId: session.user.id,
    read: false,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('fromUserId', 'firstname lastname')
    .lean();

  return NextResponse.json({ notifications });
}
```

**Modificar cliente para polling:**
```typescript
// useNotifications.ts
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch('/api/notifications/poll');
    const { notifications } = await res.json();
    setNotifications(notifications);
  }, 10000); // Poll cada 10 segundos

  return () => clearInterval(interval);
}, []);
```

---

## 🧪 TESTING ANTES DE PRODUCCIÓN

### Test Local
```bash
npm run build
npm start
```

Verificar:
- ✅ Build exitoso sin errores TypeScript
- ✅ Todas las rutas API responden
- ✅ Autenticación funciona
- ✅ MongoDB conecta correctamente
- ✅ Imágenes cargan desde Firebase

### Test en Preview de Vercel

1. Hacer push a rama `develop` o `preview`
2. Vercel creará deployment de preview
3. Probar todas las funcionalidades críticas

---

## 📊 MONITOREO POST-DEPLOYMENT

### Logs en Vercel
- Dashboard → Project → Logs
- Filtrar por Function Logs para ver errores serverless

### Límites del Plan Free
- **Funciones:** 10s timeout
- **Bandwidth:** 100GB/mes
- **Builds:** 100 horas/mes
- **Edge Requests:** Ilimitadas

### Monitorear
- Tiempos de respuesta de API routes
- Uso de memoria en funciones
- Errores en logs
- Conexiones MongoDB (pooling adecuado)

---

## 🚀 CHECKLIST FINAL

Antes de marcar como listo:

- [ ] Decidir estrategia Socket.IO (Pusher/Polling/Otra plataforma)
- [ ] Configurar Google OAuth
- [ ] Generar nuevo `NEXTAUTH_SECRET` para producción
- [ ] Actualizar todas las URLs a producción
- [ ] Agregar variables de entorno en Vercel
- [ ] Modificar `package.json` scripts si es necesario
- [ ] Test build local exitoso
- [ ] Commit y push cambios
- [ ] Verificar deployment en Vercel
- [ ] Probar login con Google OAuth
- [ ] Probar login con credenciales
- [ ] Verificar notificaciones funcionan
- [ ] Probar pagos de MercadoPago
- [ ] Verificar integración Strava
- [ ] Verificar carga de imágenes Firebase
- [ ] Revisar logs por errores
- [ ] Configurar dominio custom (opcional)

---

## 📞 RECURSOS

- [Vercel Docs - Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Docs - Environment Variables](https://vercel.com/docs/environment-variables)
- [Pusher Docs](https://pusher.com/docs/)
- [Railway Docs](https://docs.railway.app/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Última actualización:** 2025-10-22
**Revisado por:** Claude Code
