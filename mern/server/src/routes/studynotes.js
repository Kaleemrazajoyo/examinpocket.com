import { Router } from 'express';
import { z } from 'zod';
import { StudyNote } from '../models/StudyNote.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { escapeRegex, paged, parsePagination } from '../utils/query.js';

const router = Router();

function slugify(str = '') {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const noteBody = z.object({
  title: z.string().trim().min(2).max(200),
  mainCategory: z.string().trim().max(80).optional(),
  subCategory: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  chapter: z.string().trim().max(80).optional().default(''),
  topic: z.string().trim().max(120).optional().default(''),
  content: z.string().min(1),
  bullets: z.array(z.string().trim().min(1)).optional().default([]),
  order: z.number().int().optional().default(0),
  isPublished: z.boolean().optional().default(true),
});

const updateBody = noteBody.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 100 });
    const { q, mainCategory, subCategory, category } = req.query;

    const filter = {};
    if (subCategory && subCategory !== 'ALL') {
      filter.$or = [{ subCategory }, { category: subCategory }];
    } else if (mainCategory && mainCategory !== 'ALL') {
      filter.$or = [{ mainCategory }, { category: mainCategory }, { subCategory: mainCategory }];
    } else if (category && category !== 'ALL') {
      filter.$or = [{ category }, { subCategory: category }, { mainCategory: category }];
    }

    if (q) filter.$text = { $search: String(q) };

    const [items, total] = await Promise.all([
      StudyNote.find(filter).sort({ order: 1, createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      StudyNote.countDocuments(filter),
    ]);

    res.json({ data: paged(items, total, page, limit) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const note = await StudyNote.findById(req.params.id);
    if (!note) throw new ApiError(404, 'Study note not found');
    res.json({ data: { note } });
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(noteBody),
  asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.subCategory && !body.category) body.category = body.subCategory;
    else if (body.mainCategory && !body.category) body.category = body.mainCategory;
    if (!body.slug) body.slug = slugify(body.title);
    const note = await StudyNote.create({ ...body, createdBy: req.user.id });
    res.status(201).json({ data: { note } });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(updateBody),
  asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.subCategory && !body.category) body.category = body.subCategory;
    else if (body.mainCategory && !body.category && body.category) {}
    if (body.title && !body.slug) body.slug = slugify(body.title);
    const note = await StudyNote.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!note) throw new ApiError(404, 'Study note not found');
    res.json({ data: { note } });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const note = await StudyNote.findByIdAndDelete(req.params.id);
    if (!note) throw new ApiError(404, 'Study note not found');
    res.json({ data: { ok: true } });
  })
);

export default router;
