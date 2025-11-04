# Próximos Pasos: De PWABuilder al Play Store

## Estado Actual

Ya analizaste tu PWA en PWABuilder y obtuviste un score de **20/44** en el manifest. He actualizado el manifest con los campos faltantes y ahora necesitas:

1. Generar los iconos faltantes para Android
2. Tomar screenshots reales de la app
3. Re-analizar en PWABuilder
4. Generar el paquete Android
5. Configurar Digital Asset Links
6. Publicar en Play Store

---

## Paso 1: Generar Iconos de Android (INMEDIATO)

### Opción A: Usar Sharp (Recomendado - Automático)

He creado un script que genera todos los iconos necesarios desde tu icono de 512×512.

#### Instalar Sharp

```bash
npm install sharp --save-dev
```

#### Ejecutar el Script

```bash
node scripts/generate-android-icons.js
```

Esto generará automáticamente:
- ✅ icon-48x48.png
- ✅ icon-72x72.png
- ✅ icon-96x96.png
- ✅ icon-144x144.png

### Opción B: Generación Manual (Si Sharp da problemas)

Si tienes problemas con Sharp, puedes usar herramientas online:

1. **PWABuilder Image Generator:** https://www.pwabuilder.com/imageGenerator
   - Sube tu icono de 512×512
   - Descarga el paquete completo
   - Copia los iconos generados a `/public/icons/`

2. **Favicon Generator:** https://realfavicongenerator.net/
   - Genera todos los tamaños necesarios
   - Descarga y extrae

### Opción C: Usar Photoshop/GIMP/Figma

Si prefieres control manual:
- Abre `icon-512x512.png`
- Redimensiona a cada tamaño (48, 72, 96, 144)
- Exporta como PNG con transparencia
- Guarda en `/public/icons/`

---

## Paso 2: Tomar Screenshots Reales

Los screenshots en el manifest son **críticos** para el Play Store. Necesitas capturas reales de tu app.

### Qué Screenshots Tomar

**Mínimo requerido (2-8 screenshots):**
1. **Pantalla de inicio/home** - Mostrando eventos disponibles
2. **Detalle de un evento** - Ejemplo de evento social/deportivo
3. **Crear evento** - El formulario de creación
4. **Perfil de usuario** - Vista del perfil con eventos
5. **Mapa** - Vista de mapa con ubicación de eventos (si aplica)

### Cómo Tomar Screenshots

#### Opción A: Desde el Navegador (Recomendado)

1. Abre tu app en Chrome
2. Abre DevTools (F12)
3. Click en el icono de dispositivo móvil (Ctrl+Shift+M)
4. Selecciona "iPhone 12 Pro" o similar (390px de ancho, igual que tu diseño)
5. Navega a cada pantalla importante
6. Click derecho → "Capture screenshot"
7. Guarda cada screenshot

#### Opción B: Desde un Dispositivo Real

1. Abre tu PWA en un Android o iPhone
2. Navega a cada pantalla
3. Toma screenshots con el botón nativo
4. Transfiere las imágenes a tu computadora

### Especificaciones de Screenshots

**Para Play Store:**
- **Formato:** PNG o JPG (24-bit, sin alpha)
- **Dimensiones mínimas:** 320px (ancho o alto)
- **Dimensiones máximas:** 3840px (ancho o alto)
- **Relación de aspecto:** 16:9 o 9:16 (aproximado)
- **Tamaño de archivo:** Máximo 8MB cada uno

**Recomendación para Trivo:**
- Usa formato vertical (portrait): 1080×1920 o 1080×2340
- Esto simula pantallas de móvil modernas
- Asegúrate de que se vea el contenido relevante

### Optimizar Screenshots

Una vez tengas las imágenes:

```bash
# Si necesitas redimensionar (requiere ImageMagick)
magick convert screenshot.png -resize 1080x1920 screenshot-optimized.png

# Si necesitas comprimir
magick convert screenshot.png -quality 85 screenshot-optimized.jpg
```

### Actualizar Manifest con Screenshots

Guarda tus screenshots en `/public/screenshots/` y actualiza el manifest:

