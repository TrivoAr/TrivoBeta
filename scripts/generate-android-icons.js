/**
 * Script para generar iconos de Android desde el icono base de 512x512
 * Usa sharp para redimensionar imágenes
 *
 * Instalación: npm install sharp
 * Uso: node scripts/generate-android-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración
const baseIcon = path.join(__dirname, '../public/icons/icon-512x512.png');
const outputDir = path.join(__dirname, '../public/icons');

// Tamaños necesarios para Android
const sizes = [
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 144, name: 'icon-144x144.png' }
];

// Verificar que existe el icono base
if (!fs.existsSync(baseIcon)) {
  console.error('❌ Error: No se encuentra el icono base en:', baseIcon);
  process.exit(1);
}

console.log('🎨 Generando iconos de Android...\n');

// Generar cada tamaño
async function generateIcons() {
  try {
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);

      // Verificar si ya existe
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  ${name} ya existe, omitiendo...`);
        continue;
      }

      // Generar icono
      await sharp(baseIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generado: ${name} (${size}x${size})`);
    }

    console.log('\n✨ ¡Iconos generados exitosamente!');
    console.log('\nPróximos pasos:');
    console.log('1. Verifica que los iconos se vean bien');
    console.log('2. Despliega los cambios a producción');
    console.log('3. Vuelve a analizar tu PWA en PWABuilder');

  } catch (error) {
    console.error('❌ Error al generar iconos:', error);
    process.exit(1);
  }
}

generateIcons();
