import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";
import { v4 as uuidv4 } from "uuid";

/**
 * Sube el logo de un bar a Firebase Storage
 * @param logoFile - Archivo del logo
 * @param barId - ID del bar (opcional, se genera si no se proporciona)
 * @returns URL de descarga del logo
 */
export async function saveBarLogo(logoFile: File, barId?: string): Promise<string> {
  try {
    const id = barId || uuidv4();
    const fileExtension = logoFile.name.split('.').pop() || 'jpg';
    const fileName = `logo.${fileExtension}`;

    // Referencia en Firebase Storage: bares/{barId}/logo.jpg
    const logoRef = ref(storage, `bares/${id}/${fileName}`);

    console.log(`[FIREBASE] Subiendo logo para bar ${id}...`);
    const snapshot = await uploadBytes(logoRef, logoFile);

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`[FIREBASE] Logo subido exitosamente: ${downloadURL}`);

    return downloadURL;
  } catch (error) {
    console.error("[FIREBASE] Error al subir logo:", error);
    throw new Error("Error al subir logo del bar");
  }
}

/**
 * Sube múltiples imágenes del carrusel a Firebase Storage
 * @param imageFiles - Array de archivos de imágenes
 * @param barId - ID del bar (opcional, se genera si no se proporciona)
 * @returns Array de URLs de descarga
 */
export async function saveBarCarouselImages(imageFiles: File[], barId?: string): Promise<string[]> {
  try {
    const id = barId || uuidv4();
    const uploadPromises: Promise<string>[] = [];

    console.log(`[FIREBASE] Subiendo ${imageFiles.length} imágenes del carrusel para bar ${id}...`);

    imageFiles.forEach((file, index) => {
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `carousel_${index + 1}.${fileExtension}`;

      // Referencia en Firebase Storage: bares/{barId}/carousel/carousel_1.jpg
      const imageRef = ref(storage, `bares/${id}/carousel/${fileName}`);

      const uploadPromise = uploadBytes(imageRef, file)
        .then(snapshot => getDownloadURL(snapshot.ref))
        .then(url => {
          console.log(`[FIREBASE] Imagen ${index + 1} subida: ${url}`);
          return url;
        });

      uploadPromises.push(uploadPromise);
    });

    const imageUrls = await Promise.all(uploadPromises);
    console.log(`[FIREBASE] ${imageUrls.length} imágenes del carrusel subidas exitosamente`);

    return imageUrls;
  } catch (error) {
    console.error("[FIREBASE] Error al subir imágenes del carrusel:", error);
    throw new Error("Error al subir imágenes del carrusel");
  }
}

/**
 * Sube todas las imágenes de un bar (logo + carrusel) a Firebase Storage
 * @param logoFile - Archivo del logo
 * @param carouselFiles - Array de archivos del carrusel
 * @param barId - ID del bar (opcional, se genera si no se proporciona)
 * @returns Objeto con URLs del logo y carrusel
 */
export async function saveAllBarImages(
  logoFile: File,
  carouselFiles: File[],
  barId?: string
): Promise<{ logo: string; imagenesCarrusel: string[]; barId: string }> {
  try {
    const id = barId || uuidv4();

    console.log(`[FIREBASE] Iniciando subida de todas las imágenes para bar ${id}...`);

    // Subir logo y carrusel en paralelo
    const [logoUrl, carouselUrls] = await Promise.all([
      saveBarLogo(logoFile, id),
      saveBarCarouselImages(carouselFiles, id)
    ]);

    console.log(`[FIREBASE] Todas las imágenes subidas exitosamente para bar ${id}`);

    return {
      logo: logoUrl,
      imagenesCarrusel: carouselUrls,
      barId: id
    };
  } catch (error) {
    console.error("[FIREBASE] Error al subir todas las imágenes:", error);
    throw new Error("Error al subir imágenes del bar");
  }
}

/**
 * Elimina todas las imágenes de un bar de Firebase Storage
 * @param barId - ID del bar
 */
export async function deleteBarImages(barId: string): Promise<void> {
  try {
    const { deleteObject, listAll } = await import("firebase/storage");

    // Listar y eliminar todas las imágenes del bar
    const barFolderRef = ref(storage, `bares/${barId}`);
    const listResult = await listAll(barFolderRef);

    // Eliminar archivos en la carpeta raíz (logo)
    const deletePromises = listResult.items.map(item => deleteObject(item));

    // Eliminar archivos en subcarpetas (carousel)
    for (const folder of listResult.prefixes) {
      const folderList = await listAll(folder);
      deletePromises.push(...folderList.items.map(item => deleteObject(item)));
    }

    await Promise.all(deletePromises);
    console.log(`[FIREBASE] Todas las imágenes del bar ${barId} eliminadas`);
  } catch (error) {
    console.error("[FIREBASE] Error al eliminar imágenes:", error);
    throw new Error("Error al eliminar imágenes del bar");
  }
}

/**
 * Actualiza una imagen específica del carrusel
 * @param newImageFile - Nuevo archivo de imagen
 * @param barId - ID del bar
 * @param imageIndex - Índice de la imagen a reemplazar (0-based)
 * @returns Nueva URL de la imagen
 */
export async function updateCarouselImage(
  newImageFile: File,
  barId: string,
  imageIndex: number
): Promise<string> {
  try {
    const fileExtension = newImageFile.name.split('.').pop() || 'jpg';
    const fileName = `carousel_${imageIndex + 1}.${fileExtension}`;

    const imageRef = ref(storage, `bares/${barId}/carousel/${fileName}`);

    console.log(`[FIREBASE] Actualizando imagen ${imageIndex + 1} del carrusel para bar ${barId}...`);

    const snapshot = await uploadBytes(imageRef, newImageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(`[FIREBASE] Imagen ${imageIndex + 1} actualizada: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error("[FIREBASE] Error al actualizar imagen del carrusel:", error);
    throw new Error("Error al actualizar imagen del carrusel");
  }
}