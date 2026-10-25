import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { connectDB } from '../src/config/db.js';
import { Mcq } from '../src/models/Mcq.js';
import { Vocab } from '../src/models/Vocab.js';
import { Headline } from '../src/models/Headline.js';
import { Article } from '../src/models/Article.js';
import { Book } from '../src/models/Book.js';
import { Bookmark } from '../src/models/Bookmark.js';
import { User } from '../src/models/User.js';
import { resolveLink } from '../src/services/onedrive.js';

function readJson(file) {
  const content = fs.readFileSync(file, 'utf-8');
  return JSON.parse(content);
}

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npm run import-legacy -- <export.json>');
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');
  await connectDB();
  const json = readJson(path.resolve(file));
  const data = json.data || json;

  const mcqMap = new Map();
  const vocabMap = new Map();
  const articleMap = new Map();
  const bookMap = new Map();

  if (Array.isArray(data.mcqs)) {
    for (const item of data.mcqs) {
      const payload = { ...item };
      delete payload._id;
      const doc = dryRun ? null : await Mcq.create(payload);
      if (doc && item.id) mcqMap.set(item.id, doc._id);
    }
    console.log(`[import] mcqs: ${data.mcqs.length}`);
  }

  if (Array.isArray(data.dawnWords || data.vocab)) {
    const list = data.dawnWords || data.vocab;
    for (const item of list) {
      const payload = { ...item };
      delete payload._id;
      const doc = dryRun ? null : await Vocab.create(payload);
      if (doc && item.id) vocabMap.set(item.id, doc._id);
    }
    console.log(`[import] vocab: ${list.length}`);
  }

  if (Array.isArray(data.dawnHeadlines || data.headlines)) {
    const list = (data.dawnHeadlines || data.headlines).map((title, idx) =>
      typeof title === 'string' ? { title } : title
    );
    if (!dryRun) await Headline.insertMany(list);
    console.log(`[import] headlines: ${list.length}`);
  }

  if (Array.isArray(data.articles)) {
    for (const item of data.articles) {
      const payload = { ...item };
      delete payload._id;
      const doc = dryRun ? null : await Article.create(payload);
      if (doc && item.id) articleMap.set(item.id, doc._id);
    }
    console.log(`[import] articles: ${data.articles.length}`);
  }

  if (Array.isArray(data.library || data.books)) {
    const list = data.library || data.books;
    for (const item of list) {
      const payload = { ...item, url: item.url || '' };
      delete payload._id;
      if (!dryRun && payload.url && !payload.embedUrl) {
        try {
          const resolved = await resolveLink(payload.url);
          payload.embedUrl = resolved.embedUrl;
          payload.downloadUrl = resolved.downloadUrl;
          payload.provider = resolved.provider;
        } catch {}
      }
      const doc = dryRun ? null : await Book.create(payload);
      if (doc && item.id) bookMap.set(item.id, doc._id);
    }
    console.log(`[import] books: ${list.length}`);
  }

  const email = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1];
  if (!dryRun && email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const ops = [];
      for (const id of data.savedMcqs || []) {
        const mapped = mcqMap.get(Number(id));
        if (mapped) ops.push({ user: user._id, itemType: 'mcq', item: mapped });
      }
      for (const id of data.savedVocab || []) {
        const mapped = vocabMap.get(Number(id));
        if (mapped) ops.push({ user: user._id, itemType: 'vocab', item: mapped });
      }
      for (const id of data.savedArticles || []) {
        const mapped = articleMap.get(Number(id));
        if (mapped) ops.push({ user: user._id, itemType: 'article', item: mapped });
      }
      for (const id of data.savedBooks || []) {
        const mapped = bookMap.get(Number(id));
        if (mapped) ops.push({ user: user._id, itemType: 'book', item: mapped });
      }
      if (ops.length) {
        await Bookmark.insertMany(ops, { ordered: false });
        console.log(`[import] bookmarks for ${email}: ${ops.length}`);
      }
    }
  }

  console.log('[import] done', dryRun ? '(dry-run)' : '');
  process.exit(0);
}

run().catch((error) => {
  console.error('[import] failed', error.message);
  process.exit(1);
});
