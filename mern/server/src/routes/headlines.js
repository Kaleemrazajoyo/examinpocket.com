import { Router } from 'express';
import { z } from 'zod';
import { Headline } from '../models/Headline.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { paged, parsePagination } from '../utils/query.js';

const router = Router();

const headlineBody = z.object({
  title: z.string().trim().min(5).max(300),
  source: z.string().trim().max(80).optional(),
  url: z.string().trim().url().or(z.literal('')).optional(),
  publishedAt: z.string().datetime().optional(),
});
const updateBody = headlineBody.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 20 });
    const [items, total] = await Promise.all([
      Headline.find({}).sort({ publishedAt: -1, _id: -1 }).skip(skip).limit(limit),
      Headline.countDocuments({}),
    ]);
    res.json({ data: paged(items, total, page, limit) });
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(headlineBody),
  asyncHandler(async (req, res) => {
    const headline = await Headline.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ data: { headline } });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(updateBody),
  asyncHandler(async (req, res) => {
    const headline = await Headline.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!headline) throw new ApiError(404, 'Headline not found');
    res.json({ data: { headline } });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const headline = await Headline.findByIdAndDelete(req.params.id);
    if (!headline) throw new ApiError(404, 'Headline not found');
    res.json({ data: { ok: true } });
  })
);

export default router;
