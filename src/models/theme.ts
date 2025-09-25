import { Schema, model, models } from 'mongoose';

const ThemeDateRangeSchema = new Schema({
  theme: {
    type: String,
    enum: ['halloween', 'christmas', 'newyear'],
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
});

const ThemeSchema = new Schema(
  {
    _id: {
      type: String,
      default: 'global',
    },
    activeSeasonalTheme: {
      type: String,
      enum: ['none', 'halloween', 'christmas', 'newyear'],
      default: 'none',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    dateRanges: [ThemeDateRangeSchema],
  },
  { timestamps: true }
);

const Theme = models.Theme || model('Theme', ThemeSchema);
export default Theme;