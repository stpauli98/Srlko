/**
 * API client for Srlko backend. Uses VITE_API_URL in production (Vercel → Railway),
 * and relative paths in development (Vite proxy → localhost:3000).
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(apiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    // Auto-logout on 401 (expired/invalid token).
    if (res.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const errorMsg = Array.isArray(body.error)
      ? body.error.map((e: { message?: string }) => e.message || 'Validation error').join(', ')
      : body.error || 'Request failed';
    throw new ApiError(errorMsg, res.status);
  }

  return res.json();
}

// ---- Auth ----

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar?: string | null;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

// ---- Channels ----

export interface ApiChannel {
  id: number;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  unreadCount: number;
  isMember: boolean;
  _count: { members: number; messages: number };
}

export interface ApiChannelDetail extends ApiChannel {
  createdBy?: number | null;
  members: Array<{
    userId: number;
    channelId: number;
    role: 'OWNER' | 'MODERATOR' | 'MEMBER';
    joinedAt: string;
    user: {
      id: number;
      name: string;
      avatar?: string | null;
    };
  }>;
}

export function getChannels() {
  return request<ApiChannel[]>('/channels');
}

export function getChannel(id: number) {
  return request<ApiChannelDetail>(`/channels/${id}`);
}

export function createChannel(name: string, isPrivate = false) {
  return request<ApiChannel>('/channels', {
    method: 'POST',
    body: JSON.stringify({ name, isPrivate }),
  });
}

export function joinChannel(id: number) {
  return request<{ message: string }>(`/channels/${id}/join`, { method: 'POST' });
}

export function leaveChannel(id: number) {
  return request<{ message: string }>(`/channels/${id}/leave`, { method: 'POST' });
}

export function markChannelReadBaseline(channelId: number) {
  return request<{ success: boolean }>(`/channels/${channelId}/read/baseline`, { method: 'POST' });
}

export function markChannelRead(channelId: number, messageId: number) {
  return request<{ success: boolean }>(`/channels/${channelId}/read`, {
    method: 'POST',
    body: JSON.stringify({ messageId }),
  });
}

export function markChannelUnread(channelId: number, messageId: number) {
  return request<{ success: boolean }>(`/channels/${channelId}/unread`, {
    method: 'POST',
    body: JSON.stringify({ messageId }),
  });
}

export function markDMUnread(userId: number, messageId: number) {
  return request<{ markedAsUnread: number }>(`/dms/${userId}/unread`, {
    method: 'POST',
    body: JSON.stringify({ messageId }),
  });
}

// ---- Messages ----

export interface ApiReaction {
  id: number;
  emoji: string;
  userId: number;
  messageId: number;
  createdAt: string;
  user: { id: number; name: string };
}

export interface ApiMessage {
  id: number;
  content: string;
  userId: number;
  channelId: number;
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: { id: number; name: string; email?: string; avatar?: string | null };
  channel?: { id: number; name: string };
  reactions: ApiReaction[];
}

export interface MessagesResponse {
  messages: ApiMessage[];
  nextCursor?: number;
  hasMore: boolean;
}

export function getMessages(channelId: number, cursor?: number, limit = 50, around?: number) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', String(cursor));
  if (around) params.set('around', String(around));
  return request<MessagesResponse>(`/channels/${channelId}/messages?${params}`);
}

export function sendMessage(channelId: number, content: string): Promise<ApiMessage> {
  return request<ApiMessage>(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ---- Reactions ----

export function addReaction(messageId: number, emoji: string) {
  return request<ApiReaction>(`/messages/${messageId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

export function removeReaction(messageId: number, emoji: string) {
  return request<{ message: string }>(
    `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    { method: 'DELETE' },
  );
}

// ---- Messages (edit/delete) ----

export function editMessage(messageId: number, content: string) {
  return request<ApiMessage>(`/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export function deleteMessage(messageId: number) {
  return request<{ message: string }>(`/messages/${messageId}`, {
    method: 'DELETE',
  });
}

// ---- Search ----

export interface SearchResult {
  id: number;
  type: 'message' | 'dm';
  content: string;
  createdAt: string;
  user: { id: number; name: string; email?: string; avatar?: string | null };
  channel?: { id: number; name: string };
  participant?: { id: number; name: string; email?: string };
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  counts: { messages: number; dms: number; total: number };
}

export function searchMessages(query: string, channelId?: number) {
  const params = new URLSearchParams({ q: query });
  if (channelId) params.set('channelId', String(channelId));
  return request<SearchResponse>(`/search?${params}`);
}

// ---- Users ----

export function getUsers(search?: string) {
  const params = new URLSearchParams({ limit: '50' });
  if (search) params.set('search', search);
  return request<AuthUser[]>(`/users?${params}`);
}

// ---- User Profile ----

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatar?: string | null;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  status?: string;
  bio?: string | null;
  createdAt: string;
  _count?: { messages: number; channels: number };
}

export function getMyProfile() {
  return request<UserProfile>('/users/me');
}

export function updateMyProfile(data: { name?: string; avatar?: string | null; status?: string; bio?: string | null }) {
  return request<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function getUserProfile(userId: number) {
  return request<UserProfile>(`/users/${userId}`);
}

// ---- Direct Messages ----

export interface ApiDMConversation {
  otherUser: { id: number; name: string; email?: string; avatar?: string | null; status?: string };
  lastMessage: { content: string; createdAt: string; fromUserId: number } | null;
  unreadCount: number;
}

export interface ApiDMReaction {
  id: number;
  emoji: string;
  userId: number;
  dmId: number;
  user: { id: number; name: string };
}

export interface ApiDirectMessage {
  id: number;
  content: string;
  fromUserId: number;
  toUserId: number;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  readAt?: string | null;
  fromUser: { id: number; name: string; email?: string; avatar?: string | null };
  toUser: { id: number; name: string; email?: string; avatar?: string | null };
  reactions?: ApiDMReaction[];
}

export function getDirectMessages() {
  return request<ApiDMConversation[]>('/dms');
}

export function getConversation(userId: number, cursor?: number, around?: number) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', String(cursor));
  if (around) params.set('around', String(around));
  return request<{ messages: ApiDirectMessage[]; hasMore: boolean }>(`/dms/${userId}?${params}`);
}

export function sendDM(toUserId: number, content: string) {
  return request<ApiDirectMessage>('/dms', {
    method: 'POST',
    body: JSON.stringify({ toUserId, content }),
  });
}

export function editDM(dmId: number, content: string) {
  return request<ApiDirectMessage>(`/dms/messages/${dmId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export function deleteDM(dmId: number) {
  return request<{ message: string }>(`/dms/messages/${dmId}`, {
    method: 'DELETE',
  });
}

export function addDMReaction(dmId: number, emoji: string) {
  return request<ApiDMReaction>(`/dms/messages/${dmId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

export function removeDMReaction(dmId: number, emoji: string) {
  return request<{ message: string }>(`/dms/messages/${dmId}/reactions/${encodeURIComponent(emoji)}`, {
    method: 'DELETE',
  });
}

// ---- Unreads ----

export function getUnreadMessages(cursor?: number, limit = 50) {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append('cursor', cursor.toString());
  return request<{
    messages: ApiMessage[];
    nextCursor?: number;
    hasMore: boolean;
  }>(`/unreads?${params}`);
}

// ---- Channel Members ----

export interface ChannelMember {
  userId: number;
  channelId: number;
  channelRole?: 'OWNER' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  user: {
    id: number;
    name: string;
    email?: string;
    avatar?: string | null;
    status: string;
    isOnline: boolean;
    lastSeen?: string;
  };
}

export function getChannelMembers(channelId: number) {
  return request<ChannelMember[]>(`/channels/${channelId}/members`);
}

export function addChannelMember(channelId: number, userId: number) {
  return request<{ message: string }>(`/channels/${channelId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export function removeChannelMember(channelId: number, userId: number) {
  return request<{ message: string }>(`/channels/${channelId}/members/${userId}`, {
    method: 'DELETE',
  });
}
