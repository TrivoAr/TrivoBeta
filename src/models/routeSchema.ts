import { Schema, model, models } from "mongoose";

const routeSchema = new Schema({
  stravaActivityId: { type: String, unique: true }, // referencia a Strava
  name: String,
  description: String,
  distance_km: Number,
  moving_time: Number,
  elapsed_time: Number,
  average_speed: Number,
  max_speed: Number,
  total_elevation_gain: Number,
  sport_type: String,

  polyline: String,
  start_latlng: [Number],
  end_latlng: [Number],

  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  
  visibility: { type: String, enum: ["public", "group", "private"], default: "public" },

  photos: [String],
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

const RouteSchema = models.RouteSchema || model("RouteSchema", routeSchema);
export default RouteSchema