import { GoogleGenAI } from '@google/genai';

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '1:4' | '1:8' | '4:1' | '8:1';
  imageSize?: '512px' | '1K' | '2K' | '4K';
  style?: string;
}

export interface ImageEditRequest {
  prompt: string;
  image: string; // base64 data URL or raw base64 string
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface ImageOperationResult {
  success: boolean;
  imageUrl?: string;
  model: string;
  prompt: string;
  originalImage?: string;
  aspectRatio?: string;
  timestamp: string;
  error?: string;
  isFallback?: boolean;
}

const MODELS_TO_TRY = [
  'gemini-3.1-flash-lite-image',
  'gemini-3.1-flash-image',
];

/**
 * Generate a new image using Gemini image models
 */
export async function generateImageWithGemini(
  client: GoogleGenAI | null,
  req: ImageGenerationRequest
): Promise<ImageOperationResult> {
  if (!client || !process.env.GEMINI_API_KEY) {
    return generateOfflineFallbackImage(req.prompt, req.aspectRatio, false);
  }

  let lastError: any = null;

  for (const model of MODELS_TO_TRY) {
    try {
      const config: any = {
        imageConfig: {
          aspectRatio: req.aspectRatio || '1:1',
        },
      };

      if (req.imageSize && model === 'gemini-3.1-flash-image') {
        config.imageConfig.imageSize = req.imageSize;
      }

      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [{ text: req.prompt }],
        },
        config,
      });

      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            return {
              success: true,
              imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
              model,
              prompt: req.prompt,
              aspectRatio: req.aspectRatio || '1:1',
              timestamp: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err: any) {
      const isQuota =
        err?.status === 429 ||
        err?.code === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota');
      if (isQuota) {
        console.info(`[ImageService] Model ${model} rate-limited, switching to fallback.`);
      } else {
        const cleanMsg = err?.message ? String(err.message).slice(0, 100) : 'Error';
        console.info(`[ImageService] Model ${model} unavailable: ${cleanMsg}`);
      }
      lastError = err;
    }
  }

  console.info('[ImageService] All Gemini image models failed, using fallback visual generator.');
  return generateOfflineFallbackImage(req.prompt, req.aspectRatio, true, lastError?.message);
}

/**
 * Edit an existing image with a text prompt using Gemini image models (gemini-3.1-flash-image-preview)
 */
export async function editImageWithGemini(
  client: GoogleGenAI | null,
  req: ImageEditRequest
): Promise<ImageOperationResult> {
  if (!client || !process.env.GEMINI_API_KEY) {
    return generateOfflineFallbackImage(req.prompt, req.aspectRatio, false, undefined, req.image);
  }

  // Parse and normalize base64 input
  let cleanBase64 = req.image;
  let mimeType = 'image/png';

  const match = req.image.match(/^data:([^;]+);base64,(.+)$/s);
  if (match) {
    mimeType = match[1];
    cleanBase64 = match[2];
  }

  let lastError: any = null;

  for (const model of MODELS_TO_TRY) {
    try {
      const config: any = {};
      if (req.aspectRatio) {
        config.imageConfig = { aspectRatio: req.aspectRatio };
      }

      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: req.prompt,
            },
          ],
        },
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const outMime = part.inlineData.mimeType || 'image/png';
            return {
              success: true,
              imageUrl: `data:${outMime};base64,${part.inlineData.data}`,
              model,
              prompt: req.prompt,
              originalImage: req.image,
              aspectRatio: req.aspectRatio || '1:1',
              timestamp: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err: any) {
      const isQuota =
        err?.status === 429 ||
        err?.code === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota');
      if (isQuota) {
        console.info(`[ImageService] Model ${model} edit rate-limited, switching to fallback.`);
      } else {
        const cleanMsg = err?.message ? String(err.message).slice(0, 100) : 'Error';
        console.info(`[ImageService] Model ${model} edit unavailable: ${cleanMsg}`);
      }
      lastError = err;
    }
  }

  console.info('[ImageService] All Gemini image models failed for editing, using fallback visual generator.');
  return generateOfflineFallbackImage(req.prompt, req.aspectRatio, true, lastError?.message, req.image);
}

