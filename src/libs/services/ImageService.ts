import { getStorage, ref, uploadBytes, getDownloadURL, StorageReference } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

export interface ImageUploadOptions {
  maxRetries?: number;
  timeout?: number;
  quality?: number;
}

export interface ImageServiceError extends Error {
  code?: string;
  originalError?: unknown;
}

export class ImageUploadError extends Error implements ImageServiceError {
  code = 'IMAGE_UPLOAD_ERROR';
  originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'ImageUploadError';
    this.originalError = originalError;
  }
}

export class ImageFetchError extends Error implements ImageServiceError {
  code = 'IMAGE_FETCH_ERROR';
  originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'ImageFetchError';
    this.originalError = originalError;
  }
}

/**
 * Unified service for handling all image operations in the application
 * Follows Next.js best practices and provides consistent error handling
 */
export class ImageService {
  private static readonly DEFAULT_FILE_NAME = 'image.jpg';
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private static readonly DEFAULT_FETCH_TIMEOUT = 3000; // 3 seconds for fetching

  /**
   * Upload an image to Firebase Storage
   */
  static async uploadImage(
    file: File,
    path: string,
    fileName?: string,
    options: ImageUploadOptions = {}
  ): Promise<string> {
    const {
      maxRetries = 3,
      timeout = this.DEFAULT_TIMEOUT
    } = options;

    const finalFileName = fileName || this.DEFAULT_FILE_NAME;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const uploadPromise = this.performUpload(file, path, finalFileName);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout')), timeout)
        );

