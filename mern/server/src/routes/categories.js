import { Router } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category.js';
import { Mcq } from '../models/Mcq.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';

const router = Router();

const categoryBody = z.object({
  name: z.string().trim().min(2).max(80),
  parent: z.string().trim().optional().nullable().or(z.literal('')),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

router.get(
  '/tree',
  asyncHandler(async (_req, res) => {
    const all = await Category.find({ active: true }).sort({ order: 1, name: 1 }).lean();
    const map = new Map();
    all.forEach((c) => map.set(String(c._id), { ...c, children: [] }));
    const tree = [];
    map.forEach((c) => {
      if (c.parent && map.has(String(c.parent))) {
        map.get(String(c.parent)).children.push(c);
      } else if (!c.parent) {
        tree.push(c);
      } else {
        tree.push(c);
      }
    });
    res.json({ data: { tree } });
  })
);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Category.find().sort({ parent: 1, order: 1, name: 1 }).lean();
    res.json({ data: { items } });
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(categoryBody),
  asyncHandler(async (req, res) => {
    const { name, parent, order = 0, active = true } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let parentId = null;
    if (parent) {
      const p = await Category.findById(parent);
      if (!p) throw new ApiError(404, 'Parent category not found');
      parentId = p._id;
    }
    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, parent: parentId });
    if (exists) throw new ApiError(409, 'Category already exists');
    const cat = await Category.create({ name, parent: parentId, slug, order, active });
    res.status(201).json({ data: { category: cat } });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(categoryBody.partial()),
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    if (updates.name) {
      updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (updates.parent === '') updates.parent = null;
    const cat = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!cat) throw new ApiError(404, 'Category not found');
    res.json({ data: { category: cat } });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const cat = await Category.findById(req.params.id);
    if (!cat) throw new ApiError(404, 'Category not found');
    const children = await Category.countDocuments({ parent: cat._id });
    if (children > 0) throw new ApiError(400, 'Remove subcategories first');
    const used = await Mcq.countDocuments({ $or: [{ mainCategory: cat.name }, { subCategory: cat.name }, { category: cat.name }] });
    if (used > 0) throw new ApiError(400, `Cannot delete. ${used} MCQ(s) are using this category`);
    await Category.findByIdAndDelete(req.params.id);
    res.json({ data: { ok: true } });
  })
);

export default router;
