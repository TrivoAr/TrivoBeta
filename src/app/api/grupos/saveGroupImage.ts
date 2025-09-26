import { ImageService } from "@/libs/services/ImageService";

/**
 * @deprecated Use ImageService.saveGroupImage() instead
 * This function is kept for backward compatibility
 */
export async function saveGroupImage(file: File, groupId: string) {
  return await ImageService.saveGroupImage(file, groupId);
}
