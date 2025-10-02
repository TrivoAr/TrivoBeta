import { Schema, model, models } from "mongoose";

const AsistenciaSchema = new Schema(
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
      required: true,
      index: true,
    },
    suscripcionId: {
      type: Schema.Types.ObjectId,
      ref: "Suscripcion",
      required: true,
      index: true,
    },

    // Información de la asistencia
    fecha: {
      type: Date,
      required: true,
      index: true,
    },
    asistio: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Contexto de la asistencia
    esTrial: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Información adicional
    notas: {
      type: String, // Ej: "Llegó tarde", "Lesión en rodilla", etc.
    },
    registradoPor: {
      type: Schema.Types.ObjectId,
      ref: "User", // Profesor o admin que registró la asistencia
    },
  },
  {
    timestamps: true,
  }
);

// Índices compuestos para consultas frecuentes
AsistenciaSchema.index({ userId: 1, grupoId: 1, fecha: -1 });
AsistenciaSchema.index({ grupoId: 1, fecha: -1 });
AsistenciaSchema.index({ suscripcionId: 1, esTrial: 1 });
AsistenciaSchema.index({ fecha: -1 });

// Evitar registros duplicados de asistencia
AsistenciaSchema.index({ userId: 1, grupoId: 1, fecha: 1 }, { unique: true });

// Métodos de instancia
AsistenciaSchema.methods.esDelMismoMes = function (fecha: Date) {
  return (
    this.fecha.getMonth() === fecha.getMonth() &&
    this.fecha.getFullYear() === fecha.getFullYear()
  );
};

// Métodos estáticos reutilizables
AsistenciaSchema.statics.contarAsistenciasPorSuscripcion = async function (
  suscripcionId: string,
  soloTrial = false
) {
  const query: any = { suscripcionId, asistio: true };
  if (soloTrial) {
    query.esTrial = true;
  }
  return await this.countDocuments(query);
};

AsistenciaSchema.statics.obtenerAsistenciasDelMes = async function (
  userId: string,
  grupoId: string,
  fecha: Date = new Date()
) {
  const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

  return await this.find({
    userId,
    grupoId,
    asistio: true,
    fecha: {
      $gte: inicioMes,
      $lte: finMes,
    },
  }).sort({ fecha: -1 });
};

AsistenciaSchema.statics.obtenerAsistenciasDiarias = async function (
  grupoId: string,
  fecha: Date = new Date()
) {
  const inicioDia = new Date(fecha);
  inicioDia.setHours(0, 0, 0, 0);

  const finDia = new Date(fecha);
  finDia.setHours(23, 59, 59, 999);

  return await this.find({
    grupoId,
    fecha: {
      $gte: inicioDia,
      $lte: finDia,
    },
  })
    .populate("userId", "firstname lastname email imagen")
    .populate("suscripcionId", "estado trial")
    .sort({ asistio: -1 });
};

const Asistencia = models.Asistencia || model("Asistencia", AsistenciaSchema);
export default Asistencia;
