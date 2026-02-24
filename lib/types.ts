export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf';
  sizeBytes?: number;
  expiresAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: FileAttachment[];
  provider?: 'openrouter' | 'openai';
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageStats {
  month: string;
  totalTokensInput: number;
  totalTokensOutput: number;
  totalCostUsd: number;
  messagesCount: number;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'openai';
  description: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  supportsVision: boolean;
}

export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'openrouter',
    description: 'Rápido y económico',
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
    supportsVision: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini (OpenRouter)',
    provider: 'openrouter',
    description: 'Equilibrado, buena calidad',
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    supportsVision: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (OpenAI)',
    provider: 'openai',
    description: 'OpenAI directo',
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    supportsVision: true,
  },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0];

