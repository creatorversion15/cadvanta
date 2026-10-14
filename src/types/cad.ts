import * as THREE from 'three';

export type PartType =
  | 'cylinder'
  | 'shaft'
  | 'stepped_shaft'
  | 'hollow_shaft'
  | 'axle'
  | 'spindle'
  | 'torsion_shaft'
  | 'box_plate'
  | 'flange'
  | 'flange_coupling'
  | 'bracket'
  | 'bolt'
  | 'nut'
  | 'screw'
  | 'stud'
  | 'rivet'
  | 'washer'
  | 'gear'
  | 'helical_gear'
  | 'bevel_gear'
  | 'worm_gear'
  | 'rack_pinion'
  | 'bearing'
  | 'roller_bearing'
  | 'thrust_bearing'
  | 'journal_bearing'
  | 'bearing_housing'
  | 'pulley'
  | 'belt_drive'
  | 'sprocket'
  | 'chain_drive'
  | 'spring'
  | 'extension_spring'
  | 'torsion_spring'
  | 'leaf_spring'
  | 'parallel_key'
  | 'rocker_lever'
  | 'pipe_section'
  | 'pressure_vessel'
  | 'lead_screw'
  | 'hydraulic_cylinder'
  | 'planetary_gearbox'
  | 'spur_gearbox'
  | 'worm_gearbox'
  | 'crank_slider'
  | 'four_bar_mechanism'
  | 'universal_joint'
  | 'geneva_mechanism'
  | 'engine_piston'
  | 'engine_connecting_rod'
  | 'engine_crankshaft'
  | 'engine_camshaft'
  | 'engine_cylinder_head'
  | 'engine_cylinder_block'
  | 'turbocharger_impeller'
  | 'engine_flywheel'
  | 'gas_turbine_blisk'
  | 'roots_supercharger_rotor'
  | 'engine_valve'
  | 'cycloidal_drive'
  | 'clutch_pack'
  | 'assembly_custom'
  | 'sheet_metal'
  | 'surfacing'
  | 'sketch_extrusion'
  | 'custom';

export type DisplayMode = 'shaded_edges' | 'shaded' | 'wireframe' | 'xray' | 'exploded' | 'section';
export type CameraView = 'iso' | 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';
export type CameraProjection = 'perspective' | 'orthographic';
export type MeasurementMode = 'none' | 'distance' | 'diameter' | 'angle';

export interface MaterialInfo {
  id: string;
  name: string;
  standard: string;
  category: 'Ferrous' | 'Non-Ferrous' | 'Superalloy' | 'Polymer' | 'Custom';
  density: number; // g/cm³
  youngsModulus: number; // GPa
  yieldStrength: number; // MPa
  tensileStrength: number; // MPa
  poissonsRatio: number;
  thermalExpansion: number; // µm/(m·K)
  thermalConductivity: number; // W/(m·K)
  machinabilityRating: number; // %
  costPerKg: number; // Indian Rupees (₹ / kg)
  costPerKgInr?: number; // Indian Rupees (₹ / kg)
  color: string;
  roughness: number;
  metalness: number;
  description: string;
}

export interface FeatureHistoryItem {
  id: string;
  name: string;
  type: 'base' | 'extrude' | 'revolve' | 'cut' | 'hole' | 'pattern' | 'chamfer' | 'fillet' | 'bore' | 'thread' | 'keyway' | 'gear_teeth' | 'bearing_seat' | 'loft' | 'sweep' | 'bend' | 'flange' | 'custom';
  description: string;
  parameters: Record<string, any>;
  enabled: boolean;
  plane?: string;
  timestamp?: number;
}

export interface AssemblyComponent {
  id: string;
  name: string;
  partType: PartType;
  instanceName: string;
  materialId: string;
  color?: string;
  parameters: Record<string, any>;
  position: [number, number, number]; // [x, y, z] in mm
  rotation: [number, number, number]; // [rx, ry, rz] in radians
  scale?: [number, number, number];
  visible: boolean;
  isolated?: boolean;
  suppressed?: boolean;
  opacity?: number;
  explodeVector?: [number, number, number]; // vector for exploded view
  meshRef?: THREE.Object3D;
}

export interface AssemblyConstraint {
  id: string;
  type: 'coincident' | 'concentric' | 'distance' | 'angle' | 'parallel' | 'perpendicular' | 'gear_ratio' | 'revolute' | 'slider';
  componentIdA: string;
  componentIdB: string;
  value?: number;
  status: 'satisfied' | 'conflict' | 'active';
  description: string;
}

