import mongoose from "mongoose";

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI must be defined");
}

export const connectDB = async () => {
  // Verificar si ya está conectado
  if (mongoose.connections[0].readyState) {
    console.log("MongoDB ya está conectado");
    return;
  }

  try {
    const { connection } = await mongoose.connect(MONGODB_URI);
    if (connection.readyState === 1) {
      console.log("MongoDB Connected");
    }
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    throw new Error("Error al conectar a MongoDB");
  }
};
