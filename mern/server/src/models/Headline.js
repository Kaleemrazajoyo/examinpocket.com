import mongoose from 'mongoose';

const headlineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Headline = mongoose.model('Headline', headlineSchema);
