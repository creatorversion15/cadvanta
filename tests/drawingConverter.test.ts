/**
 * Unit & Integration Tests for Vanta 2D-to-3D Intelligent CAD Converter
 * Verifies DXF parsing, image preprocessing, parametric solid reconstruction,
 * B-Rep topology validation, ambiguity resolution, and STEP/STL export pipelines.
 */

import { parseDXFString, analyzeDXFGeometry } from '../src/engine/dxfParser';
import { reconstruct3DModelFromDrawing } from '../src/engine/drawingReconstructionEngine';
import { SAMPLE_ENGINEERING_DRAWINGS } from '../src/engine/drawingPreprocessor';
import { exportToSTEP, exportToSTL } from '../src/engine/advancedExporters';
import { DrawingAnalysisResult } from '../src/types/drawingConverter';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 VANTA 2D-to-3D CAD CONVERTER - UNIT & INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. DXF Parser Unit Tests
  // ---------------------------------------------------------------------------
  console.log('📦 1. DXF Vector Geometry Extraction Tests:');

  const sampleDXF = `0
SECTION
2
ENTITIES
0
LINE
8
OUTLINE
10
0.0
20
0.0
11
120.0
21
0.0
0
LINE
8
OUTLINE
10
120.0
20
0.0
11
120.0
21
60.0
0
CIRCLE
8
HOLES
10
60.0
20
30.0
40
15.0
0
CIRCLE
8
BOLT_CIRCLE
10
30.0
20
30.0
40
5.0
0
CIRCLE
8
BOLT_CIRCLE
10
90.0
20
30.0
40
5.0
0
DIMENSION
1
120 mm
42
120.0
0
ENDSEC
0
EOF`;

  const parsedDXF = parseDXFString(sampleDXF);
  const analysis = analyzeDXFGeometry(parsedDXF, 'Mounting_Plate.dxf');

  assert(parsedDXF.entities.length >= 5, 'Parses vector entities from ASCII DXF string', `Found ${parsedDXF.entities.length}`);
  assert(parsedDXF.layers.includes('OUTLINE') && parsedDXF.layers.includes('HOLES'), 'Identifies CAD layers (OUTLINE, HOLES)');
  assert(analysis.detectedPartType === 'box_plate' || analysis.detectedPartType === 'bracket', 'Detects plate topology from bounding rectangle', `Detected ${analysis.detectedPartType}`);
  assert(analysis.dimensions.some((d) => d.value === 120), 'Extracts 120mm linear dimension from DXF');
  assert(analysis.dimensions.length >= 2, 'Extracts multiple engineering dimensions from vector entities');

  // ---------------------------------------------------------------------------
  // 2. Parametric Reconstruction Engine Unit Tests (Shaft & Gallery Samples)
  // ---------------------------------------------------------------------------
  console.log('\n⚙️ 2. Parametric CAD Reconstruction Tests:');

  const shaftSample = SAMPLE_ENGINEERING_DRAWINGS.find((s) => s.id === 'sample_stepped_shaft')!;
  assert(shaftSample !== undefined, 'Found sample_stepped_shaft in industrial blueprints gallery');

  const shaftModel = reconstruct3DModelFromDrawing(shaftSample.analysisPreset);

  assert(shaftModel.part.part_type === 'stepped_shaft' || shaftModel.part.part_type === 'shaft', 'Reconstructs shaft part type');
  assert(shaftModel.part.parameters.main_diameter === 50, 'Applies Ø50mm main crown diameter');
  assert(shaftModel.part.parameters.total_length === 180, 'Applies 180mm total length parameter');
  assert(shaftModel.part.parameters.chamfer_size === 1.5, 'Applies 1.5mm chamfer parameter');
  assert(shaftModel.part.features && shaftModel.part.features.length >= 3, 'Generates multi-feature history tree (revolve, keyway, chamfer)');
  assert(shaftModel.validation.isValid, 'Solid model satisfies geometric validity checks');
  assert(shaftModel.metrics.volumeCm3 > 0, 'Computes non-zero positive solid volume');

  // ---------------------------------------------------------------------------
  // 3. Flange & Circular Pattern Reconstruction Tests
  // ---------------------------------------------------------------------------
  console.log('\n🔩 3. Flange & Bolt Circle Pattern Reconstruction Tests:');

  const flangeSample = SAMPLE_ENGINEERING_DRAWINGS.find((s) => s.id === 'sample_pipe_flange')!;
  assert(flangeSample !== undefined, 'Found sample_pipe_flange in industrial blueprints gallery');

  const flangeModel = reconstruct3DModelFromDrawing(flangeSample.analysisPreset);

  assert(flangeModel.part.part_type === 'flange', 'Reconstructs flange part type');
  assert(flangeModel.part.parameters.flange_diameter === 160, 'Applies Ø160mm flange diameter');
  assert(flangeModel.part.parameters.flange_thickness === 18, 'Applies 18mm flange thickness');
  assert(flangeModel.part.parameters.bolt_hole_count === 4, 'Applies 4-bolt circular pattern');
  assert(flangeModel.part.parameters.pitch_circle_diameter === 125, 'Applies Ø125mm PCD');
  assert(flangeModel.metrics.massGrams > 0, 'Calculates estimated physical mass in grams');

  // ---------------------------------------------------------------------------
  // 4. Ambiguity Resolution & Missing Dimension Guarantee Tests
  // ---------------------------------------------------------------------------
  console.log('\n🛡️ 4. Ambiguity & Dimensional Honesty Tests:');

  // Clone sample and test parameter override resolution
  const testAnalysis: DrawingAnalysisResult = JSON.parse(JSON.stringify(shaftSample.analysisPreset));
  testAnalysis.ambiguities = [
    {
      id: 'amb_len_test',
      title: 'Length Callout Ambiguity',
      question: 'Should total length be standard (180mm) or extended (250mm)?',
      options: [
        {
          id: 'opt_180',
          label: '180mm Standard',
          description: 'Standard 180mm shaft',
          parameterOverrides: { total_length: 180 },
          isRecommended: false,
        },
        {
          id: 'opt_250',
          label: '250mm Extended',
          description: 'Extended 250mm shaft',
          parameterOverrides: { total_length: 250 },
          isRecommended: true,
        },
      ],
      selectedOptionId: 'opt_250',
      resolved: true,
    },
  ];

  const resolvedModel = reconstruct3DModelFromDrawing(testAnalysis);

  assert(
    resolvedModel.part.parameters.total_length === 250,
    'Respects user-confirmed ambiguity resolution option (250 mm instead of arbitrary guess)'
  );

  // ---------------------------------------------------------------------------
  // 5. STEP and STL CAD Export Tests
  // ---------------------------------------------------------------------------
  console.log('\n💾 5. CAD Solid Export Pipeline Tests:');

  const stepBlob = exportToSTEP(shaftModel.part, {
    format: 'step',
    units: 'mm',
    resolution: 'standard',
  });
  const stepData = await stepBlob.text();
  assert(stepData.length > 500, 'Generates valid ISO 10303-21 STEP ASCII solid data', `${stepData.length} bytes`);
  assert(stepData.includes('ISO-10303-21;'), 'STEP header matches ISO 10303-21 standard');
  assert(stepData.includes('CLOSED_SHELL') || stepData.includes('MANIFOLD_SOLID_BREP'), 'STEP file contains B-Rep solid entities');

  const stlBlob = exportToSTL(
    flangeModel.part,
    { format: 'stl', units: 'mm', resolution: 'standard' },
    'ascii'
  );
  const stlData = await stlBlob.text();
  assert(stlData.length > 1000, 'Generates ASCII STL faceted solid triangle mesh', `${stlData.length} bytes`);
  assert(stlData.startsWith('solid ') && stlData.includes('endsolid'), 'STL file starts with solid header and closes with endsolid');

  // ---------------------------------------------------------------------------
  // 6. Industrial Blueprint Gallery Integration Tests
  // ---------------------------------------------------------------------------
  console.log('\n📚 6. Industrial Sample Drawings Gallery Tests:');

  assert(SAMPLE_ENGINEERING_DRAWINGS.length >= 3, 'Pre-loaded gallery includes standard engineering drawings');
  for (const sample of SAMPLE_ENGINEERING_DRAWINGS) {
    const sampleModel = reconstruct3DModelFromDrawing(sample.analysisPreset);
    assert(
      sampleModel.validation.isValid,
      `Sample "${sample.title}" (${sample.partType}) reconstructs valid solid CADPart`
    );
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with unhandled error:', err);
  process.exit(1);
});
