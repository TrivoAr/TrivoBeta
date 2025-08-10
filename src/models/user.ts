import { Schema, model, models } from "mongoose";



const FavoritosSchema = new Schema({
  salidas: [{ type: Schema.Types.ObjectId, ref: "SalidaSocial" }],
  academias: [{ type: Schema.Types.ObjectId, ref: "Academia" }],
  teamSocial: [{ type: Schema.Types.ObjectId, ref: "TeamSocial" }],
});


const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email is invalid",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    firstname: {
      type: String,
      required: [true, "First name is required"],
      minLength: [3, "First name must be at least 3 characters"],
      maxLength: [20, "First name must be at most 20 characters"],
    },
    lastname: {
      type: String,
      required: [true, "Last name is required"],
      minLength: [3, "Last name must be at least 3 characters"],
      maxLength: [20, "Last name must be at most 20 characters"],
    },
    rol: {
      type: String,
      enum: ["alumno", "profe", "dueño de academia"],
      required: [true, "Role is required"],
    },

    telnumber: {
      type: String,
      required: false,
      minLength: [7, "Phone number must be at least 7 characters"],
      maxLength: [19, "Phone number must be at most 19 characters"],
    },
    instagram: { type: String, required: false, default: "" },
    facebook: { type: String, required: false, default: "" },
    twitter: { type: String, required: false, default: "" },

    imagen: {
      type: String,
    },
    bio: {
      type: String,
    },

    favoritos: FavoritosSchema,

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  {
    timestamps: true,
  }
);

const User = models.User || model("User", UserSchema);
export default User;
