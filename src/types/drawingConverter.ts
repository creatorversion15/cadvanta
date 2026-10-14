/**
 * Vanta 2D-to-3D Intelligent CAD Converter
 * Core Data Structures and Interfaces
 */

import { CADPart, FeatureHistoryItem, PartType } from './cad';

export type DrawingFormatType = 'pdf' | 'png' | 'jpg' | 'jpeg' | 'dxf' | 'dwg';

export type DrawingProjectionType = 'third_angle' | 'first_angle' | 'unspecified';

export type DrawingViewType = 'front' | 'top' | 'right' | 'left' | 'isometric' | 'section' | 'detail';

export type DimensionType = 'linear' | 'diameter' | 'radius' | 'angle' | 'thread' | 'chamfer' | 'tolerance';

export interface DetectedDimension {
  id: string;
  label: string;
  value: number;
  originalText?: string;
  unit: 'mm' | 'inch';
  type: DimensionType;
  tolerance?: string; // e.g. "±0.1", "h6", "js6", "+0.05/-0.02"
  view: DrawingViewType;
  confidence: number; // 0.0 - 1.0
  isAmbiguous?: boolean;
  ambiguityNote?: string;
  associatedFeatureId?: string;
  sourceCoords?: { x: number; y: number; width?: number; height?: number };
}

export type FeatureOperationType =
  | 'base_extrude'
  | 'base_revolve'
  | 'step_journal'
  | 'through_hole'
  | 'blind_hole'
  | 'hole_pattern'
  | 'cut_extrude'
  | 'revolved_cut'
  | 'keyway_slot'
  | 'chamfer'
  | 'fillet'
  | 'flange_boss'
  | 'central_bore';

export interface DetectedFeatureSpec {
  id: string;
  name: string;
  operation: FeatureOperationType;
  description: string;
  parameters: Record<string, any>;
  confidence: number;
  viewReference: DrawingViewType;
  isConfirmed: boolean;
  isAmbiguous?: boolean;
}

export interface DrawingAmbiguityOption {
  id: string;
  label: string;
  description: string;
  parameterOverrides: Record<string, any>;
  isRecommended: boolean;
}

export interface DrawingAmbiguity {
  id: string;
  title: string;
  question: string;
  affectedFeatureId?: string;
  options: DrawingAmbiguityOption[];
  selectedOptionId: string;
  resolved: boolean;
}

export interface DrawingAnalysisResult {
  partName: string;
  drawingNumber?: string;
  detectedPartType: PartType;
  sourceType?: 'engineering_drawing' | 'photo';
  projection: DrawingProjectionType;
  detectedViews: DrawingViewType[];
  dimensions: DetectedDimension[];
  features: DetectedFeatureSpec[];
  customProfile2D?: { x: number; y: number }[];
  detectedShapes?: string[];
  ambiguities: DrawingAmbiguity[];
  missingDimensions: {
    featureName: string;
    description: string;
    suggestedValue: number;
    unit: 'mm' | 'inch';
    isCritical: boolean;
  }[];
  calibrationRequired?: boolean;
  calibrationReference?: {
    featureName: string;
    currentValue: number;
    suggestedUnit: 'mm' | 'inch';
    prompt: string;
  };
  overallConfidence: number; // 0.0 - 1.0
  notes: string[];
  reconstructionPlan: {
    step: number;
    operation: string;
    description: string;
    dimensionsUsed: string[];
  }[];
}

export interface ReconstructedCADModel {
  part: CADPart;
  brepSummary: {
    vertexCount: number;
    edgeCount: number;
    faceCount: number;
    solidCount: number;
    isWatertight: boolean;
  };
  metrics: {
    volumeCm3: number;
    surfaceAreaCm2: number;
    massGrams: number;
    boundingBox: { x: number; y: number; z: number };
    centerOfMass: { x: number; y: number; z: number };
  };
  validation: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
}

export interface SampleDrawingDefinition {
  id: string;
  title: string;
  partType: PartType;
  format: 'dxf' | 'png' | 'svg';
  category: 'Shafts & Rotational' | 'Plates & Prismatic' | 'Flanges & Housings' | 'Bushings & Sleeves';
  description: string;
  dimensionsSummary: string;
  thumbnailSvg: string;
  analysisPreset: DrawingAnalysisResult;
}
