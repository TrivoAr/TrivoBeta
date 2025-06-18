import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function saveTeamSocialImage(file: File, salidaId: string) {
  try {
    const storage = getStorage();
    const fileName = "foto_salida.jpg";
    const fileRef = ref(storage, `team-social/${salidaId}/${fileName}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error("Error al guardar la imagen de team social:", error);
    throw error;
  }
}
