// api/profile/getProfileImage.ts
import { ImageService } from '@/libs/services/ImageService';

/**
 * @deprecated Use ImageService.getImageUrl() or ImageService.getProfileImageWithFallback() instead
 * This function is kept for backward compatibility
 */
export const getProfileImage = async (fileName: string, userId: string): Promise<string> => {
  return await ImageService.getImageUrl(`profile/${userId}`, fileName);
};
  