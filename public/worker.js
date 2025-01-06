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
    icon: "/icon.png",  // Asegúrate de tener un icono en public/
    badge: "/badge.png", // Asegúrate de tener un badge en public/
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Notificación", options)
  );
});
