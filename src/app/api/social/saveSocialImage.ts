import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function saveSocialImage(file: File, salidaId: string) {
  try {
    const storage = getStorage();
    const fileName = "foto_salida.jpg";
    const fileRef = ref(storage, `social/${salidaId}/${fileName}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error("Error al guardar la imagen de salida social:", error);
    throw error;
  }
}
