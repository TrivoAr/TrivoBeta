// api/academias/saveAcademyImage.ts
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export const saveAcademyImage = async (file: File, academyId: string): Promise<string> => {
  const storageRef = ref(storage, `academias/${academyId}/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Failed to upload academy image:", error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};
