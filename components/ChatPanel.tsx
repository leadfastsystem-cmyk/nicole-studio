'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { DEFAULT_MODEL, Message } from '@/lib/types';
import { generateId } from '@/lib/id';
import MessageBubble from './MessageBubble';

interface ChatPanelProps {
  onCostChange?: (delta: number) => void;
}

function sanitizeContent(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n');
  const maxChars = 900;
  if (text.length > maxChars) text = text.slice(0, maxChars) + '…';
  return text.trim();
}

export default function ChatPanel({ onCostChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      provider: DEFAULT_MODEL.provider,
      model: DEFAULT_MODEL.id,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: DEFAULT_MODEL.id,
        }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      const content = sanitizeContent(data.content || '');
      const tokensInput = data.tokensInput ?? 0;
      const tokensOutput = data.tokensOutput ?? 0;
      const cost =
        (tokensInput * DEFAULT_MODEL.costPer1kInput +
          tokensOutput * DEFAULT_MODEL.costPer1kOutput) /
        1000;

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'assistant') {
          last.content = content;
          last.tokensInput = tokensInput;
          last.tokensOutput = tokensOutput;
          last.costUsd = cost;
        }
        return next;
      });
      onCostChange?.(cost);
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'assistant') {
          last.content =
            'Lo siento, hubo un error. Por favor, intenta de nuevo.';
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--foreground-muted)] text-center py-6">
            Pregúntame sobre tendencias, materiales o refina las piezas propuestas.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Pensando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--border)] shrink-0"
      >
        <div className="flex gap-2 p-2 rounded-xl border border-[var(--border)] bg-[var(--background)] focus-within:border-[var(--accent)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Escribe tu mensaje..."
            className="flex-1 resize-none bg-transparent outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[24px] max-h-[100px]"
            rows={1}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
