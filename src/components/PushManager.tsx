import { useEffect } from "react";

const PushManager = () => {
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const subscribeUser = async () => {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/worker.js");

        // Solicitar suscripción
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicVapidKey,
        });

        // Envía la suscripción al backend
        await fetch("/api/save-subscription", {
          method: "POST",
          body: JSON.stringify(subscription),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    };

    subscribeUser();
  }, []);

  return null;
};

export default PushManager;