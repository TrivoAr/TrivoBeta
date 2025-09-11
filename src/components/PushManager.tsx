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
  const [currentProcess, setCurrentProcess] = useState<Promise<any> | null>(null);

  const subscribeUser = useCallback(async () => {
    // Evitar ejecuciones múltiples
    if (busy || currentProcess) {
      console.log("⚠️ Proceso ya en ejecución, ignorando click");
      return;
    }
    
    setBusy(true);
    console.log("🚀 Iniciando proceso ÚNICO de suscripción push...");
    
    const processPromise = (async () => {
      try {
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

        // 1) Pedir permiso ANTES de hacer nada más
        console.log("🔐 Verificando/pidiendo permisos...");
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          console.log("📋 Permiso otorgado:", permission);
          if (permission !== "granted") {
            toast.error("❌ Necesitamos permisos para notificaciones");
            return;
          }
        } else if (Notification.permission === "denied") {
          toast.error("🚫 Las notificaciones están bloqueadas. Ve a configuración del navegador para habilitarlas.");
          return;
        }

        // 2) ESTRATEGIA SIMPLE: No limpiar nada, usar lo que existe
        console.log("📝 Obteniendo service worker existente...");
        let reg = await navigator.serviceWorker.getRegistration("/");
        
        if (!reg) {
          console.log("📝 No hay SW, registrando nuevo...");
          reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
        } else {
          console.log("✅ Usando service worker existente");
        }
        
        await navigator.serviceWorker.ready;
        console.log("✅ Service worker listo");

        // 3) Verificar si ya existe una suscripción
        console.log("🔍 Verificando suscripción existente...");
        const existingSubscription = await reg.pushManager.getSubscription();
        
        if (existingSubscription) {
          console.log("ℹ️ Ya existe una suscripción, enviando al backend...");
          
          // Intentar guardar la existente (puede que no esté en BD)
          try {
            const resp = await fetch("/api/save-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(existingSubscription),
            });
            
            if (resp.ok) {
              console.log("✅ Suscripción existente registrada en backend");
              setSubscribed(true);
              toast.success("📱 Notificaciones ya estaban activadas");
              return;
            }
          } catch (e) {
            console.warn("⚠️ Error guardando suscripción existente, creando nueva...");
            await existingSubscription.unsubscribe();
          }
        }

        // 4) CREAR SUSCRIPCIÓN con estrategia específica por navegador
        console.log("📬 Creando nueva suscripción...");
        console.log("🔑 VAPID key original:", publicKey);
        
        // Detectar navegador
        const isChromium = /Chrome|Chromium|Brave/i.test(navigator.userAgent);
        const isFirefox = /Firefox/i.test(navigator.userAgent);
        
        console.log("🌐 Navegador detectado:", { isChromium, isFirefox });
        
        // Validar la clave VAPID antes de usarla
        console.log("🔄 Procesando VAPID key...");
        const vapidKey = urlBase64ToUint8Array(publicKey);
        console.log("🔑 VAPID key procesada:", {
          length: vapidKey.length,
          first10: Array.from(vapidKey.slice(0, 10)),
          expectedLength: 65
        });
        
        console.log("⚡ Intentando suscribirse...");
        
        let subscription;
        if (isChromium) {
          // ESTRATEGIA ESPECIAL PARA CHROMIUM
          console.log("🔧 Usando estrategia específica para Chromium...");
          
          // Esperar un poco más entre pasos
          await new Promise(r => setTimeout(r, 1000));
          
          // Intentar con configuraciones alternativas
          const strategies = [
            // Estrategia 1: Configuración estándar
            {
              userVisibleOnly: true,
              applicationServerKey: vapidKey,
            },
            // Estrategia 2: Sin applicationServerKey (para algunos casos edge)
            {
              userVisibleOnly: true,
            }
          ];
          
          for (let i = 0; i < strategies.length; i++) {
            try {
              console.log(`🎯 Probando estrategia ${i + 1} para Chromium...`);
              subscription = await reg.pushManager.subscribe(strategies[i]);
              console.log(`✅ Estrategia ${i + 1} exitosa`);
              break;
            } catch (err) {
              console.warn(`⚠️ Estrategia ${i + 1} falló:`, err.message);
              if (i === strategies.length - 1) {
                throw err; // Lanzar el último error si todas fallan
              }
              // Esperar antes de probar la siguiente estrategia
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        } else {
          // ESTRATEGIA ESTÁNDAR PARA OTROS NAVEGADORES (Firefox, Safari, etc.)
          console.log("🦊 Usando estrategia estándar para navegadores no-Chromium...");
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          });
        }

        console.log("✅ Suscripción creada:", {
          endpoint: subscription.endpoint.substring(0, 50) + "...",
          hasKeys: !!subscription.toJSON().keys
        });

        // 5) Guardar en backend
        console.log("💾 Guardando en backend...");
        const resp = await fetch("/api/save-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error("❌ Error del backend:", resp.status, errorText);
          throw new Error(`Backend error (${resp.status}): ${errorText}`);
        }

        console.log("🎉 Todo completado exitosamente");
        setSubscribed(true);
        toast.success("📱 Notificaciones activadas correctamente");
        
      } catch (err: any) {
        console.error("❌ Error completo:", err);
        console.error("❌ Stack:", err?.stack);
        
        const errorName = String(err?.name || "");
        const errorMessage = String(err?.message || err);

        if (errorName === "AbortError") {
          const isChromium = /Chrome|Chromium|Brave/i.test(navigator.userAgent);
          if (isChromium) {
            toast.error("🚫 Problema con Chrome/Brave: FCM bloqueado. Soluciones:\n\n✅ Funciona en Firefox\n1️⃣ Usa Firefox temporalmente\n2️⃣ O espera - puede ser temporal\n3️⃣ Verifica tu red/firewall");
          } else {
            toast.error("🚫 El navegador rechazó la suscripción");
          }
        } else if (errorName === "NotSupportedError") {
          toast.error("❌ Tu navegador no soporta push notifications");
        } else if (errorName === "NotAllowedError") {
          toast.error("🚫 Permisos denegados por el navegador");
        } else if (errorMessage.includes("applicationServerKey is not valid")) {
          toast.error("🔑 Clave VAPID inválida - contacta al desarrollador");
        } else if (errorMessage.includes("Backend error")) {
          toast.error("🔧 Error del servidor - intenta más tarde");
        } else {
          toast.error(`❌ Error: ${errorMessage.substring(0, 80)}...`);
        }
      }
    })();
    
    setCurrentProcess(processPromise);
    
    try {
      await processPromise;
    } finally {
      setBusy(false);
      setCurrentProcess(null);
    }
  }, [session, publicKey, busy, currentProcess]);



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