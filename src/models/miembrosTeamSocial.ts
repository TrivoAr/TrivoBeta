import { Schema, model, models } from "mongoose";

const MiembroTeamSocialSchema = new Schema(
  {
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamsocial_id: {
      type: Schema.Types.ObjectId,
      ref: "TeamSocial",
      required: true,
    },
    fecha_union: {
      type: Date,
      default: Date.now,
    },
    rol: {
      type: String,
      enum: ["miembro", "organizador"],
      default: "miembro",
    },
  },
  { timestamps: true }
);

// 👇 este nombre tiene que ser el correcto
const MiembroTeamSocial = models.MiembroTeamSocial || model("MiembroTeamSocial", MiembroTeamSocialSchema);
export default MiembroTeamSocial;
