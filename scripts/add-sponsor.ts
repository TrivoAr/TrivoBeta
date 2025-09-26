import { connectDB } from "../src/libs/mongodb";
import Sponsors from "../src/models/sponsors";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import fs from "fs";
import path from "path";

// Firebase config (usa la misma configuración que tu proyecto)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function saveSponsorImage(imageBuffer: Buffer, sponsorId: string) {
  try {
    const fileName = "sponsor-image.jpg";
    const fileRef = ref(storage, `sponsors/${sponsorId}/${fileName}`);

    const snapshot = await uploadBytes(fileRef, imageBuffer);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error("Error al guardar imagen del sponsor:", error);
    throw error;
  }
}

async function addSponsor(sponsorName: string, imagePath: string) {
  try {
    console.log("🔄 Conectando a la base de datos...");
    await connectDB();

    console.log("🔄 Creando sponsor...");
    const sponsor = await Sponsors.create({
      name: sponsorName,
    });

    console.log("✅ Sponsor creado con ID:", sponsor._id);

    console.log("🔄 Subiendo imagen...");

    // Verificar que el archivo existe
    if (!fs.existsSync(imagePath)) {
      throw new Error(`El archivo no existe: ${imagePath}`);
    }

    // Leer la imagen
    const imageBuffer = fs.readFileSync(imagePath);
    console.log("📁 Imagen leída:", imageBuffer.length, "bytes");

    // Subir a Firebase
    const imageUrl = await saveSponsorImage(
      imageBuffer,
      sponsor._id.toString()
    );

    // Actualizar el sponsor con la URL
    sponsor.imagen = imageUrl;
    await sponsor.save();

    console.log("🎉 ¡Sponsor creado exitosamente!");
    console.log("ID:", sponsor._id);
    console.log("Nombre:", sponsor.name);
    console.log("Imagen:", sponsor.imagen);

    return sponsor;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Configuración del sponsor (CAMBIAR ESTOS VALORES)
const SPONSOR_NAME = "Marathon";
const IMAGE_PATH = "C:/Users/matia/Downloads/marathon.png"; // Cambiar por tu ruta

// Ejecutar el script
addSponsor(SPONSOR_NAME, IMAGE_PATH)
  .then(() => {
    console.log("✅ Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script falló:", error);
    process.exit(1);
  });
