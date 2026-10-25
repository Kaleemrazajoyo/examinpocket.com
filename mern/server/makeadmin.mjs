import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const userSchema = new mongoose.Schema({name:String,email:String,passwordHash:String,role:String}, {timestamps:true});
const User = mongoose.model('User', userSchema);
const email = (process.env.ADMIN_EMAIL || 'kaleemrjoyo@examinpocket.local').toLowerCase();
const existing = await User.findOne({email});
if(existing){ console.log('exists'); process.exit(0); }
const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || '@KRj321', 12);
await User.create({name: process.env.ADMIN_NAME || 'Kaleem R Joyo', email, passwordHash: hash, role: 'admin'});
console.log('created');
process.exit(0);
