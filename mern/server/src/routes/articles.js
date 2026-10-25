import { Router } from 'express';
import { z } from 'zod';
import { Article } from '../models/Article.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { escapeRegex, paged, parsePagination } from '../utils/query.js';

const router = Router();

const articleBody = z.object({
  title: z.string().trim().min(3).max(300),
  category: z.string().trim().max(80).optional(),
  author: z.string().trim().max(120).optional(),
  content: z.string().max(200000).optional().default(''),
  coverUrl: z.string().trim().url().or(z.literal('')).optional(),
});
const updateBody = articleBody.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 12 });
    const filter = {};
    if (req.query.q) filter.title = new RegExp(escapeRegex(String(req.query.q)), 'i');
    if (req.query.category && req.query.category !== 'ALL') {
      filter.category = req.query.category;
    }

    const [items, total] = await Promise.all([
      Article.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Article.countDocuments(filter),
    ]);

    res.json({ data: paged(items, total, page, limit) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) throw new ApiError(404, 'Article not found');
    res.json({ data: { article } });
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(articleBody),
  asyncHandler(async (req, res) => {
    const article = await Article.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ data: { article } });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(updateBody),
  asyncHandler(async (req, res) => {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!article) throw new ApiError(404, 'Article not found');
    res.json({ data: { article } });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) throw new ApiError(404, 'Article not found');
    res.json({ data: { ok: true } });
  })
);

export default router;
