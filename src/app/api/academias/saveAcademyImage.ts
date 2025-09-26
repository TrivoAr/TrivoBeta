// api/academias/saveAcademyImage.ts
import { ImageService } from "@/libs/services/ImageService";

/**
 * @deprecated Use ImageService.saveAcademyImage() instead
 * This function is kept for backward compatibility
 */
export async function saveAcademyImage(file: File, academyId: string) {
  return await ImageService.saveAcademyImage(file, academyId);
}