```json
"screenshots": [
  {
    "src": "/screenshots/home.png",
    "sizes": "1080x1920",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Pantalla principal con eventos disponibles"
  },
  {
    "src": "/screenshots/event-detail.png",
    "sizes": "1080x1920",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Detalle de evento deportivo"
  },
  {
    "src": "/screenshots/create-event.png",
    "sizes": "1080x1920",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Crear nuevo evento"
  },
  {
    "src": "/screenshots/profile.png",
    "sizes": "1080x1920",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Perfil de usuario con historial"
  }
]
```

---

## Paso 3: Re-analizar en PWABuilder

### Una vez completados los pasos anteriores:

1. **Commitea y despliega los cambios:**

```bash
git add public/manifest.json
git add public/icons/icon-*.png
git add public/screenshots/
git commit -m "feat: mejorar manifest para empaquetado Android"
git push
```

2. **Espera el despliegue** (Vercel, Netlify, etc.)

3. **Re-analiza en PWABuilder:**
   - Ve a https://www.pwabuilder.com/
   - Ingresa tu URL de producción nuevamente
   - Click en "Start"
   - Tu score debería mejorar significativamente (objetivo: 35+/44)

### Action Items que Deberían Resolverse

Después de estos cambios, deberían resolverse:
- ✅ Screenshots agregados
- ✅ ID del manifest agregado
- ✅ Iconos de todos los tamaños
- ✅ `related_applications` configurado
- ✅ `prefer_related_applications` configurado
- ✅ `lang` y `scope` agregados

---

## Paso 4: Verificar Service Worker (Si hay advertencia)

Si PWABuilder muestra advertencia del service worker, verifica:

### Comprobar que esté registrado

```bash
# Abre tu sitio en Chrome
# DevTools → Application → Service Workers
# Deberías ver tu service worker activo
```

### Si no está registrado correctamente

Verifica que tu `_app.tsx` o componente raíz tenga:

```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => console.log('SW registrado:', registration),
      (error) => console.error('Error al registrar SW:', error)
    );
  }
}, []);
```

---

## Paso 5: Generar Paquete Android (.aab)

Una vez que tu score esté optimizado:

### En PWABuilder Web

1. **En el reporte de PWABuilder, sección "Publish"**
2. Click en "Store Package" → selecciona **"Android"** o **"Google Play"**
3. Click en **"Generate Package"**

### Configurar Opciones del Paquete

Te pedirá la siguiente información:

#### Información Básica

```
Package ID: com.trivo.app
  (IMPORTANTE: No podrás cambiar esto después)

App name: Trivo

App version: 1.0.0
  (Usa versionado semántico)

Version code: 1
  (Incrementa con cada release: 2, 3, 4...)
```

#### URLs y Configuración

```
Host: trivo.com
  (Tu dominio en producción, SIN https://)

Start URL: /
  (Página inicial de tu app)

Theme color: #000000
  (El color de tu manifest)

Background color: #FFFFFF
  (El color de fondo de tu manifest)

Display mode: standalone
  (Ya configurado en tu manifest)
```

#### Iconos

- PWABuilder usará automáticamente los iconos de tu manifest
- Verifica que se vean correctamente en la preview

#### Opciones Avanzadas (Opcional)

```
Splash screen: Auto-generado desde iconos
Orientation: portrait-primary (tu configuración actual)
Fallback behavior: none (o configura una página de error)
```

### Generar y Descargar

1. Click en **"Generate"** o **"Download Package"**
2. PWABuilder procesará tu PWA (puede tomar 30-60 segundos)
3. Descarga el archivo `.zip`

### Contenido del Paquete

El `.zip` contendrá:

```
trivo-android/
├── app.aab                      ← El paquete Android para Play Store
├── assetlinks.json              ← Para configurar Digital Asset Links
├── signing.keystore             ← Tu keystore (guárdalo seguro)
├── Next-steps.md                ← Instrucciones de PWABuilder
└── signing-key-info.txt         ← Información de la clave
```

### Guardar el Keystore de Forma Segura

