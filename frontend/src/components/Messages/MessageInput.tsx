import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  placeholder: string;
  onSend: (content: string) => Promise<void>;
  sendError: string | null;
  clearSendError: () => void;
  channelId?: number;
  dmParticipantIds?: number[];
  testIdPrefix?: string;
}

// Per-channel/DM draft storage (session-only)
const drafts = new Map<string, string>();

function getDraftKey(channelId?: number, dmParticipantIds?: number[]): string {
  if (channelId) return `ch:${channelId}`;
  if (dmParticipantIds) return `dm:${dmParticipantIds.sort().join(',')}`;
  return '';
}

export function MessageInput({ placeholder, onSend, sendError, clearSendError, channelId, dmParticipantIds, testIdPrefix }: MessageInputProps) {
  const draftKey = getDraftKey(channelId, dmParticipantIds);
  const [value, setValue] = useState<string>(() => (draftKey ? drafts.get(draftKey) ?? '' : ''));
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefix = testIdPrefix ? `${testIdPrefix}-` : '';

  // Load draft when channel/DM changes
  useEffect(() => {
    setValue(draftKey ? drafts.get(draftKey) ?? '' : '');
  }, [draftKey]);

  // Save draft on change
  useEffect(() => {
    if (!draftKey) return;
    if (value) drafts.set(draftKey, value);
    else drafts.delete(draftKey);
  }, [value, draftKey]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  const handleSend = useCallback(async () => {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await onSend(content);
      setValue('');
      if (draftKey) drafts.delete(draftKey);
    } catch {
      // Error banner will show from sendError; value is preserved
    } finally {
      setSending(false);
    }
  }, [value, onSend, sending, draftKey]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slack-border bg-white px-4 py-3">
      {sendError && (
        <div className="mb-2 flex items-center justify-between rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-[13px] text-red-800">
          <span>{sendError}</span>
          <button
            onClick={clearSendError}
            className="text-red-600 hover:text-red-800"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 rounded-md border border-slack-border bg-white px-3 py-2 focus-within:border-blue-500">
        <textarea
          ref={textareaRef}
          data-testid={`${prefix}message-input`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 resize-none border-0 bg-transparent text-[15px] leading-5 outline-none',
            'placeholder:text-gray-400',
          )}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || sending}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
            value.trim() && !sending
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
          aria-label="Send message"
          data-testid={`${prefix}send-button`}
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
