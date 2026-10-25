import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

if (isProd && jwtSecret.startsWith('dev-only')) {
  throw new Error('JWT_SECRET must be set to a strong secret in production.');
}

export const env = {
  nodeEnv,
  isProd,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/examinpocket',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  aiWindowMinutes: Number(process.env.AI_WINDOW_MINUTES || 10),
  aiMaxRequests: Number(process.env.AI_MAX_REQUESTS || 20),
  adminName: process.env.ADMIN_NAME || 'ExamInPocket Admin',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@examinpocket.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
};