**CRÍTICO: Guarda estos archivos en múltiples lugares seguros:**

```bash
# Crea un directorio seguro fuera del repositorio
mkdir ~/trivo-signing-keys
cp signing.keystore ~/trivo-signing-keys/
cp signing-key-info.txt ~/trivo-signing-keys/

# Backup en la nube (encriptado)
# Sube a Google Drive, Dropbox, etc. en una carpeta privada

# NO COMMITEES ESTO A GIT
# Verifica que esté en .gitignore
```

**Anota las contraseñas:**
- Keystore password
- Key password
- Key alias

---

## Paso 6: Configurar Digital Asset Links

Este paso es **CRÍTICO** para que tu app no muestre la barra de navegador.

### Paso 6.1: Obtener SHA-256 Fingerprint

El archivo `signing-key-info.txt` del paquete descargado contiene el SHA-256 fingerprint.

**O puedes obtenerlo manualmente:**

```bash
keytool -list -v -keystore signing.keystore -alias android
# Ingresa la contraseña cuando te la pida
# Busca la línea "SHA256:"
```

Copia el valor, se verá algo así:
```
14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B6:3F:CF:44:E5
```

### Paso 6.2: Crear el Directorio .well-known

```bash
mkdir -p public/.well-known
```

### Paso 6.3: Crear assetlinks.json

Crea el archivo `public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.trivo.app",
      "sha256_cert_fingerprints": [
        "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B6:3F:CF:44:E5"
      ]
    }
  }
]
```

**Reemplaza:**
- `com.trivo.app` con tu Package ID real
- El SHA-256 fingerprint con el tuyo

### Paso 6.4: Configurar Next.js

Ya está configurado en tu `next.config.js`, pero verifica que tenga:

```javascript
async headers() {
  return [
    {
      source: '/.well-known/assetlinks.json',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/json',
        },
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
  ]
}
```

### Paso 6.5: Verificar en Local

```bash
npm run dev
# Abre: http://localhost:3000/.well-known/assetlinks.json
# Deberías ver el JSON correctamente formateado
```

### Paso 6.6: Desplegar a Producción

```bash
git add public/.well-known/assetlinks.json
git commit -m "feat: agregar Digital Asset Links para Android TWA"
git push
```

### Paso 6.7: Verificar en Producción

Una vez desplegado:

1. **Verifica que sea accesible:**
   ```
   https://trivo.com/.well-known/assetlinks.json
   ```

2. **Usa el verificador de Google:**
   ```
   https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://trivo.com&relation=delegate_permission/common.handle_all_urls
   ```

   Debería retornar tu configuración sin errores.

---

## Paso 7: Probar el Paquete Localmente (Opcional pero Recomendado)

Antes de subir a Play Store, prueba que funciona:

### Opción A: Usar Bundletool

```bash
# Descargar bundletool
wget https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar

# Generar APKs desde el AAB
java -jar bundletool-all-1.15.6.jar build-apks \
  --bundle=app.aab \
  --output=trivo.apks \
  --mode=universal

# Instalar en dispositivo Android conectado por USB
java -jar bundletool-all-1.15.6.jar install-apks \
  --apks=trivo.apks
```

### Opción B: Usar Android Studio

1. Abre Android Studio
2. Build → Analyze APK
3. Selecciona `app.aab`
4. Instala en emulador o dispositivo físico

### Qué Verificar

- ✅ La app se instala correctamente
- ✅ El icono se ve bien
- ✅ Se abre sin errores
- ✅ Carga tu sitio web correctamente
- ⚠️ Probablemente aún tendrás la barra de navegador (normal hasta subir a Play Store)

---

## Paso 8: Crear Cuenta de Google Play Developer

Si aún no tienes:

1. Ve a https://play.google.com/console/signup
2. Paga la tarifa única de **$25 USD**
3. Completa la información de la cuenta
4. Verifica tu identidad (puede tardar 1-2 días)

---

## Paso 9: Preparar Assets del Play Store

Mientras esperas la verificación, prepara los assets:

### Assets Obligatorios

