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
      // Usar el SW generado dinámicamente con variables de entorno
      const registration =
        await navigator.serviceWorker.register("/api/firebase-sw");
      // Firebase SW registered
      return registration;
    } catch (error) {
      // Error registering Firebase SW
      throw error;
    }
  }
  throw new Error("Service Worker no soportado");
};

// Función para obtener token FCM
export const getFCMToken = async () => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      throw new Error("Messaging no soportado en este navegador");
    }

    // Registrar SW primero
    await registerFirebaseSW();

    // Obtener token
    const { getToken } = await import("firebase/messaging");
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error("FIREBASE_VAPID_KEY no configurada");
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration:
        await navigator.serviceWorker.getRegistration("/api/firebase-sw"),
    });

    if (token) {
      // FCM Token obtained
      return token;
    } else {
      throw new Error(
        "No se pudo obtener el token FCM - verifica los permisos"
      );
    }
  } catch (error) {
    // Error obtaining FCM token
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