export interface CADPart {
  id: string;
  name: string;
  part_type: PartType;
  units: 'mm' | 'inch';
  parameters: Record<string, any>;
  material: MaterialInfo;
  features: FeatureHistoryItem[];
  custom_extrusion?: {
    entities: any[];
    depth: number;
    direction: 'blind' | 'symmetric';
    operation?: 'boss' | 'cut';
    plane?: 'XY' | 'XZ' | 'YZ';
  };
  components?: AssemblyComponent[]; // For multi-component assemblies
  constraints?: AssemblyConstraint[];
  isAssembly?: boolean;
  rawPrompt?: string;
  reasoning?: string[];
  stagePipeline?: {
    stage: string;
    status: 'completed' | 'in_progress' | 'pending';
    detail: string;
  }[];
  clarificationRequired?: boolean;
  clarificationQuestion?: string;
  calculatedMetrics?: {
    volume: number; // cm³
    surfaceArea: number; // cm²
    mass: number; // grams
    boundingBox: {
      x: number; // mm
      y: number; // mm
      z: number; // mm
    };
    centerOfMass: {
      x: number;
      y: number;
      z: number;
    };
    momentOfInertia?: {
      Ixx: number;
      Iyy: number;
      Izz: number;
    };
  };
  metadata?: Record<string, any>;
}

export interface EngineeringCalculationResult {
  title: string;
  category: 'Shaft & Stress' | 'Gears & Drivetrain' | 'Bearings' | 'Fasteners' | 'Springs' | 'Thermal';
  formula: string;
  inputs: Record<string, { value: number | string; unit: string; label: string }>;
  outputs: Record<string, { value: number | string; unit: string; label: string }>;
  factorOfSafety?: number;
  status: 'safe' | 'warning' | 'critical';
  interpretation: string;
  recommendations: string[];
}

export interface EngineeringCheck {
  id: string;
  severity: 'valid' | 'warning' | 'error';
  title: string;
  message: string;
  category?: 'Geometry' | 'DFM' | 'Standard' | 'Clearance';
  paramKey?: string;
  suggestedFix?: string;
  autoFixValue?: number | string;
}

export interface BOMItem {
  itemNumber: number;
  partNumber: string;
  partName: string;
  quantity: number;
  material: string;
  unitMassKg: number;
  totalMassKg: number;
  manufacturingMethod: string;
  dimensions: string;
  unitCostInr: number;
  totalCostInr: number;
  hsnCode?: string;
  unitCostUsd?: number;
  totalCostUsd?: number;
}

export interface DFMAnalysisResult {
  score: number; // 0 - 100
  recommendedProcess: string;
  estimatedMachiningTimeMin: number;
  toolAccessibility: 'Good' | 'Moderate' | 'Difficult';
  minWallThicknessMm: number;
  maxAspectDepthRatio: number;
  complianceStandard?: string;
  warnings: string[];
  costDrivers: string[];
  suggestions: string[];
}

export interface GDTFeature {
  id: string;
  featureName: string;
  symbol: 'position' | 'flatness' | 'cylindricity' | 'runout' | 'perpendicularity' | 'parallelism' | 'concentricity';
  toleranceMm: number;
  datumA?: string;
  datumB?: string;
  datumC?: string;
  materialCondition?: 'MMC' | 'LMC' | 'RFS';
  explanation: string;
}

export interface CADProject {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  lastModifiedDate: string;
  part: CADPart;
  version: number;
  history: {
    version: number;
    timestamp: string;
    prompt?: string;
    description: string;
    partSnapshot: CADPart;
  }[];
}

export interface ModelVersionSnapshot {
  id: string;
  versionNumber: number;
  versionTag: string;
  timestamp: number;
  formattedTime: string;
  actionType:
    | 'param_edit'
    | 'ai_prompt'
    | 'preset_change'
    | 'material_change'
    | 'manual_snapshot'
    | 'direct_edit'
    | 'restore'
    | 'feature_add'
    | 'feature_delete'
    | 'feature_suppress'
    | 'sketch_extrude'
    | 'part_insert';
  title: string;
  description?: string;
  part: CADPart;
  changedParameters?: { param: string; from: any; to: any }[];
}

export interface TestScenario {
  id: string;
  title: string;
  description: string;
  prompt: string;
  expectedPartType: PartType;
  expectedFeatureCountMin: number;
  isAssembly?: boolean;
}
