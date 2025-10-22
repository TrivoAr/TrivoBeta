// api/academias/getAcademyImage.ts
import { ref, getDownloadURL } from "firebase/storage";
import { getStorageInstance } from "@/libs/firebaseConfig";

export const getAcademyImage = async (
  fileName: string,
  academyId: string
): Promise<string> => {
  try {
    // Primero intentar con la nueva estructura: academias/{academyId}/foto_academia.jpg
    const storage = await getStorageInstance();
    const fileRef = ref(storage, `academias/${academyId}/${fileName}`);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    try {
      // Si falla, intentar con estructura anterior: academias/{academyId}/profile-image.jpg
      const storage = await getStorageInstance();
      const fallbackRef = ref(
        storage,
        `academias/${academyId}/profile-image.jpg`
      );
      const downloadUrl = await getDownloadURL(fallbackRef);
      return downloadUrl;
    } catch (fallbackError) {

      throw error;
    }
  }
};
