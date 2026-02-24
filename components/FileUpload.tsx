'use client';

import { useCallback } from 'react';
import { Upload, X, Image, FileText } from 'lucide-react';

interface Props {
  onFileSelect: (files: File[]) => void;
  onClose: () => void;
}

export default function FileUpload({ onFileSelect, onClose }: Props) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type.startsWith('image/') || file.type === 'application/pdf',
      );
      if (files.length > 0) onFileSelect(files);
    },
    [onFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(
        (file) =>
          file.type.startsWith('image/') || file.type === 'application/pdf',
      );
      if (files.length > 0) onFileSelect(files);
    },
    [onFileSelect],
  );

  return (
    <div className="relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] z-10"
      >
        <X className="w-4 h-4" />
      </button>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 lg:p-8 text-center hover:border-[var(--accent)] transition-colors duration-300"
      >
        <div className="flex justify-center gap-3 lg:gap-4 mb-3 lg:mb-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
            <Image className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--accent)]" />
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
            <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--accent)]" />
          </div>
        </div>

        <p className="text-sm lg:text-base text-[var(--foreground)] mb-1 lg:mb-2">
          Arrastra imágenes o PDFs aquí
        </p>
        <p className="text-xs lg:text-sm text-[var(--foreground-muted)] mb-3 lg:mb-4">
          o toca para seleccionar
        </p>

        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-colors duration-300 text-sm">
          <Upload className="w-4 h-4" />
          <span>Seleccionar</span>
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        <p className="mt-3 lg:mt-4 text-[10px] lg:text-xs text-[var(--foreground-muted)]">
          Los archivos se eliminan en 30 días
        </p>
      </div>
    </div>
  );
}

