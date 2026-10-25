import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { Mcq } from '../models/Mcq.js';
import { Vocab } from '../models/Vocab.js';
import { Headline } from '../models/Headline.js';
import { Article } from '../models/Article.js';
import { Book } from '../models/Book.js';
import { User } from '../models/User.js';
import { Bookmark } from '../models/Bookmark.js';
import { TestAttempt } from '../models/TestAttempt.js';
import { resolveLink } from '../services/onedrive.js';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [mcqs, vocab, headlines, articles, books, users, bookmarks, attempts] =
      await Promise.all([
        Mcq.countDocuments(),
        Vocab.countDocuments(),
        Headline.countDocuments(),
        Article.countDocuments(),
        Book.countDocuments(),
        User.countDocuments(),
        Bookmark.countDocuments(),
        TestAttempt.countDocuments(),
      ]);

    res.json({
      data: {
        counts: { mcqs, vocab, headlines, articles, books, users, bookmarks, attempts },
      },
    });
  })
);

router.get(
  '/export',
  asyncHandler(async (_req, res) => {
    const [mcqs, vocab, headlines, articles, books, users, bookmarks, attempts] =
      await Promise.all([
        Mcq.find({}).lean(),
        Vocab.find({}).lean(),
        Headline.find({}).lean(),
        Article.find({}).lean(),
        Book.find({}).lean(),
        User.find({}).lean(),
        Bookmark.find({}).lean(),
        TestAttempt.find({}).lean(),
      ]);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="examinpocket-backup-${Date.now()}.json"`
    );

    res.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { mcqs, vocab, headlines, articles, books, users, bookmarks, attempts },
    });
  })
);

const collectionMap = {
  mcqs: Mcq,
  vocab: Vocab,
  headlines: Headline,
  articles: Article,
  books: Book,
};

router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const { data = {}, dryRun = false } = req.body || {};
    const report = {};

    for (const [key, Model] of Object.entries(collectionMap)) {
      const items = Array.isArray(data[key]) ? data[key] : [];
      report[key] = { received: items.length, imported: 0 };

      if (dryRun || items.length === 0) continue;

      // Normalize OneDrive links on import if embedUrl is missing.
      const docs = [];
      for (const item of items) {
        const doc = { ...item };
        delete doc._id;
        delete doc.__v;
        delete doc.createdAt;
        delete doc.updatedAt;

        if (key === 'books' && doc.url && !doc.embedUrl) {
          try {
            const resolved = await resolveLink(doc.url);
            doc.provider = doc.provider || resolved.provider;
            doc.embedUrl = resolved.embedUrl;
            doc.downloadUrl = resolved.downloadUrl;
          } catch {
            // Keep as-is if resolution fails; admin can fix later.
          }
        }

        docs.push(doc);
      }

      const result = await Model.insertMany(docs, { ordered: false });
      report[key].imported = result.length;
    }

    res.json({ data: { dryRun, report } });
  })
);

export default router;