#### 1. Icono de Alta Resolución (512×512)
- Ya lo tienes: `icon-512x512.png`
- Formato: PNG 32-bit con alpha
- ✅ Listo

#### 2. Banner de Función Destacada (1024×500)

Necesitas crear este banner. Opciones:

**Opción A: Canva (Fácil)**
1. Ve a https://www.canva.com/
2. Crea diseño personalizado 1024×500
3. Agrega tu logo, nombre "Trivo", y un tagline
4. Exporta como PNG o JPG

**Opción B: Figma/Photoshop**
- Crea un diseño 1024×500
- Incluye logo, nombre de app, y captura de pantalla
- Exporta como PNG 24-bit (sin alpha)

**Ejemplo de contenido:**
```
+----------------------------------+
|  [Logo]  Trivo                   |
|  Únete a eventos deportivos      |
|  [Screenshot de la app]          |
+----------------------------------+
```

#### 3. Screenshots del Teléfono (2-8 required)

Usa los screenshots que tomaste en el Paso 2.

**Preparación final:**
- Formato: PNG o JPG
- Mínimo: 320px (ancho o alto)
- Máximo: 3840px
- Recomendado: 1080×1920 (portrait)

### Assets Opcionales (Muy Recomendados)

#### 4. Screenshots de Tablet (opcional)

Si tienes recursos, crea versiones para tablet (landscape):
- Dimensiones: 1920×1080 o similar
- Mejora la presentación en Play Store

#### 5. Video Promocional (opcional)

- Sube un video a YouTube
- 30 segundos a 2 minutos
- Muestra las características principales de Trivo
- Agrega el link en Play Console

---

## Paso 10: Subir a Play Console

Finalmente, publica tu app:

### 10.1: Crear la Aplicación

1. Ve a https://play.google.com/console
2. Click en **"Create app"**
3. Completa:
   - **App name:** Trivo
   - **Default language:** Spanish (Argentina) - es-AR
   - **App or game:** App
   - **Free or paid:** Free
4. Acepta las políticas
5. Click **"Create app"**

### 10.2: Completar Store Listing

**Ir a: Grow > Store presence > Main store listing**

#### App details

```
App name: Trivo
Short description (80 chars):
  Únete a eventos deportivos, sociales y entrenamientos cerca de ti

Full description (4000 chars):
  Trivo es la plataforma ideal para deportistas y personas activas que
  buscan conectar con su comunidad. Descubre eventos deportivos,
  salidas sociales y entrenamientos organizados por academias y usuarios
  como tú.

  🏃 CARACTERÍSTICAS PRINCIPALES:

  • Explora eventos deportivos y sociales cercanos
  • Únete a salidas grupales de running, ciclismo, y más
  • Crea tus propios eventos y comparte con la comunidad
  • Integración con Strava para compartir rutas
  • Gestiona pagos de eventos de forma segura
  • Conoce otros deportistas y amplía tu red social
  • Recibe notificaciones de eventos que te interesan

  🎯 IDEAL PARA:

  • Runners y ciclistas que buscan compañía
  • Equipos deportivos que organizan entrenamientos
  • Academias que gestionan grupos y miembros
  • Personas activas que quieren conocer gente nueva
  • Organizadores de eventos sociales y deportivos

  💪 ÚNETE A LA COMUNIDAD TRIVO

  Descarga la app y empieza a disfrutar del deporte en comunidad hoy mismo.

  Para más información, visita trivo.com
```

#### Graphics

- **App icon:** Sube `icon-512x512.png`
- **Feature graphic:** Sube tu banner 1024×500
- **Phone screenshots:** Sube 2-8 screenshots (arrastra en orden)
- **Tablet screenshots:** (opcional) Sube si los tienes

#### Categorization

```
App category: Health & Fitness (o Sports)
Tags: sports, running, fitness, social, events
```

#### Contact details

```
Email: tu-email@dominio.com
Website: https://trivo.com (opcional)
Privacy policy: https://trivo.com/privacidad (OBLIGATORIO)
```

**Si aún no tienes política de privacidad, créala urgente** (ver sección al final).

