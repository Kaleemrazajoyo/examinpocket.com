import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';

async function run() {
  await connectDB();
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = env;

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log('[create-admin] already exists:', existing.email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    role: 'admin',
  });

  console.log('[create-admin] created admin:', admin.email);
  process.exit(0);
}

run().catch((error) => {
  console.error('[create-admin] failed', error.message);
  process.exit(1);
});
