console.log("🔧 Service Worker iniciando...");

self.addEventListener("install", (event) => {
  console.log("✅ Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activado");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
  console.log("📬 Push recibido:", event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn("⚠️ Error parseando data del push:", e);
    data = {};
  }

  const options = {
    body: data.body || "¡Tienes una nueva notificación!",
    icon: "/assets/icons/Notification.png",
    badge: "/assets/logo/Trivo%20T.png", // URL encoded space
    data: {
      url: data.url || "/notificaciones"
    },
    tag: "trivo-notification",
    requireInteraction: false, // Cambié de true a false para evitar problemas
    vibrate: [200, 100, 200]
  };

  console.log("📱 Mostrando notificación:", data.title || "Notificación", options);

  event.waitUntil(
    self.registration.showNotification(data.title || "Notificación", options)
  );
});

self.addEventListener("notificationclick", function (event) {
  console.log("👆 Click en notificación");
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/notificaciones";
  console.log("🔗 Abriendo URL:", urlToOpen);
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Si ya hay una ventana/tab abierta, enfocarla y navegar
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          console.log("🎯 Enfocando ventana existente");
          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        console.log("🆕 Abriendo nueva ventana");
        return clients.openWindow(urlToOpen);
      }
    }).catch(err => {
      console.error("❌ Error manejando click:", err);
    })
  );
});

console.log("🎉 Service Worker cargado completamente");
