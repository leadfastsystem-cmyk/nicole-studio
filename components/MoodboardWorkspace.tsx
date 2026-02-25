'use client';

import { useCallback, useState } from 'react';
import { Loader2, ImagePlus, ArrowLeft, Sparkles, ImageIcon, RefreshCw } from 'lucide-react';
import TokenStats from './TokenStats';
import ChatPanel from './ChatPanel';

interface MoodboardImage {
  file: File;
  preview: string;
}

interface AdnResult {
  lineas?: string;
  texturas?: string;
  energia?: string;
}

interface MoodboardWorkspaceProps {
  onBack: () => void;
  totalCost: number;
  onAddCost: (delta: number) => void;
}

const REFINE_CHIPS = [
  'Más minimal',
  'Añadir perla',
  'Plata en vez de oro',
  'Dorado en vez de plata',
  'Fondo gris',
  'Más escultórico',
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MoodboardWorkspace({ onBack, totalCost, onAddCost }: MoodboardWorkspaceProps) {
  const [images, setImages] = useState<MoodboardImage[]>([]);
  const [adn, setAdn] = useState<AdnResult | null>(null);
  const [pieces, setPieces] = useState<string[]>([]);
  const [needMoreInfo, setNeedMoreInfo] = useState<{
    whatISee: string;
    questions: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'piezas' | 'chat'>('piezas');
  const [chatContext, setChatContext] = useState('');
  const [pieceImages, setPieceImages] = useState<Record<number, { url: string; cost: number }>>({});
  const [loadingImage, setLoadingImage] = useState<Record<number, boolean>>({});
  const [pieceRefinements, setPieceRefinements] = useState<Record<number, string>>({});

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    addImages(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith('image/'),
    );
    addImages(files);
    e.target.value = '';
  }, []);

  const addImages = (files: File[]) => {
    const newOnes = files.slice(0, 3 - images.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newOnes].slice(0, 3));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const analyzeMoodboard = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    setNeedMoreInfo(null);
    setAdn(null);
    setPieces([]);
    setPieceImages({});
    setPieceRefinements({});

    try {
      const dataUrls = await Promise.all(
        images.map((img) => fileToDataUrl(img.file)),
      );
      const res = await fetch('/api/moodboard/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: dataUrls,
          context: chatContext.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al analizar');
      }

      const data = await res.json();

      if (data.needMoreInfo) {
        setNeedMoreInfo({
          whatISee: data.whatISee || '',
          questions: data.questions || [],
        });
      } else {
        setAdn(data.adn || null);
        setPieces(data.pieces || []);
      }
    } catch (err) {
      setNeedMoreInfo({
        whatISee: err instanceof Error ? err.message : 'Error desconocido.',
        questions: [
          '¿Puedes subir imágenes más claras del moodboard?',
          '¿Hay algún contexto de colección que quieras añadir?',
        ],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPromptForPiece = (index: number) => {
    const base = pieces[index] || '';
    const ref = pieceRefinements[index]?.trim();
    return ref ? `${base}. Refinamiento: ${ref}` : base;
  };

  const generateImageForPiece = async (index: number) => {
    const prompt = getPromptForPiece(index);
    if (!prompt.trim()) return;
    setLoadingImage((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await fetch('/api/moodboard/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ piece: prompt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al generar');
      }
      const data = await res.json();
      setPieceImages((prev) => ({ ...prev, [index]: { url: data.imageUrl, cost: data.costUsd } }));
      onAddCost(data.costUsd || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImage((prev) => ({ ...prev, [index]: false }));
    }
  };

  const generateAllImages = async () => {
    for (let i = 0; i < pieces.length; i++) {
      if (!pieceImages[i]) await generateImageForPiece(i);
    }
  };

  const updatePiece = (index: number, value: string) => {
    setPieces((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addRefinementChip = (index: number, chip: string) => {
    setPieceRefinements((prev) => {
      const current = prev[index] || '';
      const added = current ? `${current}, ${chip}` : chip;
      return { ...prev, [index]: added };
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      <header className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Volver al chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white text-sm font-medium font-serif">N</span>
          </div>
          <h1 className="text-lg lg:text-xl font-serif font-medium text-[var(--foreground)]">
            Moodboard
          </h1>
        </div>
        <TokenStats totalCost={totalCost} />
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-4 p-4 lg:p-6 overflow-hidden">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div>
            <h2 className="text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Imágenes del moodboard (1–3)
            </h2>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 text-center hover:border-[var(--accent)] transition-colors min-h-[140px] flex flex-col items-center justify-center"
            >
              {images.length > 0 ? (
                <div className="flex gap-2 flex-wrap justify-center">
                  {images.map((img, i) => (
                    <div key={i} className="relative">
                      <img
                        src={img.preview}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg border border-[var(--border)]"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--foreground)] text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--accent)] transition-colors">
                      <ImagePlus className="w-6 h-6 text-[var(--foreground-muted)]" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ) : (
                <>
                  <ImagePlus className="w-10 h-10 text-[var(--foreground-muted)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--foreground-muted)] mb-2">
                    Arrastra imágenes o haz clic para subir
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-white cursor-pointer hover:bg-[var(--accent-hover)] text-sm">
                    <ImagePlus className="w-4 h-4" />
                    Seleccionar
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <button
            onClick={analyzeMoodboard}
            disabled={images.length === 0 || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generar piezas desde este moodboard
              </>
            )}
          </button>

          {adn && (
            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
                ADN de la colección
              </h3>
              <div className="space-y-2 text-sm text-[var(--foreground-muted)]">
                {adn.lineas && (
                  <p>
                    <span className="text-[var(--foreground)]">Líneas:</span>{' '}
                    {adn.lineas}
                  </p>
                )}
                {adn.texturas && (
                  <p>
                    <span className="text-[var(--foreground)]">Texturas:</span>{' '}
                    {adn.texturas}
                  </p>
                )}
                {adn.energia && (
                  <p>
                    <span className="text-[var(--foreground)]">Energía:</span>{' '}
                    {adn.energia}
                  </p>
                )}
              </div>
            </div>
          )}

          {needMoreInfo && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
                Necesito un poco más
              </h3>
              <p className="text-sm text-[var(--foreground-muted)] mb-3">
                {needMoreInfo.whatISee}
              </p>
              {needMoreInfo.questions.length > 0 && (
                <ul className="list-disc list-inside text-sm text-[var(--foreground-muted)] space-y-1 mb-3">
                  {needMoreInfo.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-[var(--foreground-muted)] border-t border-amber-200 pt-3">
                Responde en la pestaña &quot;Chat con Nicole&quot; y vuelve a pulsar &quot;Generar piezas&quot;.
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha: pestañas */}
        <div className="flex flex-col min-h-0 rounded-xl border border-[var(--border)] bg-white overflow-hidden">
          <div className="flex border-b border-[var(--border)] shrink-0">
            <button
              onClick={() => setActiveTab('piezas')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'piezas'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Piezas propuestas
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Chat con Nicole
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab === 'piezas' && (
              <div className="p-4 space-y-4">
                {pieces.length === 0 && !needMoreInfo && (
                  <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
                    Sube imágenes y pulsa &quot;Generar piezas desde este
                    moodboard&quot; para ver propuestas.
                  </p>
                )}
                {pieces.length > 0 && (
                  <button
                    type="button"
                    onClick={generateAllImages}
                    disabled={Object.keys(pieceImages).length >= pieces.length || Object.values(loadingImage).some(Boolean)}
                    className="mb-4 w-full py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] disabled:opacity-50"
                  >
                    Generar imágenes de todas las piezas
                  </button>
                )}
                {pieces.map((piece, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                  >
                    <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                      Descripción (editable)
                    </label>
                    <textarea
                      value={piece}
                      onChange={(e) => updatePiece(i, e.target.value)}
                      className="w-full text-sm text-[var(--foreground)] leading-relaxed p-2 rounded-lg border border-[var(--border)] bg-white resize-none min-h-[60px] mb-3"
                      placeholder="Describe la pieza..."
                      rows={3}
                    />
                    {pieceImages[i] ? (
                      <div className="space-y-3">
                        <img
                          src={pieceImages[i].url}
                          alt={`Pieza ${i + 1}`}
                          className="w-full max-w-xs rounded-lg border border-[var(--border)] object-cover"
                        />
                        <p className="text-xs text-[var(--foreground-muted)]">
                          Coste imagen: ${pieceImages[i].cost.toFixed(4)}
                        </p>
                        <div>
                          <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                            ¿Qué quieres cambiar?
                          </label>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {REFINE_CHIPS.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => addRefinementChip(i, chip)}
                                className="px-2 py-1 rounded-full text-xs border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={pieceRefinements[i] || ''}
                              onChange={(e) =>
                                setPieceRefinements((p) => ({ ...p, [i]: e.target.value }))
                              }
                              placeholder="O escribe tu refinamiento..."
                              className="flex-1 text-sm px-2 py-1.5 rounded-lg border border-[var(--border)] bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => generateImageForPiece(i)}
                              disabled={loadingImage[i]}
                              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[var(--accent)] text-sm text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
                            >
                              {loadingImage[i] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              Regenerar (~$0.04)
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {REFINE_CHIPS.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => addRefinementChip(i, chip)}
                              className="px-2 py-1 rounded-full text-xs border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={pieceRefinements[i] || ''}
                          onChange={(e) =>
                            setPieceRefinements((p) => ({ ...p, [i]: e.target.value }))
                          }
                          placeholder="Añade detalles antes de generar..."
                          className="w-full text-sm px-2 py-1.5 rounded-lg border border-[var(--border)] bg-white mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => generateImageForPiece(i)}
                          disabled={loadingImage[i]}
                          className="flex items-center gap-2 py-2 px-3 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] disabled:opacity-50"
                        >
                          {loadingImage[i] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4" />
                              Generar imagen (~$0.04)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'chat' && (
              <ChatPanel
                onCostChange={onAddCost}
                onUserMessage={(text) =>
                  setChatContext((prev) =>
                    prev ? `${prev}\n\n${text}` : text
                  )
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
