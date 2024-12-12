
import { storage } from "@/libs/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function saveGroupImage(file: File, groupId: string) {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, `groups/${groupId}/${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error("Error al guardar la imagen:", error);
      throw error;
    }
  }
  