// import mongoose from "mongoose";

// const { MONGODB_URI } = process.env;

// if (!MONGODB_URI) {
//   throw new Error("MONGODB_URI must be defined");
// }

// export const connectDB = async () => {
//   // Verificar si ya está conectado
//   if (mongoose.connections[0].readyState) {
//     console.log("MongoDB ya está conectado");
//     return;
//   }

//   try {
//     const { connection } = await mongoose.connect(MONGODB_URI);
//     if (connection.readyState === 1) {
//       console.log("MongoDB Connected");
//     }
//   } catch (error) {
//     console.error("Error al conectar a MongoDB:", error);
//     throw new Error("Error al conectar a MongoDB");
//   }
// };

// libs/mongodb.ts
// import mongoose from "mongoose";

// const { MONGODB_URI } = process.env;

// if (!MONGODB_URI) {
//   throw new Error("❌ MONGODB_URI must be defined");
// }

// Evita múltiples conexiones (especialmente en dev con hot reload)
// let isConnected: boolean = false;

// export const connectDB = async () => {
//   if (isConnected) {
//     // Ya está conectado
//     return;
//   }

//   try {
//     const db = await mongoose.connect(MONGODB_URI, {
//       bufferCommands: false, // Opcional: evita que mongoose guarde queries en cola mientras conecta
//     });

//     isConnected = db.connections[0].readyState === 1;

//     if (isConnected) {
//       console.log("✅ MongoDB conectado");
//     } else {
//       console.warn("⚠️ MongoDB en estado:", db.connections[0].readyState);
//     }
//   } catch (error) {
//     console.error("❌ Error al conectar a MongoDB:", error);
//     throw error;
//   }
// };


// libs/mongodb.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("❌ MONGODB_URI must be defined");

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10, // importante para producción
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
