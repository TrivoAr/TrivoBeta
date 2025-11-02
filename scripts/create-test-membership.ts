/**
 * Script para crear una membresía de prueba del Club del Trekking
 * Sin necesidad de pasar por MercadoPago
 */

import path from "path";
import fs from "fs";

// Cargar variables de entorno manualmente
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

import connectDB from "../src/libs/mongodb";
import ClubTrekkingMembership from "../src/models/ClubTrekkingMembership";
import User from "../src/models/user";

async function createTestMembership() {
  try {
    await connectDB();

    // Usar tu email
    const email = "matiasprofesor@gmail.com";

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ Usuario no encontrado con email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.nombre} (${user.email})`);

    // Verificar si ya tiene membresía activa
    const existing = await ClubTrekkingMembership.findOne({
      userId: user._id,
      estado: { $in: ["activa", "pausada"] },
    });

    if (existing) {
      console.log("⚠️  Ya existe una membresía activa/pausada para este usuario");
      console.log("📋 Detalles:");
      console.log("   - Estado:", existing.estado);
      console.log("   - Fecha inicio:", existing.fechaInicio);
      console.log("   - Fecha fin:", existing.fechaFin);
      console.log("   - Salidas realizadas:", existing.historialSalidas.length);

      const penalizacion = existing.tienePenalizacionActiva();
      if (penalizacion) {
        console.log("   - ⚠️ Tiene penalización activa:", existing.penalizacion.diasRestantes, "días");
      }

      process.exit(0);
    }

    // Crear nueva membresía de prueba
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + 1); // 1 mes adelante

    const membership = new ClubTrekkingMembership({
      userId: user._id,
      estado: "activa",
      fechaInicio,
      fechaFin,
      precioMensual: 25000,
      metodoPago: "test", // Método de prueba
      mercadoPagoSubscriptionId: `test-${Date.now()}`, // ID de prueba
      historialSalidas: [],
      penalizacion: {
        activa: false,
        inasistenciasConsecutivas: 0,
        historialPenalizaciones: [],
      },
    });

    await membership.save();

    console.log("✅ Membresía de prueba creada exitosamente!");
    console.log("📋 Detalles:");
    console.log("   - Usuario:", user.nombre);
    console.log("   - Email:", user.email);
    console.log("   - Estado:", membership.estado);
    console.log("   - Fecha inicio:", membership.fechaInicio);
    console.log("   - Fecha fin:", membership.fechaFin);
    console.log("   - Precio mensual: $", membership.precioMensual);
    console.log("");
    console.log("🎯 Ahora puedes:");
    console.log("   1. Crear salidas de Trekking ≤ $10,000");
    console.log("   2. Reservar esas salidas (gratis con membresía)");
    console.log("   3. Después de la fecha de la salida, verás el modal de confirmación");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestMembership();
