import { Schema, model, models } from "mongoose";

const HistorialSalidaSchema = new Schema({
  salidaId: {
    type: Schema.Types.ObjectId,
    ref: "SalidaSocial",
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  checkInRealizado: {
    type: Boolean,
    default: false,
  },
  // Sistema de confirmación post-evento
  asistenciaConfirmada: {
    type: Boolean,
    default: null, // null = pendiente, true = asistió, false = no asistió
  },
  fechaConfirmacion: {
    type: Date,
  },
});

const ClubTrekkingMembershipSchema = new Schema(
  {
    // Usuario propietario
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Estado de la membresía
    estado: {
      type: String,
      enum: ["pendiente", "activa", "vencida", "cancelada"],
      default: "pendiente",
      required: true,
      index: true,
    },

    // Período de suscripción
    fechaInicio: {
      type: Date,
      required: true,
      default: Date.now,
    },
    fechaFin: {
      type: Date,
      required: true,
    },
    proximaFechaPago: {
      type: Date,
      required: true,
    },

    // Información de pago con MercadoPago
    mercadoPago: {
      preapprovalId: {
        type: String,
        unique: true,
        sparse: true, // Permite nulls pero valores únicos
      },
      payerId: {
        type: String,
      },
      payerEmail: {
        type: String,
      },
      status: {
        type: String, // Estado en Mercado Pago
      },
    },

    // Control de uso mensual
    usoMensual: {
      salidasRealizadas: {
        type: Number,
        default: 0,
      },
      limiteSemanal: {
        type: Number,
        default: 2, // Máximo 2 salidas por semana
      },
      ultimaResetFecha: {
        type: Date,
        default: Date.now,
      },
    },

    // Historial de salidas
    historialSalidas: [HistorialSalidaSchema],

    // Metadata para cancelación
    fechaCancelacion: {
      type: Date,
    },
    motivoCancelacion: {
      type: String,
    },

    // Sistema de penalización por inasistencia
    penalizacion: {
      activa: {
        type: Boolean,
        default: false,
      },
      fechaInicio: {
        type: Date,
      },
      fechaFin: {
        type: Date,
      },
      diasRestantes: {
        type: Number,
        default: 0,
      },
      inasistenciasConsecutivas: {
        type: Number,
        default: 0,
      },
      historialPenalizaciones: [
        {
          fechaInicio: Date,
          fechaFin: Date,
          motivo: String,
          inasistenciasConsecutivas: Number,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas eficientes
ClubTrekkingMembershipSchema.index({ userId: 1, estado: 1 });
ClubTrekkingMembershipSchema.index({ "mercadoPago.preapprovalId": 1 });

// Método para verificar si puede reservar más salidas esta semana
ClubTrekkingMembershipSchema.methods.puedeReservarSalida = function (
  fechaSalida: Date
): boolean {
  if (this.estado !== "activa") return false;

  // Calcular inicio y fin de la semana de la salida
  const inicioSemana = new Date(fechaSalida);
  inicioSemana.setDate(fechaSalida.getDate() - fechaSalida.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);

  // Contar salidas en esta semana
  const salidasEstaSemana = this.historialSalidas.filter((h: any) => {
    const fecha = new Date(h.fecha);
    return fecha >= inicioSemana && fecha <= finSemana;
  }).length;

  return salidasEstaSemana < this.usoMensual.limiteSemanal;
};

// Método para verificar si la membresía está activa
ClubTrekkingMembershipSchema.methods.estaActiva = function (): boolean {
  return this.estado === "activa" && new Date() < this.fechaFin;
};

// Método para agregar salida al historial
ClubTrekkingMembershipSchema.methods.agregarSalida = function (
  salidaId: string,
  fecha: Date,
  checkInRealizado = false
) {
  this.historialSalidas.push({
    salidaId,
    fecha,
    checkInRealizado,
  });
  this.usoMensual.salidasRealizadas += 1;
};

// Método para cancelar la membresía
ClubTrekkingMembershipSchema.methods.cancelar = function (motivo: string) {
  this.estado = "cancelada";
  this.fechaCancelacion = new Date();
  this.motivoCancelacion = motivo;
};

// Método para resetear contador mensual
ClubTrekkingMembershipSchema.methods.resetearContadorMensual = function () {
  const ahora = new Date();

  // Verificar si ha pasado un mes
  const unMesDespues = new Date(this.fechaInicio);
  unMesDespues.setMonth(unMesDespues.getMonth() + 1);

  if (ahora >= unMesDespues) {
    this.usoMensual.salidasRealizadas = 0;
    this.usoMensual.ultimaResetFecha = ahora;
    this.fechaInicio = ahora;

    // Calcular nueva fecha de fin (un mes después)
    const nuevaFechaFin = new Date(ahora);
    nuevaFechaFin.setMonth(ahora.getMonth() + 1);
    this.fechaFin = nuevaFechaFin;

    // Calcular próxima fecha de pago
    const nuevaFechaPago = new Date(ahora);
    nuevaFechaPago.setMonth(ahora.getMonth() + 1);
    this.proximaFechaPago = nuevaFechaPago;
  }
};

// Método para confirmar asistencia (post-evento)
ClubTrekkingMembershipSchema.methods.confirmarAsistencia = function (
  salidaId: string,
  asistio: boolean
) {
  const salida = this.historialSalidas.find(
    (h: any) => h.salidaId.toString() === salidaId.toString()
  );

  if (!salida) {
    throw new Error("Salida no encontrada en el historial");
  }

  if (salida.asistenciaConfirmada !== null) {
    throw new Error("La asistencia ya fue confirmada");
  }

  salida.asistenciaConfirmada = asistio;
  salida.fechaConfirmacion = new Date();

  // Si NO asistió, incrementar contador de inasistencias consecutivas
  if (!asistio) {
    this.penalizacion.inasistenciasConsecutivas += 1;

    // Si tiene 2 inasistencias consecutivas, aplicar penalización de 3 días
    if (this.penalizacion.inasistenciasConsecutivas >= 2) {
      this.aplicarPenalizacion();
    }
  } else {
    // Si asistió, resetear contador de inasistencias consecutivas
    this.penalizacion.inasistenciasConsecutivas = 0;
    salida.checkInRealizado = true; // Marcar como completada
  }
};

// Método para aplicar penalización
ClubTrekkingMembershipSchema.methods.aplicarPenalizacion = function () {
  const ahora = new Date();
  const fechaFin = new Date(ahora);
  fechaFin.setDate(ahora.getDate() + 3); // 3 días de penalización

  this.penalizacion.activa = true;
  this.penalizacion.fechaInicio = ahora;
  this.penalizacion.fechaFin = fechaFin;
  this.penalizacion.diasRestantes = 3;

  // Agregar al historial
  this.penalizacion.historialPenalizaciones.push({
    fechaInicio: ahora,
    fechaFin,
    motivo: `${this.penalizacion.inasistenciasConsecutivas} inasistencias consecutivas`,
    inasistenciasConsecutivas: this.penalizacion.inasistenciasConsecutivas,
  });

  // Resetear contador después de aplicar penalización
  this.penalizacion.inasistenciasConsecutivas = 0;
};

// Método para verificar si tiene penalización activa
ClubTrekkingMembershipSchema.methods.tienePenalizacionActiva = function (): boolean {
  if (!this.penalizacion.activa) return false;

  const ahora = new Date();

  // Si ya pasó la fecha de fin, desactivar penalización
  if (ahora >= this.penalizacion.fechaFin) {
    this.penalizacion.activa = false;
    this.penalizacion.diasRestantes = 0;
    return false;
  }

  // Actualizar días restantes
  const diffTime = this.penalizacion.fechaFin.getTime() - ahora.getTime();
  this.penalizacion.diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return true;
};

// Método para obtener salidas pendientes de confirmar
ClubTrekkingMembershipSchema.methods.getSalidasPendientesConfirmacion = function () {
  const ahora = new Date();
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);

  return this.historialSalidas.filter((h: any) => {
    const fechaSalida = new Date(h.fecha);
    return (
      h.asistenciaConfirmada === null && // No confirmada
      fechaSalida < ahora && // Ya pasó
      fechaSalida >= ayer // No hace más de 1 día (para no molestar con muy antiguas)
    );
  });
};

const ClubTrekkingMembership =
  models.ClubTrekkingMembership ||
  model("ClubTrekkingMembership", ClubTrekkingMembershipSchema);

export default ClubTrekkingMembership;
