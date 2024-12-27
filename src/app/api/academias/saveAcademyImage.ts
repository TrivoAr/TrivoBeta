// api/academias/saveAcademyImage.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export async function saveAcademyImage(file: File, academyId: string) {
  try {
      const storage = getStorage();
      
      // Usamos un nombre fijo para la foto de perfil del grupo
      const fileName = "profile-image.jpg";  // Puedes cambiar el nombre si lo prefieres
      const fileRef = ref(storage, `academias/${academyId}/${fileName}`);
      
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
  } catch (error) {
      console.error("Error al guardar la imagen:", error);
      throw error;
  }
}
