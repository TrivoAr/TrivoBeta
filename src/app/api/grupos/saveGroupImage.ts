
import { storage } from "@/libs/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function saveGroupImage(file: File, groupId: string) {
  try {
      const storage = getStorage();
      
      // Usamos un nombre fijo para la foto de perfil del grupo
      const fileName = "foto_perfil_grupo.jpg";  // Puedes cambiar el nombre si lo prefieres
      const fileRef = ref(storage, `groups/${groupId}/${fileName}`);
      
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
  } catch (error) {
      console.error("Error al guardar la imagen:", error);
      throw error;
  }
}