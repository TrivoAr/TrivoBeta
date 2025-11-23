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

export default mixpanelServer;
