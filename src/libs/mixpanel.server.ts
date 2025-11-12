/**
 * Mixpanel Server-Side Tracking
 * Este módulo permite trackear eventos desde el servidor (webhooks, API routes)
 * usando la API HTTP de Mixpanel
 */

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const MIXPANEL_API_URL = 'https://api.mixpanel.com';

interface TrackEventParams {
  event: string;
  properties: Record<string, any>;
  distinctId?: string;
}

interface TrackChargeParams {
  distinctId: string;
  amount: number;
  properties?: Record<string, any>;
}

/**
 * Trackea un evento desde el servidor
 */
export async function trackEventServer(params: TrackEventParams): Promise<boolean> {
  if (!MIXPANEL_TOKEN) {
    console.warn('⚠️ NEXT_PUBLIC_MIXPANEL_TOKEN no está configurado');
    return false;
  }

  try {
    const eventData = {
      event: params.event,
      properties: {
        token: MIXPANEL_TOKEN,
        distinct_id: params.distinctId || params.properties.distinct_id,
        time: Math.floor(Date.now() / 1000),
        ...params.properties,
      },
    };

    const response = await fetch(`${MIXPANEL_API_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify([eventData]),
    });

    if (!response.ok) {
      console.error('❌ Error al enviar evento a Mixpanel:', await response.text());
      return false;
    }

    const result = await response.text();
    return result === '1'; // Mixpanel devuelve '1' para éxito
  } catch (error) {
    console.error('❌ Error al trackear evento en Mixpanel:', error);
    return false;
  }
}

/**
 * Registra un cargo (revenue) en el perfil del usuario desde el servidor
 */
export async function trackChargeServer(params: TrackChargeParams): Promise<boolean> {
  if (!MIXPANEL_TOKEN) {
    console.warn('⚠️ NEXT_PUBLIC_MIXPANEL_TOKEN no está configurado');
    return false;
  }

  try {
    const engageData = {
      $token: MIXPANEL_TOKEN,
      $distinct_id: params.distinctId,
      $append: {
        $transactions: {
          $time: new Date().toISOString(),
          $amount: params.amount,
          ...params.properties,
        },
      },
    };

    const response = await fetch(`${MIXPANEL_API_URL}/engage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify([engageData]),
    });

    if (!response.ok) {
      console.error('❌ Error al registrar cargo en Mixpanel:', await response.text());
      return false;
    }

    const result = await response.text();
    return result === '1';
  } catch (error) {
    console.error('❌ Error al registrar cargo en Mixpanel:', error);
    return false;
  }
}

/**
 * Incrementa una propiedad del usuario desde el servidor
 */
export async function incrementUserPropertyServer(
  distinctId: string,
  property: string,
  amount: number = 1
): Promise<boolean> {
  if (!MIXPANEL_TOKEN) {
    console.warn('⚠️ NEXT_PUBLIC_MIXPANEL_TOKEN no está configurado');
    return false;
  }

  try {
    const engageData = {
      $token: MIXPANEL_TOKEN,
      $distinct_id: distinctId,
      $add: {
        [property]: amount,
      },
    };

    const response = await fetch(`${MIXPANEL_API_URL}/engage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify([engageData]),
    });

    if (!response.ok) {
      console.error('❌ Error al incrementar propiedad en Mixpanel:', await response.text());
      return false;
    }

    const result = await response.text();
    return result === '1';
  } catch (error) {
    console.error('❌ Error al incrementar propiedad en Mixpanel:', error);
    return false;
  }
}

/**
 * Establece propiedades del usuario desde el servidor
 */
export async function setUserPropertiesServer(
  distinctId: string,
  properties: Record<string, any>
): Promise<boolean> {
  if (!MIXPANEL_TOKEN) {
    console.warn('⚠️ NEXT_PUBLIC_MIXPANEL_TOKEN no está configurado');
    return false;
  }

  try {
    const engageData = {
      $token: MIXPANEL_TOKEN,
      $distinct_id: distinctId,
      $set: properties,
    };

    const response = await fetch(`${MIXPANEL_API_URL}/engage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify([engageData]),
    });

    if (!response.ok) {
      console.error('❌ Error al establecer propiedades en Mixpanel:', await response.text());
      return false;
    }

    const result = await response.text();
    return result === '1';
  } catch (error) {
    console.error('❌ Error al establecer propiedades en Mixpanel:', error);
    return false;
  }
}

export default {
  trackEventServer,
  trackChargeServer,
  incrementUserPropertyServer,
  setUserPropertiesServer,
};
