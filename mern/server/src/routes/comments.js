import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Comment } from '../models/Comment.js';
import { Mcq } from '../models/Mcq.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { publicWriteLimiter } from '../middleware/rateLimit.js';

const router = Router();

const commentBody = z.object({
  mcqId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  text: z.string().trim().min(2).max(2000),
});

// Public: comments for one MCQ. Email is never returned.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const mcqId = String(req.query.mcqId || '').trim();
    if (!mongoose.isValidObjectId(mcqId)) throw new ApiError(400, 'A valid mcqId is required');

    const comments = await Comment.find({ mcqId }).sort({ createdAt: 1 }).select('-email').lean();
    res.json({ data: { comments } });
  })
);

// Public: post a comment (auto-live). Email is stored for admin only.
router.post(
  '/',
  publicWriteLimiter,
  validate(commentBody),
  asyncHandler(async (req, res) => {
    const { mcqId, name, email, text } = req.body;
    if (!mongoose.isValidObjectId(mcqId)) throw new ApiError(400, 'A valid mcqId is required');

    const mcq = await Mcq.exists({ _id: mcqId });
    if (!mcq) throw new ApiError(404, 'MCQ not found');

    const comment = await Comment.create({ mcqId, name, email, text });
    const publicComment = comment.toObject();
    delete publicComment.email;

    res.status(201).json({ data: { comment: publicComment } });
  })
);

// Public: comment counts per MCQ (used for the card badges).
router.get(
  '/counts',
  asyncHandler(async (_req, res) => {
    const rows = await Comment.aggregate([
      { $group: { _id: '$mcqId', count: { $sum: 1 } } },
    ]);
    const counts = {};
    for (const row of rows) counts[String(row._id)] = row.count;
    res.json({ data: { counts } });
  })
);

// Admin: every comment, including email addresses.
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const comments = await Comment.find()
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate('mcqId', 'question category')
      .lean();
    res.json({ data: { comments } });
  })
);

// Admin: delete a comment.
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) throw new ApiError(404, 'Comment not found');
    res.json({ data: { ok: true } });
  })
);

export default router;
