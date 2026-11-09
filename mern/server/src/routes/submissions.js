import { Router } from 'express';
import { z } from 'zod';
import { Mcq } from '../models/Mcq.js';
import { McqSubmission } from '../models/McqSubmission.js';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { publicWriteLimiter } from '../middleware/rateLimit.js';

const router = Router();

const submissionBody = z.object({
  question: z.string().trim().min(5).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().max(4000).optional().default(''),
  mainCategory: z.string().trim().max(80).optional().default(''),
  subCategory: z.string().trim().max(80).optional().default(''),
});

// Logged-in users submit an MCQ. It stays pending until an admin approves it.
router.post(
  '/',
  requireAuth,
  publicWriteLimiter,
  validate(submissionBody),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('name email');
    if (!user) throw new ApiError(401, 'Authentication required');

    const body = req.body;
    const submission = await McqSubmission.create({
      question: body.question,
      options: body.options,
      answerIndex: body.answerIndex,
      explanation: body.explanation || '',
      mainCategory: body.mainCategory || '',
      subCategory: body.subCategory || '',
      category: body.subCategory || body.mainCategory || '',
      submittedBy: user.name,
      submittedById: user._id,
      submittedByEmail: user.email,
    });

    res.status(201).json({ data: { submission } });
  })
);

// Admin: pending submissions.
router.get(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const submissions = await McqSubmission.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: { submissions } });
  })
);

// Admin: approve a submission -> becomes a normal MCQ with "Submitted by <name>".
router.post(
  '/:id/approve',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const submission = await McqSubmission.findById(req.params.id);
    if (!submission) throw new ApiError(404, 'Submission not found');

    const mcq = await Mcq.create({
      question: submission.question,
      options: submission.options,
      answerIndex: submission.answerIndex,
      explanation: submission.explanation || '',
      category: submission.category || submission.subCategory || submission.mainCategory || '',
      mainCategory: submission.mainCategory || '',
      subCategory: submission.subCategory || '',
      submittedBy: submission.submittedBy,
      createdBy: submission.submittedById,
    });

    await McqSubmission.findByIdAndDelete(submission._id);
    res.status(201).json({ data: { mcq } });
  })
);

// Admin: reject a submission -> deleted permanently.
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const submission = await McqSubmission.findByIdAndDelete(req.params.id);
    if (!submission) throw new ApiError(404, 'Submission not found');
    res.json({ data: { ok: true } });
  })
);

export default router;
