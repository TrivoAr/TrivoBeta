import { Schema, model, models } from "mongoose";
import { SUBSCRIPTION_CONFIG } from "@/config/subscription.config";

const SuscripcionSchema = new Schema(
  {
    // Relaciones
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    academiaId: {
      type: Schema.Types.ObjectId,
      ref: "Academia",
      required: true,
      index: true,
    },
    grupoId: {
      type: Schema.Types.ObjectId,
      ref: "Grupo",
      required: false, // Puede ser suscripción a academia sin grupo específico
    },

    // Estado de la suscripción
    estado: {
      type: String,
      enum: Object.values(SUBSCRIPTION_CONFIG.ESTADOS),
      default: SUBSCRIPTION_CONFIG.ESTADOS.TRIAL,
      required: true,
      index: true,
    },

    // Información del Trial
    trial: {
      estaEnTrial: {
        type: Boolean,
        default: true,
      },
      fechaInicio: {
        type: Date,
        default: Date.now,
      },
      fechaFin: {
        type: Date,
        required: false,
      },
      clasesAsistidas: {
        type: Number,
        default: 0,
      },
      // Marca si este trial fue usado (importante para el conteo global)
      fueUsado: {
        type: Boolean,
        default: false,
      },
    },

    // Información de Mercado Pago
    mercadoPago: {
      preapprovalId: {
        type: String,
        unique: true,
        sparse: true, // Permite nulls pero valores únicos
      },
      initPoint: {
        type: String, // URL para que el usuario autorice el pago
      },
      status: {
        type: String, // Estado en Mercado Pago
      },
      payerId: {
        type: String,
      },
      payerEmail: {
        type: String,
      },
    },

    // Información de pagos
    pagos: {
      monto: {
        type: Number,
        required: true,
      },
      moneda: {
        type: String,
        default: SUBSCRIPTION_CONFIG.SUBSCRIPTION.CURRENCY,
      },
      frecuencia: {
        type: Number,
        default: SUBSCRIPTION_CONFIG.SUBSCRIPTION.FREQUENCY,
      },
      tipoFrecuencia: {
        type: String,
        enum: ["months", "days"],
        default: SUBSCRIPTION_CONFIG.SUBSCRIPTION.FREQUENCY_TYPE,
      },
      proximaFechaPago: {
        type: Date,
      },
      ultimaFechaPago: {
        type: Date,
      },
    },

    // Fechas importantes
    fechaActivacion: {
      type: Date, // Cuando se activó la suscripción (post-trial)
    },
    fechaCancelacion: {
      type: Date,
    },
    fechaPausa: {
      type: Date,
    },

    // Metadatos
    motivoCancelacion: {
      type: String,
    },
    notas: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compuestos para búsquedas eficientes
SuscripcionSchema.index({ userId: 1, academiaId: 1 });
SuscripcionSchema.index({ userId: 1, estado: 1 });
SuscripcionSchema.index({ academiaId: 1, estado: 1 });
SuscripcionSchema.index({ "mercadoPago.preapprovalId": 1 });

// Método para verificar si el trial ha expirado (modelo híbrido)
SuscripcionSchema.methods.haExpiradoTrial = function () {
  if (!this.trial.estaEnTrial) return true;

  const ahora = new Date();
  const diasTranscurridos = Math.floor(
    (ahora.getTime() - this.trial.fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Verifica ambas condiciones del modelo híbrido
  const excedioClases =
    this.trial.clasesAsistidas >= SUBSCRIPTION_CONFIG.TRIAL.MAX_CLASES_GRATIS;
  const excedioDias =
    diasTranscurridos >= SUBSCRIPTION_CONFIG.TRIAL.MAX_DIAS_GRATIS;

  return excedioClases || excedioDias;
};

// Método para verificar si puede asistir a clases
SuscripcionSchema.methods.puedeAsistir = function () {
  // En trial siempre puede asistir (el control se hace después)
  if (this.estado === SUBSCRIPTION_CONFIG.ESTADOS.TRIAL) {
    return !this.haExpiradoTrial();
  }

  // Si está activa, puede asistir
  if (this.estado === SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA) {
    return true;
  }

  // En cualquier otro caso, no puede
  return false;
};

// Método para activar suscripción (post-trial)
SuscripcionSchema.methods.activarSuscripcion = function () {
  this.estado = SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA;
  this.trial.estaEnTrial = false;
  this.trial.fueUsado = true;
  this.fechaActivacion = new Date();
};

const Suscripcion =
  models.Suscripcion || model("Suscripcion", SuscripcionSchema);
export default Suscripcion;
