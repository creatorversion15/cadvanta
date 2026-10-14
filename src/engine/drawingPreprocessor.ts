/**
 * Drawing Preprocessing & Industrial Sample Blueprints Gallery
 * Provides image preprocessing (contrast, thresholding, deskew) and
 * pre-loaded industrial standard drawings for immediate vertical slice testing.
 */

import { SampleDrawingDefinition, DrawingAnalysisResult } from '../types/drawingConverter';

export interface PreprocessingOptions {
  contrast: number; // 0.5 - 2.0
  threshold: number; // 0 - 255
  invert: boolean;
  deskewAngleDeg: number;
}

/**
 * Preprocesses a canvas image element for clean OCR and edge detection:
 * Grayscale conversion, contrast stretching, binarization, and deskew rotation.
 */
export function preprocessDrawingCanvas(
  canvas: HTMLCanvasElement,
  options: PreprocessingOptions
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const contrastFactor = (259 * (options.contrast * 255 + 255)) / (255 * (259 - options.contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply contrast
    gray = contrastFactor * (gray - 128) + 128;

    // Apply threshold
    if (options.threshold > 0) {
      gray = gray < options.threshold ? 0 : 255;
    }

    if (options.invert) {
      gray = 255 - gray;
    }

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imgData, 0, 0);

  // Apply deskew rotation if detected
  if (Math.abs(options.deskewAngleDeg) > 0.2) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((options.deskewAngleDeg * Math.PI) / 180);
      ctx.drawImage(tempCanvas, -width / 2, -height / 2);
      ctx.restore();
    }
  }

  return canvas;
}

/**
 * Five pre-loaded industrial standard drawings ready for immediate 1-click testing.
 */
