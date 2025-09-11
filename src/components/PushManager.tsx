// "use client"
// import { useEffect, useState } from "react";
// import { useSession } from "next-auth/react";
// import toast from "react-hot-toast";

// const PushManager = () => {
//   const { data: session } = useSession();
//   const [notificationState, setNotificationState] = useState<string>("checking");
//   const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

//   useEffect(() => {
//     // Solo intentar suscribir si hay sesión
//     if (!session?.user) return;

//     const subscribeUser = async () => {
//       if ("serviceWorker" in navigator && "PushManager" in window) {
//         try {
//           setNotificationState("requesting");
          
//           // Registro del Service Worker
//           const registration = await navigator.serviceWorker.register("/worker.js");
//           console.log("📱 Service Worker registrado:", registration);

//           // Esperar a que el Service Worker esté listo
//           const readyRegistration = await navigator.serviceWorker.ready;
//           console.log("📱 Service Worker listo:", readyRegistration);

//           // Verificar si ya está suscrito
//           const existingSubscription = await readyRegistration.pushManager.getSubscription();
//           if (existingSubscription) {
//             console.log("📱 Ya existe suscripción push");
//             setNotificationState("subscribed");
//             return;
//           }

//           // Solicitar permiso para notificaciones
//           const permission = await Notification.requestPermission();
//           if (permission !== "granted") {
//             console.warn("❌ Permiso para notificaciones denegado");
//             setNotificationState("denied");
//             toast("ℹ️ Puedes activar notificaciones más tarde en configuración del navegador", {
//               duration: 5000,
//               icon: "ℹ️"
//             });
//             return;
//           }
//           console.log("✅ Permiso para notificaciones otorgado");

//           // Suscripción al PushManager
//           const subscription = await readyRegistration.pushManager.subscribe({
//             userVisibleOnly: true,
//             applicationServerKey: publicVapidKey,
//           });
//           console.log("📱 Usuario suscrito a push:", subscription);

//           // Enviar la suscripción al backend
//           const response = await fetch("/api/save-subscription", {
//             method: "POST",
//             body: JSON.stringify(subscription),
//             headers: {
//               "Content-Type": "application/json",
//             },
//           });

//           if (response.ok) {
//             console.log("✅ Suscripción guardada en el backend");
//             setNotificationState("subscribed");
//             toast.success("📱 ¡Notificaciones activadas! Recibirás alertas importantes");
//           } else {
//             console.error("❌ Error guardando suscripción:", await response.text());
//             setNotificationState("error");
//             toast.error("❌ Error activando notificaciones");
//           }
//         } catch (error) {
//           console.error("❌ Error al habilitar notificaciones:", error);
//           setNotificationState("error");
//         }
//       } else {
//         console.warn("❌ Push notifications no soportadas en este dispositivo");
//         setNotificationState("unsupported");
//       }
//     };

//     subscribeUser();
//   }, [session, publicVapidKey]);

//   return null;
// };

// export default PushManager;

// "use client";
// import { useState, useEffect, useCallback } from "react";
// import { useSession } from "next-auth/react";
// import toast from "react-hot-toast";

// function urlBase64ToUint8Array(base64String: string) {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
//   const rawData = window.atob(base64);
//   const outputArray = new Uint8Array(rawData.length);
//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }
//   return outputArray;
// }

// const PushManager = () => {
//   const { data: session } = useSession();
//   const [notificationState, setNotificationState] = useState<
//     "checking" | "unsupported" | "denied" | "subscribed" | "error" | "idle"
//   >("idle");
//   const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

//   const subscribeUser = useCallback(async () => {
//     if (!session?.user) {
//       toast("⚠️ Debes iniciar sesión para activar notificaciones");
//       return;
//     }

//     if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
//       toast("❌ Este navegador no soporta notificaciones push", { icon: "⚠️" });
//       setNotificationState("unsupported");
//       return;
//     }

//     try {
//       setNotificationState("checking");

//       // Registrar el SW
//       const registration = await navigator.serviceWorker.register("/worker.js");
//       console.log("📱 Service Worker registrado:", registration);

//       const readyRegistration = await navigator.serviceWorker.ready;

//       // Verificar si ya hay suscripción
//       const existingSubscription = await readyRegistration.pushManager.getSubscription();
//       if (existingSubscription) {
//         console.log("📱 Ya existe suscripción push");
//         setNotificationState("subscribed");
//         toast.success("✅ Ya estabas suscrito a notificaciones");
//         return;
//       }

