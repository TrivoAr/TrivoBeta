import { ImageService } from '@/libs/services/ImageService';

/**
 * @deprecated Use ImageService.saveSocialImage() instead
 * This function is kept for backward compatibility
 */
export async function saveSocialImage(file: File, salidaId: string) {
  return await ImageService.saveSocialImage(file, salidaId);
}
