import { Router } from 'express';
import { z } from 'zod';
import { Mcq } from '../models/Mcq.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { escapeRegex, paged, parsePagination } from '../utils/query.js';

const router = Router();

const mcqBody = z.object({
  question: z.string().trim().min(5).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().max(4000).optional().default(''),
  category: z.string().trim().min(1).max(80),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

const updateBody = mcqBody.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 12 });
    const { q, category } = req.query;

    const filter = {};
    if (category && category !== 'ALL') filter.category = category;
    if (q) filter.question = new RegExp(escapeRegex(String(q)), 'i');

    const [items, total] = await Promise.all([
      Mcq.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Mcq.countDocuments(filter),
    ]);

    res.json({ data: paged(items, total, page, limit) });
  })
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await Mcq.distinct('category');
    res.json({ data: { categories: categories.filter(Boolean).sort() } });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const mcq = await Mcq.findById(req.params.id);
    if (!mcq) throw new ApiError(404, 'MCQ not found');
    res.json({ data: { mcq } });
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(mcqBody),
  asyncHandler(async (req, res) => {
    const mcq = await Mcq.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ data: { mcq } });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(updateBody),
  asyncHandler(async (req, res) => {
    const mcq = await Mcq.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!mcq) throw new ApiError(404, 'MCQ not found');
    res.json({ data: { mcq } });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const mcq = await Mcq.findByIdAndDelete(req.params.id);
    if (!mcq) throw new ApiError(404, 'MCQ not found');
    res.json({ data: { ok: true } });
  })
);

export default router;
