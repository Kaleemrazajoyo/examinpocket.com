import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, default: 'ALL' },
    total: { type: Number, required: true },
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
    unattempted: { type: Number, required: true },
    percentage: { type: Number, required: true },
    weakSubjects: [{ category: String, wrong: Number }],
    answers: [
      {
        mcq: { type: mongoose.Schema.Types.ObjectId, ref: 'Mcq' },
        selectedIndex: { type: Number, default: null },
        correct: { type: Boolean, default: false },
      },
    ],
    startedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

attemptSchema.index({ user: 1, submittedAt: -1 });

export const TestAttempt = mongoose.model('TestAttempt', attemptSchema);
