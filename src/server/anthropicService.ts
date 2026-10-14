import Anthropic, {
  APIError,
  RateLimitError,
  AuthenticationError,
  PermissionDeniedError,
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from '@anthropic-ai/sdk';
import { CADPart } from '../types/cad.js';
import {
  SUPPORTED_AI_MODELS,
  DEFAULT_ANTHROPIC_MODEL,
  isAnthropicModel,
} from '../config/aiModels.js';
import {
  getAnthropicToolDefinitions,
  executeControlledTool,
  ToolExecutionResult,
} from './viraControlledTools.js';

export class AnthropicServiceError extends Error {
  public code: string;
  public statusCode: number;
  public userMessage: string;
  public details?: any;

  constructor(message: string, code = 'ANTHROPIC_ERROR', statusCode = 500, details?: any) {
    super(message);
    this.name = 'AnthropicServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = message;
    this.details = details;
  }
}

let clientInstance: Anthropic | null = null;

/**
 * Returns lazy singleton instance of Anthropic SDK client.
 * Strictly verifies ANTHROPIC_API_KEY is present without leaking it.
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey.trim() === 'MY_ANTHROPIC_API_KEY') {
    throw new AnthropicServiceError(
      'Anthropic API key is not configured. Please add the ANTHROPIC_API_KEY secret in Google AI Studio or server environment.',
      'MISSING_API_KEY',
      400
    );
  }

  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey: apiKey.trim(),
    });
  }
  return clientInstance;
}

export interface ChatWithAnthropicParams {
  message: string;
  currentPart?: CADPart;
  history?: Array<{ role: string; content?: string; text?: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface ChatWithAnthropicResponse {
  reply: string;
  sender: 'VIRA';
  creator: 'Viraj Bansod';
  model: string;
  provider: 'anthropic';
  suggestedParamFix?: Record<string, any>;
  suggestedAction?: {
    label: string;
    prompt: string;
    paramFix?: Record<string, any>;
  };
  toolExecution?: ToolExecutionResult;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * System prompt instructing Claude to act as Vira AI:
 * The reasoning/AI layer in Cadvanta that relies on controlled engineering tools.
 */
function buildViraSystemPrompt(currentPart?: CADPart): string {
  const partContext = currentPart
    ? `\n\nACTIVE CAD SOLID MODEL IN CADVANTA VIEWPORT:
- Part Name: ${currentPart.name || 'Component'}
- Part Type: ${currentPart.part_type || 'custom'}
- Material: ${currentPart.material?.name || 'EN8 Carbon Steel'} (Density: ${currentPart.material?.density || 7850} kg/m³, Yield: ${currentPart.material?.yieldStrength || 465} MPa)
- Parameters: ${JSON.stringify(currentPart.parameters || {}, null, 2)}
- Feature Tree Count: ${currentPart.features?.length || 0} features`
    : '\n\nACTIVE CAD MODEL: No active part currently open in workspace.';

  return `You are Vira AI, the mechanical engineering assistant and reasoning layer inside Cadvanta, created by Viraj Bansod.
Accuracy is your highest priority. A wrong engineering calculation is worse than no number.

CORE PRINCIPLE: CLAUDE AS THE REASONING LAYER, NOT THE CAD ENGINE
- You are the reasoning intelligence, natural language interpreter, and mechanical consultant.
- You do NOT directly manipulate 3D geometry vertices or pretend you already rebuilt the CAD model in secret.
- When the user asks to change a dimension (e.g. "Change the shaft diameter from 20 mm to 25 mm" or "make it 200mm long"), you understand the instruction, explain the engineering impact, and call the "modify_cad_parameter" tool.
- When the user asks for mechanical calculations (stress, deflection, factor of safety, torque), call "run_engineering_calculation".
- Never guess numbers, stress formulas, or safety factors. Always invoke the app's controlled engineering tools.

RULES FOR VIRA AI:
1. NEVER GUESS NUMBERS: Always use tools or show rigorous step-by-step SI formulas.
2. COLLECT INPUTS BEFORE ACTING: If essential dimensions are missing (e.g., load or shaft span), ask for them clearly.
3. UNITS AND STANDARDS: Always state units (mm, N, MPa, kg).
4. VALIDATE DESIGNS: Check factor of safety (min 1.5 for static loads), minimum wall thickness, and edge distances.
5. HONESTY: State limits clearly and advise verifying with a licensed engineer for production equipment.
6. RESPONSE STRUCTURE:
   - Summary of understood parameters with units.
   - Engineering reasoning (stress, stiffness, or manufacturing DFM considerations).
   - Tool execution summary / proposed action for the CAD viewport.
7. REAL CAD ONLY: Never generate fake images or placeholder mockups. Everything in Cadvanta is parametric 3D CAD.

${partContext}`;
}

/**
 * Sanitizes and formats multi-turn chat history into Anthropic's expected format:
 * alternating 'user' and 'assistant' roles, starting with 'user'.
 */
function sanitizeAnthropicMessages(
  history: Array<{ role: string; content?: string; text?: string }>,
  currentMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const result: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const h of history) {
    const rawContent = (h.content || h.text || '').trim();
    if (!rawContent) continue;

    const role: 'user' | 'assistant' =
      h.role === 'user' || h.role === 'human' ? 'user' : 'assistant';

    // Ensure alternating sequence
    if (result.length > 0 && result[result.length - 1].role === role) {
      result[result.length - 1].content += `\n\n${rawContent}`;
    } else {
      result.push({ role, content: rawContent });
    }
  }

  // Ensure sequence begins with 'user'
  if (result.length > 0 && result[0].role === 'assistant') {
    result.shift();
  }

  // Append current user message
  const cleanCurrent = currentMessage.trim();
  if (result.length > 0 && result[result.length - 1].role === 'user') {
    result[result.length - 1].content += `\n\n${cleanCurrent}`;
  } else {
    result.push({ role: 'user', content: cleanCurrent });
  }

  return result;
}

