// src/models/stravaActivity.ts
import { Schema, model, models } from "mongoose";

const StravaActivitySchema = new Schema({
  id: { type: String, required: true }, // ID de Strava
  name: { type: String, required: true },
  distance: { type: String }, // en metros
  moving_time: { type: String }, // en segundos
  average_speed: { type: String }, // en m/s
  sport_type: { type: String },
  start_date: { type: Date },
  map: {
    id: { type: String }, // id de la ruta en Strava
    summary_polyline: { type: String }, // polyline resumida
    polyline: { type: String }, // polyline detallada
    resource_tate: {type: String}
  },
  created_at: { type: Date, default: Date.now },
});

export default models.StravaActivity || model("StravaActivity", StravaActivitySchema);
