import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'Current Affairs', trim: true, index: true },
    author: { type: String, default: 'Editorial Team', trim: true },
    content: { type: String, default: '' },
    coverUrl: { type: String, default: '', trim: true },
    legacyId: { type: Number, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Article = mongoose.model('Article', articleSchema);
