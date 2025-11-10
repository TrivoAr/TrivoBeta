/**
 * Script para verificar la configuración de MercadoPago
 *
 * Ejecutar con: node scripts/verify-mp-config.js
 */

const fs = require('fs');
const path = require('path');

// Leer .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parsear variables
const env = {};
envContent.split('\n').forEach(line => {
  // Ignorar líneas vacías y comentarios
  line = line.trim();
  if (!line || line.startsWith('#')) return;

  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remover comillas si existen
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

console.log('\n🔍 Verificando configuración de MercadoPago...\n');

const checks = [];

// 1. Verificar Access Token
const accessToken = env.MP_ACCESS_TOKEN || env.MERCADOPAGO_ACCESS_TOKEN;
if (accessToken) {
  checks.push({
    name: 'Access Token',
    status: 'ok',
    value: accessToken.substring(0, 20) + '...',
    message: 'Configurado correctamente'
  });
} else {
  checks.push({
    name: 'Access Token',
    status: 'error',
    message: 'Falta MP_ACCESS_TOKEN o MERCADOPAGO_ACCESS_TOKEN en .env.local'
  });
}

// 2. Verificar Public Key
const publicKey = env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
if (publicKey) {
  checks.push({
    name: 'Public Key',
    status: 'ok',
    value: publicKey.substring(0, 20) + '...',
    message: 'Configurado correctamente'
  });
} else {
  checks.push({
    name: 'Public Key',
    status: 'error',
    message: 'Falta NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY en .env.local'
  });
}

// 3. Verificar Base URL
const baseUrl = env.NEXT_PUBLIC_BASE_URL || env.NEXTAUTH_URL;
if (baseUrl) {
  checks.push({
    name: 'Base URL',
    status: 'ok',
    value: baseUrl,
    message: 'Configurado correctamente'
  });
} else {
  checks.push({
    name: 'Base URL',
    status: 'warning',
    message: 'No configurado (se usará fallback automático). Recomendado: agregar NEXT_PUBLIC_BASE_URL'
  });
}

// 4. Verificar Webhook Secret
const webhookSecret = env.MERCADOPAGO_WEBHOOK_SECRET;
if (webhookSecret) {
  checks.push({
    name: 'Webhook Secret',
    status: 'ok',
    value: '***' + webhookSecret.substring(webhookSecret.length - 4),
    message: 'Configurado correctamente'
  });
} else {
  checks.push({
    name: 'Webhook Secret',
    status: 'warning',
    message: 'No configurado. Recomendado para producción: agregar MERCADOPAGO_WEBHOOK_SECRET'
  });
}

// 5. Verificar CVU para transferencias automáticas
const cvu = env.NEXT_PUBLIC_MP_CVU;
const alias = env.NEXT_PUBLIC_MP_ALIAS;
if (cvu && alias) {
  checks.push({
    name: 'CVU/Alias MP',
    status: 'ok',
    value: `${cvu.substring(0, 10)}... / ${alias}`,
    message: 'Configurado (sistema de transferencias automáticas DESACTIVADO temporalmente)'
  });
} else {
  checks.push({
    name: 'CVU/Alias MP',
    status: 'warning',
    message: 'No configurado. Necesario solo si se reactiva el sistema de transferencias automáticas'
  });
}

// Mostrar resultados
console.log('📋 Resultados:\n');

checks.forEach((check) => {
  const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
  console.log(`${icon} ${check.name}`);
  if (check.value) {
    console.log(`   Valor: ${check.value}`);
  }
  if (check.message) {
    console.log(`   ${check.message}`);
  }
  console.log();
});

// Resumen
const errors = checks.filter(c => c.status === 'error').length;
const warnings = checks.filter(c => c.status === 'warning').length;
const ok = checks.filter(c => c.status === 'ok').length;

console.log('─'.repeat(60));
console.log(`\n📊 Resumen: ${ok} OK | ${warnings} Advertencias | ${errors} Errores\n`);

if (errors > 0) {
  console.log('❌ Hay errores críticos que deben corregirse para que MercadoPago funcione.');
  console.log('   Ver MERCADOPAGO_SETUP.md para más información.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  La configuración básica está completa, pero hay advertencias.');
  console.log('   El sistema funcionará, pero se recomienda revisar las advertencias.\n');
  process.exit(0);
} else {
  console.log('✅ ¡Configuración de MercadoPago completa y correcta!\n');
  process.exit(0);
}
