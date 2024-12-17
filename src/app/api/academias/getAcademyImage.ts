// api/academias/getAcademyImage.ts
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export const getAcademyImage = async (fileName: string, academyId: string): Promise<string> => {
    const fileRef = ref(storage, `academias/${academyId}/${fileName}`);
    return getDownloadURL(fileRef);
  };
  