export const SAMPLE_ENGINEERING_DRAWINGS: SampleDrawingDefinition[] = [
  {
    id: 'sample_stepped_shaft',
    title: 'Stepped Transmission Drive Shaft',
    partType: 'stepped_shaft',
    format: 'svg',
    category: 'Shafts & Rotational',
    description: 'ISO 286-1 stepped rotational drive shaft with DIN 6885 keyway, Ø50mm main body, Ø35mm bearing journals, and end chamfers.',
    dimensionsSummary: 'Total L=180mm | Main Ø50mm | Step Ø35mm | Keyway 10×5×35mm',
    thumbnailSvg: `
      <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full bg-[#0F172A]">
        <rect width="400" height="240" fill="#0B132B"/>
        <line x1="20" y1="120" x2="380" y2="120" stroke="#00F5A0" stroke-dasharray="8,4" stroke-width="1.2" opacity="0.6"/>
        <!-- Journal 1 -->
        <rect x="50" y="85" width="60" height="70" fill="#1E293B" stroke="#00F5A0" stroke-width="1.8"/>
        <!-- Main Shaft -->
        <rect x="110" y="70" width="160" height="100" fill="#1E293B" stroke="#00F5A0" stroke-width="2"/>
        <!-- Journal 2 -->
        <rect x="270" y="85" width="70" height="70" fill="#1E293B" stroke="#00F5A0" stroke-width="1.8"/>
        <!-- Keyway -->
        <rect x="140" y="70" width="65" height="14" fill="#00F5A0" opacity="0.4" stroke="#00F5A0" stroke-width="1.2" stroke-dasharray="3,2"/>
        <!-- Dimensions -->
        <line x1="110" y1="52" x2="270" y2="52" stroke="#38BDF8" stroke-width="1"/>
        <text x="190" y="46" fill="#38BDF8" font-size="11" font-family="monospace" text-anchor="middle">L1=100mm</text>
        <line x1="50" y1="195" x2="340" y2="195" stroke="#38BDF8" stroke-width="1.2"/>
        <text x="195" y="212" fill="#38BDF8" font-size="13" font-family="monospace" font-weight="bold" text-anchor="middle">TOTAL L = 180 mm</text>
        <text x="190" y="125" fill="#F8FAFC" font-size="13" font-family="monospace" font-weight="bold" text-anchor="middle">Ø50 h6</text>
        <text x="80" y="125" fill="#F8FAFC" font-size="11" font-family="monospace" text-anchor="middle">Ø35 js6</text>
      </svg>
    `,
    analysisPreset: {
      partName: 'STEPPED TRANSMISSION DRIVE SHAFT',
      drawingNumber: 'MECH-DWG-8821',
      detectedPartType: 'stepped_shaft',
      projection: 'third_angle',
      detectedViews: ['front', 'top', 'right', 'isometric'],
      dimensions: [
        { id: 'd1', label: 'Total Shaft Length', value: 180, unit: 'mm', type: 'linear', tolerance: '±0.2', view: 'front', confidence: 0.99 },
        { id: 'd2', label: 'Main Center Diameter (ØD)', value: 50, unit: 'mm', type: 'diameter', tolerance: 'h6', view: 'front', confidence: 0.98 },
        { id: 'd3', label: 'Drive End Step Diameter (Ød1)', value: 35, unit: 'mm', type: 'diameter', tolerance: 'js6', view: 'front', confidence: 0.97 },
        { id: 'd4', label: 'Drive End Step Length (L1)', value: 45, unit: 'mm', type: 'linear', tolerance: '±0.1', view: 'front', confidence: 0.96 },
        { id: 'd5', label: 'Non-Drive End Diameter (Ød2)', value: 35, unit: 'mm', type: 'diameter', tolerance: 'js6', view: 'front', confidence: 0.95 },
        { id: 'd6', label: 'Non-Drive End Length (L2)', value: 35, unit: 'mm', type: 'linear', tolerance: '±0.1', view: 'front', confidence: 0.95 },
        { id: 'd7', label: 'DIN 6885 Keyway Width', value: 10, unit: 'mm', type: 'linear', tolerance: 'P9', view: 'top', confidence: 0.94 },
        { id: 'd8', label: 'DIN 6885 Keyway Depth', value: 5, unit: 'mm', type: 'linear', tolerance: '+0.2', view: 'top', confidence: 0.92 },
        { id: 'd9', label: 'DIN 6885 Keyway Length', value: 35, unit: 'mm', type: 'linear', tolerance: '±0.5', view: 'top', confidence: 0.94 },
        { id: 'd10', label: 'Shoulder Fillet Radii', value: 2.0, unit: 'mm', type: 'radius', tolerance: '±0.2', view: 'front', confidence: 0.91 },
        { id: 'd11', label: 'End Chamfer Size', value: 1.5, unit: 'mm', type: 'chamfer', tolerance: '45°', view: 'front', confidence: 0.93 },
      ],
      features: [
        {
          id: 'f1',
          name: 'Base Revolve (Main Shaft Body)',
          operation: 'base_revolve',
          description: 'Solid rotational body Ø50mm × 100mm center span',
          parameters: { diameter: 50, length: 100 },
          confidence: 0.98,
          viewReference: 'front',
          isConfirmed: true,
        },
        {
          id: 'f2',
          name: 'Drive End Journal Step 1',
          operation: 'step_journal',
          description: 'Cylindrical shoulder Ø35mm × 45mm drive journal',
          parameters: { diameter: 35, length: 45 },
          confidence: 0.97,
          viewReference: 'front',
          isConfirmed: true,
        },
        {
          id: 'f3',
          name: 'Opposite End Journal Step 2',
          operation: 'step_journal',
          description: 'Cylindrical shoulder Ø35mm × 35mm tail journal',
          parameters: { diameter: 35, length: 35 },
          confidence: 0.96,
          viewReference: 'front',
          isConfirmed: true,
        },
        {
          id: 'f4',
          name: 'DIN 6885 Form A Feather Keyway',
          operation: 'keyway_slot',
          description: 'Milled slot 10mm wide × 5mm deep × 35mm long on main crown',
          parameters: { width: 10, depth: 5, length: 35 },
          confidence: 0.94,
          viewReference: 'top',
          isConfirmed: true,
        },
        {
          id: 'f5',
          name: '1.5mm × 45° Journal Chamfers',
          operation: 'chamfer',
          description: 'Machined lead-in chamfers on both shaft ends',
          parameters: { size: 1.5, angle: 45 },
          confidence: 0.92,
          viewReference: 'front',
          isConfirmed: true,
        },
      ],
      ambiguities: [
        {
          id: 'amb_shaft_symmetry',
          title: 'Opposite Journal Geometry Callout',
          question: 'Drawing lists drive step as 45mm, tail step is 35mm. Maintain unequal step lengths?',
          options: [
            {
              id: 'opt_unequal',
              label: 'As-Drawn Unequal Steps (45mm / 35mm)',
              description: 'Preserves exact asymmetrical journal lengths per drawing dimension callouts.',
              parameterOverrides: { step1_length: 45, step2_length: 35 },
              isRecommended: true,
            },
            {
              id: 'opt_symmetric',
              label: 'Force Symmetric Journals (40mm / 40mm)',
              description: 'Equalizes journal length to 40mm on both sides.',
              parameterOverrides: { step1_length: 40, step2_length: 40 },
              isRecommended: false,
            },
          ],
          selectedOptionId: 'opt_unequal',
          resolved: true,
        },
      ],
      missingDimensions: [],
      overallConfidence: 0.96,
      notes: [
        'Recognized rotational axis along horizontal centerline.',
        'High contrast technical drawing, 11 dimensions extracted with 96% mean confidence.',
        'Profile mapped to B-Rep Revolve + Journal Extrusions + Slot Pocket.',
      ],
      reconstructionPlan: [
        { step: 1, operation: 'Base Revolve', description: 'Revolve main Ø50mm cylinder around axis', dimensionsUsed: ['Main Center Diameter', 'Total Shaft Length'] },
        { step: 2, operation: 'Journal Steps', description: 'Revolve left & right stepped journals Ø35mm', dimensionsUsed: ['Drive End Step Diameter', 'Drive End Step Length'] },
        { step: 3, operation: 'Cut Keyway', description: 'Pocket cut keyway slot 10×5×35mm DIN 6885', dimensionsUsed: ['Keyway Width', 'Keyway Depth', 'Keyway Length'] },
        { step: 4, operation: 'Chamfer & Fillet', description: 'Apply 1.5mm 45° end chamfers and R2 shoulder fillets', dimensionsUsed: ['End Chamfer Size', 'Shoulder Fillet Radii'] },
      ],
    },
  },
  {
    id: 'sample_mounting_plate',
    title: '4-Hole Flanged Mounting Base Plate',
    partType: 'box_plate',
    format: 'svg',
    category: 'Plates & Prismatic',
    description: 'Precision machined rectangular mounting base plate with central clearance bore, 4x corner mounting holes, and rounded corner radii.',
    dimensionsSummary: '160×120×15mm | Central Bore Ø40mm | 4x M10 Holes (Ø11mm)',
    thumbnailSvg: `
      <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full bg-[#0F172A]">
        <rect width="400" height="240" fill="#0B132B"/>
        <!-- Main Plate -->
        <rect x="70" y="40" width="260" height="160" rx="14" fill="#1E293B" stroke="#00F5A0" stroke-width="2"/>
        <!-- Center Bore -->
        <circle cx="200" cy="120" r="30" fill="#0B132B" stroke="#00F5A0" stroke-width="1.8"/>
        <!-- Centerlines -->
        <line x1="150" y1="120" x2="250" y2="120" stroke="#38BDF8" stroke-dasharray="6,3" stroke-width="1"/>
        <line x1="200" y1="70" x2="200" y2="170" stroke="#38BDF8" stroke-dasharray="6,3" stroke-width="1"/>
        <!-- 4 Mounting Holes -->
        <circle cx="105" cy="72" r="10" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <circle cx="295" cy="72" r="10" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <circle cx="105" cy="168" r="10" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <circle cx="295" cy="168" r="10" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <!-- Labels -->
        <text x="200" y="125" fill="#38BDF8" font-size="12" font-family="monospace" font-weight="bold" text-anchor="middle">Ø40 H8</text>
        <text x="200" y="222" fill="#F8FAFC" font-size="13" font-family="monospace" font-weight="bold" text-anchor="middle">160 × 120 × 15 mm</text>
        <text x="105" y="58" fill="#38BDF8" font-size="10" font-family="monospace" text-anchor="middle">4x Ø11</text>
      </svg>
    `,
    analysisPreset: {
      partName: '4-HOLE FLANGED MOUNTING BASE PLATE',
      drawingNumber: 'MECH-DWG-4012',
      detectedPartType: 'box_plate',
      projection: 'third_angle',
      detectedViews: ['top', 'front', 'isometric'],
      dimensions: [
        { id: 'd1', label: 'Overall Plate Length (X)', value: 160, unit: 'mm', type: 'linear', tolerance: '±0.2', view: 'top', confidence: 0.99 },
        { id: 'd2', label: 'Overall Plate Width (Y)', value: 120, unit: 'mm', type: 'linear', tolerance: '±0.2', view: 'top', confidence: 0.99 },
        { id: 'd3', label: 'Plate Thickness (Z)', value: 15, unit: 'mm', type: 'linear', tolerance: '±0.1', view: 'front', confidence: 0.98 },
        { id: 'd4', label: 'Central Clearance Bore (Ø)', value: 40, unit: 'mm', type: 'diameter', tolerance: 'H8', view: 'top', confidence: 0.97 },
        { id: 'd5', label: '4x Corner Mounting Holes (Ø)', value: 11, unit: 'mm', type: 'diameter', tolerance: '±0.15', view: 'top', confidence: 0.96 },
        { id: 'd6', label: 'Mounting Hole Pitch X', value: 120, unit: 'mm', type: 'linear', tolerance: '±0.1', view: 'top', confidence: 0.95 },
        { id: 'd7', label: 'Mounting Hole Pitch Y', value: 80, unit: 'mm', type: 'linear', tolerance: '±0.1', view: 'top', confidence: 0.95 },
        { id: 'd8', label: 'Corner Fillet Radius (R)', value: 8, unit: 'mm', type: 'radius', tolerance: '±0.5', view: 'top', confidence: 0.93 },
      ],
      features: [
        {
          id: 'f1',
          name: 'Base Plate Sketch & Extrusion',
          operation: 'base_extrude',
          description: 'Extrude 160mm × 120mm rectangular profile with 15mm thickness',
          parameters: { length: 160, width: 120, thickness: 15 },
          confidence: 0.98,
          viewReference: 'top',
          isConfirmed: true,
        },
        {
          id: 'f2',
          name: 'Central Through-Bore',
          operation: 'through_hole',
          description: 'Hole feature Ø40mm concentric with plate origin, through all',
          parameters: { diameter: 40, is_through: true },
          confidence: 0.97,
          viewReference: 'top',
          isConfirmed: true,
        },
        {
          id: 'f3',
          name: '4x Corner Mounting Holes',
          operation: 'hole_pattern',
          description: 'Rectangular pattern of 4x Ø11mm clearance holes at 120×80mm spacing',
          parameters: { diameter: 11, spacingX: 120, spacingY: 80, count: 4 },
          confidence: 0.96,
          viewReference: 'top',
          isConfirmed: true,
        },
        {
          id: 'f4',
          name: 'Corner Fillets R8mm',
          operation: 'fillet',
          description: '8mm radius fillets applied to 4 vertical corners',
          parameters: { radius: 8 },
          confidence: 0.93,
          viewReference: 'top',
          isConfirmed: true,
        },
      ],
      ambiguities: [
        {
          id: 'amb_bore_type',
          title: 'Central Bore Depth Type',
          question: 'Side view does not specify whether Ø40mm bore is counterbored or through-all.',
          options: [
            {
              id: 'opt_through',
              label: 'Through-All Clearance Bore',
              description: 'Passes completely through 15mm plate thickness for shaft/conduit passage.',
              parameterOverrides: { is_through: true },
              isRecommended: true,
            },
            {
              id: 'opt_counterbore',
              label: 'Stepped Counterbore Seat (10mm depth)',
              description: 'Provides a recessed bearing/seal locating shoulder.',
              parameterOverrides: { is_through: false, depth: 10 },
              isRecommended: false,
            },
          ],
          selectedOptionId: 'opt_through',
          resolved: true,
        },
      ],
      missingDimensions: [],
      overallConfidence: 0.97,
      notes: [
        'Prismatic plate archetype identified.',
        'Symmetric 4-hole mounting pattern detected on 120×80mm grid.',
        'Extrusion with CSG hole cutouts and corner blends.',
      ],
      reconstructionPlan: [
        { step: 1, operation: 'Sketch Profile', description: 'Construct 160×120mm rectangular perimeter', dimensionsUsed: ['Overall Plate Length', 'Overall Plate Width'] },
        { step: 2, operation: 'Base Extrusion', description: 'Extrude 15mm along Z axis', dimensionsUsed: ['Plate Thickness'] },
        { step: 3, operation: 'Bore Cutout', description: 'Through-cut central cylinder Ø40mm', dimensionsUsed: ['Central Clearance Bore'] },
        { step: 4, operation: 'Hole Pattern', description: 'Drill 4x Ø11mm holes at 120×80mm offsets', dimensionsUsed: ['4x Corner Mounting Holes', 'Mounting Hole Pitch X', 'Mounting Hole Pitch Y'] },
        { step: 5, operation: 'Corner Blend', description: 'Apply 8mm fillets to 4 corners', dimensionsUsed: ['Corner Fillet Radius'] },
      ],
    },
  },
  {
    id: 'sample_pipe_flange',
    title: 'Heavy-Duty Pipe Coupling Flange',
    partType: 'flange',
    format: 'svg',
    category: 'Flanges & Housings',
    description: 'DIN EN 1092-1 weld-neck pipe coupling flange with raised face, 4x bolt holes on Ø125mm PCD, raised hub collar, and central through-bore.',
    dimensionsSummary: 'Outer Ø160mm | Hub Ø90mm × 28mm | Bore Ø45mm | 4x Ø14mm on Ø125 PCD',
    thumbnailSvg: `
      <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full bg-[#0F172A]">
        <rect width="400" height="240" fill="#0B132B"/>
        <!-- Flange Outer Circle -->
        <circle cx="200" cy="120" r="90" fill="#1E293B" stroke="#00F5A0" stroke-width="2"/>
        <!-- Hub Circle -->
        <circle cx="200" cy="120" r="50" fill="#1E293B" stroke="#38BDF8" stroke-width="1.8"/>
        <!-- PCD Circle -->
        <circle cx="200" cy="120" r="70" fill="none" stroke="#38BDF8" stroke-dasharray="6,4" stroke-width="1.2"/>
        <!-- Central Bore -->
        <circle cx="200" cy="120" r="26" fill="#0B132B" stroke="#00F5A0" stroke-width="2"/>
        <!-- 4 Bolt Holes -->
        <circle cx="200" cy="50" r="9" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <circle cx="270" cy="120" r="9" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <circle cx="200" cy="190" r="9" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <circle cx="130" cy="120" r="9" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <!-- Labels -->
        <text x="200" y="125" fill="#38BDF8" font-size="12" font-family="monospace" font-weight="bold" text-anchor="middle">Ø45</text>
        <text x="200" y="224" fill="#F8FAFC" font-size="13" font-family="monospace" font-weight="bold" text-anchor="middle">FLANGE Ø160 mm</text>
        <text x="295" y="124" fill="#38BDF8" font-size="10" font-family="monospace">4x Ø14</text>
      </svg>
    `,
    analysisPreset: {
      partName: 'HEAVY-DUTY COUPLING FLANGE',
      drawingNumber: 'FLG-DIN-EN1092',
      detectedPartType: 'flange',
      projection: 'third_angle',
      detectedViews: ['front', 'top', 'section'],
      dimensions: [
        { id: 'd1', label: 'Flange Outer Diameter (ØD)', value: 160, unit: 'mm', type: 'diameter', tolerance: '±0.5', view: 'top', confidence: 0.99 },
        { id: 'd2', label: 'Flange Rim Thickness (t)', value: 18, unit: 'mm', type: 'linear', tolerance: '±0.2', view: 'front', confidence: 0.98 },
        { id: 'd3', label: 'Hub Neck Diameter (ØN)', value: 90, unit: 'mm', type: 'diameter', tolerance: '±0.3', view: 'front', confidence: 0.96 },
        { id: 'd4', label: 'Total Flange Height (H)', value: 45, unit: 'mm', type: 'linear', tolerance: '±0.3', view: 'front', confidence: 0.97 },
        { id: 'd5', label: 'Central Flow Bore (Ød)', value: 45, unit: 'mm', type: 'diameter', tolerance: 'H9', view: 'section', confidence: 0.98 },
        { id: 'd6', label: 'Pitch Circle Diameter (PCD)', value: 125, unit: 'mm', type: 'diameter', tolerance: '±0.2', view: 'top', confidence: 0.97 },
        { id: 'd7', label: '4x Bolt Hole Diameter (Øh)', value: 14, unit: 'mm', type: 'diameter', tolerance: '±0.2', view: 'top', confidence: 0.96 },
        { id: 'd8', label: 'Outer Rim Chamfer', value: 2.5, unit: 'mm', type: 'chamfer', tolerance: '45°', view: 'front', confidence: 0.91 },
      ],
      features: [
        {
          id: 'f1',
          name: 'Flange Disc Extrusion',
          operation: 'base_extrude',
          description: 'Cylindrical base disc Ø160mm × 18mm thickness',
          parameters: { outer_diameter: 160, thickness: 18 },
          confidence: 0.98,
          viewReference: 'front',
          isConfirmed: true,
        },
        {
          id: 'f2',
          name: 'Raised Neck Hub Collar',
          operation: 'flange_boss',
          description: 'Concentric hub Ø90mm extending 27mm above flange rim',
          parameters: { hub_diameter: 90, hub_length: 27 },
          confidence: 0.96,
          viewReference: 'front',
          isConfirmed: true,
        },
        {
          id: 'f3',
          name: 'Flow Through-Bore',
          operation: 'through_hole',
          description: 'Central clearance bore Ø45mm through entire height',
          parameters: { bore_diameter: 45, is_through: true },
          confidence: 0.98,
          viewReference: 'section',
          isConfirmed: true,
        },
        {
          id: 'f4',
          name: '4x Circular Bolt Hole Pattern',
          operation: 'hole_pattern',
          description: '4x Ø14mm holes spaced symmetrically at 90° along Ø125mm PCD',
          parameters: { hole_diameter: 14, pcd: 125, hole_count: 4 },
          confidence: 0.97,
          viewReference: 'top',
          isConfirmed: true,
        },
        {
          id: 'f5',
          name: 'Rim Deburr Chamfer',
          operation: 'chamfer',
          description: '2.5mm × 45° lead-in chamfer on outer rim',
          parameters: { size: 2.5, angle: 45 },
          confidence: 0.91,
          viewReference: 'front',
          isConfirmed: true,
        },
      ],
      ambiguities: [],
      missingDimensions: [],
      overallConfidence: 0.97,
      notes: [
        'Detected circular symmetry with raised face hub and PCD pattern.',
        'Conforms to standard DIN / ANSI piping flange specifications.',
      ],
      reconstructionPlan: [
        { step: 1, operation: 'Base Disc', description: 'Extrude Ø160mm circle by 18mm', dimensionsUsed: ['Flange Outer Diameter', 'Flange Rim Thickness'] },
        { step: 2, operation: 'Hub Collar', description: 'Boss extrude Ø90mm collar to 45mm total height', dimensionsUsed: ['Hub Neck Diameter', 'Total Flange Height'] },
        { step: 3, operation: 'Center Bore', description: 'Cut Ø45mm through all', dimensionsUsed: ['Central Flow Bore'] },
        { step: 4, operation: 'Bolt Circle Pattern', description: 'Pattern 4x Ø14mm holes on Ø125mm PCD', dimensionsUsed: ['Pitch Circle Diameter', '4x Bolt Hole Diameter'] },
        { step: 5, operation: 'Chamfer', description: 'Apply 2.5mm 45° chamfer to edge', dimensionsUsed: ['Outer Rim Chamfer'] },
      ],
    },
  },
  {
    id: 'sample_bushing_sleeve',
    title: 'Self-Lubricating Bushing Sleeve',
    partType: 'cylinder',
    format: 'svg',
    category: 'Bushings & Sleeves',
    description: 'Precision turned bearing sleeve / bushing with outer diameter Ø60mm, inner bore Ø40mm, 75mm length, lubrication ports, and end bevels.',
    dimensionsSummary: 'Outer Ø60mm | Inner Ø40mm | Length 75mm | 2x Ø6mm Oil Ports',
    thumbnailSvg: `
      <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full bg-[#0F172A]">
        <rect width="400" height="240" fill="#0B132B"/>
        <!-- Outer Cylinder -->
        <rect x="110" y="55" width="180" height="130" fill="#1E293B" stroke="#00F5A0" stroke-width="2"/>
        <!-- Inner Bore Hidden Lines -->
        <line x1="110" y1="90" x2="290" y2="90" stroke="#38BDF8" stroke-dasharray="6,4" stroke-width="1.5"/>
        <line x1="110" y1="150" x2="290" y2="150" stroke="#38BDF8" stroke-dasharray="6,4" stroke-width="1.5"/>
        <!-- Centerline -->
        <line x1="80" y1="120" x2="320" y2="120" stroke="#00F5A0" stroke-dasharray="10,4,3,4" stroke-width="1.2"/>
        <!-- Radial Oil Port -->
        <circle cx="200" cy="55" r="7" fill="#0B132B" stroke="#38BDF8" stroke-width="1.5"/>
        <line x1="200" y1="40" x2="200" y2="90" stroke="#38BDF8" stroke-dasharray="4,2" stroke-width="1"/>
        <!-- Dimensions -->
        <text x="200" y="125" fill="#38BDF8" font-size="13" font-family="monospace" font-weight="bold" text-anchor="middle">Ø40 / Ø60</text>
        <text x="200" y="210" fill="#F8FAFC" font-size="13" font-family="monospace" font-weight="bold" text-anchor="middle">LENGTH 75 mm</text>
        <text x="200" y="32" fill="#38BDF8" font-size="10" font-family="monospace" text-anchor="middle">Ø6 OIL PORT</text>
      </svg>
    `,
    analysisPreset: {
      partName: 'SELF-LUBRICATING BUSHING SLEEVE',
      drawingNumber: 'BSH-75-6040',
      detectedPartType: 'cylinder',
      projection: 'third_angle',
      detectedViews: ['front', 'top', 'section'],
      dimensions: [
        { id: 'd1', label: 'Outer Sleeve Diameter (ØOD)', value: 60, unit: 'mm', type: 'diameter', tolerance: 'r6', view: 'front', confidence: 0.99 },
        { id: 'd2', label: 'Inner Bearing Bore (ØID)', value: 40, unit: 'mm', type: 'diameter', tolerance: 'E7', view: 'front', confidence: 0.99 },
        { id: 'd3', label: 'Total Sleeve Length (L)', value: 75, unit: 'mm', type: 'linear', tolerance: 'h11', view: 'front', confidence: 0.98 },
        { id: 'd4', label: 'Radial Oil Hole Diameter (Øh)', value: 6, unit: 'mm', type: 'diameter', tolerance: '±0.2', view: 'top', confidence: 0.94 },
        { id: 'd5', label: 'Internal End Chamfers', value: 1.5, unit: 'mm', type: 'chamfer', tolerance: '30°', view: 'section', confidence: 0.91 },
      ],
      features: [
        {
          id: 'f1',
          name: 'Outer Cylindrical Body',
          operation: 'base_revolve',
          description: 'Solid rotational mantle Ø60mm × 75mm length',
          parameters: { diameter: 60, length: 75 },
          confidence: 0.99,
          viewReference: 'front',
          isConfirmed: true,
        },
        {
          id: 'f2',
          name: 'Precision Journal Bore',
          operation: 'through_hole',
          description: 'Hollow central bore Ø40mm through entire 75mm length',
          parameters: { bore_diameter: 40, is_through: true },
          confidence: 0.99,
          viewReference: 'section',
          isConfirmed: true,
        },
        {
          id: 'f3',
          name: 'Radial Lubrication Port',
          operation: 'through_hole',
          description: 'Cross-drilled Ø6mm oil hole through sleeve wall into bore',
          parameters: { diameter: 6, is_through: true },
          confidence: 0.93,
          viewReference: 'top',
          isConfirmed: true,
        },
        {
          id: 'f4',
          name: 'Press-Fit Lead Chamfer',
          operation: 'chamfer',
          description: '1.5mm × 30° insertion bevel on outer diameter',
          parameters: { size: 1.5, angle: 30 },
          confidence: 0.92,
          viewReference: 'front',
          isConfirmed: true,
        },
      ],
      ambiguities: [],
      missingDimensions: [],
      overallConfidence: 0.97,
      notes: [
        'Hollow cylindrical bushing with tight tolerance bore.',
        'Cross hole for lubrication oil distribution.',
      ],
      reconstructionPlan: [
        { step: 1, operation: 'Base Cylinder', description: 'Revolve Ø60mm cylinder by 75mm', dimensionsUsed: ['Outer Sleeve Diameter', 'Total Sleeve Length'] },
        { step: 2, operation: 'Through Bore', description: 'Cut Ø40mm concentric hole', dimensionsUsed: ['Inner Bearing Bore'] },
        { step: 3, operation: 'Radial Port', description: 'Cross drill Ø6mm hole at mid-span', dimensionsUsed: ['Radial Oil Hole Diameter'] },
        { step: 4, operation: 'Lead Chamfer', description: 'Apply 1.5mm 30° chamfer', dimensionsUsed: ['Internal End Chamfers'] },
      ],
    },
  },
  {
    id: 'sample_bracket',
    title: 'Precision Machined Angle Bracket',
    partType: 'bracket',
    format: 'svg',
    category: 'Plates & Prismatic',
    description: 'Machined L-shaped angle bracket with triangular stiffener web, 2x base mounting holes, and vertical face alignment slot.',
    dimensionsSummary: '100×80×60mm | 12mm Wall | Triangular Rib | Base Holes Ø10mm',
    thumbnailSvg: `
      <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full bg-[#0F172A]">
        <rect width="400" height="240" fill="#0B132B"/>
        <!-- L Profile -->
        <path d="M 90 50 L 115 50 L 115 155 L 290 155 L 290 180 L 90 180 Z" fill="#1E293B" stroke="#00F5A0" stroke-width="2"/>
        <!-- Stiffener Web -->
        <polygon points="115,80 115,155 240,155" fill="#00F5A0" opacity="0.25" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="4,2"/>
        <!-- Base Hole -->
        <circle cx="270" cy="167" r="6" fill="#0B132B" stroke="#00F5A0" stroke-width="1.5"/>
        <!-- Vertical Slot -->
        <rect x="98" y="70" width="8" height="35" rx="4" fill="#0B132B" stroke="#38BDF8" stroke-width="1.5"/>
        <!-- Dimensions -->
        <text x="190" y="196" fill="#F8FAFC" font-size="12" font-family="monospace" font-weight="bold" text-anchor="middle">BASE 100 mm</text>
        <text x="70" y="115" fill="#38BDF8" font-size="12" font-family="monospace" text-anchor="middle">80 mm</text>
        <text x="210" y="110" fill="#38BDF8" font-size="11" font-family="monospace">RIB T=10</text>
      </svg>
    `,
    analysisPreset: {
      partName: 'PRECISION MACHINED ANGLE BRACKET',
      drawingNumber: 'BRK-L-10080',
      detectedPartType: 'bracket',
      projection: 'third_angle',
      detectedViews: ['front', 'top', 'right', 'isometric'],
      dimensions: [
        { id: 'd1', label: 'Base Foot Length', value: 100, unit: 'mm', type: 'linear', tolerance: '±0.2', view: 'front', confidence: 0.98 },
        { id: 'd2', label: 'Vertical Upright Height', value: 80, unit: 'mm', type: 'linear', tolerance: '±0.2', view: 'front', confidence: 0.98 },
        { id: 'd3', label: 'Bracket Width (Extrusion Depth)', value: 60, unit: 'mm', type: 'linear', tolerance: '±0.3', view: 'top', confidence: 0.97 },
        { id: 'd4', label: 'Leg Wall Thickness', value: 12, unit: 'mm', type: 'linear', tolerance: '±0.15', view: 'front', confidence: 0.96 },
        { id: 'd5', label: 'Stiffener Gusset Web Thickness', value: 10, unit: 'mm', type: 'linear', tolerance: '±0.2', view: 'top', confidence: 0.93 },
        { id: 'd6', label: '2x Base Mounting Holes (Ø)', value: 10, unit: 'mm', type: 'diameter', tolerance: '±0.15', view: 'top', confidence: 0.95 },
        { id: 'd7', label: 'Vertical Adjustment Slot Width', value: 10, unit: 'mm', type: 'linear', tolerance: '±0.1', view: 'right', confidence: 0.94 },
        { id: 'd8', label: 'Vertical Adjustment Slot Length', value: 35, unit: 'mm', type: 'linear', tolerance: '±0.2', view: 'right', confidence: 0.94 },
      ],
      features: [
        {
          id: 'f1',
          name: 'L-Shape Profile Extrusion',
          operation: 'base_extrude',
          description: 'Extrude 100×80mm L-section with 12mm wall by 60mm width',
          parameters: { baseLength: 100, height: 80, thickness: 12, width: 60 },
          confidence: 0.98,
          viewReference: 'front',
          isConfirmed: true,
        },
        {
          id: 'f2',
          name: 'Triangular Stiffener Web Gusset',
          operation: 'base_extrude',
          description: 'Center triangular gusset 10mm thick reinforcing the 90° corner',
          parameters: { webThickness: 10 },
          confidence: 0.94,
          viewReference: 'front',
          isConfirmed: true,
        },
        {
          id: 'f3',
          name: '2x Base Foot Clearance Holes',
          operation: 'hole_pattern',
          description: '2x Ø10mm holes through 12mm base foot',
          parameters: { diameter: 10, count: 2 },
          confidence: 0.96,
          viewReference: 'top',
          isConfirmed: true,
        },
        {
          id: 'f4',
          name: 'Vertical Face Alignment Slot',
          operation: 'cut_extrude',
          description: 'Milled slot 10mm wide × 35mm long through vertical leg',
          parameters: { width: 10, length: 35 },
          confidence: 0.94,
          viewReference: 'right',
          isConfirmed: true,
        },
      ],
      ambiguities: [],
      missingDimensions: [],
      overallConfidence: 0.96,
      notes: [
        'Recognized structural L-bracket with stiffener web.',
        'Extruded sketch with boolean through-holes and slot cut.',
      ],
      reconstructionPlan: [
        { step: 1, operation: 'L-Profile Sketch', description: 'Sketch L-cross-section 100×80×12mm', dimensionsUsed: ['Base Foot Length', 'Vertical Upright Height', 'Leg Wall Thickness'] },
        { step: 2, operation: 'Extrude Bracket', description: 'Extrude 60mm width along Z', dimensionsUsed: ['Bracket Width (Extrusion Depth)'] },
        { step: 3, operation: 'Add Gusset Web', description: 'Extrude 10mm triangular stiffener', dimensionsUsed: ['Stiffener Gusset Web Thickness'] },
        { step: 4, operation: 'Drill Holes & Cut Slot', description: 'Cut 2x Ø10mm base holes and 10×35mm vertical slot', dimensionsUsed: ['2x Base Mounting Holes', 'Vertical Adjustment Slot Width', 'Vertical Adjustment Slot Length'] },
      ],
    },
  },
];
