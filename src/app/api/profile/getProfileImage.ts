// api/profile/getProfileImage.ts
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export const getProfileImage = async (fileName: string, userId: string): Promise<string> => {
    try {
      const fileRef = ref(storage, `profile/${userId}/${fileName}`);
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (error) {
      console.error("Error al obtener la imagen del perfil:", error);
      throw error;
    }
  };
  