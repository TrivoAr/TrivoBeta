/**
 * Script de diagnóstico para MercadoPago en producción
 *
 * CÓMO USAR:
 * 1. Abre la consola del navegador en https://trivo.com.ar
 * 2. Copia y pega este script completo
 * 3. Presiona Enter
 * 4. Revisa los resultados
 */

(async function debugMercadoPago() {
  console.log('🔍 Iniciando diagnóstico de MercadoPago...\n');

  const results = {
    checks: [],
    errors: [],
    warnings: []
  };

  // 1. Verificar que window.MercadoPago esté disponible
  console.log('1️⃣ Verificando SDK de MercadoPago en el cliente...');
  if (typeof window.MercadoPago !== 'undefined') {
    results.checks.push('✅ SDK de MercadoPago cargado correctamente');
    console.log('   ✅ window.MercadoPago está disponible');
  } else {
    results.errors.push('❌ SDK de MercadoPago no está cargado');
    console.error('   ❌ window.MercadoPago no está disponible');
    console.log('   💡 Verifica que la Public Key esté configurada');
  }

  // 2. Verificar Public Key en el HTML
  console.log('\n2️⃣ Verificando Public Key en variables de entorno...');
  const scripts = Array.from(document.querySelectorAll('script'));
  const publicKeyPattern = /APP_USR-[a-f0-9-]+/i;
  let foundPublicKey = false;

  scripts.forEach(script => {
    const match = script.textContent?.match(publicKeyPattern);
    if (match) {
      foundPublicKey = true;
      const key = match[0];
      results.checks.push(`✅ Public Key encontrada: ${key.substring(0, 20)}...`);
      console.log(`   ✅ Public Key: ${key.substring(0, 20)}...`);
    }
  });

  if (!foundPublicKey) {
    results.errors.push('❌ No se encontró NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY');
    console.error('   ❌ No se encontró la Public Key en el código');
    console.log('   💡 Verifica que NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY esté en Vercel');
  }

  // 3. Test endpoint de bricks/preferences
  console.log('\n3️⃣ Probando endpoint /api/mercadopago/bricks/preferences...');
  try {
    const response = await fetch('/api/mercadopago/bricks/preferences', {
      method: 'GET'
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.status === 200) {
      const data = await response.json();
      results.checks.push('✅ Endpoint bricks/preferences responde correctamente');
      console.log('   ✅ Endpoint responde OK');
      console.log('   Datos:', data);
    } else if (response.status === 401) {
      results.errors.push('❌ Endpoint bricks/preferences devuelve 401 Unauthorized');
      console.error('   ❌ 401 Unauthorized - La Public Key no está configurada en el servidor');
      console.log('   💡 Agrega NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY en Vercel Environment Variables');
    } else if (response.status === 404) {
      results.errors.push('❌ Endpoint bricks/preferences no existe (404)');
      console.error('   ❌ 404 Not Found - El endpoint no está deployado');
      console.log('   💡 Verifica que el último deploy incluya el archivo route.ts');
    } else {
      results.warnings.push(`⚠️ Endpoint responde con status ${response.status}`);
      console.warn(`   ⚠️ Status inesperado: ${response.status}`);
    }
  } catch (error) {
    results.errors.push(`❌ Error al consultar endpoint: ${error.message}`);
    console.error('   ❌ Error:', error);
  }

  // 4. Test endpoint principal de preferences
  console.log('\n4️⃣ Probando endpoint /api/mercadopago/preferences...');
  try {
    const response = await fetch('/api/mercadopago/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salidaId: 'test',
        userId: 'test'
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      results.warnings.push('⚠️ Endpoint preferences requiere autenticación (esperado)');
      console.log('   ⚠️ 401 - Esperado, necesitas estar autenticado');
    } else if (response.status === 500) {
      const data = await response.json();
      if (data.error?.includes('Configuración de MercadoPago incompleta')) {
        results.errors.push('❌ Access Token no configurado en el servidor');
        console.error('   ❌ MERCADOPAGO_ACCESS_TOKEN no está en Vercel');
        console.log('   💡 Agrega MERCADOPAGO_ACCESS_TOKEN en Vercel Environment Variables');
      } else {
        results.errors.push(`❌ Error 500: ${data.error}`);
        console.error('   ❌ Error:', data.error);
      }
    } else {
      results.checks.push(`✅ Endpoint preferences responde (status ${response.status})`);
      console.log(`   ✅ Endpoint responde`);
    }
  } catch (error) {
    results.errors.push(`❌ Error al consultar endpoint: ${error.message}`);
    console.error('   ❌ Error:', error);
  }

  // 5. Verificar si hay bloqueadores
  console.log('\n5️⃣ Verificando bloqueadores de contenido...');
  const performanceEntries = performance.getEntriesByType('resource');
  const blockedRequests = performanceEntries.filter(entry =>
    entry.name.includes('mercado') && entry.transferSize === 0
  );

  if (blockedRequests.length > 0) {
    results.warnings.push('⚠️ Posibles requests bloqueados detectados');
    console.warn('   ⚠️ Hay requests de MercadoPago que pueden estar bloqueados');
    console.log('   💡 Prueba en modo incógnito o desactiva bloqueadores de ads');
  } else {
    results.checks.push('✅ No se detectaron bloqueadores');
    console.log('   ✅ No se detectaron bloqueadores');
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO\n');

  console.log('✅ Checks Exitosos:');
  results.checks.forEach(check => console.log('   ' + check));

  if (results.warnings.length > 0) {
    console.log('\n⚠️ Advertencias:');
    results.warnings.forEach(warn => console.log('   ' + warn));
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Errores Críticos:');
    results.errors.forEach(error => console.log('   ' + error));
  }

  console.log('\n' + '='.repeat(60));

  if (results.errors.length === 0) {
    console.log('✅ ¡Todo parece estar configurado correctamente!');
    console.log('Si aún tienes problemas, revisa la consola durante el flujo de pago.');
  } else {
    console.log('❌ Se encontraron problemas de configuración.');
    console.log('Revisa las variables de entorno en Vercel Settings → Environment Variables');
  }

  console.log('\n📝 Variables requeridas en Vercel:');
  console.log('   1. MERCADOPAGO_ACCESS_TOKEN (o MP_ACCESS_TOKEN)');
  console.log('   2. NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY');
  console.log('\nDespués de agregar/modificar variables, hacer redeploy.');

  return results;
})();
