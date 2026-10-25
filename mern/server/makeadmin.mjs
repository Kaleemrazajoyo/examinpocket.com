import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const userSchema = new mongoose.Schema({name:String,email:String,passwordHash:String,role:String}, {timestamps:true});
const User = mongoose.model('User', userSchema);
const email = (process.env.ADMIN_EMAIL || 'kaleemrjoyo').toLowerCase();
let user = await User.findOne({email});
const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'krj@123#', 12);
if(user){
  user.passwordHash = hash;
  user.role = 'admin';
  await user.save();
  console.log('updated');
  process.exit(0);
}
await User.create({name: process.env.ADMIN_NAME || 'Kaleem R Joyo', email, passwordHash: hash, role: 'admin'});
console.log('created');
process.exit(0);
