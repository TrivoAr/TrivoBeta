/**
 * Script de migración para el Club del Trekking
 *
 * Este script realiza las siguientes tareas:
 * 1. Actualiza todas las salidas sociales existentes con el campo clubTrekking.incluidaEnMembresia
 * 2. Crea índices necesarios para el modelo ClubTrekkingMembership
 * 3. Actualiza usuarios existentes con el campo clubTrekking
 *
 * Uso: npm run migrate:club-trekking
 */

import mongoose from "mongoose";
import connectDB from "../src/libs/mongodb";
import SalidaSocial from "../src/models/salidaSocial";
import User from "../src/models/user";
import ClubTrekkingMembership from "../src/models/ClubTrekkingMembership";
import { clubTrekkingHelpers } from "../src/config/clubTrekking.config";

async function migrarClubTrekking() {
  try {
    console.log("🚀 Iniciando migración del Club del Trekking...\n");

    await connectDB();
    console.log("✅ Conectado a MongoDB\n");

    // 1. Actualizar salidas sociales
    console.log("📋 Actualizando salidas sociales...");

    // Obtener salidas sin usar Mongoose (para evitar valores por defecto)
    const salidasRaw = await SalidaSocial.collection.find({}).toArray();
    let salidasActualizadas = 0;
    let salidasElegibles = 0;

    for (const salidaRaw of salidasRaw) {
      // Verificar si el campo ya existe en la DB
      if (!salidaRaw.clubTrekking || salidaRaw.clubTrekking.incluidaEnMembresia === undefined) {
        // Solo salidas de Trekking son elegibles
        const esElegible = clubTrekkingHelpers.esElegibleParaMembresia(
          salidaRaw.precio || "0",
          salidaRaw.deporte // Pasar el deporte para validación
        );

        const clubTrekkingData = {
          incluidaEnMembresia: esElegible,
          requiereCheckIn: true,
          cupoMiembros: esElegible ? Math.floor(salidaRaw.cupo * 0.5) : 0,
          miembrosActuales: 0,
        };

        // Actualizar directamente en MongoDB
        await SalidaSocial.collection.updateOne(
          { _id: salidaRaw._id },
          { $set: { clubTrekking: clubTrekkingData } }
        );

        salidasActualizadas++;
        if (esElegible) {
          salidasElegibles++;
        }
      }
    }

    console.log(
      `✅ Actualizadas ${salidasActualizadas} salidas (${salidasElegibles} elegibles para membresía)\n`
    );

    // 2. Actualizar usuarios
    console.log("👤 Actualizando usuarios...");

    // Obtener usuarios sin usar Mongoose (para evitar valores por defecto)
    const usuariosRaw = await User.collection.find({}).toArray();
    let usuariosActualizados = 0;

    for (const usuarioRaw of usuariosRaw) {
      // Verificar si el campo ya existe en la DB
      if (!usuarioRaw.clubTrekking || usuarioRaw.clubTrekking.esMiembro === undefined) {
        const clubTrekkingData = {
          esMiembro: false,
          membershipId: null,
          badge: {
            activo: false,
            tipoMiembro: "bronce",
          },
        };

        // Actualizar directamente en MongoDB
        await User.collection.updateOne(
          { _id: usuarioRaw._id },
          { $set: { clubTrekking: clubTrekkingData } }
        );

        usuariosActualizados++;
      }
    }

    console.log(`✅ Actualizados ${usuariosActualizados} usuarios\n`);

    // 3. Crear índices para ClubTrekkingMembership
    console.log("🔍 Creando índices para ClubTrekkingMembership...");
    try {
      await ClubTrekkingMembership.createIndexes();
      console.log("✅ Índices creados\n");
    } catch (error: any) {
      if (error.code === 86) {
        console.log("⚠️  Índices ya existen, continuando...\n");
      } else {
        throw error;
      }
    }

    // 4. Verificar integridad
    console.log("🔎 Verificando integridad de datos...");

    const totalSalidas = await SalidaSocial.countDocuments({});
    const salidasConCampo = await SalidaSocial.countDocuments({
      "clubTrekking.incluidaEnMembresia": { $exists: true },
    });
    const salidasIncluidasMembresia = await SalidaSocial.countDocuments({
      "clubTrekking.incluidaEnMembresia": true,
    });

    const totalUsuarios = await User.countDocuments({});
    const usuariosConCampo = await User.countDocuments({
      "clubTrekking.esMiembro": { $exists: true },
    });

    console.log("\n📊 Resumen de migración:");
    console.log("─".repeat(50));
    console.log(`Salidas totales: ${totalSalidas}`);
    console.log(`Salidas con campo clubTrekking: ${salidasConCampo}`);
    console.log(`Salidas incluidas en membresía: ${salidasIncluidasMembresia}`);
    console.log(`\nUsuarios totales: ${totalUsuarios}`);
    console.log(`Usuarios con campo clubTrekking: ${usuariosConCampo}`);
    console.log("─".repeat(50));

    if (
      salidasConCampo === totalSalidas &&
      usuariosConCampo === totalUsuarios
    ) {
      console.log("\n✅ Migración completada exitosamente!");
    } else {
      console.log("\n⚠️  Advertencia: Algunos documentos no fueron actualizados");
    }

    await mongoose.disconnect();
    console.log("\n👋 Desconectado de MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante la migración:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Ejecutar migración
migrarClubTrekking();
