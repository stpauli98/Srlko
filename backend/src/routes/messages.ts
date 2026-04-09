import { Router, Response } from 'express';
import { z } from 'zod';
import { MAX_MESSAGE_LENGTH } from '../utils/params.js';
import prisma from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireChannelMembership, requirePublicChannelReadAccess } from '../middleware/authorize.js';
import { AuthRequest } from '../types.js';
import { MESSAGE_INCLUDE_FULL } from '../db/selects.js';
import { parsePagination, paginateResults } from '../utils/pagination.js';
import { logError } from '../utils/logger.js';
import { getIO } from '../websocket/index.js';

const router = Router();

const createMessageSchema = z.object({
  content: z.string()
    .min(1)
    .max(MAX_MESSAGE_LENGTH)
    .refine((val) => val.trim().length > 0, { message: 'Message content cannot be empty' })
    .refine((val) => !val.includes('\u0000'), { message: 'Message content cannot contain null bytes' }),
});

// POST /channels/:id/messages - Send message
router.post('/:id/messages', authMiddleware, requireChannelMembership, async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.channelId!;
    const userId = req.user!.userId;
    const { content } = createMessageSchema.parse(req.body);

    // Block messaging in archived channels
    const channelRecord = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { archivedAt: true },
    });
    if (channelRecord?.archivedAt) {
      res.status(403).json({ error: 'This channel has been archived' });
      return;
    }

    const created = await prisma.message.create({
      data: { content, userId, channelId },
    });

    const finalMessage = await prisma.message.findUnique({
      where: { id: created.id },
      include: MESSAGE_INCLUDE_FULL,
    });

    // Broadcast via WebSocket so other users see the message in real-time
    const io = getIO();
    if (io && finalMessage) {
      io.to(`channel:${channelId}`).emit('message:new', finalMessage);
    }

    res.status(201).json(finalMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    logError('Send message error', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /channels/:id/messages - Get messages (paginated)
router.get('/:id/messages', authMiddleware, requirePublicChannelReadAccess, async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.channelId!;
    const { limit, cursor } = parsePagination(req);
    const aroundRaw = req.query.around ? parseInt(req.query.around as string) : undefined;
    const around = aroundRaw !== undefined && !isNaN(aroundRaw) && aroundRaw > 0 ? aroundRaw : undefined;

    // "around" mode: fetch messages surrounding a target message ID
    if (around) {
      const half = Math.floor(limit / 2);
      const [before, target, after] = await Promise.all([
        prisma.message.findMany({
          where: { channelId, deletedAt: null, id: { lt: around } },
          include: MESSAGE_INCLUDE_FULL,
          orderBy: { createdAt: 'desc' },
          take: half,
        }),
        prisma.message.findMany({
          where: { channelId, deletedAt: null, id: around },
          include: MESSAGE_INCLUDE_FULL,
          take: 1,
        }),
        prisma.message.findMany({
          where: { channelId, deletedAt: null, id: { gt: around } },
          include: MESSAGE_INCLUDE_FULL,
          orderBy: { createdAt: 'asc' },
          take: half,
        }),
      ]);
      const combined = [...before.reverse(), ...target, ...after];
      res.json({
        messages: combined,
        nextCursor: undefined,
        hasMore: false,
      });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        deletedAt: null,
      },
      include: MESSAGE_INCLUDE_FULL,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const { results: resultMessages, nextCursor, hasMore } = paginateResults(messages, limit);

    res.json({
      messages: resultMessages,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    logError('Get messages error', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

export default router;