### 10.3: Completar "App content"

Ve a: **Policy > App content** y completa cada sección:

#### Privacy policy
- URL: https://trivo.com/privacidad

#### App access
- ¿Se requiere cuenta para usar la app? **Sí**
- Proporciona credenciales de prueba:
  ```
  Email: test@trivo.com
  Password: TestTrivo2024!
  ```

#### Ads
- ¿Tu app contiene anuncios? **No**

#### Content ratings
1. Click en **"Start questionnaire"**
2. Email de contacto
3. Selecciona categoría: **Utilidades, Productividad, Comunicaciones u Otras**
4. Responde las preguntas (para app deportiva/social, probablemente todo "No")
5. Completa y obtendrás clasificación automática (probablemente PEGI 3 o Everyone)

#### Target audience
- Rango de edad: **13 años o más** (o 18+ si prefieres)

#### News apps
- ¿Es app de noticias? **No**

#### COVID-19 contact tracing
- No aplica

#### Data safety
**CRÍTICO para Trivo:**

Click en **"Start"** y declara qué datos recolectas:

**Datos que Trivo recolecta (marca cada uno):**

1. **Personal info:**
   - ✅ Name
   - ✅ Email address
   - ✅ User IDs
   - ✅ Photos (profile pictures)

2. **Location:**
   - ✅ Approximate location
   - ✅ Precise location (para eventos)

3. **App activity:**
   - ✅ App interactions
   - ✅ In-app search history

4. **Financial info:**
   - ✅ Purchase history (pagos de eventos via MercadoPago)

**Para cada tipo de dato, indica:**
- ✅ **Collected:** Sí
- ✅ **Shared:** Solo si compartes con terceros (MercadoPago, Firebase)
- ✅ **Data usage:** Account management, App functionality
- ✅ **Data handling:** Data is encrypted in transit, Users can request deletion

#### Government apps
- No aplica

**Guarda todo.**

### 10.4: Seleccionar Países

Ve a: **Reach and devices > Countries/regions**

- Selecciona los países donde estará disponible
- Para LATAM: Argentina, Chile, Uruguay, Brasil, México, Colombia, Perú
- O selecciona **"All countries"**

### 10.5: Crear Release de Producción

**Ir a: Release > Production**

1. Click en **"Create new release"**

2. **App integrity:**
   - Selecciona **"Use Google Play App Signing"** (recomendado)
   - Google gestionará las claves de firma

3. **Upload AAB:**
   - Arrastra y suelta tu archivo `app.aab`
   - Espera a que se procese (puede tomar 2-5 minutos)
   - Google mostrará información del paquete

4. **Release name:**
   ```
   1.0.0 - Lanzamiento inicial
   ```

5. **Release notes:**

   **Spanish (Argentina):**
   ```
   🎉 Primera versión de Trivo

   • Explora eventos deportivos y sociales
   • Crea y únete a salidas grupales
   • Integración con Strava
   • Gestión segura de pagos
   • Notificaciones de eventos
   ```

   **English (optional):**
   ```
   🎉 First release of Trivo

   • Explore sports and social events
   • Create and join group activities
   • Strava integration
   • Secure payment management
   • Event notifications
   ```

6. **Review:**
   - Play Console mostrará errores o advertencias
   - Resuelve cualquier problema (si hay)

7. **Save** o **Review release**

### 10.6: Enviar a Revisión

1. Revisa todo el checklist de Play Console
2. Asegúrate de que todo esté verde ✅
3. Click en **"Start rollout to Production"**
4. Confirma

**Estado durante revisión:**
- "Pending publication" → En cola
- "Under review" → Google está revisando (7-14 días)
- "Approved" → ¡Aprobada! Se publicará pronto
- "Rejected" → Necesitas hacer cambios

---

## Paso 11: Post-Publicación (CRÍTICO)

### Una vez que tu app esté publicada:

#### 11.1: Actualizar assetlinks.json con SHA-256 de Producción

**IMPORTANTE:** Google firma tu app con su propia clave de producción, generando un nuevo SHA-256 fingerprint.

