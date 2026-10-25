import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './config/env.js';
import { notFound } from './utils/errors.js';
import { errorHandler } from './middleware/error.js';

// Routes
import authRoutes from './routes/auth.js';
import mcqRoutes from './routes/mcqs.js';
import vocabRoutes from './routes/vocab.js';
import headlineRoutes from './routes/headlines.js';
import articleRoutes from './routes/articles.js';
import bookRoutes from './routes/books.js';
import bookmarkRoutes from './routes/bookmarks.js';
import attemptRoutes from './routes/attempts.js';
import aiRoutes from './routes/ai.js';
import linkRoutes from './routes/links.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', env: env.nodeEnv, time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/mcqs', mcqRoutes);
  app.use('/api/vocab', vocabRoutes);
  app.use('/api/headlines', headlineRoutes);
  app.use('/api/articles', articleRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/bookmarks', bookmarkRoutes);
  app.use('/api/attempts', attemptRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/links', linkRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
