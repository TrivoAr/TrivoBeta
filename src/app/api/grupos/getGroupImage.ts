// api/grupos/getGroupImage.ts
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export const getGroupImage = async (
  fileName: string,
  groupId: string
): Promise<string> => {
  try {
    const fileRef = ref(storage, `groups/${groupId}/${fileName}`);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error al obtener la imagen del grupo:", error);
    throw error;
  }
};
