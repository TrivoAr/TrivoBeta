import { ref, getDownloadURL } from "firebase/storage";
import { getStorageInstance } from "@/libs/firebaseConfig";

export const getSocialImage = async (
  fileName: string,
  salidaId: string
): Promise<string> => {
  try {
    const storage = await getStorageInstance();
    const fileRef = ref(storage, `social/${salidaId}/${fileName}`);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error al obtener la imagen de salida social:", error);
    throw error;
  }
};
