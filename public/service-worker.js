self.addEventListener("push", function (event) {
    const data = event.data.json(); // Recibir datos JSON del mensaje
    console.log("Push received:", data);
  
    const options = {
      body: data.body,
      icon: "/icon.png",
      badge: "/badge.png",
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  