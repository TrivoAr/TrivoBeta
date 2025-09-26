import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", SubscriptionSchema);
