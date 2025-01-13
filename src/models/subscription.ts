import mongoose, { Schema, Document } from "mongoose";

interface ISubscription extends Document {
  user_id: mongoose.Schema.Types.ObjectId; // Cambiar a ObjectId
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const SubscriptionSchema: Schema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // Cambiar a ObjectId
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
});

export default mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
