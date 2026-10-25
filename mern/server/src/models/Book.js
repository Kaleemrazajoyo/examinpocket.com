import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'General Knowledge', trim: true, index: true },
    sizeLabel: { type: String, default: 'PDF Book', trim: true },
    provider: {
      type: String,
      enum: ['onedrive', 'external'],
      default: 'onedrive',
    },
    url: { type: String, required: true, trim: true },
    embedUrl: { type: String, default: '', trim: true },
    downloadUrl: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    legacyId: { type: Number, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Book = mongoose.model('Book', bookSchema);
