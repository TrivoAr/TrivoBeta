// api/profile/saveProfileImage.ts
import { ImageService } from '@/libs/services/ImageService';

/**
 * @deprecated Use ImageService.saveProfileImage() instead
 * This function is kept for backward compatibility
 */
export async function saveProfileImage(file: File, userId: string) {
  return await ImageService.saveProfileImage(file, userId);
}