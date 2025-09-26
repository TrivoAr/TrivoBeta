import { connectDB } from "@/libs/mongodb";
import Sponsors from "@/models/sponsors";
import { saveSponsorImage } from "@/app/api/sponsors/saveSponsorImage";
import fs from "fs";
import path from "path";

export async function addSponsor(sponsorName: string, imagePath: string) {
  try {
    // Conectar a la DB
    await connectDB();

    // Crear el sponsor primero (sin imagen)
    const sponsor = await Sponsors.create({
      name: sponsorName,
    });

    console.log("Sponsor creado:", sponsor._id);

    // Leer la imagen del sistema de archivos
    const imageBuffer = fs.readFileSync(imagePath);
    const imageFile = new File([imageBuffer], "sponsor-image.jpg", {
      type: "image/jpeg",
    });

    // Subir imagen a Firebase
    const imageUrl = await saveSponsorImage(imageFile, sponsor._id.toString());

    // Actualizar el sponsor con la URL de la imagen
    sponsor.imagen = imageUrl;
    await sponsor.save();

    console.log("✅ Sponsor creado exitosamente:");
    console.log("ID:", sponsor._id);
    console.log("Nombre:", sponsor.name);
    console.log("Imagen:", sponsor.imagen);

    return sponsor;
  } catch (error) {
    console.error("❌ Error creando sponsor:", error);
    throw error;
  }
}
