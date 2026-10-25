import mongoose from 'mongoose';

const vocabSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, trim: true, index: true },
    type: { type: String, default: 'Word', trim: true },
    meaning: { type: String, required: true, trim: true },
    urdu: { type: String, default: '', trim: true },
    sentence: { type: String, default: '', trim: true },
    source: { type: String, default: 'Dawn Vocabulary', trim: true },
    legacyId: { type: Number, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Vocab = mongoose.model('Vocab', vocabSchema);
