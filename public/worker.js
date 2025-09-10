self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
});

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "¡Tienes una nueva notificación!",
    icon: "/assets/icons/Notification.png",
    badge: "/assets/logo/Trivo T.png",
    data: {
      url: data.url || "/notificaciones"
    },
    actions: [
      {
        action: "open",
        title: "Abrir"
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Notificación", options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/notificaciones";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Si ya hay una ventana/tab abierta, enfocarla y navegar
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
