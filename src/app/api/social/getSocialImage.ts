import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export const getSocialImage = async (fileName: string, salidaId: string): Promise<string> => {
  try {
    const fileRef = ref(storage, `social/${salidaId}/${fileName}`);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error al obtener la imagen de salida social:", error);
    throw error;
  }
};
