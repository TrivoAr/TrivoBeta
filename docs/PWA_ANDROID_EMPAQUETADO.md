# Guía de Empaquetado y Publicación de PWA en Google Play Store

## Resumen Ejecutivo

Este documento detalla el proceso completo para empaquetar la aplicación Trivo (PWA de Next.js) y publicarla en Google Play Store utilizando Trusted Web Activity (TWA).

## Tabla de Contenidos

1. [Tecnologías y Herramientas](#tecnologías-y-herramientas)
2. [Requisitos Previos](#requisitos-previos)
3. [Proceso de Empaquetado](#proceso-de-empaquetado)
4. [Configuración de Digital Asset Links](#configuración-de-digital-asset-links)
5. [Firma y Certificados](#firma-y-certificados)
6. [Requisitos del Play Store](#requisitos-del-play-store)
7. [Proceso de Publicación](#proceso-de-publicación)
8. [Mantenimiento y Actualizaciones](#mantenimiento-y-actualizaciones)

---

## Tecnologías y Herramientas

### ¿Qué es TWA (Trusted Web Activity)?

Trusted Web Activity es una tecnología de Google Chrome que permite ejecutar tu PWA dentro de una aplicación Android nativa sin mostrar la barra de direcciones del navegador. La app se ve y funciona como una aplicación nativa, pero el contenido proviene de tu PWA web.

**Ventajas de TWA:**
- Tu PWA se ejecuta en Chrome sin UI visible del navegador
- Comparte el mismo almacenamiento y cookies con Chrome
- Actualizaciones automáticas cuando actualizas tu sitio web
- No necesitas reescribir código en Java/Kotlin
- Mantiene todas las capacidades de tu PWA

### Opciones de Herramientas

#### 1. PWABuilder (RECOMENDADO para Trivo)

**Descripción:** Suite de herramientas de Microsoft para empaquetar PWAs.

**Ventajas:**
- Interfaz web simple y visual (https://www.pwabuilder.com/)
- Genera paquetes listos para subir a Play Store
- Extensión de VS Code disponible (PWABuilder Studio)
- Documentación extensa y comunidad activa
- Soporta múltiples plataformas (Android, iOS, Windows)
- Maneja automáticamente la configuración de TWA
- Validación de PWA integrada

**Cómo funciona:**
1. Ingresas la URL de tu PWA
2. PWABuilder analiza tu manifest y service worker
3. Genera un paquete Android (.aab) firmado
4. Proporciona instrucciones para Digital Asset Links

**Trust Score:** 8.3/10
**Snippets disponibles:** 232+

#### 2. Bubblewrap (Herramienta oficial de Google)

**Descripción:** CLI de Google para crear aplicaciones TWA.

**Ventajas:**
- Herramienta oficial de Google
- CLI para automatización
- Control total sobre la configuración
- Integración con Android Studio

**Desventajas:**
- Requiere más conocimientos técnicos
- Configuración manual más compleja
- Curva de aprendizaje más pronunciada

**Cuándo usar:** Si necesitas automatización CI/CD o control granular.

#### 3. Extensión de PWABuilder Studio (VS Code)

**Características:**
- Crear nuevas PWAs desde templates
- Convertir apps web existentes en PWAs
- Gestionar manifest, service workers e iconos
- Empaquetar para múltiples stores
- Validar métricas de PWA
- Agregar capacidades web con snippets

---

## Requisitos Previos

### 1. PWA Funcional

Tu aplicación Trivo ya tiene implementado:
- ✅ Web App Manifest (`/public/manifest.json`)
- ✅ Service Worker con Workbox
- ✅ HTTPS (obligatorio para TWA)
- ✅ Iconos en múltiples tamaños

**Verificar que el manifest incluya:**

```json
{
  "name": "Trivo - Tu nombre completo de app",
  "short_name": "Trivo",
  "description": "Descripción completa de la app para el Play Store",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#tu-color",
  "icons": [
    {
      "src": "/icons/icon-48x48.png",
      "sizes": "48x48",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2. Assets del Play Store

Necesitarás crear los siguientes assets gráficos:

#### Iconos de la Aplicación
- **48×48** px (MDPI)
- **72×72** px (HDPI)
- **96×96** px (XHDPI)
- **144×144** px (XXHDPI)
- **192×192** px (XXXHDPI)
- **Icono Adaptativo** (opcional pero recomendado)

#### Assets del Play Store
- **Icono de Alta Resolución:** 512×512 px (PNG 32-bit con alpha)
- **Banner de la App:** 1024×500 px (JPG o PNG 24-bit sin alpha)
- **Screenshots:**
  - Mínimo 2, máximo 8 screenshots
  - Teléfono: 320-3840 px (ancho o alto)
  - Tablet: Dimensiones específicas para tablets
  - Formatos: JPG o PNG 24-bit (sin alpha)

### 3. Cuenta de Google Play Developer

- Costo único: $25 USD
- Registro en: https://play.google.com/console
- Verificación de identidad requerida
- Configuración de métodos de pago para distribución de apps pagas (opcional)

### 4. Información para el Listing

Prepara el siguiente contenido:

**Textos:**
- Título de la app (máx. 50 caracteres)
- Descripción corta (máx. 80 caracteres)
- Descripción completa (máx. 4000 caracteres)
- Categoría de la app
- Información de contacto (email, sitio web, política de privacidad)

**Clasificación de contenido:**
- Cuestionario de clasificación IARC
- Clasificación por edad

---

## Proceso de Empaquetado

### Opción A: PWABuilder Web (RECOMENDADO)

#### Paso 1: Preparar tu PWA para Análisis

1. Asegúrate de que tu PWA esté desplegada en producción y accesible vía HTTPS
2. Verifica que el manifest esté en `/manifest.json` o `/public/manifest.json`
3. Confirma que el service worker esté registrado correctamente

#### Paso 2: Usar PWABuilder

1. Visita https://www.pwabuilder.com/
2. Ingresa la URL de tu PWA en producción (ej: `https://trivo.com`)
3. Click en "Start"
4. PWABuilder analizará tu app y mostrará un reporte

#### Paso 3: Revisar Reporte y Mejoras

PWABuilder te mostrará:
- Estado del Manifest
- Service Worker implementado
- Métricas de PWA (puntuación)
- Mejoras sugeridas

**Realiza las correcciones necesarias antes de continuar.**

#### Paso 4: Generar Paquete Android

1. En el reporte de PWABuilder, ve a la sección "Publish"
2. Selecciona "Google Play" o "Android"
3. Click en "Download Package"

#### Paso 5: Configurar Opciones del Paquete

PWABuilder te pedirá configurar:

**Información Básica:**
- Package ID (ej: `com.trivo.app`) - **IMPORTANTE:** No podrás cambiar esto después
- App name (Trivo)
- App version (1.0.0)
- Version code (1)

**URLs y Configuración:**
- Host (tu dominio en producción)
- Start URL (/)
- Theme color
- Background color
- Display mode (standalone)

**Iconos:**
- PWABuilder los tomará de tu manifest
- Puedes subir iconos personalizados si es necesario

**Opciones Avanzadas:**
- Splash screen settings
- Orientation (portrait, landscape, any)
- Fallback behavior (opcional)

#### Paso 6: Generar y Descargar

1. Click en "Generate"
2. PWABuilder generará un archivo `.zip` con:
   - Archivo `.aab` (Android App Bundle) - **Este es el que subirás al Play Store**
   - Instrucciones para Digital Asset Links
   - Keystore (si elegiste que PWABuilder genere uno)
   - Documentación

### Opción B: PWABuilder CLI

Para desarrolladores que prefieren la terminal:

#### Instalación

```bash
npm install -g @pwabuilder/cli
```

#### Generar Paquete

```bash
# Desde el directorio de tu proyecto
pwa package android \
  --url https://tu-dominio.com \
  --package-id com.trivo.app \
  --name "Trivo" \
  --version 1.0.0
```

### Opción C: Bubblewrap (Avanzado)

Si necesitas más control o automatización:

#### Instalación

```bash
npm install -g @bubblewrap/cli
```

#### Inicializar Proyecto

```bash
bubblewrap init --manifest https://tu-dominio.com/manifest.json
```

#### Configurar

Bubblewrap te hará preguntas interactivas:
- Package name
- App name
- Host URL
- Configuración de certificados

#### Generar APK/AAB

```bash
# Generar .aab (recomendado para Play Store)
bubblewrap build

# O generar .apk (para pruebas)
bubblewrap build --target apk
```

---

## Configuración de Digital Asset Links

**¿Por qué es necesario?** Digital Asset Links establece una conexión verificada bidireccional entre tu sitio web y la app Android. Sin esto, la app mostrará la barra de direcciones del navegador.

### Paso 1: Obtener SHA-256 Fingerprint

El fingerprint se obtiene de dos lugares:

#### Durante Desarrollo (Upload Key)

Si generaste un keystore localmente:

```bash
keytool -list -v -keystore tu-keystore.jks -alias tu-alias -storepass tu-password -keypass tu-password
```

Busca la línea que dice `SHA256:` y copia el valor.

#### Después de Subir a Play Store (App Signing Key)

1. Ve a Google Play Console
2. Tu App > Release > Setup > App Integrity
3. Sección "App signing key certificate"
4. Copia el **SHA-256 certificate fingerprint**

**IMPORTANTE:** Después de la primera publicación, deberás actualizar `assetlinks.json` con este fingerprint.

### Paso 2: Crear assetlinks.json

Crea el archivo `/public/.well-known/assetlinks.json` en tu proyecto:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.trivo.app",
      "sha256_cert_fingerprints": [
        "TU:SHA256:FINGERPRINT:AQUI:CON:DOS:PUNTOS"
      ]
    }
  }
]
```

**Reemplaza:**
- `com.trivo.app` con tu Package ID real
- El SHA-256 fingerprint con el que obtuviste

### Paso 3: Configurar Next.js para Servir el Archivo

#### En next.config.js

Agrega una regla para servir archivos desde `.well-known`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... tu configuración existente

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
  },
}

module.exports = nextConfig
```

### Paso 4: Verificar que Funcione

Después de desplegar:

1. Visita: `https://tu-dominio.com/.well-known/assetlinks.json`
2. Deberías ver el JSON correctamente formateado
3. Usa el verificador de Google: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://tu-dominio.com

### Paso 5: Actualizar Después de Play Store

**CRÍTICO:** Después de subir tu primera versión al Play Store:

1. Google firma tu app con su propia clave
2. Genera un nuevo SHA-256 fingerprint
3. Debes agregar este nuevo fingerprint a `assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.trivo.app",
      "sha256_cert_fingerprints": [
        "TU:FINGERPRINT:DE:DESARROLLO",
        "FINGERPRINT:DE:GOOGLE:PLAY:PRODUCTION"
      ]
    }
  }
]
```

---

## Firma y Certificados

### Sistema de Firma de Google Play

Google Play usa un sistema de **dos claves**:

1. **Upload Key (Clave de Carga):**
   - La usas TÚ para firmar los AABs que subes
   - La conservas de forma segura
   - Puedes resetearla si la pierdes (sin afectar la app)

2. **App Signing Key (Clave de Firma de App):**
   - La gestiona GOOGLE
   - Firma los APKs que se distribuyen a los usuarios
   - No puedes acceder a ella
   - Permanente para la vida de la app

### Opción 1: Dejar que PWABuilder Genere las Claves (FÁCIL)

**Recomendado para:** Primera app, sin experiencia previa.

Cuando usas PWABuilder web, automáticamente:
1. Genera un keystore nuevo
2. Firma el AAB con esa clave
3. Te proporciona el `.zip` con todo incluido

**Ventajas:**
- Configuración cero
- Todo está listo para subir
- Incluye instrucciones paso a paso

**Desventaja:**
- Debes guardar el keystore en un lugar seguro para futuras actualizaciones

### Opción 2: Crear Tu Propio Keystore (CONTROL)

**Recomendado para:** Equipos, múltiples desarrolladores, CI/CD.

#### Crear Keystore

```bash
keytool -genkey -v \
  -keystore trivo-release.jks \
  -alias trivo \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Información requerida:**
- Contraseña del keystore (anótala)
- Contraseña de la clave (anótala)
- Nombre, organización, ciudad, país

#### Firmar con Bubblewrap usando tu Keystore

```bash
bubblewrap build \
  --signingKeyPath=./trivo-release.jks \
  --signingKeyAlias=trivo \
  --signingKeyPassword=tu-password
```

### Opción 3: Dejar que Google Genere Todo (MÁS FÁCIL)

**Nuevo en Play Console:** Al subir tu primer AAB, Play Store puede generar ambas claves.

**Ventajas:**
- Máxima seguridad
- No tienes que gestionar keystores
- Google maneja todo

**Desventaja:**
- Menos control
- Dependes completamente de Google

### Requisitos de las Claves (2025)

- **Algoritmo:** RSA
- **Tamaño mínimo:** 2048 bits
- **Validez recomendada:** 25+ años

### Recuperación de Claves Perdidas

Si pierdes tu **Upload Key**:

1. Ve a Play Console
2. Tu App > Settings > App Integrity
3. "Request upload key reset"
4. Crea una nueva clave y súbela
5. Google la aprueba en 48 horas aprox.

**Nota:** Esto NO afecta la App Signing Key que gestiona Google.

### Mejores Prácticas de Seguridad

1. **Backup del Keystore:**
   - Guarda múltiples copias (cloud seguro, disco externo)
   - Encripta las copias
   - Documenta las contraseñas de forma segura

2. **Control de Acceso:**
   - Limita quién puede acceder al keystore
   - Usa variables de entorno en CI/CD
   - No commitees el keystore en Git

3. **Contraseñas:**
   - Usa contraseñas fuertes
   - Usa un gestor de contraseñas
   - Documenta para tu equipo

---

## Requisitos del Play Store

### Requisitos Técnicos

#### Versión de Android
- **Target SDK:** Android 13 (API 33) o superior (requisito desde agosto 2023)
- **Min SDK:** Android 5.0 (API 21) o superior (recomendado para TWA)

#### Formato del Paquete
- **Requerido:** Android App Bundle (.aab)
- Los APKs directos ya no se aceptan para nuevas apps

#### Tamaño
- **Tamaño máximo del AAB:** 150 MB
- Si necesitas más, usa Android Asset Packs

#### Permisos
Tu TWA necesitará solicitar permisos Android para características web:
- Cámara → `CAMERA`
- Micrófono → `RECORD_AUDIO`
- Ubicación → `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- Notificaciones → Permisos automáticos en TWA

PWABuilder configura estos permisos automáticamente basándose en tu PWA.

### Requisitos de Contenido

#### Política de Privacidad
- **Obligatoria** si tu app solicita permisos sensibles
- Debe estar alojada en URL permanente
- Debe estar en español para audiencia de LATAM

**Para Trivo:**
Ya que usas:
- Autenticación (datos de usuario)
- Ubicación (eventos y mapas)
- Firebase (notificaciones)
- MercadoPago (pagos)

**DEBES tener una política de privacidad completa.**

#### Clasificación de Contenido
- Completa el cuestionario IARC en Play Console
- Categorías: violencia, lenguaje, alcohol, etc.
- Para Trivo (app deportiva/social): Probablemente sea PEGI 3 o "Everyone"

#### Información Veraz
- Descripción precisa de funcionalidad
- Screenshots reales de la app
- No promesas falsas

### Cumplimiento de Políticas

#### Políticas que Aplican a Trivo

1. **Datos del Usuario:**
   - Transparencia en recolección de datos
   - Permitir eliminar cuenta
   - Exportar datos del usuario (GDPR)

2. **Pagos:**
   - Si usas MercadoPago para pagos in-app, está permitido
   - No uses Google Play Billing para pagos de eventos (no es necesario)

3. **Contenido Generado por Usuarios:**
   - Ya que permites crear eventos sociales
   - Debes tener sistema de reportes/moderación
   - Términos de servicio claros

4. **Ubicación:**
   - Explicar por qué necesitas ubicación
   - Permitir funcionalidad sin ubicación (si es posible)

5. **Notificaciones:**
   - Deben ser opt-in
   - Permitir desuscribirse fácilmente

### Assets Gráficos Requeridos

#### Obligatorios
- ✅ Icono de alta resolución (512×512 px)
- ✅ Banner (1024×500 px)
- ✅ Mínimo 2 screenshots de teléfono

#### Recomendados
- Screenshots de tablet (mejora la presentación)
- Video promocional (YouTube)
- Banner de función destacada (1024×500 px)

---

## Proceso de Publicación

### Fase 1: Preparación del Paquete

1. **Generar AAB con PWABuilder**
   - Descargar el `.zip`
   - Extraer y verificar que contiene `app.aab`

2. **Probar Localmente (Opcional pero Recomendado)**

   **Instalar en dispositivo Android:**

   ```bash
   # Si tienes Android Studio
   # O usa bundletool de Google

   # Descargar bundletool
   wget https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar

   # Generar APKs desde AAB
   java -jar bundletool-all-1.15.6.jar build-apks \
     --bundle=app.aab \
     --output=app.apks \
     --mode=universal

   # Instalar en dispositivo conectado
   java -jar bundletool-all-1.15.6.jar install-apks \
     --apks=app.apks
   ```

3. **Verificar Digital Asset Links**
   - Confirmar que `assetlinks.json` está accesible
   - Probar URL: `https://tu-dominio.com/.well-known/assetlinks.json`

### Fase 2: Configuración en Play Console

#### Paso 1: Crear la Aplicación

1. Ve a https://play.google.com/console
2. Click en "Create app"
3. Completa:
   - App name: "Trivo"
   - Default language: Español (LATAM)
   - App or game: App
   - Free or paid: Free (o Paid si cobra por descarga)
4. Acepta las políticas
5. Click "Create app"

#### Paso 2: Configurar Store Listing

**En el menú lateral > Grow > Store presence > Main store listing:**

**Detalles:**
- App name: Trivo
- Short description (80 chars): Descripción breve y atractiva
- Full description (4000 chars): Descripción completa con:
  - ¿Qué hace la app?
  - Características principales
  - Beneficios para el usuario
  - Call to action

**Gráficos:**
- App icon (512×512)
- Feature graphic (1024×500)
- Phone screenshots (mín. 2)
- Tablet screenshots (opcional)

**Categorización:**
- App category: "Sports" o "Social"
- Tags: Fitness, Social, Events, etc.

**Contacto:**
- Email: tu-email@dominio.com
- Website (opcional): https://trivo.com
- Privacy policy: https://trivo.com/privacidad

#### Paso 3: Configurar el Contenido de la Aplicación

**Cada sección debe completarse:**

1. **Privacy Policy:**
   - URL de tu política de privacidad

2. **App Access:**
   - ¿Se requiere una cuenta para usar la app?
   - Para Trivo: Probablemente "Sí"
   - Proporciona credenciales de prueba

3. **Ads:**
   - ¿Tu app contiene anuncios?
   - Para Trivo: Probablemente "No"

4. **Content Ratings:**
   - Completa el cuestionario IARC
   - Responde sobre violencia, lenguaje, etc.
   - Obtén la clasificación automática

5. **Target Audience:**
   - Selecciona rango de edad
   - Para app deportiva: 13+ o 18+

6. **News Apps:**
   - ¿Tu app es de noticias? No

7. **COVID-19 Contact Tracing:**
   - No aplica

8. **Data Safety:**
   - **IMPORTANTE:** Declara qué datos recolectas
   - Para Trivo:
     - Información personal (nombre, email, foto)
     - Ubicación (para eventos)
     - Actividad en la app
     - Datos de pago (vía MercadoPago)
   - Explica cómo usas y compartes cada tipo de dato
   - Indica si permites eliminar datos

9. **Government Apps:**
   - No aplica

#### Paso 4: Seleccionar Países y Precios

1. Countries: Selecciona los países donde estará disponible
   - Para LATAM: Argentina, Chile, Uruguay, etc.
   - O "All countries"

2. Si es paga, define precio por país

#### Paso 5: Crear un Release

**En el menú lateral > Release > Production:**

1. Click "Create new release"

2. **App Integrity:**
   - Elige "Google Play App Signing" (recomendado)
   - O "I want to manage my own"

3. **Upload AAB:**
   - Arrastra y suelta tu `app.aab`
   - Espera a que se procese (puede tomar minutos)

4. **Release name:**
   - Versión 1.0.0 o "Initial release"

5. **Release notes:**
   - Español: "Primera versión de Trivo"
   - Inglés: "First release of Trivo"

6. **Sección de Revisión:**
   - Play Console mostrará errores o advertencias
   - Resuelve cualquier problema antes de continuar

7. **Save** (guardar como borrador) o **Review release**

### Fase 3: Testing (Altamente Recomendado)

**Antes de publicación pública:**

#### Track de Internal Testing

1. Ve a Release > Testing > Internal testing
2. Crea un release interno
3. Sube el mismo AAB
4. Agrega testers por email
5. Los testers recibirán un link para descargar

**Ventajas:**
- Pruebas rápidas sin revisión de Google
- Hasta 100 testers
- Feedback antes de publicación

#### Track de Closed Testing (Beta Cerrada)

1. Release > Testing > Closed testing
2. Crea un release de prueba
3. Define un grupo de testers
4. Pasa por revisión ligera de Google

**Ventajas:**
- Hasta 100,000 testers
- Simula la experiencia del Play Store
- Feedback organizado

#### Track de Open Testing (Beta Abierta)

- Cualquiera puede unirse
- Aparece en Play Store como "beta"
- Útil para testeo masivo pre-launch

### Fase 4: Publicación en Producción

#### Último Checklist

- ✅ Store listing completo (título, descripción, gráficos)
- ✅ Contenido de la app configurado (privacy, ratings, data safety)
- ✅ AAB subido y procesado sin errores
- ✅ Release notes escritos
- ✅ Países seleccionados
- ✅ Digital Asset Links configurado y verificado
- ✅ Testers han probado la versión (si usaste testing tracks)

#### Enviar a Revisión

1. En la página del release de Producción
2. Click en "Review release"
3. Revisa todo el resumen
4. Click en "Start rollout to Production"

**¿Cuánto tarda?**
- Primera app: 7-14 días (puede ser más)
- Actualizaciones: 1-3 días
- Google revisa manualmente

**Estado durante revisión:**
- "Under review": En proceso
- "Approved": ¡Aprobada! Se publicará pronto
- "Rejected": Necesitas hacer cambios

#### Si te Rechazan

**Razones comunes:**
1. Política de privacidad faltante o incompleta
2. Screenshots no representativos
3. Descripción engañosa
4. Permisos no justificados
5. Violación de políticas (contenido, malware, etc.)

**Qué hacer:**
1. Lee el email de rechazo cuidadosamente
2. Corrige los problemas señalados
3. Responde al email explicando los cambios
4. Sube un nuevo release
5. Vuelve a enviar a revisión

### Fase 5: Post-Publicación

#### Actualizar assetlinks.json

**CRÍTICO después de la primera publicación:**

1. Ve a Play Console > Release > Setup > App Integrity
2. Copia el SHA-256 de "App signing key certificate"
3. Actualiza tu archivo `assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.trivo.app",
      "sha256_cert_fingerprints": [
        "FINGERPRINT:DE:DESARROLLO:SI:LO:TIENES",
        "NUEVO:FINGERPRINT:DE:GOOGLE:PLAY:AQUI"
      ]
    }
  }
]
```

4. Despliega esta actualización a producción
5. Verifica: https://tu-dominio.com/.well-known/assetlinks.json
6. Espera 24-48 horas para propagación
7. La app ahora se verá sin barra de direcciones

#### Verificar la Publicación

- Busca "Trivo" en Play Store
- Instala en un dispositivo real
- Verifica que se vea sin barra de navegador
- Prueba todas las funcionalidades críticas
- Revisa que las notificaciones funcionen
- Confirma que los pagos de MercadoPago funcionan

---

## Mantenimiento y Actualizaciones

### Actualizar la Aplicación

#### Cuándo Actualizar

**Debes actualizar si:**
- Cambias el paquete de funcionalidades de la PWA
- Actualizas el manifest (nombre, iconos, etc.)
- Cambias el target SDK de Android
- Actualizas dependencias mayores
- Correcciones críticas de seguridad

**NO necesitas actualizar si:**
- Cambias contenido de tu sitio web (se actualiza automático)
- Fixes menores de bugs en tu PWA (se propagan automáticamente)
- Cambios de diseño CSS/HTML

#### Proceso de Actualización

1. **Genera nuevo AAB:**
   - Incrementa `versionCode` (2, 3, 4...)
   - Incrementa `versionName` ("1.0.1", "1.1.0", etc.)
   - Usa el mismo Package ID
   - Firma con el mismo keystore (o Google lo hará)

2. **Sube a Play Console:**
   - Release > Production (o Testing)
   - "Create new release"
   - Sube el nuevo AAB
   - Escribe release notes (qué cambió)

3. **Rollout:**
   - Puedes hacer "Staged rollout" (10%, 25%, 50%, 100%)
   - Útil para monitorear crashes
   - O "Full rollout" (100% inmediato)

### Versionado Semántico

Usa versionado semántico estándar:

```
MAJOR.MINOR.PATCH

1.0.0 → Primera versión
1.0.1 → Bug fix
1.1.0 → Nueva funcionalidad menor
2.0.0 → Cambio mayor / breaking change
```

**Ejemplo para Trivo:**
- `1.0.0` - Lanzamiento inicial
- `1.0.1` - Fix en sistema de pagos
- `1.1.0` - Agregada integración con Strava
- `1.2.0` - Nuevo sistema de sponsors
- `2.0.0` - Rediseño completo de UI

### Monitoreo Post-Lanzamiento

#### Métricas Clave en Play Console

1. **Statistics > Overview:**
   - Instalaciones
   - Desinstalaciones
   - Usuarios activos

2. **Quality > Android Vitals:**
   - Crash rate
   - ANRs (App Not Responding)
   - Battery drain
   - Rendering time

3. **Reviews and Ratings:**
   - Calificación promedio
   - Comentarios de usuarios
   - Responde a reviews (mejora ASO)

#### Configurar Alerts

- Set up email alerts para crashes críticos
- Monitor ANR rate (debe ser < 0.47%)
- Monitor crash rate (debe ser < 1.09%)

### Rollback de Emergencia

Si una versión tiene problemas graves:

1. Ve a Release > Production
2. Click en "Emergency stop" (detiene el rollout)
3. O crea un nuevo release con fix urgente
4. Google permite promover una versión anterior en casos extremos

### Gestión de Feedback

**Responder a Reviews:**
- Responde a reviews negativos con soluciones
- Agradece reviews positivos
- Usa respuestas para identificar bugs comunes

**Usar Feedback para Roadmap:**
- Identifica features más solicitadas
- Prioriza bugs más reportados

---

## Checklist Final de Publicación

### Pre-Publicación

- [ ] PWA funciona correctamente en producción (HTTPS)
- [ ] Manifest completo con todos los campos
- [ ] Service worker registrado y funcional
- [ ] Iconos en todos los tamaños requeridos (48, 72, 96, 144, 192, 512)
- [ ] Assets del Play Store listos (banner, screenshots)
- [ ] Política de privacidad publicada y accesible
- [ ] Cuenta de Google Play Developer activa ($25 pagados)
- [ ] Textos de listing escritos (título, descripción corta/larga)

### Empaquetado

- [ ] AAB generado con PWABuilder o Bubblewrap
- [ ] Package ID definido (ej: com.trivo.app)
- [ ] Versión configurada (1.0.0, versionCode 1)
- [ ] AAB probado localmente (opcional pero recomendado)
- [ ] Keystore guardado de forma segura con contraseñas documentadas

### Digital Asset Links

- [ ] Archivo assetlinks.json creado con SHA-256 correcto
- [ ] assetlinks.json alojado en `/.well-known/assetlinks.json`
- [ ] URL accesible públicamente
- [ ] Next.js configurado para servir el archivo
- [ ] Verificador de Google retorna éxito

### Play Console

- [ ] App creada en Play Console
- [ ] Store listing completo (textos, gráficos, categoría)
- [ ] Privacy policy URL agregada
- [ ] Data safety completado (qué datos recolectas)
- [ ] Content rating (cuestionario IARC) completado
- [ ] Target audience definido
- [ ] Países/regiones seleccionados
- [ ] AAB subido a un release (Internal/Closed/Production)
- [ ] Release notes escritos
- [ ] App Signing configurado (Google Play App Signing recomendado)

### Testing (Altamente Recomendado)

- [ ] Internal testing track configurado
- [ ] Testers invitados y han probado
- [ ] Feedback de testers incorporado
- [ ] Verificado que Digital Asset Links funciona (sin barra de URL)
- [ ] Todas las funcionalidades críticas probadas en Android real

### Publicación

- [ ] Revisión final de todos los datos
- [ ] "Start rollout to Production" clickeado
- [ ] Estado "Under review" en Play Console
- [ ] Notificaciones de Play Console monitoreadas

### Post-Publicación

- [ ] App aprobada y publicada
- [ ] SHA-256 de Google Play agregado a assetlinks.json
- [ ] assetlinks.json actualizado desplegado (crítico)
- [ ] App instalada y probada desde Play Store real
- [ ] Sin barra de direcciones visible
- [ ] Métricas de Android Vitals monitoreadas
- [ ] Responder a primeros reviews

---

## Recursos Adicionales

### Documentación Oficial

- **PWABuilder Docs:** https://docs.pwabuilder.com/
- **Google Play Console:** https://play.google.com/console
- **TWA Documentation:** https://developer.chrome.com/docs/android/trusted-web-activity/
- **Bubblewrap:** https://github.com/GoogleChromeLabs/bubblewrap
- **Digital Asset Links:** https://developers.google.com/digital-asset-links

### Herramientas Útiles

- **PWABuilder:** https://www.pwabuilder.com/
- **Bundletool:** https://github.com/google/bundletool/releases
- **Manifest Validator:** https://manifest-validator.appspot.com/
- **Lighthouse (PWA Score):** https://developers.google.com/web/tools/lighthouse
- **Asset Links Tester:** https://digitalassetlinks.googleapis.com/

### Comunidades y Soporte

- **Stack Overflow:** [progressive-web-apps] tag
- **PWABuilder GitHub:** Issues y Discussions
- **Bubblewrap GitHub:** Issues
- **Google Play Support:** Play Console Help Center

---

## Glosario

- **AAB (Android App Bundle):** Formato de paquete de Google para subir apps al Play Store.
- **APK (Android Package Kit):** Formato instalable de apps Android (legacy).
- **TWA (Trusted Web Activity):** Tecnología para ejecutar PWAs en contenedor Android sin barra de navegador.
- **Digital Asset Links:** Sistema de verificación bidireccional entre sitio web y app Android.
- **SHA-256 Fingerprint:** Hash criptográfico de tu certificado de firma.
- **Keystore:** Archivo que contiene las claves privadas para firmar tu app.
- **Upload Key:** Clave que usas para firmar AABs antes de subir a Play Store.
- **App Signing Key:** Clave que Google usa para firmar APKs distribuidos a usuarios.
- **Package ID:** Identificador único de tu app (ej: com.trivo.app).
- **versionCode:** Número entero que incrementa con cada versión (1, 2, 3...).
- **versionName:** String legible de la versión ("1.0.0", "1.0.1"...).
- **Rollout:** Proceso de distribuir una actualización gradualmente.
- **ANR (App Not Responding):** Error cuando la app se congela.

---

## Notas Específicas para Trivo

### Consideraciones para tu Stack Tecnológico

**Next.js:**
- El service worker debe estar optimizado para rutas dinámicas
- Verifica que el precaching de Workbox incluya rutas críticas
- Ten cuidado con rutas API que requieren autenticación

**Firebase:**
- Las notificaciones push funcionarán normalmente en TWA
- El storage de Firebase es compatible
- Verifica que las reglas de seguridad de Firebase permitan el dominio del TWA

**NextAuth:**
- Las sesiones deben funcionar igual que en web
- Google OAuth debe permitir el dominio del TWA en consola de Google Cloud
- Verifica cookies y CORS

**MercadoPago:**
- Los pagos en TWA abren un navegador externo (esperado)
- Verifica que las redirecciones funcionen correctamente
- Testea flujo completo de pago en dispositivo real

**Mixpanel:**
- Funciona normalmente en TWA
- Considera agregar eventos específicos de "App Android"
- Útil para diferenciar tráfico web vs app

**Mapbox/MapLibre:**
- Los mapas funcionan bien en TWA
- Asegúrate de tener permisos de ubicación en el manifest Android
- Verifica que la geolocalización funcione en dispositivo real

### Features Específicas a Considerar

**Strava Integration:**
- El OAuth de Strava debe permitir redirect desde el TWA
- Verifica que el callback URL esté configurado correctamente

**Profile Images (Firebase Storage):**
- Debe funcionar sin cambios
- Verifica que los CORS estén configurados

**Social Events con Ubicación:**
- Pide permisos de ubicación claramente
- En Data Safety, declara que usas ubicación para eventos

**Notificaciones Push (FCM):**
- Funcionan nativamente en TWA
- Configura los iconos de notificación para Android
- Verifica que las notificaciones abran la app correctamente

---

**Última actualización:** 29 de octubre de 2025
**Versión del documento:** 1.0
**Autor:** Documentación generada para el proyecto Trivo
