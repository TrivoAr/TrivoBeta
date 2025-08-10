import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User", // alumno que escribe la reseña
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
    },
    profesor: {
      type: Schema.Types.ObjectId,
      ref: "User", // profe que recibe la reseña
    },
    academia: {
      type: Schema.Types.ObjectId,
      ref: "Academia", // academia que recibe la reseña
    },
  },
  {
    timestamps: true,
  }
);

// Validación personalizada: debe haber profesor o academia, pero no ambos
ReviewSchema.pre("save", function (next) {
  if (!this.profesor && !this.academia) {
    return next(new Error("Debe incluir una referencia a un profesor o academia."));
  }
  if (this.profesor && this.academia) {
    return next(new Error("No puede incluir reseña a profesor y academia al mismo tiempo."));
  }
  next();
});

const Review = models.Review || model("Review", ReviewSchema);
export default Review;