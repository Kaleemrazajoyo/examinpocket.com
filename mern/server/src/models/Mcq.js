import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4 && v.every((o) => typeof o === 'string'),
        message: 'An MCQ needs exactly 4 options',
      },
    },
    answerIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '', trim: true },
    category: { type: String, required: true, trim: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    legacyId: { type: Number, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

mcqSchema.index({ question: 'text', explanation: 'text' });

export const Mcq = mongoose.model('Mcq', mcqSchema);
