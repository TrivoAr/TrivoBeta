import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa Firebase solo si no está ya inicializado
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Lazy initialization para cada servicio de Firebase
let authInstance = null;
let dbInstance = null;
let storageInstance = null;

export const getAuthInstance = async () => {
  if (!authInstance) {
    const { getAuth } = await import("firebase/auth");
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const getDbInstance = async () => {
  if (!dbInstance) {
    const { getFirestore } = await import("firebase/firestore");
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};

export const getStorageInstance = async () => {
  if (!storageInstance) {
    const { getStorage } = await import("firebase/storage");
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

// IMPORTANTE: No usar auth, db, storage directamente
// Usar getAuthInstance(), getDbInstance(), getStorageInstance() para lazy loading

// Función para obtener el messaging instance
export const getMessagingInstance = async () => {
  if (typeof window === "undefined") return null;

  const { getMessaging, isSupported } = await import("firebase/messaging");
  const supported = await isSupported();
  if (!supported) return null;

  return getMessaging(app);
};

// Función para registrar Service Worker y obtener token
export const registerFirebaseSW = async () => {
  if ("serviceWorker" in navigator) {
    try {
      // Primero verificar si ya existe el registro
      const existingRegistration = await navigator.serviceWorker.getRegistration("/");

      if (existingRegistration) {
        console.log('[Firebase] SW ya registrado, reutilizando:', existingRegistration.scope);
        return existingRegistration;
      }

      // Si no existe, registrar SOLO el SW generado dinámicamente con variables de entorno
      // Esto reemplaza al firebase-messaging-sw.js hardcodeado
      const registration = await navigator.serviceWorker.register("/api/firebase-sw", {
        scope: "/"
      });
      console.log('[Firebase] SW registrado correctamente:', registration.scope);

      // Esperar a que el SW esté activo
      await navigator.serviceWorker.ready;

      return registration;
    } catch (error) {
      console.error('[Firebase] Error registrando SW:', error);
      throw error;
    }
  }
  throw new Error("Service Worker no soportado");
};

// Función para obtener token FCM
export const getFCMToken = async () => {
  try {
    console.log("[Firebase] Iniciando getFCMToken...");

    const messaging = await getMessagingInstance();
    if (!messaging) {
      throw new Error("Messaging no soportado en este navegador");
    }
    console.log("[Firebase] Messaging instance obtenida");

    // Obtener/esperar el SW (ya registrado por ServiceWorkerRegistration.tsx)
    console.log("[Firebase] Esperando Service Worker...");
    const swRegistration = await registerFirebaseSW();
    console.log("[Firebase] Service Worker listo:", swRegistration.scope);

    // Verificar que el SW esté activo
    if (!swRegistration.active) {
      console.warn("[Firebase] SW no está activo, esperando...");
      await navigator.serviceWorker.ready;
      console.log("[Firebase] SW ahora está activo");
    }

    // Obtener token
    const { getToken } = await import("firebase/messaging");
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    console.log("[Firebase] VAPID Key presente:", !!vapidKey);
    if (!vapidKey) {
      throw new Error("FIREBASE_VAPID_KEY no configurada");
    }

    console.log("[Firebase] Solicitando token FCM...");
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log("[Firebase] Token FCM obtenido exitosamente:", token.substring(0, 20) + "...");
      return token;
    } else {
      throw new Error(
        "No se pudo obtener el token FCM - verifica los permisos"
      );
    }
  } catch (error) {
    console.error("[Firebase] Error en getFCMToken:", error);
    throw error;
  }
};

// Función para escuchar mensajes en primer plano
export const onMessageListener = () =>
  new Promise(async (resolve) => {
    const messaging = await getMessagingInstance();
    if (messaging) {
      const { onMessage } = await import("firebase/messaging");
      onMessage(messaging, (payload) => {
        // Message received in foreground
        resolve(payload);
      });
    }
  });

export { app };
