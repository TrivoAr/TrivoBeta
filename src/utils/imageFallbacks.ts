/**
 * Obtiene la URL de la imagen fallback según el deporte
 * @param deporte - El tipo de deporte (Running, Ciclismo, Trekking, etc.)
 * @returns URL de la imagen fallback
 */
export function getDeporteFallbackImage(deporte: string): string {
  const deporteLower = deporte?.toLowerCase() || '';

  if (deporteLower.includes('ciclismo') || deporteLower.includes('bici')) {
    return '/assets/ciclismo.jpeg';
  }

  if (deporteLower.includes('trekking') || deporteLower.includes('senderismo') || deporteLower.includes('montaña')) {
    return '/assets/trekking.jpeg';
  }

  // Por defecto, usar trekking como imagen genérica para otros deportes
  return '/assets/trekking.jpeg';
}

/**
 * Obtiene las imágenes para mostrar, usando fallback si no hay imágenes
 * @param imagenes - Array de URLs de imágenes
 * @param imagen - URL de imagen individual (compatibilidad)
 * @param deporte - Tipo de deporte para fallback
 * @returns Array de URLs de imágenes para mostrar
 */
export function getImagenesToShow(
  imagenes: string[] | undefined,
  imagen: string | undefined,
  deporte: string
): string[] {
  // Si hay array de imágenes con contenido, usarlo
  if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
    return imagenes;
  }

  // Si hay imagen individual, usarla
  if (imagen) {
    return [imagen];
  }

  // Si no hay ninguna imagen, usar fallback según deporte
  return [getDeporteFallbackImage(deporte)];
}
