import { connectDB } from "../src/libs/mongodb";
import Bares from "../src/models/bares";

// Datos de ejemplo para poblar la base de datos
const baresData = [
  {
    name: "Antares Palermo",
    locationCoords: {
      lat: -34.5885,
      lng: -58.4203
    },
    logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
      "https://images.unsplash.com/photo-1574749389079-35c89120caf9?w=800"
    ],
    direccion: "Av. Juan B. Justo 1600, Palermo"
  },
  {
    name: "Beerhop Bar",
    locationCoords: {
      lat: -34.6037,
      lng: -58.3816
    },
    logo: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=800",
      "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800",
      "https://images.unsplash.com/photo-1572367149-2c3d373beb0e?w=800"
    ],
    direccion: "Av. Corrientes 1234, Centro"
  },
  {
    name: "Krakow Cervecería",
    locationCoords: {
      lat: -34.5928,
      lng: -58.3825
    },
    logo: "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1555992336-03a23c8e0290?w=800",
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800",
      "https://images.unsplash.com/photo-1573958175519-d3c7e1a58e2c?w=800",
      "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800"
    ],
    direccion: "Av. Córdoba 3420, Recoleta"
  },
  {
    name: "Strange Brewing",
    locationCoords: {
      lat: -34.5721,
      lng: -58.4363
    },
    logo: "https://images.unsplash.com/photo-1523567830207-96731740fa71?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800",
      "https://images.unsplash.com/photo-1572297872201-2b0b5d83c1b3?w=800"
    ],
    direccion: "Thames 1556, Villa Crespo"
  },
  {
    name: "Bar de Quinta",
    locationCoords: {
      lat: -34.6118,
      lng: -58.3960
    },
    logo: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=800",
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
      "https://images.unsplash.com/photo-1503481766315-7a586b937ec5?w=800",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
      "https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=800"
    ],
    direccion: "San Telmo 890, San Telmo"
  },
  {
    name: "The Temple Bar",
    locationCoords: {
      lat: -34.5851,
      lng: -58.4094
    },
    logo: "https://images.unsplash.com/photo-1485871981521-5b1fd3805b6d?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=800",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800",
      "https://images.unsplash.com/photo-1596519455294-74b6e754b67c?w=800"
    ],
    direccion: "Costa Rica 4600, Palermo Hollywood"
  },
  {
    name: "Gibraltar Pub",
    locationCoords: {
      lat: -34.6083,
      lng: -58.3712
    },
    logo: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1572297872194-e7e47a4edb03?w=800",
      "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800",
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800",
      "https://images.unsplash.com/photo-1541692641319-981cc79ee10e?w=800"
    ],
    direccion: "Perú 895, San Telmo"
  },
  {
    name: "Mundo Bizarro",
    locationCoords: {
      lat: -34.6127,
      lng: -58.3734
    },
    logo: "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400",
    imagenesCarrusel: [
      "https://images.unsplash.com/photo-1571091655798-ab7ab99fae76?w=800",
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800"
    ],
    direccion: "Serrano 1222, San Telmo"
  }
];

async function addBares() {
  try {
    console.log("🔗 Conectando a MongoDB...");
    await connectDB();
    console.log("✅ Conectado a MongoDB");

    console.log("🗑️ Limpiando base de datos existente...");
    await Bares.deleteMany({});
    console.log("✅ Base de datos limpiada");

    console.log("📝 Agregando bares...");
    const result = await Bares.insertMany(baresData);
    console.log(`✅ ${result.length} bares agregados exitosamente`);

    console.log("\n📋 Bares agregados:");
    result.forEach((bar, index) => {
      console.log(`${index + 1}. ${bar.name}`);
      console.log(`   📍 ${bar.direccion}`);
      console.log(`   🖼️ ${bar.imagenesCarrusel.length} imágenes en carrusel`);
      console.log(`   🆔 ID: ${bar._id}`);
      console.log("");
    });

    console.log("🎉 Script completado exitosamente!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error al agregar bares:", error);
    process.exit(1);
  }
}

// Ejecutar script solo si es llamado directamente
if (require.main === module) {
  addBares();
}

export { addBares };