**Obtener el nuevo fingerprint:**

1. Ve a **Google Play Console**
2. Tu App > **Release > Setup > App Integrity**
3. Sección **"App signing key certificate"**
4. Copia el **SHA-256 certificate fingerprint** (será diferente al de desarrollo)

**Actualizar assetlinks.json:**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.trivo.app",
      "sha256_cert_fingerprints": [
        "TU:FINGERPRINT:DE:DESARROLLO",
        "NUEVO:FINGERPRINT:DE:GOOGLE:PLAY:PRODUCTION"
      ]
    }
  }
]
```

**Desplegar:**

```bash
git add public/.well-known/assetlinks.json
git commit -m "feat: agregar SHA-256 de producción de Play Store"
git push
```

**Verificar:**
```
https://trivo.com/.well-known/assetlinks.json
```

**Espera 24-48 horas** para que se propague completamente.

#### 11.2: Verificar la App en Play Store

1. Busca "Trivo" en Google Play Store
2. Instala en un dispositivo Android real
3. Verifica que:
   - ✅ Se instala correctamente
   - ✅ El icono se ve bien
   - ✅ Se abre sin barra de navegador (después de 24-48h)
   - ✅ Todas las funcionalidades funcionan
   - ✅ Notificaciones push funcionan
   - ✅ Pagos de MercadoPago funcionan
   - ✅ OAuth de Google funciona
   - ✅ Integración con Strava funciona

---

## Checklist Completo

### Pre-PWABuilder
- [ ] Iconos de Android generados (48, 72, 96, 144)
- [ ] Screenshots reales tomados y optimizados (mínimo 2)
- [ ] Manifest actualizado con todos los campos
- [ ] Cambios desplegados a producción
- [ ] Service worker funcionando correctamente

### PWABuilder
- [ ] PWA re-analizada con score mejorado (35+/44)
- [ ] Paquete Android (.aab) generado
- [ ] Keystore guardado de forma segura con contraseñas anotadas
- [ ] SHA-256 fingerprint de desarrollo anotado

### Digital Asset Links
- [ ] Directorio `.well-known` creado
- [ ] Archivo `assetlinks.json` creado con SHA-256 correcto
- [ ] Next.js configurado para servir el archivo
- [ ] Archivo desplegado y accesible en producción
- [ ] Verificador de Google retorna éxito

### Play Console
- [ ] Cuenta de Google Play Developer activa ($25 pagados)
- [ ] Assets gráficos listos (icono 512, banner 1024×500, screenshots)
- [ ] Política de privacidad publicada y accesible
- [ ] App creada en Play Console
- [ ] Store listing completo (textos, gráficos, categoría, contacto)
- [ ] App content completado (privacy, access, ads, ratings, audience, data safety)
- [ ] Países seleccionados
- [ ] Release de producción creado con AAB subido
- [ ] Release notes escritos
- [ ] "Start rollout to Production" confirmado

### Post-Publicación
- [ ] App aprobada por Google
- [ ] SHA-256 de producción obtenido de Play Console
- [ ] `assetlinks.json` actualizado con SHA-256 de producción
- [ ] Cambios desplegados a producción
- [ ] App instalada y probada desde Play Store real
- [ ] Verificado que no aparece barra de navegador
- [ ] Todas las funcionalidades críticas probadas
- [ ] Métricas de Android Vitals monitoreadas

---

## Recursos Rápidos

### Documentación
- PWABuilder Docs: https://docs.pwabuilder.com/
- Play Console Help: https://support.google.com/googleplay/android-developer
- TWA Guide: https://developer.chrome.com/docs/android/trusted-web-activity/

### Herramientas
- PWABuilder: https://www.pwabuilder.com/
- PWA Image Generator: https://www.pwabuilder.com/imageGenerator
- Bundletool: https://github.com/google/bundletool/releases
- Asset Links Tester: https://digitalassetlinks.googleapis.com/
- Favicon Generator: https://realfavicongenerator.net/

### Soporte
- Stack Overflow: [progressive-web-apps] tag
- PWABuilder Issues: https://github.com/pwa-builder/pwabuilder/issues
- Play Console Support: En Play Console → Help

---

## Política de Privacidad (OBLIGATORIO)

Si aún no tienes, necesitas crear una política de privacidad. Aquí un esquema básico:

### Contenido Mínimo Requerido

Tu política debe incluir:

1. **Qué datos recolectas:**
   - Información personal (nombre, email, foto de perfil)
   - Ubicación (para mostrar y crear eventos)
   - Actividad en la app (eventos a los que te unes)
   - Información de pago (a través de MercadoPago)

2. **Cómo usas los datos:**
   - Proporcionar funcionalidad de la app
   - Mostrar eventos cercanos
   - Procesar pagos
   - Enviar notificaciones
   - Mejorar la experiencia del usuario

3. **Con quién compartes los datos:**
   - MercadoPago (procesamiento de pagos)
   - Firebase (notificaciones push, almacenamiento)
   - Mixpanel (analytics anónimos)
   - Strava (si el usuario conecta su cuenta)

4. **Derechos del usuario:**
   - Ver sus datos
   - Eliminar su cuenta
   - Exportar sus datos
   - Revocar permisos

5. **Seguridad:**
   - Encriptación de datos en tránsito (HTTPS)
   - Almacenamiento seguro
   - No vendemos datos a terceros

### Generadores de Políticas

Si prefieres usar un generador:

1. **TermsFeed:** https://www.termsfeed.com/privacy-policy-generator/
2. **FreePrivacyPolicy:** https://www.freeprivacypolicy.com/
3. **PrivacyPolicies:** https://www.privacypolicies.com/

**Configura:**
- Nombre de la app: Trivo
- Tipo: Mobile app + Website
- Servicios usados: Firebase, MercadoPago, Mixpanel, Strava
- Datos recolectados: Marca todos los que apliquen

**Publica la política en:** `https://trivo.com/privacidad`

