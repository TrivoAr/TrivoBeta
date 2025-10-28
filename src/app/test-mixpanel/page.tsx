'use client';

import { useMixpanel } from '@/hooks/useMixpanel';
import { trackLogin, trackSalidaSocialCreated } from '@/utils/mixpanelEvents';
import { useState } from 'react';

export default function TestMixpanel() {
  const { trackEvent, getDistinctId } = useMixpanel();
  const [distinctId, setDistinctId] = useState<string | undefined>();
  const [eventsSent, setEventsSent] = useState<string[]>([]);

  const handleTestBasicEvent = () => {
    trackEvent('Test Event', {
      test_property: 'test_value',
      timestamp: new Date().toISOString(),
    });
    setEventsSent([...eventsSent, 'Test Event']);
  };

  const handleTestLogin = () => {
    trackLogin('credentials', 'test-user-123');
    setEventsSent([...eventsSent, 'User Login']);
  };

  const handleTestSalidaSocial = () => {
    trackSalidaSocialCreated('test-salida-123', {
      sport_type: 'running',
      location: 'Buenos Aires',
      max_participants: 20,
    });
    setEventsSent([...eventsSent, 'Salida Social Created']);
  };

  const handleGetDistinctId = () => {
    const id = getDistinctId();
    setDistinctId(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Test de Mixpanel</h1>

        {/* Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ℹ️ Información</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Token configurado:</strong>{' '}
              {process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ? '✅ Sí' : '❌ No'}
            </p>
            {distinctId && (
              <p className="text-sm text-gray-600">
                <strong>Distinct ID:</strong> {distinctId}
              </p>
            )}
            <button
              onClick={handleGetDistinctId}
              className="text-sm text-blue-600 hover:underline"
            >
              Mostrar Distinct ID
            </button>
          </div>
        </div>

        {/* Botones de Prueba */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Pruebas de Eventos</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={handleTestBasicEvent}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                📊 Enviar Evento Básico
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Envía un evento simple con propiedades de prueba
              </p>
            </div>

            <div>
              <button
                onClick={handleTestLogin}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
              >
                🔐 Simular Login
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Trackea un evento de login de prueba
              </p>
            </div>

            <div>
              <button
                onClick={handleTestSalidaSocial}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                🏃 Crear Salida Social
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Trackea creación de salida social con propiedades
              </p>
            </div>
          </div>
        </div>

        {/* Eventos Enviados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            📤 Eventos Enviados ({eventsSent.length})
          </h2>
          {eventsSent.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No se han enviado eventos aún. Haz clic en los botones arriba para probar.
            </p>
          ) : (
            <ul className="space-y-2">
              {eventsSent.map((event, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {event}
                  <span className="text-xs text-gray-400 ml-2">
                    ({new Date().toLocaleTimeString()})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            📋 Cómo verificar en Mixpanel:
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Abre la consola del navegador (F12) para ver logs en desarrollo</li>
            <li>Ve a Mixpanel Dashboard → Live View</li>
            <li>Haz clic en los botones de arriba</li>
            <li>Verifica que los eventos aparezcan en tiempo real en Mixpanel</li>
            <li>Los eventos pueden tardar 1-2 segundos en aparecer</li>
          </ol>
        </div>

        {/* Consola del navegador */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">
            💡 Consejo:
          </h3>
          <p className="text-sm text-yellow-800">
            En modo desarrollo, los eventos se logean en la consola del navegador.
            Abre DevTools (F12) y ve a la pestaña Console para ver los eventos en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
