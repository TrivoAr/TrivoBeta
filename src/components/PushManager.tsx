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
      // 0) Chequeos básicos
      if (!session?.user) {
        toast("Iniciá sesión para activar notificaciones");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        toast("Este navegador no soporta notificaciones push", { icon: "⚠️" });
        return;
      }

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
      console.log("VAPID key length:", publicKey.length); // ~87-88

      // 1) Registrar Service Worker
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
      await navigator.serviceWorker.ready;

      // 2) Limpiar suscripción previa (evita AbortError con claves viejas)
      try {
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          console.log("🗑 Desuscribiendo suscripción previa");
          await existing.unsubscribe();
        }
      } catch (e) {
        console.warn("No se pudo limpiar suscripción previa:", e);
      }

      // 3) Pedir permiso
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast("Permiso denegado");
        return;
      }

      // 4) Suscribirse (retry una vez si da AbortError)
      const subscribeOnce = async () =>
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

      let subscription;
      try {
        subscription = await subscribeOnce();
      } catch (err: any) {
        if (String(err?.name || err).includes("AbortError")) {
          console.warn("Retry subscribe after AbortError…");
          await new Promise((r) => setTimeout(r, 250));
          subscription = await subscribeOnce();
        } else {
          throw err;
        }
      }

      console.log("📬 Nueva suscripción:", subscription);

      // 5) Guardar en backend
      const resp = await fetch("/api/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!resp.ok) throw new Error(await resp.text());

      setSubscribed(true);
      toast.success("📱 Notificaciones activadas");
    } catch (err: any) {
      console.error("❌ Error al habilitar notificaciones:", err);
      const msg = String(err?.message || err);

      if (msg.includes("applicationServerKey is not valid") || msg.includes("InvalidAccessError")) {
        toast.error("Clave VAPID inválida. Verificá que frontend y backend usen la misma pública.");
      } else if (msg.includes("AbortError")) {
        toast.error("Falló el servicio de push. Reintentá (limpiamos suscripciones previas).");
      } else {
        toast.error("No se pudo activar notificaciones");
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