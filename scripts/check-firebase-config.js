// Script para verificar configuración de Firebase
// Ejecutar con: node scripts/check-firebase-config.js

const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

console.log('\n🔍 Verificando configuración de Firebase...\n');

// Variables de cliente (públicas)
const clientVars = {
  'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  'NEXT_PUBLIC_FIREBASE_VAPID_KEY': process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
};

// Variables de servidor (privadas)
const serverVars = {
  'FIREBASE_SERVICE_ACCOUNT_KEY': process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
  'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
  'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
};

let hasErrors = false;

// Verificar variables de cliente
console.log('📱 Variables de Cliente (Frontend):');
Object.entries(clientVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`   ❌ ${key}: NO CONFIGURADA`);
    hasErrors = true;
  } else {
    const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`   ✅ ${key}: ${preview}`);
  }
});

console.log('\n🔒 Variables de Servidor (Backend):');

// Verificar Firebase Admin (opción 1: JSON completo)
if (serverVars.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccount = JSON.parse(serverVars.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('   ✅ FIREBASE_SERVICE_ACCOUNT_KEY: JSON válido');
    console.log(`      - project_id: ${serviceAccount.project_id}`);
    console.log(`      - client_email: ${serviceAccount.client_email}`);
    console.log(`      - private_key: ${serviceAccount.private_key ? 'Presente' : 'Ausente'}`);
  } catch (error) {
    console.log('   ❌ FIREBASE_SERVICE_ACCOUNT_KEY: JSON inválido');
    console.log(`      Error: ${error.message}`);
    hasErrors = true;
  }
} else if (
  serverVars.FIREBASE_PROJECT_ID &&
  serverVars.FIREBASE_CLIENT_EMAIL &&
  serverVars.FIREBASE_PRIVATE_KEY
) {
  // Opción 2: Credenciales individuales
  console.log('   ✅ Credenciales individuales configuradas:');
  console.log(`      - FIREBASE_PROJECT_ID: ${serverVars.FIREBASE_PROJECT_ID}`);
  console.log(`      - FIREBASE_CLIENT_EMAIL: ${serverVars.FIREBASE_CLIENT_EMAIL}`);
  console.log(`      - FIREBASE_PRIVATE_KEY: ${serverVars.FIREBASE_PRIVATE_KEY.substring(0, 30)}...`);
} else {
  console.log('   ❌ Firebase Admin NO CONFIGURADO');
  console.log('      Configura FIREBASE_SERVICE_ACCOUNT_KEY o las credenciales individuales');
  hasErrors = true;
}

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('\n❌ HAY ERRORES DE CONFIGURACIÓN\n');
  console.log('Instrucciones:');
  console.log('1. Ve a https://console.firebase.google.com/');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Ve a Project Settings → Service Accounts');
  console.log('4. Click en "Generate new private key"');
  console.log('5. Copia el contenido del JSON en FIREBASE_SERVICE_ACCOUNT_KEY en .env.local\n');
  process.exit(1);
} else {
  console.log('\n✅ CONFIGURACIÓN COMPLETA Y VÁLIDA\n');
  console.log('Puedes continuar con las pruebas:');
  console.log('1. npm run dev');
  console.log('2. Abre http://localhost:3000');
  console.log('3. Inicia sesión');
  console.log('4. Activa las notificaciones en tu perfil\n');
  process.exit(0);
}