/**
 * Execute chat request with Anthropic Claude through server route
 */
export async function chatWithAnthropic(
  params: ChatWithAnthropicParams
): Promise<ChatWithAnthropicResponse> {
  const {
    message,
    currentPart,
    history = [],
    model = DEFAULT_ANTHROPIC_MODEL,
    maxTokens = 1024,
    temperature = 0.2,
    timeoutMs = 25000,
  } = params;

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new AnthropicServiceError('Message text is required.', 'INVALID_REQUEST', 400);
  }

  // 1. Model ID Validation
  // Must use official Anthropic model identifier, never invented IDs
  const validAnthropicModels = SUPPORTED_AI_MODELS.filter((m) => m.provider === 'anthropic').map(
    (m) => m.id
  );

  const selectedModel = model || DEFAULT_ANTHROPIC_MODEL;
  if (!validAnthropicModels.includes(selectedModel) && !selectedModel.startsWith('claude-')) {
    throw new AnthropicServiceError(
      `Model "${selectedModel}" is not a recognized or supported Anthropic model ID. Supported models: ${validAnthropicModels.join(', ')}`,
      'INVALID_MODEL',
      400
    );
  }

  // 2. Client Initialization (validates ANTHROPIC_API_KEY)
  const client = getAnthropicClient();

  // 3. Format messages and tools
  const systemPrompt = buildViraSystemPrompt(currentPart);
  const formattedMessages = sanitizeAnthropicMessages(history, message);
  const tools = getAnthropicToolDefinitions();

  // 4. API Execution with Timeout Protection
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let anthropicResponse: Anthropic.Message;
    try {
      anthropicResponse = await client.messages.create(
        {
          model: selectedModel,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: formattedMessages,
          tools,
        },
        {
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // 5. Parse response content & tool_use blocks
    let replyText = '';
    let toolExecution: ToolExecutionResult | undefined;
    let suggestedParamFix: Record<string, any> | undefined;
    let suggestedAction: ChatWithAnthropicResponse['suggestedAction'] | undefined;

    for (const block of anthropicResponse.content) {
      if (block.type === 'text') {
        replyText += (replyText ? '\n\n' : '') + block.text;
      } else if (block.type === 'tool_use') {
        // Execute the controlled engineering tool
        const toolResult = executeControlledTool(block.name, block.input as Record<string, any>, currentPart);
        toolExecution = toolResult;

        if (toolResult.suggestedParamFix) {
          suggestedParamFix = toolResult.suggestedParamFix;
        }
        if (toolResult.suggestedAction) {
          suggestedAction = toolResult.suggestedAction;
        }

        // If no explicit text came with the tool call, use the tool's formatted user summary
        if (!replyText) {
          replyText = toolResult.userSummary;
        } else {
          replyText += `\n\n${toolResult.userSummary}`;
        }
      }
    }

    if (!replyText.trim()) {
      replyText = 'I processed your CAD engineering request. How else can I assist with this model?';
    }

    return {
      reply: replyText.trim(),
      sender: 'VIRA',
      creator: 'Viraj Bansod',
      model: selectedModel,
      provider: 'anthropic',
      suggestedParamFix,
      suggestedAction,
      toolExecution,
      usage: {
        inputTokens: anthropicResponse.usage.input_tokens,
        outputTokens: anthropicResponse.usage.output_tokens,
      },
    };
  } catch (err: any) {
    // 6. Comprehensive Error Handling
    if (err.name === 'AbortError' || err.code === 'ERR_CANCELED' || err.message?.includes('aborted')) {
      throw new AnthropicServiceError(
        `Anthropic API request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`,
        'API_TIMEOUT',
        504
      );
    }

    if (err instanceof RateLimitError || err.status === 429) {
      throw new AnthropicServiceError(
        'Anthropic API rate limit exceeded. Please wait a moment before sending another request.',
        'RATE_LIMIT_EXCEEDED',
        429,
        err.error
      );
    }

    if (err instanceof AuthenticationError || err.status === 401) {
      throw new AnthropicServiceError(
        'Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY secret in Google AI Studio.',
        'AUTHENTICATION_ERROR',
        401,
        err.error
      );
    }

    if (err instanceof PermissionDeniedError || err.status === 403) {
      throw new AnthropicServiceError(
        'Permission denied for this Anthropic model. Please verify your Anthropic account permissions.',
        'PERMISSION_DENIED',
        403,
        err.error
      );
    }

    if (err instanceof NotFoundError || err.status === 404) {
      throw new AnthropicServiceError(
        `Anthropic model "${selectedModel}" was not found or is unavailable.`,
        'INVALID_MODEL',
        404,
        err.error
      );
    }

    if (err instanceof BadRequestError || err.status === 400) {
      throw new AnthropicServiceError(
        err.message || 'Anthropic API request was rejected as invalid.',
        'BAD_REQUEST',
        400,
        err.error
      );
    }

    if (err instanceof InternalServerError || (err.status && err.status >= 500)) {
      throw new AnthropicServiceError(
        'Anthropic API service is currently experiencing technical difficulties. Please try again shortly or switch to Gemini.',
        'ANTHROPIC_SERVER_ERROR',
        502,
        err.error
      );
    }

    if (err instanceof AnthropicServiceError) {
      throw err;
    }

    // Generic fallback
    throw new AnthropicServiceError(
      err?.message || 'Unexpected error communicating with Anthropic API.',
      'ANTHROPIC_ERROR',
      500,
      err
    );
  }
}
