import mongoose from 'mongoose';

const mcqSubmissionSchema = new mongoose.Schema(
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
    category: { type: String, trim: true },
    mainCategory: { type: String, trim: true },
    subCategory: { type: String, trim: true },
    submittedBy: { type: String, required: true, trim: true, maxlength: 80 },
    submittedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submittedByEmail: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ['pending'], default: 'pending', index: true },
  },
  { timestamps: true }
);

mcqSubmissionSchema.index({ createdAt: -1 });

export const McqSubmission = mongoose.model('McqSubmission', mcqSubmissionSchema);
