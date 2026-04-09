import { useEffect, useRef, useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { useDMStore, type DMMessage } from '@/stores/useDMStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMobileStore } from '@/stores/useMobileStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { Avatar } from '@/components/ui/avatar';
import { MessageInput } from './MessageInput';
import { HuddleButton } from '@/components/Huddle/HuddleButton';
import { getSocket } from '@/lib/socket';

interface DMConversationProps {
  userId: number;
  userName: string;
  userAvatar?: string;
}

export function DMConversation({ userId, userName, userAvatar }: DMConversationProps) {
  const openSidebar = useMobileStore((s) => s.openSidebar);
  const openProfile = useProfileStore((s) => s.openProfile);
  const fetchConversation = useDMStore((s) => s.fetchConversation);
  const sendMessage = useDMStore((s) => s.sendMessage);
  const isLoading = useDMStore((s) => s.isLoading);
  const sendError = useDMStore((s) => s.sendError);
  const clearSendError = useDMStore((s) => s.clearSendError);
  const messagesByConv = useDMStore((s) => s.messages);
  const messages: DMMessage[] = messagesByConv[userId] ?? [];

  const currentUser = useAuthStore((s) => s.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchConversation(userId);
  }, [userId, fetchConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Join DM room for typing + reaction events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('dm:join', userId);

    const handleTypingStart = (data: { userId: number }) => {
      if (data.userId === userId) setIsTyping(true);
    };
    const handleTypingStop = (data: { userId: number }) => {
      if (data.userId === userId) setIsTyping(false);
    };
    socket.on('dm:typing:start', handleTypingStart);
    socket.on('dm:typing:stop', handleTypingStop);

    return () => {
      socket.emit('dm:leave', userId);
      socket.off('dm:typing:start', handleTypingStart);
      socket.off('dm:typing:stop', handleTypingStop);
    };
  }, [userId]);

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(userId, content);
    },
    [userId, sendMessage]
  );

  const dmParticipantIds = currentUser ? [currentUser.id, userId].sort() : undefined;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[49px] flex-shrink-0 items-center justify-between border-b border-slack-border bg-white px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={openSidebar}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-slack-hover md:hidden"
          >
            <Menu className="h-5 w-5 text-slack-secondary" />
          </button>
          <button
            onClick={() => openProfile(userId)}
            className="flex items-center gap-2 rounded px-1.5 py-0.5 hover:bg-slack-hover"
          >
            <Avatar src={userAvatar} alt={userName} fallback={userName} size="sm" />
            <span className="text-[15px] font-bold text-slack-primary">{userName}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <HuddleButton userId={userId} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading && messages.length === 0 && (
          <div className="text-center text-sm text-gray-500">Loading...</div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Start the conversation with {userName}
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.fromUserId === currentUser?.id;
          return (
            <div key={msg.id} className="mb-3 flex gap-3">
              <button
                onClick={() => openProfile(msg.fromUser.id)}
                className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-200"
              >
                {msg.fromUser.avatar ? (
                  <img src={msg.fromUser.avatar} alt={msg.fromUser.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-500 text-sm font-medium text-white">
                    {msg.fromUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline gap-2">
                  <span className="text-[15px] font-bold text-gray-900">{msg.fromUser.name}</span>
                  <span className="text-[11px] text-gray-500">
                    {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.editedAt && <span className="text-[11px] text-gray-400">(edited)</span>}
                  {isOwn && <span className="text-[11px] text-gray-400">— you</span>}
                </div>
                <div className="whitespace-pre-wrap break-words text-[15px] leading-5 text-gray-900">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="text-[12px] italic text-gray-500">{userName} is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        placeholder={`Message ${userName}`}
        onSend={handleSend}
        sendError={sendError}
        clearSendError={clearSendError}
        dmParticipantIds={dmParticipantIds}
      />
    </div>
  );
}
