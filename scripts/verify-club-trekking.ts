/**
 * Script para verificar la configuración del Club del Trekking
 * Uso: npm run verify:club-trekking
 */

import mongoose from "mongoose";
import connectDB from "../src/libs/mongodb";
import SalidaSocial from "../src/models/salidaSocial";
import User from "../src/models/user";
import ClubTrekkingMembership from "../src/models/ClubTrekkingMembership";

async function verificarClubTrekking() {
  try {
    console.log("🔍 Verificando configuración del Club del Trekking...\n");

    await connectDB();

    // 1. Verificar colecciones
    console.log("📊 Estado de las colecciones:");
    console.log("─".repeat(50));

    const totalSalidas = await SalidaSocial.countDocuments({});
    const salidasConCampo = await SalidaSocial.countDocuments({
      "clubTrekking.incluidaEnMembresia": { $exists: true },
    });
    const salidasIncluidas = await SalidaSocial.countDocuments({
      "clubTrekking.incluidaEnMembresia": true,
    });

    console.log(`Salidas Sociales:`);
    console.log(`  Total: ${totalSalidas}`);
    console.log(`  Con campo clubTrekking: ${salidasConCampo}`);
    console.log(`  Incluidas en membresía: ${salidasIncluidas}\n`);

    const totalUsuarios = await User.countDocuments({});
    const usuariosConCampo = await User.countDocuments({
      "clubTrekking.esMiembro": { $exists: true },
    });
    const usuariosMiembros = await User.countDocuments({
      "clubTrekking.esMiembro": true,
    });

    console.log(`Usuarios:`);
    console.log(`  Total: ${totalUsuarios}`);
    console.log(`  Con campo clubTrekking: ${usuariosConCampo}`);
    console.log(`  Miembros activos: ${usuariosMiembros}\n`);

    const totalMemberships = await ClubTrekkingMembership.countDocuments({});
    const membershipsActivas = await ClubTrekkingMembership.countDocuments({
      estado: "activa",
    });

    console.log(`Membresías:`);
    console.log(`  Total: ${totalMemberships}`);
    console.log(`  Activas: ${membershipsActivas}\n`);

    // 2. Verificar índices
    console.log("🔑 Índices de ClubTrekkingMembership:");
    console.log("─".repeat(50));
    const indexes = await ClubTrekkingMembership.collection.getIndexes();
    Object.entries(indexes).forEach(([name, index]) => {
      console.log(`  ${name}:`, JSON.stringify(index));
    });
    console.log();

    // 3. Mostrar ejemplo de salida incluida (si existe)
    const salidaEjemplo = await SalidaSocial.findOne({
      "clubTrekking.incluidaEnMembresia": true,
    });

    if (salidaEjemplo) {
      console.log("📋 Ejemplo de salida incluida en membresía:");
      console.log("─".repeat(50));
      console.log(`  Nombre: ${salidaEjemplo.nombre}`);
      console.log(`  Precio: $${salidaEjemplo.precio}`);
      console.log(`  Incluida: ${salidaEjemplo.clubTrekking.incluidaEnMembresia}`);
      console.log(
        `  Cupo miembros: ${salidaEjemplo.clubTrekking.cupoMiembros}`
      );
      console.log();
    }

    // 4. Mostrar ejemplo de usuario con membresía (si existe)
    const usuarioMiembro = await User.findOne({
      "clubTrekking.esMiembro": true,
    });

    if (usuarioMiembro) {
      console.log("👤 Ejemplo de usuario miembro:");
      console.log("─".repeat(50));
      console.log(`  Nombre: ${usuarioMiembro.firstname} ${usuarioMiembro.lastname}`);
      console.log(`  Email: ${usuarioMiembro.email}`);
      console.log(`  Es miembro: ${usuarioMiembro.clubTrekking.esMiembro}`);
      console.log(`  Badge activo: ${usuarioMiembro.clubTrekking.badge.activo}`);
      console.log(`  Tipo: ${usuarioMiembro.clubTrekking.badge.tipoMiembro}`);
      console.log();
    }

    // 5. Resumen
    console.log("✅ Verificación completada");
    console.log("─".repeat(50));

    if (totalSalidas > 0 && salidasConCampo === 0) {
      console.log("⚠️  ADVERTENCIA: Las salidas no tienen el campo clubTrekking");
      console.log("   Ejecuta: npm run migrate:club-trekking");
    } else if (totalSalidas > 0) {
      console.log("✓ Salidas configuradas correctamente");
    }

    if (totalUsuarios > 0 && usuariosConCampo === 0) {
      console.log("⚠️  ADVERTENCIA: Los usuarios no tienen el campo clubTrekking");
      console.log("   Ejecuta: npm run migrate:club-trekking");
    } else if (totalUsuarios > 0) {
      console.log("✓ Usuarios configurados correctamente");
    }

    if (totalMemberships === 0) {
      console.log("ℹ️  No hay membresías creadas aún");
      console.log("   Esto es normal en una instalación nueva");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante la verificación:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verificarClubTrekking();
