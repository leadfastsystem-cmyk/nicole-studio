'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { LLMModel } from '@/lib/types';

interface Props {
  models: LLMModel[];
  selected: LLMModel;
  onSelect: (model: LLMModel) => void;
}

export default function LLMSelector({ models, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] text-xs lg:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors duration-300"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{selected.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl border border-[var(--border)] shadow-lg overflow-hidden z-20">
            <div className="p-2">
              <p className="px-3 py-2 text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
                Seleccionar modelo
              </p>
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelect(model);
                    setOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selected.id === model.id
                      ? 'bg-[var(--background-secondary)]'
                      : 'hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {model.name}
                      </span>
                      {selected.id === model.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {model.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

