/**
 * CADVANTA AI Model Configuration
 *
 * Central configuration registry for AI reasoning providers (Anthropic Claude & Google Gemini).
 * Allows modifying, adding, or selecting models without rewriting application logic.
 */

export type AIProvider = 'anthropic' | 'gemini';

export interface AIModelOption {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  badge?: string;
  contextWindow: number;
  supportsToolCalling: boolean;
  isDefault?: boolean;
}

/**
 * Official supported models list.
 * Anthropic model identifiers are verified against official Anthropic documentation:
 * - claude-3-7-sonnet-20250219 (Claude 3.7 Sonnet - Hybrid reasoning flagship)
 * - claude-3-5-sonnet-20241022 (Claude 3.5 Sonnet - High intelligence STEM & coding)
 * - claude-3-5-haiku-20241022  (Claude 3.5 Haiku - Ultra low-latency conversational)
 * - claude-3-opus-20240229      (Claude 3 Opus - Deep analytical reasoning)
 */
export const SUPPORTED_AI_MODELS: AIModelOption[] = [
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    description: 'Anthropic hybrid reasoning model for mechanical design and CAD logic',
    badge: 'Reasoning Flagship',
    contextWindow: 200000,
    supportsToolCalling: true,
    isDefault: false,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Industry standard for complex engineering reasoning and code generation',
    badge: 'Balanced',
    contextWindow: 200000,
    supportsToolCalling: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Ultra-fast, responsive engineering assistant for rapid Q&A',
    badge: 'Fast',
    contextWindow: 200000,
    supportsToolCalling: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    description: 'Google multimodal engineering model with live search grounding',
    badge: 'Default Gemini',
    contextWindow: 1048576,
    supportsToolCalling: true,
    isDefault: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'gemini',
    description: 'Deep STEM and advanced computational geometry analysis',
    badge: 'Pro Reasoning',
    contextWindow: 2097152,
    supportsToolCalling: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'gemini',
    description: 'Lightweight instant responses for fast design queries',
    badge: 'Lightweight',
    contextWindow: 1048576,
    supportsToolCalling: true,
  },
];

export const DEFAULT_ANTHROPIC_MODEL = 'claude-3-7-sonnet-20250219';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export function getAIModelById(id: string): AIModelOption | undefined {
  return SUPPORTED_AI_MODELS.find((m) => m.id === id);
}

export function isAnthropicModel(id: string): boolean {
  const model = getAIModelById(id);
  if (model) return model.provider === 'anthropic';
  return id.startsWith('claude-');
}

export function isGeminiModel(id: string): boolean {
  const model = getAIModelById(id);
  if (model) return model.provider === 'gemini';
  return id.startsWith('gemini-');
}

export function getDefaultModelForProvider(provider: AIProvider): string {
  return provider === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_GEMINI_MODEL;
}
