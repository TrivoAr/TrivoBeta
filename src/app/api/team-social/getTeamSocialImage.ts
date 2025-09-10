import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig.js";

export const getTeamSocialImage = async (fileName: string, salidaId: string): Promise<string> => {
  try {
    const fileRef = ref(storage, `team-social/${salidaId}/${fileName}`);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error al obtener la imagen de team social:", error);
    throw error;
  }
};