        return await Promise.race([uploadPromise, timeoutPromise]);
      } catch (error) {
        console.error(`[ImageService] Upload attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw new ImageUploadError(
            `Failed to upload image after ${maxRetries} attempts`,
            error
          );
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new ImageUploadError('Unexpected error during upload');
  }

  /**
   * Perform the actual file upload to Firebase Storage
   */
  private static async performUpload(
    file: File,
    path: string,
    fileName: string
  ): Promise<string> {
    try {
      const fileRef = ref(storage, `${path}/${fileName}`);
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      throw new ImageUploadError('Firebase upload failed', error);
    }
  }

  /**
   * Get an image URL from Firebase Storage
   */
  static async getImageUrl(
    path: string,
    fileName: string,
    timeout: number = this.DEFAULT_FETCH_TIMEOUT
  ): Promise<string> {
    try {
      const fetchPromise = this.performImageFetch(path, fileName);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Image fetch timeout')), timeout)
      );

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      throw new ImageFetchError('Failed to fetch image URL', error);
    }
  }

  /**
   * Perform the actual image URL fetch from Firebase Storage
   */
  private static async performImageFetch(path: string, fileName: string): Promise<string> {
    try {
      const fileRef = ref(storage, `${path}/${fileName}`);
      return await getDownloadURL(fileRef);
    } catch (error) {
      throw new ImageFetchError('Firebase fetch failed', error);
    }
  }

  /**
   * Generate a fallback avatar URL using ui-avatars.com
   */
  static generateAvatarUrl(
    name: string,
    options: {
      size?: number;
      background?: string;
      color?: string;
      length?: number;
    } = {}
  ): string {
    const {
      size = 128,
      background = 'random',
      color = 'fff',
      length = 1
    } = options;

    const encodedName = encodeURIComponent(name || 'U');
    return `https://ui-avatars.com/api/?name=${encodedName}&length=${length}&background=${background}&color=${color}&size=${size}`;
  }

  /**
   * Get profile image with automatic fallback to avatar
   */
  static async getProfileImageWithFallback(
    userId: string,
    userName: string,
    fileName: string = 'profile-image.jpg',
    timeout: number = this.DEFAULT_FETCH_TIMEOUT
  ): Promise<string> {
    try {
      return await this.getImageUrl(`profile/${userId}`, fileName, timeout);
    } catch (error) {
      console.log(`[ImageService] Profile image fetch failed for user ${userId}, using fallback:`, error instanceof Error ? error.message : 'unknown error');
      return this.generateAvatarUrl(userName);
    }
  }

  // Specialized upload methods for different entity types

  /**
   * Save social event image
   */
  static async saveSocialImage(file: File, salidaId: string): Promise<string> {
    try {
      return await this.uploadImage(file, `social/${salidaId}`, 'foto_salida.jpg');
    } catch (error) {
      console.error('[ImageService] Error saving social image:', error);
      throw new ImageUploadError('Error al guardar la imagen de salida social', error);
    }
  }

  /**
   * Save team social event image
   */
  static async saveTeamSocialImage(file: File, teamId: string): Promise<string> {
    try {
      return await this.uploadImage(file, `team-social/${teamId}`, 'foto_team.jpg');
    } catch (error) {
      console.error('[ImageService] Error saving team social image:', error);
      throw new ImageUploadError('Error al guardar la imagen de team social', error);
    }
  }

  /**
   * Save academy image
   */
  static async saveAcademyImage(file: File, academiaId: string): Promise<string> {
    try {
      return await this.uploadImage(file, `academias/${academiaId}`, 'foto_academia.jpg');
    } catch (error) {
      console.error('[ImageService] Error saving academy image:', error);
      throw new ImageUploadError('Error al guardar la imagen de academia', error);
    }
  }

  /**
   * Save group image
   */
  static async saveGroupImage(file: File, groupId: string): Promise<string> {
    try {
      return await this.uploadImage(file, `grupos/${groupId}`, 'foto_grupo.jpg');
    } catch (error) {
      console.error('[ImageService] Error saving group image:', error);
      throw new ImageUploadError('Error al guardar la imagen de grupo', error);
    }
  }

  /**
   * Save profile image
   */
  static async saveProfileImage(file: File, userId: string): Promise<string> {
    try {
      return await this.uploadImage(file, `profile/${userId}`, 'profile-image.jpg');
    } catch (error) {
      console.error('[ImageService] Error saving profile image:', error);
      throw new ImageUploadError('Error al guardar la imagen de perfil', error);
    }
  }

  /**
   * Save sponsor image
   */
  static async saveSponsorImage(file: File, sponsorId: string): Promise<string> {
    try {
      return await this.uploadImage(file, `sponsors/${sponsorId}`, 'foto_sponsor.jpg');
    } catch (error) {
      console.error('[ImageService] Error saving sponsor image:', error);
      throw new ImageUploadError('Error al guardar la imagen de sponsor', error);
    }
  }

  /**
   * Save bar/venue images (can handle multiple images)
   */
  static async saveBarImages(files: File[], barId: string): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) =>
        this.uploadImage(file, `bares/${barId}`, `imagen_${index + 1}.jpg`)
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('[ImageService] Error saving bar images:', error);
      throw new ImageUploadError('Error al guardar las imágenes del bar', error);
    }
  }

  /**
   * Get image with fallback for different entity types
   */
  static async getEntityImageWithFallback(
    entityType: 'social' | 'team-social' | 'academia' | 'grupo' | 'sponsor' | 'bar',
    entityId: string,
    fallbackUrl?: string
  ): Promise<string> {
    const pathMap = {
      'social': `social/${entityId}/foto_salida.jpg`,
      'team-social': `team-social/${entityId}/foto_team.jpg`,
      'academia': `academias/${entityId}/foto_academia.jpg`,
      'grupo': `grupos/${entityId}/foto_grupo.jpg`,
      'sponsor': `sponsors/${entityId}/foto_sponsor.jpg`,
      'bar': `bares/${entityId}/imagen_1.jpg`
    };

    const [path, fileName] = pathMap[entityType].split('/').reduce((acc, part, index, arr) => {
      if (index === arr.length - 1) {
        acc[1] = part;
      } else {
        acc[0] += (index === 0 ? '' : '/') + part;
      }
      return acc;
    }, ['', '']);

    try {
      return await this.getImageUrl(path, fileName);
    } catch (error) {
      console.log(`[ImageService] ${entityType} image fetch failed for ID ${entityId}, using fallback`);
      return fallbackUrl || this.generateAvatarUrl(entityType);
    }
  }

  /**
   * Validate file before upload
   */
  static validateImageFile(
    file: File,
    options: {
      maxSizeInMB?: number;
      allowedTypes?: string[];
    } = {}
  ): { isValid: boolean; error?: string } {
    const {
      maxSizeInMB = 5,
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    } = options;

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
      };
    }

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeInMB}MB`
      };
    }

    return { isValid: true };
  }
}