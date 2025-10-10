/**
 * Servicio centralizado para la lógica de suscripciones
 * Todas las operaciones relacionadas con suscripciones deben usar este servicio
 */

import Suscripcion from "@/models/Suscripcion";
import Asistencia from "@/models/Asistencia";
import User from "@/models/user";
import {
  SUBSCRIPTION_CONFIG,
  subscriptionHelpers,
} from "@/config/subscription.config";
import connectDB from "@/libs/mongodb";

export interface CrearSuscripcionParams {
  userId: string;
  academiaId: string;
  grupoId?: string;
  monto: number;
}

export interface ValidarTrialResult {
  puedeUsarTrial: boolean;
  razon?: string;
  yaUsoTrial: boolean;
}

export const subscriptionService = {
  /**
   * Verifica si un usuario puede usar el trial gratuito
   */
  async verificarElegibilidadTrial(
    userId: string,
    academiaId: string
  ): Promise<ValidarTrialResult> {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return {
        puedeUsarTrial: false,
        razon: "Usuario no encontrado",
        yaUsoTrial: false,
      };
    }

    // Si el trial no está habilitado, nadie puede usarlo
    if (!subscriptionHelpers.isTrialEnabled()) {
      return {
        puedeUsarTrial: false,
        razon: "Trial no habilitado",
        yaUsoTrial: false,
      };
    }

    // Verificar según el tipo de trial configurado
    if (subscriptionHelpers.isTrialGlobal()) {
      // Trial global: solo una vez en la vida
      const yaUsoTrial = user.trialConfig?.haUsadoTrial || false;
      return {
        puedeUsarTrial: !yaUsoTrial,
        razon: yaUsoTrial ? "Ya utilizó su trial gratuito" : undefined,
        yaUsoTrial,
      };
    } else {
      // Trial por academia: una vez por academia
      const academiasConTrial = user.trialConfig?.academiasConTrial || [];
      const yaUsoTrialEnEstaAcademia = academiasConTrial.some(
        (id) => id.toString() === academiaId
      );

      return {
        puedeUsarTrial: !yaUsoTrialEnEstaAcademia,
        razon: yaUsoTrialEnEstaAcademia
          ? "Ya utilizó su trial en esta academia"
          : undefined,
        yaUsoTrial: yaUsoTrialEnEstaAcademia,
      };
    }
  },

  /**
   * Crea una nueva suscripción (con o sin trial)
   */
  async crearSuscripcion(params: CrearSuscripcionParams) {
    await connectDB();

    const { userId, academiaId, grupoId, monto } = params;

    // Verificar elegibilidad para trial
    const { puedeUsarTrial } = await this.verificarElegibilidadTrial(
      userId,
      academiaId
    );

    const fechaInicio = new Date();
    const estado = puedeUsarTrial
      ? SUBSCRIPTION_CONFIG.ESTADOS.TRIAL
      : SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA;

    const suscripcion = await Suscripcion.create({
      userId,
      academiaId,
      grupoId,
      estado,
      trial: {
        estaEnTrial: puedeUsarTrial,
        fechaInicio,
        fechaFin: puedeUsarTrial
          ? subscriptionHelpers.calcularFechaFinTrial(fechaInicio)
          : null,
        clasesAsistidas: 0,
        fueUsado: false,
      },
      pagos: {
        monto,
        moneda: SUBSCRIPTION_CONFIG.SUBSCRIPTION.CURRENCY,
        frecuencia: SUBSCRIPTION_CONFIG.SUBSCRIPTION.FREQUENCY,
        tipoFrecuencia: SUBSCRIPTION_CONFIG.SUBSCRIPTION.FREQUENCY_TYPE,
      },
    });

    return {
      suscripcion,
      requiereConfiguracionPago: !puedeUsarTrial,
    };
  },

  /**
   * Obtiene la suscripción activa de un usuario en una academia
   */
  async obtenerSuscripcionActiva(userId: string, academiaId: string) {
    await connectDB();

    return await Suscripcion.findOne({
      userId,
      academiaId,
      estado: {
        $in: [
          SUBSCRIPTION_CONFIG.ESTADOS.TRIAL,
          SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA,
        ],
      },
    });
  },

  /**
   * Verifica si un usuario puede asistir a una clase
   */
  async verificarPuedeAsistir(
    userId: string,
    grupoId: string
  ): Promise<{ puedeAsistir: boolean; razon?: string; suscripcion?: any }> {
    await connectDB();

    // Obtener el grupo y su academia
    const Grupo = (await import("@/models/grupo")).default;
    const grupo = await Grupo.findById(grupoId);

    if (!grupo) {
      return {
        puedeAsistir: false,
        razon: "Grupo no encontrado",
      };
    }

    const academiaId =
      typeof grupo.academia_id === "string"
        ? grupo.academia_id
        : grupo.academia_id._id.toString();

    // Buscar suscripción por academiaId (no por grupoId)
    // porque la suscripción es a nivel de academia, no de grupo
    const suscripcion = await Suscripcion.findOne({
      userId,
      academiaId,
      estado: {
        $in: [
          SUBSCRIPTION_CONFIG.ESTADOS.TRIAL,
          SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA,
        ],
      },
    });

    if (!suscripcion) {
      return {
        puedeAsistir: false,
        razon: "No tiene suscripción activa",
      };
    }

    // Verificar si puede asistir según el método del modelo
    const puede = suscripcion.puedeAsistir();

    if (!puede) {
      return {
        puedeAsistir: false,
        razon:
          suscripcion.estado === SUBSCRIPTION_CONFIG.ESTADOS.TRIAL
            ? "Trial expirado, debe activar suscripción"
            : "Suscripción vencida",
        suscripcion,
      };
    }

    return {
      puedeAsistir: true,
      suscripcion,
    };
  },

  /**
   * Registra una asistencia y maneja la lógica del trial (modelo híbrido)
   */
  async registrarAsistencia(params: {
    userId: string;
    academiaId: string;
    grupoId: string;
    fecha?: Date;
    registradoPor?: string;
  }) {
    await connectDB();

    const {
      userId,
      academiaId,
      grupoId,
      fecha = new Date(),
      registradoPor,
    } = params;

    // Normalizar la fecha al inicio del día para evitar duplicados por diferencias de hora
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);

    console.log(`[SUBSCRIPTION_SERVICE] Registrando asistencia para ${userId} en fecha normalizada: ${fechaNormalizada.toISOString()}`);

    // Verificar si puede asistir
    const { puedeAsistir, razon, suscripcion } =
      await this.verificarPuedeAsistir(userId, grupoId);

    if (!puedeAsistir) {
      throw new Error(razon || "No puede asistir a esta clase");
    }

    // Verificar si ya existe asistencia para hoy
    const asistenciaExistente = await Asistencia.findOne({
      userId,
      grupoId,
      fecha: fechaNormalizada,
    });

    if (asistenciaExistente) {
      console.log(`[SUBSCRIPTION_SERVICE] Asistencia ya existe para ${userId} en ${fechaNormalizada.toISOString()}, devolviendo existente`);
      return {
        asistencia: asistenciaExistente,
        requiereActivacion: false,
        suscripcion,
      };
    }

    // Registrar la asistencia
    const esTrial = suscripcion.estado === SUBSCRIPTION_CONFIG.ESTADOS.TRIAL;
    const asistencia = await Asistencia.create({
      userId,
      academiaId,
      grupoId,
      suscripcionId: suscripcion._id,
      fecha: fechaNormalizada,
      asistio: true,
      esTrial,
      registradoPor,
    });

    console.log(`[SUBSCRIPTION_SERVICE] Asistencia creada exitosamente con ID: ${asistencia._id}`);

    // Si está en trial, actualizar contador
    let requiereActivacion = false;
    if (esTrial) {
      suscripcion.trial.clasesAsistidas += 1;
      await suscripcion.save();

      // Verificar si debe activarse la suscripción (modelo híbrido)
      if (suscripcion.haExpiradoTrial()) {
        requiereActivacion = true;
      }
    }

    return {
      asistencia,
      requiereActivacion,
      suscripcion,
    };
  },

  /**
   * Activa una suscripción después del trial
   */
  async activarSuscripcionPostTrial(suscripcionId: string) {
    await connectDB();

    const suscripcion = await Suscripcion.findById(suscripcionId);
    if (!suscripcion) {
      throw new Error("Suscripción no encontrada");
    }

    if (suscripcion.estado !== SUBSCRIPTION_CONFIG.ESTADOS.TRIAL) {
      throw new Error("La suscripción no está en trial");
    }

    suscripcion.activarSuscripcion();
    await suscripcion.save();

    // Actualizar el usuario (marcar trial como usado)
    const user = await User.findById(suscripcion.userId);
    if (user) {
      if (subscriptionHelpers.isTrialGlobal()) {
        user.trialConfig = user.trialConfig || {};
        user.trialConfig.haUsadoTrial = true;
      } else {
        user.trialConfig = user.trialConfig || { academiasConTrial: [] };
        if (!user.trialConfig.academiasConTrial) {
          user.trialConfig.academiasConTrial = [];
        }
        user.trialConfig.academiasConTrial.push(suscripcion.academiaId);
      }
      await user.save();
    }

    return suscripcion;
  },

  /**
   * Cancela una suscripción
   */
  async cancelarSuscripcion(suscripcionId: string, motivo?: string) {
    await connectDB();

    const suscripcion = await Suscripcion.findById(suscripcionId);
    if (!suscripcion) {
      throw new Error("Suscripción no encontrada");
    }

    suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.CANCELADA;
    suscripcion.fechaCancelacion = new Date();
    suscripcion.motivoCancelacion = motivo;
    await suscripcion.save();

    return suscripcion;
  },

  /**
   * Pausa una suscripción
   */
  async pausarSuscripcion(suscripcionId: string) {
    await connectDB();

    const suscripcion = await Suscripcion.findById(suscripcionId);
    if (!suscripcion) {
      throw new Error("Suscripción no encontrada");
    }

    suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.PAUSADA;
    suscripcion.fechaPausa = new Date();
    await suscripcion.save();

    return suscripcion;
  },

  /**
   * Obtiene las suscripciones de un usuario
   */
  async obtenerSuscripcionesUsuario(userId: string) {
    await connectDB();

    return await Suscripcion.find({ userId })
      .populate("academiaId", "nombre_academia imagen tipo_disciplina")
      .populate("grupoId", "nombre_grupo nivel horario dias")
      .sort({ createdAt: -1 });
  },

  /**
   * Obtiene estadísticas de asistencia de un usuario
   */
  async obtenerEstadisticasAsistencia(userId: string, suscripcionId: string) {
    await connectDB();

    const totalAsistencias = await Asistencia.countDocuments({
      userId,
      suscripcionId,
      asistio: true,
    });

    const asistenciasTrial = await Asistencia.countDocuments({
      userId,
      suscripcionId,
      asistio: true,
      esTrial: true,
    });

    const asistenciasPagas = totalAsistencias - asistenciasTrial;

    return {
      totalAsistencias,
      asistenciasTrial,
      asistenciasPagas,
    };
  },
};
