import { Router } from 'express';
import { z } from 'zod';
import { Vocab } from '../models/Vocab.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { escapeRegex, paged, parsePagination } from '../utils/query.js';

const router = Router();

const vocabBody = z.object({
  word: z.string().trim().min(1).max(120),
  type: z.string().trim().max(40).optional(),
  meaning: z.string().trim().min(1).max(1000),
  urdu: z.string().trim().max(500).optional().default(''),
  sentence: z.string().trim().max(1000).optional().default(''),
  source: z.string().trim().max(80).optional(),
});
const updateBody = vocabBody.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 20 });
    const filter = {};
    if (req.query.q) {
      filter.$or = [
        { word: new RegExp(escapeRegex(String(req.query.q)), 'i') },
        { meaning: new RegExp(escapeRegex(String(req.query.q)), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Vocab.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Vocab.countDocuments(filter),
    ]);

    res.json({ data: paged(items, total, page, limit) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const vocab = await Vocab.findById(req.params.id);
    if (!vocab) throw new ApiError(404, 'Vocabulary entry not found');
    res.json({ data: { vocab } });
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(vocabBody),
  asyncHandler(async (req, res) => {
    const vocab = await Vocab.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ data: { vocab } });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(updateBody),
  asyncHandler(async (req, res) => {
    const vocab = await Vocab.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vocab) throw new ApiError(404, 'Vocabulary entry not found');
    res.json({ data: { vocab } });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const vocab = await Vocab.findByIdAndDelete(req.params.id);
    if (!vocab) throw new ApiError(404, 'Vocabulary entry not found');
    res.json({ data: { ok: true } });
  })
);

export default router;
