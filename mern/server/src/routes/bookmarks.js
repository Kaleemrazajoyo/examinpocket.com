import { Router } from 'express';
import { z } from 'zod';
import { Bookmark } from '../models/Bookmark.js';
import { Mcq } from '../models/Mcq.js';
import { Vocab } from '../models/Vocab.js';
import { Article } from '../models/Article.js';
import { Book } from '../models/Book.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';

const router = Router();

const MODELS = { mcq: Mcq, vocab: Vocab, article: Article, book: Book };

const createBody = z.object({
  itemType: z.enum(['mcq', 'vocab', 'article', 'book']),
  itemId: z.string().min(1),
});

const paramsBody = z.object({
  itemType: z.enum(['mcq', 'vocab', 'article', 'book']),
  itemId: z.string().min(1),
});

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { user: req.user.id };
    if (req.query.type && MODELS[req.query.type]) filter.itemType = req.query.type;

    const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 });

    // Group by type and fetch each collection once (no N+1 queries).
    const idsByType = { mcq: [], vocab: [], article: [], book: [] };
    for (const bookmark of bookmarks) {
      idsByType[bookmark.itemType].push(bookmark.item);
    }

    const docsByType = {};
    await Promise.all(
      Object.entries(idsByType).map(async ([type, ids]) => {
        docsByType[type] = ids.length
          ? await MODELS[type].find({ _id: { $in: ids } })
          : [];
      })
    );

    const lookup = new Map();
    for (const docs of Object.values(docsByType)) {
      for (const doc of docs) lookup.set(String(doc._id), doc);
    }

    const items = bookmarks
      .map((bookmark) => ({
        _id: bookmark._id,
        itemType: bookmark.itemType,
        item: lookup.get(String(bookmark.item)) || null,
        createdAt: bookmark.createdAt,
      }))
      .filter((entry) => entry.item);

    res.json({ data: { items, counts: countByType(items) } });
  })
);

router.post(
  '/',
  validate(createBody),
  asyncHandler(async (req, res) => {
    const { itemType, itemId } = req.body;

    const exists = await MODELS[itemType].exists({ _id: itemId });
    if (!exists) throw new ApiError(404, 'Item not found');

    const bookmark = await Bookmark.findOneAndUpdate(
      { user: req.user.id, itemType, item: itemId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ data: { bookmark } });
  })
);

router.delete(
  '/:itemType/:itemId',
  validate(paramsBody, 'params'),
  asyncHandler(async (req, res) => {
    const { itemType, itemId } = req.params;
    await Bookmark.deleteOne({ user: req.user.id, itemType, item: itemId });
    res.json({ data: { ok: true } });
  })
);

function countByType(items) {
  const counts = { mcq: 0, vocab: 0, article: 0, book: 0 };
  for (const item of items) counts[item.itemType] += 1;
  return counts;
}

export default router;
