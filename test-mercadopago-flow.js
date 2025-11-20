/**
 * Test completo del flujo de pago de MercadoPago
 *
 * Ejecutar en la consola del navegador en https://trivo.com.ar
 * cuando estés en la página de un evento con pago
 */

(async function testMercadoPagoFlow() {
  console.log('🧪 Iniciando test del flujo de pago de MercadoPago...\n');

  // 1. Verificar SDK cargado
  console.log('1️⃣ Verificando SDK de MercadoPago...');
  if (typeof window.MercadoPago === 'undefined') {
    console.error('❌ window.MercadoPago no está definido');
    console.error('   El SDK no se cargó correctamente');
    return;
  }
  console.log('✅ SDK de MercadoPago cargado correctamente');

  // 2. Test endpoint bricks/preferences
  console.log('\n2️⃣ Testeando endpoint /api/mercadopago/bricks/preferences...');
  try {
    const bricksResponse = await fetch('/api/mercadopago/bricks/preferences');
    console.log(`   Status: ${bricksResponse.status}`);

    if (bricksResponse.ok) {
      const bricksData = await bricksResponse.json();
      console.log('✅ Endpoint bricks responde OK');
      console.log('   Public Key:', bricksData.public_key?.substring(0, 20) + '...');
      console.log('   Locale:', bricksData.locale);
      console.log('   Site ID:', bricksData.site_id);
    } else {
      const errorData = await bricksResponse.json();
      console.error('❌ Endpoint bricks falló:', errorData);
    }
  } catch (error) {
    console.error('❌ Error en bricks:', error.message);
  }

  // 3. Test crear preferencia (necesita autenticación)
  console.log('\n3️⃣ Testeando creación de preferencia...');
  console.log('   ⚠️ Este test requiere que estés autenticado y en una página de evento');

  // Intentar obtener el salidaId de la URL actual
  const urlMatch = window.location.pathname.match(/\/social\/([^\/]+)/);
  if (!urlMatch) {
    console.log('   ℹ️ No estás en una página de evento social');
    console.log('   Ve a un evento para probar la creación de preferencia');
    return;
  }

  const salidaId = urlMatch[1];
  console.log(`   Evento detectado: ${salidaId}`);

  try {
    const prefResponse = await fetch('/api/mercadopago/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        salidaId: salidaId,
        userId: 'test', // Esto fallará si no estás autenticado, pero nos dirá más info
      }),
    });

    console.log(`   Status: ${prefResponse.status}`);

    if (prefResponse.ok) {
      const prefData = await prefResponse.json();
      console.log('✅ Preferencia creada exitosamente!');
      console.log('   Preference ID:', prefData.preferenceId);
      console.log('   Init Point:', prefData.initPoint);

      // 4. Test inicializar Wallet
      console.log('\n4️⃣ Testeando inicialización del Wallet...');
      try {
        // Crear un contenedor temporal
        const container = document.createElement('div');
        container.id = 'test-wallet-container';
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.zIndex = '99999';
        container.style.background = 'white';
        container.style.padding = '20px';
        container.style.borderRadius = '8px';
        container.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        document.body.appendChild(container);

        console.log('   Creando Wallet con preferenceId:', prefData.preferenceId);
        console.log('   ⚠️ Se abrirá el widget de pago. Cierra esta ventana para continuar el test.');

        // Nota: No podemos crear el Wallet desde aquí porque requiere React
        console.log('   ℹ️ Para probar el Wallet completo, usa el botón en la UI');

        document.body.removeChild(container);
      } catch (error) {
        console.error('❌ Error inicializando Wallet:', error);
      }
    } else if (prefResponse.status === 401) {
      console.warn('⚠️ 401 Unauthorized - Necesitas estar autenticado');
      console.log('   Inicia sesión e intenta de nuevo');
    } else if (prefResponse.status === 500) {
      const errorData = await prefResponse.json();
      console.error('❌ Error 500:', errorData.error);
      if (errorData.error?.includes('Configuración de MercadoPago incompleta')) {
        console.error('   💡 MERCADOPAGO_ACCESS_TOKEN no está configurado en Vercel');
      }
    } else {
      const errorData = await prefResponse.json();
      console.error('❌ Error creando preferencia:', errorData);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test completado');
  console.log('\n💡 Para probar el flujo completo:');
  console.log('   1. Asegúrate de estar autenticado');
  console.log('   2. Ve a un evento que requiera pago');
  console.log('   3. Haz clic en "Pagar con MercadoPago"');
  console.log('   4. Verifica que se muestre el botón amarillo de MercadoPago');
  console.log('='.repeat(60));
})();
