/**
 * Script para generar iconos PWA desde un logo de alta resolución
 *
 * Uso:
 *   1. Coloca tu logo como 'logo.png' en la raíz del proyecto (mínimo 1024x1024px)
 *   2. npm install sharp
 *   3. node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración
const INPUT_IMAGE = 'trivo.png'; // Tu logo de alta resolución
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Tamaños de iconos PWA necesarios
const ICON_SIZES = [
  72,
  96,
  128,
  144,
  152,
  192, // Requerido por PWA
  384,
  512, // Requerido por PWA
];

// Iconos Apple Touch
const APPLE_ICONS = [
  { name: 'touch-icon-iphone.png', size: 180 },
  { name: 'touch-icon-ipad.png', size: 152 },
  { name: 'touch-icon-iphone-retina.png', size: 180 },
  { name: 'touch-icon-ipad-retina.png', size: 167 },
];

// Favicons
const FAVICONS = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
];

async function generateIcons() {
  // Verificar que existe el logo
  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error('❌ Error: No se encuentra el archivo "logo.png" en la raíz del proyecto');
    console.error('📝 Por favor, coloca tu logo (mínimo 1024x1024px) como "logo.png"');
    process.exit(1);
  }

  // Crear directorio de salida si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('✓ Directorio public/icons/ creado');
  }

  console.log('🎨 Generando iconos PWA...\n');

  // Generar iconos principales
  console.log('📱 Iconos PWA:');
  for (const size of ICON_SIZES) {
    try {
      await sharp(INPUT_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparente
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, `icon-${size}x${size}.png`));

      console.log(`  ✓ icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`  ❌ Error generando icon-${size}x${size}.png:`, error.message);
    }
  }

  // Generar iconos Apple Touch
  console.log('\n🍎 Iconos Apple Touch:');
  for (const icon of APPLE_ICONS) {
    try {
      await sharp(INPUT_IMAGE)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // Fondo blanco para iOS
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, icon.name));

      console.log(`  ✓ ${icon.name}`);
    } catch (error) {
      console.error(`  ❌ Error generando ${icon.name}:`, error.message);
    }
  }

  // Generar favicons
  console.log('\n🔖 Favicons:');
  for (const favicon of FAVICONS) {
    try {
      await sharp(INPUT_IMAGE)
        .resize(favicon.size, favicon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, favicon.name));

      console.log(`  ✓ ${favicon.name}`);
    } catch (error) {
      console.error(`  ❌ Error generando ${favicon.name}:`, error.message);
    }
  }

  // Generar favicon.ico (en public/)
  console.log('\n📄 Favicon principal:');
  try {
    await sharp(INPUT_IMAGE)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon.ico'));

    console.log('  ✓ favicon.ico (en public/)');
  } catch (error) {
    console.error('  ❌ Error generando favicon.ico:', error.message);
  }

  console.log('\n✅ ¡Iconos PWA generados exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('  1. Verifica los iconos en public/icons/');
  console.log('  2. Ejecuta: npm run build');
  console.log('  3. Prueba la PWA en producción: npm run start');
  console.log('  4. Verifica con Lighthouse en Chrome DevTools');
}

// Ejecutar
generateIcons().catch((error) => {
  console.error('❌ Error generando iconos:', error);
  process.exit(1);
});
