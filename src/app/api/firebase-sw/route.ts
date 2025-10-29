import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const swContent = `
// Service Worker Unificado - Firebase Messaging + Cache
// IMPORTANTE: importScripts DEBE estar al principio del archivo

console.log('[Trivo SW] Inicializando Service Worker unificado');

// ====================================
// PARTE 1: FIREBASE CLOUD MESSAGING (PRIMERO)
// ====================================

// Importar Firebase scripts PRIMERO (requerimiento de Firebase)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[FCM SW] Scripts de Firebase cargados');

// Configuración Firebase (inyectada dinámicamente desde env vars)
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// Inicializar Firebase en el SW
firebase.initializeApp(firebaseConfig);

// Obtener instance de messaging
const messaging = firebase.messaging();

console.log('[FCM SW] Firebase inicializado correctamente');

// Manejar mensajes en background
messaging.onBackgroundMessage(function(payload) {
  console.log('[FCM SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Trivo';
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/manifest-icon-192.maskable.png',
    tag: payload.data?.notificationId || 'trivo-notification',
    data: {
      url: payload.data?.url || '/notificaciones',
      notificationId: payload.data?.notificationId,
      type: payload.data?.type,
      ...payload.data
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ],
    requireInteraction: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', function(event) {
  console.log('[FCM SW] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notificaciones';

  // Si el usuario clickeó "Cerrar", no hacer nada
  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Si ya hay una ventana/tab abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('[FCM SW] Enfocando ventana existente');
            return client.focus().then(function() {
              return client.navigate(urlToOpen);
            });
          }
        }

        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          console.log('[FCM SW] Abriendo nueva ventana');
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(function(err) {
        console.error('[FCM SW] Error manejando click:', err);
      })
  );
});

console.log('[FCM SW] Firebase Messaging configurado');

// ====================================
// PARTE 2: CACHE DE RECURSOS ESTÁTICOS
// ====================================

const CACHE_NAME = 'trivo-cache-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalar el SW y cachear recursos
self.addEventListener('install', (event) => {
  console.log('[Trivo SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Trivo SW] Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activar el SW y limpiar caches viejos
self.addEventListener('activate', (event) => {
  console.log('[Trivo SW] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Trivo SW] Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No cachear APIs de Firebase ni endpoints propios (excepto storage)
  if (
    (url.pathname.startsWith('/api/') && !url.hostname.includes('firebasestorage')) ||
    url.pathname.includes('firebase') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/api/firebase-sw'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas exitosas
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla el network, buscar en cache
        return caches.match(event.request);
      })
  );
});

console.log('[Trivo SW] Service Worker unificado configurado completamente');
`;

  return new NextResponse(swContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Service-Worker-Allowed": "/",
    },
  });
}
