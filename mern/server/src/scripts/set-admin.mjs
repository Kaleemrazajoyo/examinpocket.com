import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'kaleemrjoyo@gmail.com';
  const password = 'krj@123';
  const name = 'Kaleem R Joyo';
  
  let user = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);
  if (user) {
    user.passwordHash = passwordHash;
    user.role = 'admin';
    user.name = name;
    await user.save();
    console.log('Updated admin user');
  } else {
    await User.create({ name, email, passwordHash, role: 'admin' });
    console.log('Created admin user');
  }
  await mongoose.disconnect();
}
run().catch(e => { console.error(e.message); process.exit(1); });
