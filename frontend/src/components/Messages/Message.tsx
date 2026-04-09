import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Smile, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessageStore } from '@/stores/useMessageStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { PortalEmojiPicker } from '@/components/ui/emoji-picker';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Message as MessageType } from '@/lib/types';

interface MessageProps {
  message: MessageType;
  showHeader?: boolean;
  showAvatar?: boolean;
  isCompact?: boolean;
  onOpenThread?: (messageId: number) => void;
  readOnly?: boolean;
}

export function Message({ message, showHeader, showAvatar, readOnly }: MessageProps) {
  const showHead = showHeader !== undefined ? showHeader : showAvatar !== undefined ? showAvatar : true;
  const currentUserId = useAuthStore((s) => s.user?.id);
  const openProfile = useProfileStore((s) => s.openProfile);
  const editMessage = useMessageStore((s) => s.editMessage);
  const deleteMessage = useMessageStore((s) => s.deleteMessage);
  const addReaction = useMessageStore((s) => s.addReaction);
  const removeReaction = useMessageStore((s) => s.removeReaction);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showDelete, setShowDelete] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const reactionButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwn = message.userId === currentUserId;

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const startEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const saveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    try {
      await editMessage(message.id, trimmed);
      setIsEditing(false);
    } catch {
      // keep edit mode open so user can retry
    }
  };

  const handleReactionToggle = (emoji: string) => {
    if (!currentUserId) return;
    const existing = message.reactions.find((r) => r.emoji === emoji);
    if (existing?.userIds.includes(currentUserId)) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };

  return (
    <div className="group relative px-4 py-1 hover:bg-gray-50">
      <div className="flex gap-3">
        {showHead ? (
          <button
            onClick={() => openProfile(message.user.id)}
            className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-200"
          >
            {message.user.avatar ? (
              <img src={message.user.avatar} alt={message.user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-500 text-sm font-medium text-white">
                {message.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        ) : (
          <div className="h-0 w-10 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          {showHeader && (
            <div className="mb-0.5 flex items-baseline gap-2">
              <button
                onClick={() => openProfile(message.user.id)}
                className="text-[15px] font-bold text-gray-900 hover:underline"
              >
                {message.user.name}
              </button>
              <span className="text-[11px] text-gray-500">
                {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {message.isEdited && (
                <span className="text-[11px] text-gray-400">(edited)</span>
              )}
            </div>
          )}

          {isEditing ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="w-full rounded-md border border-blue-400 p-2 text-[15px] outline-none"
                rows={Math.min(editContent.split('\n').length, 6)}
                autoFocus
              />
              <div className="mt-1 flex gap-2">
                <button
                  onClick={saveEdit}
                  className="rounded-md bg-blue-600 px-3 py-1 text-[13px] font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-md border border-gray-300 px-3 py-1 text-[13px] font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words text-[15px] leading-5 text-gray-900">
              {message.content}
            </div>
          )}

          {message.reactions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {message.reactions.map((r) => {
                const isActive = currentUserId ? r.userIds.includes(currentUserId) : false;
                return (
                  <button
                    key={r.emoji}
                    onClick={() => handleReactionToggle(r.emoji)}
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px]',
                      isActive
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                    )}
                    title={r.userNames.join(', ')}
                  >
                    <span>{r.emoji}</span>
                    <span>{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!readOnly && (
        <div className="absolute right-4 top-1 hidden items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5 shadow-sm group-hover:flex">
          <button
            ref={reactionButtonRef}
            onClick={() => setShowEmoji(true)}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100"
            aria-label="Add reaction"
          >
            <Smile className="h-4 w-4 text-gray-600" />
          </button>
          {isOwn && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100"
                aria-label="Message actions"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-600" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 z-10 min-w-[140px] rounded-md border border-gray-200 bg-white py-1 shadow-md">
                  <button
                    onClick={() => { startEdit(); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-gray-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => { setShowDelete(true); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      {showEmoji && (
        <PortalEmojiPicker
          onEmojiSelect={(emoji) => {
            handleReactionToggle(emoji.native);
            setShowEmoji(false);
          }}
          onClickOutside={() => setShowEmoji(false)}
        />
      )}

      {showDelete && (
        <DeleteConfirmDialog
          onConfirm={() => {
            deleteMessage(message.id);
            setShowDelete(false);
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
