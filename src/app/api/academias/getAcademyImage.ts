// api/academias/getAcademyImage.ts
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig.js";


export const getAcademyImage = async (fileName: string, academyId: string): Promise<string> => {
    try {
      const fileRef = ref(storage, `academias/${academyId}/${fileName}`);
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (error) {
      console.error("Error al obtener la imagen del perfil:", error);
      throw error;
    }
  };
  