//       // Pedir permiso al usuario
//       const permission = await Notification.requestPermission();
//       if (permission !== "granted") {
//         console.warn("❌ Permiso para notificaciones denegado");
//         setNotificationState("denied");
//         toast("ℹ️ Puedes activar notificaciones más tarde desde configuración del navegador", {
//           duration: 5000,
//           icon: "ℹ️",
//         });
//         return;
//       }

//       console.log("✅ Permiso para notificaciones otorgado");

//       // Nueva suscripción
//       const subscription = await readyRegistration.pushManager.subscribe({
//         userVisibleOnly: true,
//         applicationServerKey: urlBase64ToUint8Array(publicVapidKey!),
//       });
//       console.log("📱 Usuario suscrito a push:", subscription);

//       // Guardar en backend
//       const response = await fetch("/api/save-subscription", {
//         method: "POST",
//         body: JSON.stringify(subscription),
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.ok) {
//         console.log("✅ Suscripción guardada en backend");
//         setNotificationState("subscribed");
//         toast.success("📱 ¡Notificaciones activadas!");
//       } else {
//         console.error("❌ Error guardando suscripción:", await response.text());
//         setNotificationState("error");
//         toast.error("❌ Error activando notificaciones");
//       }
//     } catch (error) {
//       console.error("❌ Error al habilitar notificaciones:", error);
//       setNotificationState("error");
//       toast.error("❌ Ocurrió un error al activar notificaciones");
//     }
//   }, [session, publicVapidKey]);
"use client";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

function urlBase64ToUint8Array(base64String: string) {
  const input = (base64String || "").trim();
  if (!input) throw new Error("VAPID public key is empty");
  const padding = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushManager() {
  const { data: session } = useSession();
  const [state, setState] = useState<"idle"|"subscribed"|"unsupported"|"denied"|"error">("idle");
  const [notificationState, setNotificationState] = useState<string>("checking");
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const subscribeUser = useCallback(async () => {
    try {
      if (!session?.user) { toast("Iniciá sesión para activar notificaciones"); return; }
      if (!("serviceWorker" in navigator)) { toast("SW no soportado"); setState("unsupported"); return; }

      // iOS: si no está instalada como PWA, avisar
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandaloneCap = "standalone" in navigator;
      if (isIOS && isStandaloneCap && !(navigator as any).standalone) {
        toast("📲 En iOS instalá la app (Compartir → Agregar a inicio) para habilitar push", { icon: "ℹ️" });
      }

      // Registrar SW
      const reg = await navigator.serviceWorker.register("/worker.js");
      await navigator.serviceWorker.ready;

      // Ya suscripto
      const existing = await reg.pushManager.getSubscription();
      if (existing) { setState("subscribed"); toast.success("Ya estabas suscrito"); return; }

      // Permiso
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); toast("Permiso denegado"); return; }

      // Validar VAPID
      const key = (publicVapidKey || "").trim();
      if (!key) {
        console.error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        toast.error("Falta la VAPID PUBLIC KEY en el cliente");
        setState("error");
        return;
      }
      // (opcional) log de longitud para debug: suele ser ~87-88
      console.log("VAPID key length:", key.length);

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const resp = await fetch("/api/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!resp.ok) throw new Error(await resp.text());
      setState("subscribed");
      toast.success("📱 Notificaciones activadas");
    } catch (err: any) {
      console.error("Error al habilitar notificaciones:", err);
      setState("error");
      // Mensaje más útil si la key es inválida
      if (String(err?.message || "").includes("InvalidCharacterError") || String(err?.message || "").includes("atob")) {
        toast.error("VAPID PUBLIC KEY inválida. Verificá que sea la pública Base64URL generada por web-push.");
      } else {
        toast.error("No se pudo activar notificaciones");
      }
    }
  }, [session, publicVapidKey]);


  return (
    <div className="">
      {notificationState !== "subscribed" && (
        <button
          onClick={subscribeUser}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-[30px] border shadow-sm transition bg-white"
        >
          🔔 Activar notificaciones
        </button>
      )}

      {notificationState === "subscribed" && (
        <p className="text-green-600 text-sm mt-2">
          ✅ Notificaciones activadas
        </p>
      )}
    </div>
  );
};

