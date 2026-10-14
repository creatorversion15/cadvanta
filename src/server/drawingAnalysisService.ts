/**
 * Server-Side Intelligent Drawing & Photo Analysis Service
 * Uses Google Gemini Multimodal Vision (with gemini-3.8-flash / fallback models)
 * and direct DXF vector extraction to parse 2D engineering drawings and real part photos.
 * NEVER substitutes user uploads with saved library presets.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { parseDXFString, analyzeDXFGeometry } from '../engine/dxfParser.js';
import { SAMPLE_ENGINEERING_DRAWINGS } from '../engine/drawingPreprocessor.js';
import { DrawingAnalysisResult } from '../types/drawingConverter.js';

export interface DrawingAnalysisRequest {
  filename: string;
  format: 'pdf' | 'png' | 'jpg' | 'jpeg' | 'dxf' | 'dwg';
  base64Data?: string;
  dxfContent?: string;
  presetId?: string;
  sourceType?: 'engineering_drawing' | 'photo';
  userCalibrationReference?: {
    featureKey: string;
    measuredValue: number;
    unit: 'mm' | 'inch';
  };
}

/**
 * Analyzes an uploaded drawing or photo (DXF vector or multimodal image/PDF).
 */
export async function analyzeEngineeringDrawing(
  request: DrawingAnalysisRequest,
  genAI: GoogleGenAI | null
): Promise<DrawingAnalysisResult> {
  const { filename, format, base64Data, dxfContent, presetId, sourceType, userCalibrationReference } = request;

  // 1. Explicit Preset Blueprint Selection (Only when user explicitly clicks a gallery sample)
  if (presetId) {
    const sample = SAMPLE_ENGINEERING_DRAWINGS.find((s) => s.id === presetId);
    if (sample) {
      return JSON.parse(JSON.stringify(sample.analysisPreset));
    }
  }

  // 2. DXF Vector Drawing: Direct Vector Extraction
  if ((format === 'dxf' || filename.toLowerCase().endsWith('.dxf')) && dxfContent) {
    try {
      const parsedDXF = parseDXFString(dxfContent);
      return analyzeDXFGeometry(parsedDXF, filename);
    } catch (err: any) {
      throw new Error(`DXF vector parsing failed: ${err?.message || 'Invalid or corrupted DXF file format'}`);
    }
  }

  // 3. User Uploaded Photo or Drawing Image / PDF
  if (!base64Data) {
    throw new Error('No image or vector data received for analysis. Please select a valid file.');
  }

  if (!genAI) {
    throw new Error(
      'Gemini AI Vision API key (GEMINI_API_KEY) is not configured on the server. AI-powered photo and drawing analysis requires a valid API key.'
    );
  }

  const cleanBase64 = base64Data.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '');
  const mimeType =
    format === 'pdf' ? 'application/pdf' : format === 'png' ? 'image/png' : 'image/jpeg';

  const systemInstruction = `You are a Senior CAD Kernel Engineer, Metrology Director, and Computer Vision Specialist at Cadvanta Engineering Systems.
Your task is to analyze an uploaded image, which may be either:
(A) A 2D Engineering Technical Drawing / Blueprint (orthographic views, cross-sections, OCR dimension callouts, tolerances).
(B) A Real-world Photograph of a Physical Mechanical Part (perspective view, turned part, machined plate, fastener, bracket, gear, or housing).

CRITICAL REQUIREMENTS:
1. Examine the ACTUAL image pixels. Do NOT invent generic or canned dimensions. The output must strictly reflect the visible geometry in this specific upload.
2. Determine if this is an 'engineering_drawing' or a 'photo'.
3. Classify the part archetype accurately:
   - 'stepped_shaft', 'shaft', 'spindle' (turned cylindrical bodies with shoulders)
   - 'flange' (circular disc with neck hub, center bore, bolt circle pattern)
   - 'box_plate' (rectangular/planar plate with holes/cutouts)
   - 'bracket' (L-shape, U-shape, mounting angle)
   - 'cylinder' (bushing sleeve, pipe, hollow cylinder)
   - 'gear' (toothed spur/pinion)
   - 'bolt' / 'screw' (threaded fastener with hex/socket head)
   - 'housing' (cast or machined enclosure)
4. For Engineering Drawings:
   - Perform optical character recognition (OCR) on all dimension labels, diameters (Ø), radii (R), lengths, angles, and chamfers.
   - Extract title block metadata (Part Name, Drawing Number, Material if listed).
   - Extract tolerances (e.g. '±0.1', 'h6', 'H7', 'js6').
5. For Part Photographs (Photo-to-3D):
   - Estimate realistic metric engineering dimensions (in millimeters) based on visible aspect ratios and standard mechanical sizing.
   - Mark confidence accordingly (e.g. 0.85-0.95 for clear features, 0.7-0.8 for uncalibrated depth).
   - If scale is uncalibrated, provide a calibrationReference suggesting the primary feature to measure (e.g. 'Outer Diameter' or 'Total Length').
6. Ambiguity Resolution:
   - Never guess missing critical features silently. Provide 1-2 realistic engineering interpretations in ambiguities with selectable options.
7. Features DAG:
   - Specify sequential solid modeling operations: 'base_revolve', 'base_extrude', 'step_journal', 'through_hole', 'blind_hole', 'hole_pattern', 'cut_extrude', 'keyway_slot', 'chamfer', 'fillet', 'flange_boss'.
8. If the part has an irregular or custom 2D planar perimeter, output 6 to 16 normalized polygon vertices in customProfile2D [x, y] coordinates in millimeters.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      partName: { type: Type.STRING },
      drawingNumber: { type: Type.STRING },
      detectedPartType: {
        type: Type.STRING,
        enum: [
          'stepped_shaft',
          'shaft',
          'flange',
          'box_plate',
          'cylinder',
          'bracket',
          'gear',
          'bolt',
          'nut',
          'housing',
        ],
      },
      sourceType: {
        type: Type.STRING,
        enum: ['engineering_drawing', 'photo'],
      },
      projection: {
        type: Type.STRING,
        enum: ['third_angle', 'first_angle', 'unspecified'],
      },
      detectedViews: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      detectedShapes: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      dimensions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
            value: { type: Type.NUMBER },
            unit: { type: Type.STRING, enum: ['mm', 'inch'] },
            type: {
              type: Type.STRING,
              enum: ['linear', 'diameter', 'radius', 'angle', 'thread', 'chamfer', 'tolerance'],
            },
            tolerance: { type: Type.STRING },
            view: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['id', 'label', 'value', 'unit', 'type', 'view', 'confidence'],
        },
      },
      features: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            operation: {
              type: Type.STRING,
              enum: [
                'base_extrude',
                'base_revolve',
                'step_journal',
                'through_hole',
                'blind_hole',
                'hole_pattern',
                'cut_extrude',
                'revolved_cut',
                'keyway_slot',
                'chamfer',
                'fillet',
                'flange_boss',
              ],
            },
            description: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            viewReference: { type: Type.STRING },
          },
          required: ['id', 'name', 'operation', 'description', 'confidence', 'viewReference'],
        },
      },
      customProfile2D: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER },
          },
          required: ['x', 'y'],
        },
      },
      ambiguities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  isRecommended: { type: Type.BOOLEAN },
                },
                required: ['id', 'label', 'description', 'isRecommended'],
              },
            },
            selectedOptionId: { type: Type.STRING },
            resolved: { type: Type.BOOLEAN },
          },
          required: ['id', 'title', 'question', 'options', 'selectedOptionId', 'resolved'],
        },
      },
      missingDimensions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            featureName: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedValue: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            isCritical: { type: Type.BOOLEAN },
          },
          required: ['featureName', 'description', 'suggestedValue', 'unit', 'isCritical'],
        },
      },
      calibrationRequired: { type: Type.BOOLEAN },
      calibrationReference: {
        type: Type.OBJECT,
        properties: {
          featureName: { type: Type.STRING },
          currentValue: { type: Type.NUMBER },
          suggestedUnit: { type: Type.STRING },
          prompt: { type: Type.STRING },
        },
      },
      overallConfidence: { type: Type.NUMBER },
      notes: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: [
      'partName',
      'detectedPartType',
      'sourceType',
      'projection',
      'detectedViews',
      'dimensions',
      'features',
      'overallConfidence',
    ],
  };

  const modelsToAttempt = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToAttempt) {
    try {
      const response = await genAI.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze this uploaded ${sourceType === 'photo' ? 'part photograph' : 'engineering drawing'} (${filename}). Extract exact geometric shapes, dimensions, holes, edges, and mechanical features.`,
              },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
          temperature: 0.15,
        },
      });

      if (response && response.text) {
        const parsed: DrawingAnalysisResult = JSON.parse(response.text);

        if (parsed && Array.isArray(parsed.dimensions) && parsed.dimensions.length > 0) {
          // If user provided a calibration reference measurement, scale dimensions proportionally
          if (userCalibrationReference && userCalibrationReference.measuredValue > 0) {
            const refDim = parsed.dimensions.find(
              (d) =>
                d.label.toLowerCase().includes(userCalibrationReference.featureKey.toLowerCase()) ||
                d.id === userCalibrationReference.featureKey
            );
            if (refDim && refDim.value > 0) {
              const scaleRatio = userCalibrationReference.measuredValue / refDim.value;
              if (scaleRatio > 0.05 && scaleRatio < 20) {
                parsed.dimensions.forEach((d) => {
                  if (d.type === 'linear' || d.type === 'diameter' || d.type === 'radius' || d.type === 'chamfer') {
                    d.value = Math.round(d.value * scaleRatio * 10) / 10;
                  }
                });
                if (parsed.customProfile2D) {
                  parsed.customProfile2D = parsed.customProfile2D.map((p) => ({
                    x: Math.round(p.x * scaleRatio * 10) / 10,
                    y: Math.round(p.y * scaleRatio * 10) / 10,
                  }));
                }
              }
            }
          }

          // Build sequential reconstruction plan
          parsed.reconstructionPlan = parsed.features.map((f, i) => ({
            step: i + 1,
            operation: f.name,
            description: f.description,
            dimensionsUsed: parsed.dimensions.slice(0, 3).map((d) => d.label),
          }));

          return parsed;
        }
      }
    } catch (err: any) {
      lastError = err;
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('demand');
      console.warn(`Gemini vision attempt with ${model} failed (${is503 ? '503 High Demand' : err?.message}). Trying next fallback model...`);
    }
  }

  // Never return mock data or library designs when analysis fails! Throw the real error.
  throw new Error(
    `AI Vision Analysis failed: ${lastError?.message || 'Unable to extract geometry from the uploaded file'}. Please verify the file is a clear engineering drawing or part photo.`
  );
}
