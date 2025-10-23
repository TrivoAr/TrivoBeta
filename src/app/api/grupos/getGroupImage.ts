// api/grupos/getGroupImage.ts
import { ref, getDownloadURL } from "firebase/storage";
import { getStorageInstance } from "@/libs/firebaseConfig";

export const getGroupImage = async (
  fileName: string,
  groupId: string
): Promise<string> => {
  try {
    const storage = await getStorageInstance();
    const fileRef = ref(storage, `groups/${groupId}/${fileName}`);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {

    throw error;
  }
};
