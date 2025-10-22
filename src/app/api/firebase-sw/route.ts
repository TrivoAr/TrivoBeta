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
// Firebase Messaging Service Worker - Generado dinámicamente

// Importar Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración Firebase
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// Inicializar Firebase en el SW
firebase.initializeApp(firebaseConfig);

// Obtener instance de messaging
const messaging = firebase.messaging();

// Manejar mensajes en background
messaging.onBackgroundMessage(function(payload) {

  const notificationTitle = payload.notification?.title || 'Trivo Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación de Trivo',
    icon: '/assets/icons/Notification.png',
    badge: '/assets/logo/Trivo%20T.png',
    tag: 'trivo-notification',
    data: {
      url: payload.data?.url || '/notificaciones',
      ...payload.data
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      }
    ],
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', function(event) {

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notificaciones';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Si ya hay una ventana/tab abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {

          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {

        return clients.openWindow(urlToOpen);
      }
    }).catch(err => {

    })
  );
});

`;

  return new NextResponse(swContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Service-Worker-Allowed": "/",
    },
  });
}
