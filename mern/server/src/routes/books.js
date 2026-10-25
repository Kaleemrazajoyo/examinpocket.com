import { Router } from 'express';
import { z } from 'zod';
import { Book } from '../models/Book.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { escapeRegex, paged, parsePagination } from '../utils/query.js';
import { resolveLink } from '../services/onedrive.js';

const router = Router();

const bookBody = z.object({
  title: z.string().trim().min(3).max(300),
  category: z.string().trim().max(80).optional(),
  sizeLabel: z.string().trim().max(60).optional(),
  provider: z.enum(['onedrive', 'external']).optional(),
  url: z.string().trim().url(),
  embedUrl: z.string().trim().url().or(z.literal('')).optional(),
  downloadUrl: z.string().trim().url().or(z.literal('')).optional(),
  description: z.string().trim().max(2000).optional().default(''),
});
const updateBody = bookBody.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 20 });
    const filter = {};
    if (req.query.q) filter.title = new RegExp(escapeRegex(String(req.query.q)), 'i');
    if (req.query.category && req.query.category !== 'ALL') {
      filter.category = req.query.category;
    }

    const [items, total] = await Promise.all([
      Book.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Book.countDocuments(filter),
    ]);
    res.json({ data: paged(items, total, page, limit) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) throw new ApiError(404, 'Book not found');
    res.json({ data: { book } });
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(bookBody),
  asyncHandler(async (req, res) => {
    let payload = { ...req.body };

    // If the admin only pasted a link, normalize it on the server.
    if (!payload.embedUrl) {
      const resolved = await resolveLink(payload.url);
      payload = {
        ...payload,
        provider: resolved.provider,
        embedUrl: resolved.embedUrl,
        downloadUrl: resolved.downloadUrl,
      };
    }

    const book = await Book.create({ ...payload, createdBy: req.user.id });
    res.status(201).json({ data: { book } });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(updateBody),
  asyncHandler(async (req, res) => {
    const update = { ...req.body };

    if (update.url && !update.embedUrl) {
      const resolved = await resolveLink(update.url);
      update.provider = resolved.provider;
      update.embedUrl = resolved.embedUrl;
      update.downloadUrl = resolved.downloadUrl;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!book) throw new ApiError(404, 'Book not found');
    res.json({ data: { book } });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) throw new ApiError(404, 'Book not found');
    res.json({ data: { ok: true } });
  })
);

export default router;
