import { connectDB } from "../src/libs/mongodb";
import Bares from "../src/models/bares";

// Función para agregar un bar individual
async function addSingleBar(barData: {
  name: string;
  locationCoords: { lat: number; lng: number };
  logo: string;
  imagenesCarrusel: string[];
  direccion?: string;
}) {
  try {
    console.log("🔗 Conectando a MongoDB...");
    await connectDB();
    console.log("✅ Conectado a MongoDB");

    // Verificar si ya existe un bar con el mismo nombre
    const existingBar = await Bares.findOne({ name: barData.name });
    if (existingBar) {
      console.log(`⚠️ Ya existe un bar con el nombre "${barData.name}"`);
      console.log("🔄 Actualizando bar existente...");

      const updatedBar = await Bares.findByIdAndUpdate(
        existingBar._id,
        barData,
        { new: true, runValidators: true }
      );

      console.log(`✅ Bar "${updatedBar.name}" actualizado exitosamente`);
      console.log(`🆔 ID: ${updatedBar._id}`);
      return updatedBar;
    }

    console.log(`📝 Agregando nuevo bar: ${barData.name}...`);
    const newBar = new Bares(barData);
    await newBar.save();

    console.log(`✅ Bar "${newBar.name}" agregado exitosamente`);
    console.log(`📍 Dirección: ${newBar.direccion}`);
    console.log(`🖼️ ${newBar.imagenesCarrusel.length} imágenes en carrusel`);
    console.log(`🆔 ID: ${newBar._id}`);

    return newBar;

  } catch (error) {
    console.error("❌ Error al agregar bar:", error);
    throw error;
  }
}

// Ejemplo de uso desde línea de comandos
if (require.main === module) {
  // Puedes modificar estos datos para agregar un bar específico
  const exampleBar = {
    name: "Mi Nuevo Bar",
    locationCoords: {
      lat: -34.6037,
      lng: -58.3816
    },
    logo: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=800",
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800"
    ],
    direccion: "Av. Ejemplo 1234, Buenos Aires"
  };

  addSingleBar(exampleBar)
    .then(() => {
      console.log("🎉 Script completado exitosamente!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

export { addSingleBar };