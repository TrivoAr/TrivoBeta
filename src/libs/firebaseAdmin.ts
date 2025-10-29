import * as admin from "firebase-admin";

// Singleton para Firebase Admin
let firebaseAdmin: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Verificar si ya existe una app inicializada
    if (admin.apps.length > 0) {
      console.log("✅ Firebase Admin ya estaba inicializado, reutilizando");
      firebaseAdmin = admin.apps[0];
      return firebaseAdmin;
    }

    // Opción 1: Usar service account JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );

      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin inicializado con service account JSON");
    }
    // Opción 2: Usar credenciales individuales
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("✅ Firebase Admin inicializado con credenciales individuales");
    } else {
      throw new Error(
        "Firebase Admin: Credenciales no configuradas. " +
        "Configura FIREBASE_SERVICE_ACCOUNT_KEY o las credenciales individuales."
      );
    }

    return firebaseAdmin;
  } catch (error: any) {
    console.error("❌ Error inicializando Firebase Admin:", error);
    console.error("Stack:", error.stack);
    throw error;
  }
}

export function getMessaging() {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
}
