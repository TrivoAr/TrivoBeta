"use client";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const SW_URL = "/worker.js";

function urlBase64ToUint8Array(base64String: string) {
  const input = (base64String || "").trim();
  if (!input) throw new Error("VAPID public key is empty");
  const padding = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

export default function PushManager() {
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [notificationState, setNotificationState] = useState<string>("checking");
  const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim();

  const subscribeUser = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    
    // Timeout de 30 segundos para todo el proceso
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT: El proceso tardó más de 30 segundos")), 30000);
    });
    
    const subscriptionPromise = (async () => {
      try {
        console.log("🚀 Iniciando proceso de suscripción push...");
        
        // 0) Chequeos básicos
        if (!session?.user) {
          toast("Iniciá sesión para activar notificaciones");
          return;
        }
        
        console.log("✅ Usuario autenticado:", session.user.id);
        
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          toast("Este navegador no soporta notificaciones push", { icon: "⚠️" });
          return;
        }
        
        console.log("✅ Navegador soporta push notifications");

        // iOS: solo funciona en PWA (Agregar a inicio)
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isStandalone =
          (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
          (navigator as any).standalone === true;
        if (isIOS && !isStandalone) {
          toast("📲 En iOS instalá la app (Compartir → Agregar a inicio) y abrila desde el ícono.", { icon: "ℹ️" });
          return;
        }

        if (!publicKey) {
          console.error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");
          toast.error("Falta VAPID PUBLIC KEY en el cliente");
          return;
        }
        
        console.log("✅ VAPID key presente, longitud:", publicKey.length);

        // Verificar permisos actuales
        const currentPermission = Notification.permission;
        console.log("📋 Permiso actual de notificaciones:", currentPermission);

        // 1) SKIP limpieza por ahora - puede estar causando el cuelgue
        console.log("⚡ Saltando limpieza para evitar cuelgues...");

        // 2) Registrar Service Worker con timeout
        console.log("📝 Registrando service worker...");
        const regPromise = navigator.serviceWorker.register(SW_URL, { 
          scope: "/",
          updateViaCache: 'none'
        });
        
        const regTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT registrando service worker")), 5000)
        );
        
        const reg = await Promise.race([regPromise, regTimeout]) as ServiceWorkerRegistration;
        console.log("✅ Service worker registrado");
        
        console.log("⏳ Esperando service worker ready...");
        const readyPromise = navigator.serviceWorker.ready;
        const readyTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT esperando service worker ready")), 5000)
        );
        
        await Promise.race([readyPromise, readyTimeout]);
        console.log("✅ Service worker listo");

        // 3) Pedir permiso con timeout
        if (currentPermission !== "granted") {
          console.log("🔐 Pidiendo permiso para notificaciones...");
          const permissionPromise = Notification.requestPermission();
          const permissionTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("TIMEOUT pidiendo permisos")), 10000)
          );
          
          const permission = await Promise.race([permissionPromise, permissionTimeout]) as NotificationPermission;
          console.log("📋 Nuevo permiso:", permission);
          if (permission !== "granted") {
            toast("Permiso denegado");
            return;
          }
        }

        // 4) Intentar suscribirse con timeout más corto
        console.log("📬 Intentando suscribirse al push service...");
        console.log("🔑 Usando VAPID key:", publicKey.substring(0, 20) + "...");
        
        const subscribePromise = reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        
        const subscribeTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT en suscripción push - el navegador no responde")), 8000)
        );
        
        const subscription = await Promise.race([subscribePromise, subscribeTimeout]) as PushSubscription;

        console.log("✅ Suscripción exitosa:", {
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys
        });

        // 5) Guardar en backend con timeout
        console.log("💾 Guardando suscripción en backend...");
        const fetchPromise = fetch("/api/save-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
        
        const fetchTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT guardando en backend")), 5000)
        );
        
        const resp = await Promise.race([fetchPromise, fetchTimeout]) as Response;
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error("❌ Error del backend:", errorText);
          throw new Error(`Backend error: ${errorText}`);
        }

        console.log("✅ Todo completado exitosamente");
        setSubscribed(true);
        toast.success("📱 Notificaciones activadas");
        
      } catch (err: any) {
        throw err; // Re-lanzar para que lo capture el Promise.race principal
      }
    })();

    try {
      await Promise.race([subscriptionPromise, timeoutPromise]);
    } catch (err: any) {
      console.error("❌ Error completo:", err);
      console.error("❌ Error name:", err?.name);
      console.error("❌ Error message:", err?.message);
      
      const errorName = String(err?.name || "");
      const errorMessage = String(err?.message || err);

      if (errorMessage.includes("TIMEOUT")) {
        toast.error("⏰ El proceso tardó demasiado. Posibles causas:\n1) Conexión lenta\n2) El navegador está bloqueando notificaciones\n3) Problemas con el service worker");
      } else if (errorName === "AbortError") {
        toast.error("🚫 El navegador canceló la operación");
      } else if (errorName === "NotSupportedError") {
        toast.error("❌ Tu navegador no soporta push notifications");
      } else if (errorMessage.includes("applicationServerKey is not valid")) {
        toast.error("🔑 Clave VAPID inválida");
      } else {
        toast.error(`❌ Error: ${errorName || errorMessage.substring(0, 100)}`);
      }
    } finally {
      setBusy(false);
    }
  }, [session, publicKey, busy]);



//   return (
//     <div className="">
//       {notificationState !== "subscribed" && (
//         <button
//           onClick={subscribeUser}
//           className="w-full flex items-center gap-3 px-4 py-3 rounded-[30px] border shadow-sm transition bg-white"
//         >
//           🔔 Activar notificaciones
//         </button>
//       )}

//       {notificationState === "subscribed" && (
//         <p className="text-green-600 text-sm mt-2">
//           ✅ Notificaciones activadas
//         </p>
//       )}
//     </div>
//   );
// };


  return (
    <button
      onClick={subscribeUser}
      disabled={busy || subscribed}
      className="w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm hover:bg-black/5 disabled:opacity-60"
    >
      {subscribed ? "✅ Notificaciones activadas" : busy ? "Activando…" : "🔔 Activar notificaciones"}
    </button>
  );
}