---

## Troubleshooting Común

### "Failed to download icon" en PWABuilder
- Verifica que los iconos estén accesibles públicamente
- Confirma que el manifest apunte a las rutas correctas
- Usa URLs absolutas si es necesario

### "Service worker not found"
- Verifica que `/sw.js` sea accesible
- Confirma que el service worker esté registrado en el código
- Revisa la consola del navegador por errores

### "Digital Asset Links verification failed"
- Confirma que `assetlinks.json` sea accesible
- Verifica el SHA-256 fingerprint (copia/pega con cuidado)
- Usa el verificador de Google para diagnóstico
- Espera 24-48h después de desplegar

### "App rejected by Play Store"
- Lee el email de rechazo cuidadosamente
- Las razones comunes:
  - Política de privacidad faltante
  - Screenshots no representativos
  - Data safety incompleto
- Corrige y vuelve a enviar

### "Barra de navegador sigue visible"
- Verifica que Digital Asset Links esté configurado correctamente
- Confirma que usaste el SHA-256 de producción (no el de desarrollo)
- Espera 24-48h después de actualizar `assetlinks.json`
- Desinstala y reinstala la app

---

## Siguiente Actualización

Cuando necesites actualizar la app:

1. **Incrementa la versión:**
   - versionCode: 2 (3, 4, 5...)
   - versionName: "1.0.1" (o "1.1.0", "2.0.0")

2. **Genera nuevo AAB con PWABuilder**
   - Usa el mismo Package ID
   - Usa el mismo keystore (o Google lo hará)

3. **Sube a Play Console:**
   - Release > Production > Create new release
   - Sube el nuevo AAB
   - Escribe release notes con cambios
   - Rollout (10%, 25%, 50%, 100% gradual)

**No necesitas actualizar si:**
- Solo cambias contenido del sitio web (se actualiza automático)
- Fixes menores de bugs en la PWA
- Cambios de diseño CSS/HTML

---

**¡Éxito con tu publicación! 🚀**

Si tienes dudas en algún paso, consulta la documentación completa en:
[PWA_ANDROID_EMPAQUETADO.md](./PWA_ANDROID_EMPAQUETADO.md)
