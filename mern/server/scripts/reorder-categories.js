import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Category } from '../src/models/Category.js';

// Desired top-level category sequence.
// Lower `order` = appears earlier on the site.
const desiredOrder = [
  'General Knowledge',
  'English',
  'Everyday Science',
  'Pakistan Studies',
  'Islamiat',
  'Basic Computer Operations & IT',
  'Mathematics',
  'Intelligence Tests',
  'Common Observation Questions & Amazing Facts',
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findTopLevel(name) {
  const exact = await Category.findOne({ name, parent: null });
  if (exact) return exact;
  return Category.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    parent: null,
  });
}

async function run() {
  await connectDB();

  const topLevel = await Category.find({ parent: null }).sort({ name: 1 });
  console.log(`[reorder] top-level categories found: ${topLevel.length}`);

  const used = new Set();
  let position = 1;

  for (const name of desiredOrder) {
    const category = await findTopLevel(name);
    if (!category) {
      console.log(`[reorder] NOT FOUND: ${name}`);
      continue;
    }
    category.order = position * 10;
    await category.save();
    used.add(String(category._id));
    console.log(`[reorder] ${position}. ${category.name} -> order ${category.order}`);
    position += 1;
  }

  // Any top-level category not listed keeps a stable place after the listed ones.
  let extra = position;
  for (const category of topLevel) {
    if (used.has(String(category._id))) continue;
    category.order = extra * 10;
    await category.save();
    console.log(`[reorder] (extra) ${category.name} -> order ${category.order}`);
    extra += 1;
  }

  console.log('[reorder] done');
  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error('[reorder] failed:', error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
