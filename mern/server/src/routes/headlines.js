import express from 'express';
import { Headline } from '../models/Headline.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const items = await Headline.find({ active: true }).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ data: { items } });
  } catch (e) { next(e); }
});

router.get('/all', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const items = await Headline.find().sort({ createdAt: -1 });
    res.json({ data: { items } });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: { message: 'Title required' } });
    const item = await Headline.create({ title });
    res.status(201).json({ data: { item } });
  } catch (e) { next(e); }
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const item = await Headline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ data: { item } });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await Headline.findByIdAndDelete(req.params.id);
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

export default router;
