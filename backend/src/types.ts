import { Request } from 'express';

export interface JwtPayload {
  userId: number;
  tokenVersion?: number;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  channelId?: number;
  isChannelMember?: boolean;
  message?: any;
  dm?: any;
}
