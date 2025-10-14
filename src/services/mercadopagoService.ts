/**
 * Servicio para interactuar con la API de Mercado Pago
 * Maneja la creación de suscripciones (preapprovals) y procesamiento de pagos
 * NOTA: Usa credenciales centralizadas de la plataforma (no por dueño de academia)
 */

import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { SUBSCRIPTION_CONFIG } from "@/config/subscription.config";

export interface CrearPreapprovalParams {
  userId: string;
  academiaId: string;
  grupoId?: string;
  userEmail: string;
  razon: string;
  monto: number;
  conTrial: boolean;
  externalReference: string;
}

export const mercadopagoService = {
  /**
   * Obtiene las credenciales centralizadas de Mercado Pago de la plataforma
   */
  obtenerCredencialesPlataforma() {
    // Intentar primero con las variables que están en Vercel
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || process.env.MERCADOPAGO_PUBLIC_KEY;

    if (!accessToken || !publicKey) {
      throw new Error(
        "Las credenciales de MercadoPago no están configuradas en las variables de entorno. Por favor, configura MP_ACCESS_TOKEN y NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY."
      );
    }

    return {
      accessToken,
      publicKey,
    };
  },

  /**
   * Inicializa el cliente de Mercado Pago con las credenciales
   */
  inicializarCliente(accessToken: string) {
    const client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    });

    return new PreApproval(client);
  },

  /**
   * Crea un preapproval (suscripción) en Mercado Pago
   */
  async crearPreapproval(params: CrearPreapprovalParams) {
    const { userEmail, razon, monto, conTrial, externalReference } = params;

    // Convertir monto a número (por si viene como string)
    const montoNumerico = typeof monto === "string" ? parseFloat(monto) : monto;

    // Validar que el monto sea un número válido
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      throw new Error(`Monto inválido: ${monto}`);
    }

    // Validar monto mínimo
    if (montoNumerico < SUBSCRIPTION_CONFIG.SUBSCRIPTION.MIN_AMOUNT) {
      throw new Error(
        `El monto ($${montoNumerico}) es menor al mínimo requerido por MercadoPago ($${SUBSCRIPTION_CONFIG.SUBSCRIPTION.MIN_AMOUNT})`
      );
    }

    console.log(`[MERCADOPAGO_SERVICE] Creando preapproval con monto: ${montoNumerico} (tipo: ${typeof montoNumerico})`);

    // Obtener credenciales centralizadas de la plataforma
    const credentials = this.obtenerCredencialesPlataforma();

    // Inicializar cliente de Mercado Pago
    const preApprovalClient = this.inicializarCliente(credentials.accessToken);

    // Construir el cuerpo de la solicitud
    const body: any = {
      reason: razon,
      external_reference: externalReference,
      payer_email: userEmail,
      back_url: `${process.env.NEXTAUTH_URL}/dashboard`,
      auto_recurring: {
        frequency: SUBSCRIPTION_CONFIG.SUBSCRIPTION.FREQUENCY,
        frequency_type: SUBSCRIPTION_CONFIG.SUBSCRIPTION.FREQUENCY_TYPE,
        transaction_amount: montoNumerico,
        currency_id: SUBSCRIPTION_CONFIG.SUBSCRIPTION.CURRENCY,
      },
      status: "pending",
    };

    // Agregar free trial si corresponde
    if (conTrial && SUBSCRIPTION_CONFIG.TRIAL.ENABLED) {
      body.auto_recurring.free_trial = {
        frequency: SUBSCRIPTION_CONFIG.TRIAL.MAX_DIAS_GRATIS,
        frequency_type: "days",
      };
    }

    try {
      // Crear preapproval en Mercado Pago
      const response = await preApprovalClient.create({ body });

      return {
        success: true,
        preapprovalId: response.id,
        initPoint: response.init_point,
        status: response.status,
        data: response,
      };
    } catch (error: any) {
      console.error("Error creando preapproval en Mercado Pago:", error);
      throw new Error(
        `Error al crear suscripción en Mercado Pago: ${error.message}`
      );
    }
  },

  /**
   * Obtiene información de un preapproval
   */
  async obtenerPreapproval(preapprovalId: string) {
    const credentials = this.obtenerCredencialesPlataforma();
    const preApprovalClient = this.inicializarCliente(credentials.accessToken);

    try {
      const response = await preApprovalClient.get({ id: preapprovalId });
      return response;
    } catch (error: any) {
      console.error("Error obteniendo preapproval:", error);
      throw new Error(`Error al obtener suscripción: ${error.message}`);
    }
  },

  /**
   * Actualiza el estado de un preapproval
   */
  async actualizarPreapproval(
    preapprovalId: string,
    status: "paused" | "cancelled"
  ) {
    const credentials = this.obtenerCredencialesPlataforma();
    const preApprovalClient = this.inicializarCliente(credentials.accessToken);

    try {
      const response = await preApprovalClient.update({
        id: preapprovalId,
        body: { status },
      });
      return response;
    } catch (error: any) {
      console.error("Error actualizando preapproval:", error);
      throw new Error(`Error al actualizar suscripción: ${error.message}`);
    }
  },

  /**
   * Cancela un preapproval
   */
  async cancelarPreapproval(preapprovalId: string) {
    return await this.actualizarPreapproval(preapprovalId, "cancelled");
  },

  /**
   * Pausa un preapproval
   */
  async pausarPreapproval(preapprovalId: string) {
    return await this.actualizarPreapproval(preapprovalId, "paused");
  },

  /**
   * Genera una referencia externa única para el preapproval
   */
  generarExternalReference(userId: string, academiaId: string): string {
    const timestamp = Date.now();
    return `sub_${userId}_${academiaId}_${timestamp}`;
  },
};
