// api/profile/saveProfileImage.ts
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export const saveProfileImage = async (file: File, userId: string): Promise<string> => {
  const storageRef = ref(storage, `profile/${userId}/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Failed to upload profile image:", error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};