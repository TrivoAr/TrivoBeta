import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import {
  saveAllBarImages,
  saveBarLogo,
  saveBarCarouselImages,
} from "../saveBarImages";

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // TODO: Verificar que el usuario sea admin/staff
    // if (session.user.rol !== 'admin' && session.user.rol !== 'staff') {
    //   return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    // }

    const formData = await req.formData();

    const logoFile = formData.get("logo") as File;
    const barId = formData.get("barId") as string;
    const uploadType = formData.get("type") as string; // 'all', 'logo', 'carousel'

    if (!logoFile && uploadType !== "carousel") {
      return NextResponse.json({ error: "Logo es requerido" }, { status: 400 });
    }

    // Obtener archivos del carrusel
    const carouselFiles: File[] = [];
    let carouselIndex = 0;

    while (true) {
      const carouselFile = formData.get(`carousel_${carouselIndex}`) as File;
      if (!carouselFile) break;
      carouselFiles.push(carouselFile);
      carouselIndex++;
    }

    let result;

    switch (uploadType) {
      case "logo":
        if (!logoFile) {
          return NextResponse.json(
            { error: "Logo es requerido para upload tipo 'logo'" },
            { status: 400 }
          );
        }
        const logoUrl = await saveBarLogo(logoFile, barId);
        result = { logo: logoUrl };
        break;

      case "carousel":
        if (carouselFiles.length === 0) {
          return NextResponse.json(
            { error: "Al menos una imagen del carrusel es requerida" },
            { status: 400 }
          );
        }
        const carouselUrls = await saveBarCarouselImages(carouselFiles, barId);
        result = { imagenesCarrusel: carouselUrls };
        break;

      case "all":
      default:
        if (!logoFile || carouselFiles.length === 0) {
          return NextResponse.json(
            { error: "Logo y al menos una imagen del carrusel son requeridos" },
            { status: 400 }
          );
        }
        result = await saveAllBarImages(logoFile, carouselFiles, barId);
        break;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[UPLOAD_BAR_IMAGES_ERROR]", error);
    return NextResponse.json(
      { error: "Error al subir imágenes" },
      { status: 500 }
    );
  }
}
