import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa Firebase solo si no está ya inicializado
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Función para obtener el messaging instance
export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  
  const supported = await isSupported();
  if (!supported) return null;
  
  return getMessaging(app);
};

// Función para registrar Service Worker y obtener token
export const registerFirebaseSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Usar el SW generado dinámicamente con variables de entorno
      const registration = await navigator.serviceWorker.register('/api/firebase-sw');
      console.log('✅ Firebase SW registrado:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Error registrando Firebase SW:', error);
      throw error;
    }
  }
  throw new Error('Service Worker no soportado');
};

// Función para obtener token FCM
export const getFCMToken = async () => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      throw new Error('Messaging no soportado en este navegador');
    }

    // Registrar SW primero
    await registerFirebaseSW();

    // Obtener token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('FIREBASE_VAPID_KEY no configurada');
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/api/firebase-sw')
    });

    if (token) {
      console.log('✅ FCM Token obtenido:', token.substring(0, 20) + '...');
      return token;
    } else {
      throw new Error('No se pudo obtener el token FCM - verifica los permisos');
    }
  } catch (error) {
    console.error('❌ Error obteniendo token FCM:', error);
    throw error;
  }
};

// Función para escuchar mensajes en primer plano
export const onMessageListener = () =>
  new Promise((resolve) => {
    getMessagingInstance().then((messaging) => {
      if (messaging) {
        onMessage(messaging, (payload) => {
          console.log('📬 Mensaje recibido en primer plano:', payload);
          resolve(payload);
        });
      }
    });
  });

export { app, auth, db, storage };
