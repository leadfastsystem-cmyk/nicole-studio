'use client';

import { Message } from '@/lib/types';
import FileExpiryBadge from './FileExpiryBadge';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] lg:max-w-[75%] rounded-2xl px-3 lg:px-4 py-2.5 lg:py-3 ${
          isUser
            ? 'bg-[var(--message-user)] text-[var(--foreground)]'
            : 'bg-[var(--message-ai)] text-[var(--foreground)] border border-[var(--border)]'
        }`}
      >
        {message.files && message.files.length > 0 && (
          <div className="mb-2 lg:mb-3 flex flex-wrap gap-2">
            {message.files.map((file) => (
              <div key={file.id} className="relative">
                {file.type === 'image' ? (
                  <div className="relative">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="max-w-[150px] lg:max-w-[200px] max-h-[150px] lg:max-h-[200px] rounded-lg object-cover"
                    />
                    <FileExpiryBadge expiresAt={file.expiresAt} />
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--background-secondary)]">
                    <span className="text-xs lg:text-sm text-[var(--foreground-muted)]">
                      {file.name}
                    </span>
                    <FileExpiryBadge expiresAt={file.expiresAt} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
          {message.content}
        </div>

        {!isUser && message.tokensInput !== undefined && (
          <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs text-[var(--foreground-muted)] flex-wrap">
            <span>{message.model?.split('/').pop()}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              {message.tokensInput + (message.tokensOutput || 0)} tokens
            </span>
            {message.costUsd !== undefined && (
              <>
                <span>·</span>
                <span>${message.costUsd.toFixed(4)}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

