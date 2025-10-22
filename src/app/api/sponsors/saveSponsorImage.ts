import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorageInstance } from "@/libs/firebaseConfig";

export async function saveSponsorImage(file: File, sponsorId: string) {
  try {
    const storage = await getStorageInstance();
    const fileName = "sponsor-image.jpg";
    const fileRef = ref(storage, `sponsors/${sponsorId}/${fileName}`);

    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {

    throw error;
  }
}
