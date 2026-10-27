import mongoose from 'mongoose';

const studyNoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    mainCategory: { type: String, trim: true, index: true },
    subCategory: { type: String, trim: true, index: true },
    category: { type: String, trim: true, index: true },
    chapter: { type: String, trim: true, default: '' },
    topic: { type: String, trim: true, default: '' },
    content: { type: String, default: '', required: true },
    bullets: [{ type: String, trim: true }],
    order: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true },
    slug: { type: String, trim: true, index: true },
    legacyId: { type: Number, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

studyNoteSchema.index({ title: 'text', content: 'text' });

export const StudyNote = mongoose.model('StudyNote', studyNoteSchema);
