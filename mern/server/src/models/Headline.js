import mongoose from 'mongoose';

const headlineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    source: { type: String, default: 'Dawn', trim: true },
    url: { type: String, default: '', trim: true },
    publishedAt: { type: Date, default: Date.now },
    legacyId: { type: Number, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Headline = mongoose.model('Headline', headlineSchema);
