import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';
import { parseIntParam } from '../utils/params.js';
import { logError } from '../utils/logger.js';
import { isUserOnline } from '../websocket/index.js';

const router = Router();

// Strip HTML tags for defense-in-depth (React escapes output, but sanitize at API layer)
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100)
    .refine(val => !val.includes('\u0000'), { message: 'Name cannot contain null bytes' })
    .transform(stripHtml)
    .optional(),
  avatar: z.string().max(500).url({ message: 'Avatar must be a valid URL' })
    .refine((url) => url.startsWith('https://'), { message: 'Avatar URL must use HTTPS' })
    .optional().nullable(),
  status: z.enum(['online', 'away', 'busy', 'offline']).optional(),
  bio: z.string().max(500)
    .refine(val => !val.includes('\u0000'), { message: 'Bio cannot contain null bytes' })
    .transform(stripHtml)
    .optional().nullable(),
});

// GET /users/me - Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
            channels: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Enrich with real-time WebSocket presence
    const online = isUserOnline(userId);
    res.json({
      ...user,
      status: online ? 'online' : (user.status || 'offline'),
      isOnline: online,
    });
  } catch (error) {
    logError('Get profile error', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PATCH /users/me - Update current user profile
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const updates = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        status: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    logError('Update profile error', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /users/:id - Get user by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseIntParam(req.params.id);
    if (!userId) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        status: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Guests can only view profiles of shared-channel members
    if (req.user!.role === 'GUEST' && userId !== req.user!.userId) {
      const sharedChannel = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT cm1."channelId" AS id
        FROM "ChannelMember" cm1
        JOIN "ChannelMember" cm2 ON cm2."channelId" = cm1."channelId"
        WHERE cm1."userId" = ${req.user!.userId} AND cm2."userId" = ${userId}
        LIMIT 1
      `;
      if (sharedChannel.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
    }

    // Enrich with real-time presence status
    const online = isUserOnline(userId);
    const enrichedUser = {
      ...user,
      status: online ? 'online' : (user.status || 'offline'),
      isOnline: online,
    };

    res.json(enrichedUser);
  } catch (error) {
    logError('Get user error', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// GET /users - List users (for searching/mentioning)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const rawSearch = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : undefined;
    const search = rawSearch || undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    // Guests can only see users who share a channel with them
    let visibleUserIds: number[] | undefined;
    if (req.user!.role === 'GUEST') {
      const guestChannels = await prisma.channelMember.findMany({
        where: { userId: req.user!.userId },
        select: { channelId: true },
      });
      const channelIds = guestChannels.map(c => c.channelId);
      const sharedMembers = channelIds.length > 0
        ? await prisma.channelMember.findMany({
            where: { channelId: { in: channelIds } },
            select: { userId: true },
            distinct: ['userId'],
          })
        : [];
      visibleUserIds = sharedMembers.map(m => m.userId);
    }

    const where = {
      deactivatedAt: null,
      ...(visibleUserIds && { id: { in: visibleUserIds } }),
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        avatar: true,
        status: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    // Augment with real-time WebSocket presence
    const augmented = users.map((u) => ({
      ...u,
      status: isUserOnline(u.id) ? 'online' : u.status,
      isOnline: isUserOnline(u.id),
    }));

    res.json(augmented);
  } catch (error) {
    logError('List users error', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// PUT /users/me/status - Update user status
router.put('/me/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status } = z.object({
      status: z.enum(['online', 'away', 'busy', 'offline']),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    logError('Update status error', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /users/:id/presence - Get user presence status
router.get('/:id/presence', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseIntParam(req.params.id);
    if (!userId) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        lastSeen: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Guests can only check presence of shared-channel members
    if (req.user!.role === 'GUEST' && userId !== req.user!.userId) {
      const sharedChannel = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT cm1."channelId" AS id
        FROM "ChannelMember" cm1
        JOIN "ChannelMember" cm2 ON cm2."channelId" = cm1."channelId"
        WHERE cm1."userId" = ${req.user!.userId} AND cm2."userId" = ${userId}
        LIMIT 1
      `;
      if (sharedChannel.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
    }

    // Check real-time online status from WebSocket connections
    const isOnline = isUserOnline(userId);

    res.json({
      userId: user.id,
      status: isOnline ? 'online' : user.status,
      lastSeen: user.lastSeen,
      isOnline,
    });
  } catch (error) {
    logError('Get presence error', error);
    res.status(500).json({ error: 'Failed to get presence' });
  }
});

export default router;
