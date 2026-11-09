import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    mcqId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mcq', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

commentSchema.index({ mcqId: 1, createdAt: -1 });

export const Comment = mongoose.model('Comment', commentSchema);
