import express from 'express';
import { Setting } from '../models/Setting.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const PUBLIC_KEYS = new Set(['siteTicker', 'headlinesHeading']);

router.get('/', async (_req, res, next) => {
  try {
    const items = await Setting.find({ key: { $in: Array.from(PUBLIC_KEYS) } }).lean();
    const data = {};
    for (const it of items) data[it.key] = it.value;
    res.json({ data });
  } catch (e) { next(e); }
});

router.patch('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const updates = req.body && typeof req.body === 'object' ? req.body : {};
    const result = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!PUBLIC_KEYS.has(key)) continue;
      const doc = await Setting.findOneAndUpdate(
        { key },
        { $set: { key, value } },
        { new: true, upsert: true }
      ).lean();
      result[key] = doc.value;
    }
    res.json({ data: result });
  } catch (e) { next(e); }
});

export default router;
