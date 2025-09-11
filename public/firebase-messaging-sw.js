// Firebase Messaging Service Worker

// Importar Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('🔥 Firebase SW iniciando...');

// Configuración Firebase - DEBE SER LA MISMA que en tu frontend
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

// Inicializar Firebase en el SW
firebase.initializeApp(firebaseConfig);

// Obtener instance de messaging
const messaging = firebase.messaging();

console.log('✅ Firebase SW inicializado');

// Manejar mensajes en background
messaging.onBackgroundMessage(function(payload) {
  console.log('📬 Background Message recibido:', payload);

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
  console.log('👆 Click en notificación Firebase');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notificaciones';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Si ya hay una ventana/tab abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('🎯 Enfocando ventana existente');
          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        console.log('🆕 Abriendo nueva ventana');
        return clients.openWindow(urlToOpen);
      }
    }).catch(err => {
      console.error('❌ Error manejando click:', err);
    })
  );
});

console.log('🎉 Firebase SW configurado completamente');