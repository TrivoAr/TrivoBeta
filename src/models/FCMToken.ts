import mongoose, { Schema, Document } from "mongoose";

export interface IFCMToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
  };
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FCMTokenSchema = new Schema<IFCMToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para buscar tokens activos por usuario
FCMTokenSchema.index({ userId: 1, isActive: 1 });

const FCMToken =
  mongoose.models.FCMToken || mongoose.model<IFCMToken>("FCMToken", FCMTokenSchema);

export default FCMToken;
