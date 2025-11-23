import Mixpanel from 'mixpanel';

const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';
const mixpanelServer = mixpanelToken ? Mixpanel.init(mixpanelToken) : null;

export const trackServerEvent = (eventName: string, distinctId: string, properties: Record<string, any> = {}) => {
    if (!mixpanelServer) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Mixpanel Server] Event: ${eventName}, User: ${distinctId}`, properties);
        }
        return;
    }

    mixpanelServer.track(eventName, {
        distinct_id: distinctId,
        ...properties,
    });
};

export const trackServerCharge = (distinctId: string, amount: number, properties: Record<string, any> = {}) => {
    if (!mixpanelServer) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Mixpanel Server] Charge: ${amount}, User: ${distinctId}`, properties);
        }
        return;
    }

    mixpanelServer.people.track_charge(distinctId, amount, properties);
};

// ==================== CLUB DEL TREKKING ====================

export const trackServerClubTrekkingSubscribed = (
    distinctId: string,
    membershipId: string,
    plan: string = 'monthly',
    price: number = 25000
) => {
    trackServerEvent("Club Trekking - Subscribed", distinctId, {
        membership_id: membershipId,
        plan,
        price,
        currency: 'ARS',
        timestamp: new Date().toISOString(),
    });

    trackServerCharge(distinctId, price, {
        membership_id: membershipId,
        plan,
        product: "Club del Trekking"
    });
};

export const trackServerClubTrekkingSalidaReserved = (
    distinctId: string,
    membershipId: string,
    salidaId: string,
    salidasUsadasSemana: number
) => {
    trackServerEvent("Club Trekking - Salida Reserved", distinctId, {
        membership_id: membershipId,
        salida_id: salidaId,
        salidas_usadas_semana: salidasUsadasSemana,
        timestamp: new Date().toISOString(),
    });
};

export const trackServerClubTrekkingCheckIn = (
    distinctId: string,
    membershipId: string,
    salidaId: string,
    asistio: boolean,
    penalizacionAplicada: boolean
) => {
    trackServerEvent("Club Trekking - Check In", distinctId, {
        membership_id: membershipId,
        salida_id: salidaId,
        asistio,
        penalizacion_aplicada: penalizacionAplicada,
        timestamp: new Date().toISOString(),
    });
};

export const trackServerClubTrekkingCancelled = (
    distinctId: string,
    membershipId: string,
    reason: string,
    monthsActive?: number
) => {
    trackServerEvent("Club Trekking - Cancelled", distinctId, {
        membership_id: membershipId,
        reason,
        months_active: monthsActive,
        timestamp: new Date().toISOString(),
    });
};

export default mixpanelServer;
