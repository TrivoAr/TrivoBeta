// api/profile/getProfileImage.ts
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export const getProfileImage = async (fileName: string, userId: string): Promise<string> => {
    const fileRef = ref(storage, `profile/${userId}/${fileName}`);
    return getDownloadURL(fileRef);
  };