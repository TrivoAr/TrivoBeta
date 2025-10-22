import { ref, getDownloadURL } from "firebase/storage";
import { getStorageInstance } from "@/libs/firebaseConfig";

export const getTeamSocialImage = async (
  fileName: string,
  salidaId: string
): Promise<string> => {
  try {
    const storage = await getStorageInstance();
    const fileRef = ref(storage, `team-social/${salidaId}/${fileName}`);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {

    throw error;
  }
};
