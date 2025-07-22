// /utils/mapGrupoConImagen.ts
import { getGroupImage } from "@/app/api/grupos/getGroupImage";

export const mapGrupoConImagen = async (grupo: any) => {
  try {
    const imagen = await getGroupImage("profile-image.jpg", grupo._id.toString());
    return { ...grupo.toObject(), imagen };
  } catch {
    return {
      ...grupo.toObject(),
      imagen: "https://img.freepik.com/vector-premium/icono-grupo-personas-estilo-plano_78370-1208.jpg"
    };
  }
};
