import { ImageService } from '@/libs/services/ImageService';

/**
 * @deprecated Use ImageService.saveTeamSocialImage() instead
 * This function is kept for backward compatibility
 */
export async function saveTeamSocialImage(file: File, teamId: string) {
  return await ImageService.saveTeamSocialImage(file, teamId);
}