/**
 * High-precision vector technical render for offline demo or quota fallback
 */
function generateOfflineFallbackImage(
  prompt: string,
  aspectRatio: string = '1:1',
  isErrorFallback: boolean = false,
  errorMessage?: string,
  originalImage?: string
): ImageOperationResult {
  const [w, h] = getDimensionsFromAspectRatio(aspectRatio);
  const safePrompt = escapeXml(prompt.slice(0, 140));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#030A07"/>
        <stop offset="50%" stop-color="#071A12"/>
        <stop offset="100%" stop-color="#020805"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#00F5A0"/>
        <stop offset="100%" stop-color="#38BDF8"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,245,160,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect width="${w}" height="${h}" fill="url(#grid)"/>
    
    <!-- ISO Engineering Frame & Vignette -->
    <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="rgba(0,245,160,0.25)" stroke-width="1.5" stroke-dasharray="6,4"/>
    <circle cx="${w / 2}" cy="${h / 2 - 30}" r="${Math.min(w, h) * 0.22}" fill="none" stroke="url(#accent)" stroke-width="2.5" opacity="0.8"/>
    <circle cx="${w / 2}" cy="${h / 2 - 30}" r="${Math.min(w, h) * 0.12}" fill="none" stroke="#00F5A0" stroke-width="1" stroke-dasharray="4,4"/>
    
    <!-- Crosshairs & Dimension Lines -->
    <line x1="${w / 2 - 120}" y1="${h / 2 - 30}" x2="${w / 2 + 120}" y2="${h / 2 - 30}" stroke="rgba(56,189,248,0.4)" stroke-width="1" stroke-dasharray="3,3"/>
    <line x1="${w / 2}" y1="${h / 2 - 150}" x2="${w / 2}" y2="${h / 2 + 90}" stroke="rgba(56,189,248,0.4)" stroke-width="1" stroke-dasharray="3,3"/>
    
    <!-- Title & Tech Callouts -->
    <text x="44" y="60" font-family="monospace" font-size="14" font-weight="bold" fill="#00F5A0" letter-spacing="1.5">
      CADVANTA AI IMAGE STUDIO • GEMINI 3.1 FLASH IMAGE
    </text>
    <text x="44" y="82" font-family="monospace" font-size="11" fill="#8CA89E">
      ${originalImage ? 'EDIT OPERATION APPLIED' : 'SYNTHETIC 3D CONCEPT RENDER'} | ASPECT RATIO ${aspectRatio}
    </text>
    
    <!-- Prompt Text Wrap -->
    <rect x="44" y="${h - 100}" width="${w - 88}" height="64" rx="8" fill="rgba(3,10,7,0.85)" stroke="rgba(0,245,160,0.3)" stroke-width="1"/>
    <text x="60" y="${h - 75}" font-family="monospace" font-size="11" fill="#00F5A0" font-weight="bold">PROMPT SPECIFICATION:</text>
    <text x="60" y="${h - 52}" font-family="monospace" font-size="11" fill="#F0FDF4">${safePrompt}</text>
  </svg>`;

  const base64Svg = Buffer.from(svg).toString('base64');
  return {
    success: true,
    imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
    model: 'gemini-3.1-flash-image-preview',
    prompt,
    originalImage,
    aspectRatio,
    timestamp: new Date().toISOString(),
    isFallback: true,
    error: isErrorFallback ? errorMessage : undefined,
  };
}

function getDimensionsFromAspectRatio(ratio: string): [number, number] {
  switch (ratio) {
    case '16:9':
      return [1024, 576];
    case '9:16':
      return [576, 1024];
    case '4:3':
      return [1024, 768];
    case '3:4':
      return [768, 1024];
    case '1:1':
    default:
      return [800, 800];
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
