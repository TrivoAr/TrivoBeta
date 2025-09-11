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

      // 1) LIMPIAR TODO PRIMERO
      console.log("🧹 Limpiando registros previos...");
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log("📝 Service workers registrados:", registrations.length);
        
        for (const registration of registrations) {
          const existing = await registration.pushManager.getSubscription();
          if (existing) {
            console.log("🗑️ Desuscribiendo suscripción previa:", existing.endpoint);
            await existing.unsubscribe();
          }
          await registration.unregister();
        }
        console.log("✅ Limpieza completada");
      } catch (e) {
        console.warn("⚠️ Error durante limpieza:", e);
      }

      // Esperar un momento después de limpiar
      await new Promise(r => setTimeout(r, 1000));

      // 2) Registrar Service Worker fresh
      console.log("📝 Registrando service worker...");
      const reg = await navigator.serviceWorker.register(SW_URL, { 
        scope: "/",
        updateViaCache: 'none' // Forzar actualización
      });
      
      console.log("⏳ Esperando service worker ready...");
      await navigator.serviceWorker.ready;
      console.log("✅ Service worker listo");

      // 3) Pedir permiso
      if (currentPermission !== "granted") {
        console.log("🔐 Pidiendo permiso para notificaciones...");
        const permission = await Notification.requestPermission();
        console.log("📋 Nuevo permiso:", permission);
        if (permission !== "granted") {
          toast("Permiso denegado");
          return;
        }
      }

      // 4) Intentar suscribirse UNA sola vez de forma simple
      console.log("📬 Intentando suscribirse al push service...");
      console.log("🔑 Usando VAPID key:", publicKey.substring(0, 20) + "...");
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log("✅ Suscripción exitosa:", {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys
      });

      // 5) Guardar en backend
      console.log("💾 Guardando suscripción en backend...");
      const resp = await fetch("/api/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("❌ Error del backend:", errorText);
        throw new Error(`Backend error: ${errorText}`);
      }

      console.log("✅ Todo completado exitosamente");
      setSubscribed(true);
      toast.success("📱 Notificaciones activadas");
      
    } catch (err: any) {
      console.error("❌ Error completo:", err);
      console.error("❌ Error name:", err?.name);
      console.error("❌ Error message:", err?.message);
      console.error("❌ Error stack:", err?.stack);
      
      const errorName = String(err?.name || "");
      const errorMessage = String(err?.message || err);

      if (errorName === "AbortError") {
        toast.error("🚫 El navegador canceló la operación. Esto puede pasar si:\n1) Hay múltiples pestañas abiertas\n2) El navegador está bloqueando push notifications\n3) Hay problemas de conectividad");
      } else if (errorName === "NotSupportedError") {
        toast.error("❌ Tu navegador o sistema no soporta push notifications");
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