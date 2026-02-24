'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Paperclip, Send } from 'lucide-react';
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  LLMModel,
  Message,
} from '@/lib/types';
import { generateId } from '@/lib/id';
import MessageBubble from './MessageBubble';
import TokenStats from './TokenStats';
import FileUpload from './FileUpload';
import LLMSelector from './LLMSelector';

interface LocalFile {
  file: File;
  preview: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel>(DEFAULT_MODEL);
  const [uploadedFiles, setUploadedFiles] = useState<LocalFile[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [input]);

  const handleFileSelect = (files: File[]) => {
    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setShowFileUpload(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && uploadedFiles.length === 0) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      files: uploadedFiles.map((f) => ({
        id: generateId(),
        name: f.file.name,
        url: f.preview,
        type: f.file.type.startsWith('image/') ? 'image' : 'pdf',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      provider: selectedModel.provider,
      model: selectedModel.id,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      const { content, tokensInput = 0, tokensOutput = 0 } = data;

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'assistant') {
          last.content = content || '';
        }
        return next;
      });

      const cost =
        (tokensInput * selectedModel.costPer1kInput +
          tokensOutput * selectedModel.costPer1kOutput) /
        1000;
      setTotalCost((prev) => prev + cost);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'assistant') {
          last.tokensInput = tokensInput;
          last.tokensOutput = tokensOutput;
          last.costUsd = cost;
        }
        return next;
      });
    } catch (error) {
      console.error('Chat error', error);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'assistant') {
          last.content =
            'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.';
        }
        return next;
      });
    } finally {
      setIsLoading(false);
      setUploadedFiles([]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      <header className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white text-sm font-medium font-serif">N</span>
          </div>
          <h1 className="text-lg lg:text-xl font-serif font-medium text-[var(--foreground)]">
            Nicole
          </h1>
        </div>
        <TokenStats totalCost={totalCost} />
      </header>

      <div className="flex-1 overflow-y-auto px-3 lg:px-4 py-4 lg:py-6">
        <div className="max-w-3xl mx-auto space-y-4 lg:space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12 lg:py-20">
              <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-[var(--accent)] mx-auto mb-4 lg:mb-6 flex items-center justify-center">
                <span className="text-white text-xl lg:text-2xl font-serif">
                  N
                </span>
              </div>
              <h2 className="text-xl lg:text-2xl font-serif font-medium text-[var(--foreground)] mb-2 lg:mb-3">
                Hola, soy Nicole
              </h2>
              <p className="text-sm lg:text-base text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed px-4">
                Tu asistente de diseño de joyería. Puedo ayudarte a analizar
                moodboards, generar ideas y traducir inspiración en diseños
                concretos.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Pensando...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-3xl mx-auto p-3 lg:p-4">
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="relative">
                  {f.file.type.startsWith('image/') ? (
                    <img
                      src={f.preview}
                      alt={f.file.name}
                      className="w-14 h-14 lg:w-16 lg:h-16 object-cover rounded-lg border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] flex items-center justify-center">
                      <span className="text-xs text-[var(--foreground-muted)]">
                        PDF
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--foreground)] text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 p-2 lg:p-3 rounded-2xl border border-[var(--border)] bg-white focus-within:border-[var(--accent)] transition-colors duration-300">
              <button
                type="button"
                onClick={() => setShowFileUpload((v) => !v)}
                className="p-2 rounded-full hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>

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
                className="flex-1 resize-none bg-transparent outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[24px] max-h-[120px] lg:max-h-[150px] text-sm lg:text-base"
                rows={1}
              />

              <button
                type="submit"
                disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                className="p-2 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>

          {showFileUpload && (
            <div className="mt-3">
              <FileUpload
                onFileSelect={handleFileSelect}
                onClose={() => setShowFileUpload(false)}
              />
            </div>
          )}

          <div className="mt-2 lg:mt-3 flex items-center justify-between">
            <LLMSelector
              models={AVAILABLE_MODELS}
              selected={selectedModel}
              onSelect={setSelectedModel}
            />
            <span className="text-[10px] lg:text-xs text-[var(--foreground-muted)] hidden sm:block">
              Shift + Enter para nueva línea
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

