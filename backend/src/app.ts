import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import channelRoutes from './routes/channels.js';
import messageRoutes from './routes/messages.js';
import searchRoutes from './routes/search.js';
import reactionRoutes from './routes/reactions.js';
import userRoutes from './routes/users.js';
import dmRoutes from './routes/dms.js';
import unreadRoutes from './routes/unreads.js';
import { errorHandler } from './middleware/errorHandler.js';
import { JWT_SECRET } from './config.js';

const app = express();

// Trust first proxy (Railway / nginx) for correct rate-limit keying
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'blob:', 'data:', 'https:'],
      'connect-src': ["'self'", 'wss:', 'ws:'],
      'media-src': ["'self'", 'blob:'],
    },
  },
  crossOriginEmbedderPolicy: 'credentialless' as any,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// CORS: allow a single origin in production, comma-separated list for multi-origin,
// or default to Vite dev server in development.
function parseCorsOrigin(): string | boolean | string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173';
  if (raw.includes(',')) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return raw;
}
app.use(cors({ origin: parseCorsOrigin() as any, credentials: false }));
app.use(compression());
app.use(express.json({ limit: '100kb' }));

// Rate limiting (skip in test environment)
const isTest = process.env.NODE_ENV === 'test';

const authLimiter = isTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many attempts, please try again later' },
    });

const apiLimiter = isTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later' },
      keyGenerator: (req) => {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          try {
            const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET, { algorithms: ['HS256'] }) as any;
            if (decoded.userId) return `user:${decoded.userId}`;
          } catch {}
        }
        return req.ip || 'unknown';
      },
      validate: { keyGeneratorIpFallback: false },
    });

// Cache-Control: no-store for all API responses
app.use((req, res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/channels') || req.path.startsWith('/messages') ||
      req.path.startsWith('/users') || req.path.startsWith('/dms') || req.path.startsWith('/search') ||
      req.path.startsWith('/unreads')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/channels', apiLimiter, channelRoutes);
app.use('/channels', apiLimiter, messageRoutes);
app.use('/messages', apiLimiter, reactionRoutes);
app.use('/search', apiLimiter, searchRoutes);
app.use('/users', apiLimiter, userRoutes);
app.use('/dms', apiLimiter, dmRoutes);
app.use('/unreads', apiLimiter, unreadRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

export default app;
