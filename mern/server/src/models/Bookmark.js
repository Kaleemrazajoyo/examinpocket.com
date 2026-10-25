import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemType: {
      type: String,
      enum: ['mcq', 'vocab', 'article', 'book'],
      required: true,
    },
    item: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, itemType: 1, item: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
