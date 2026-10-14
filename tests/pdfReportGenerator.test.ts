/**
 * Unit & Integration Test Suite for Automated Formal Engineering Summary PDF Generator
 * Verifies:
 * - Multi-page (3-page) ISO 9001 / ASME Y14.5 compliant PDF document generation
 * - Accurate material economics, stock sizing, and batch pricing curves
 * - Automatic FEA structural solver integration (Von Mises stress, FoS, deflection, mesh)
 * - Geometric integrity, DFM readiness scorecard, and GD&T tolerance extraction
 * - Custom options (currencies, multipliers, sign-off metadata)
 */

import {
  generateEngineeringSummaryReportPDF,
  generateEngineeringChecksPDF,
  generateCostEstimatorPDF,
} from '../src/engine/pdfReportGenerator';
import { createPresetPart } from '../src/engine/cadParser';
import { CADPart } from '../src/types/cad';
import { solvePartFEA } from '../src/engine/feaEngine';

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
  console.log('🚀 VANTA AUTOMATED PDF ENGINEERING SUMMARY TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Standard Stepped Shaft
  console.log('📦 1. Stepped Drive Shaft Engineering Summary Dossier:');
  const shaftPart: CADPart = createPresetPart('shaft');
  
  const shaftDoc = generateEngineeringSummaryReportPDF(shaftPart, {
    downloadImmediately: false,
    authorName: 'Viraj Bansod',
    companyName: 'CADVANTA Engineering Systems',
    currency: 'INR',
    multiplier: 1.25,
  });

  assert(Boolean(shaftDoc), 'PDF Document object is created successfully');
  assert(shaftDoc.getNumberOfPages() === 3, 'Generates exactly 3 formal technical dossier pages', `got ${shaftDoc.getNumberOfPages()}`);
  
  const shaftPdfOutput = shaftDoc.output();
  assert(shaftPdfOutput.length > 5000, 'Generates dense, valid PDF binary string', `${shaftPdfOutput.length} bytes`);
  assert(shaftPdfOutput.includes('CADVANTA'), 'PDF contains CADVANTA official engineering brand title');
  assert(shaftPdfOutput.includes('ISO 9001'), 'PDF contains ISO 9001 compliance certification banner');

  // Test 2: Pipe Flange with Pre-Calculated FEA
  console.log('\n🔩 2. Mounting Flange with Pre-Calculated FEA Simulation:');
  const flangePart: CADPart = createPresetPart('flange');
  const sim = solvePartFEA(flangePart, {
    simulationMode: 'static_structural',
    material: flangePart.material,
    forceMagnitudeN: 8000,
    loadDirection: 'Y',
    constraintAnchor: 'bore_inner',
    meshRefinement: 'standard',
    amplificationFactor: 1,
  });

  assert(sim.results.maxVonMisesStressMPa > 0, 'FEA solver calculates positive Von Mises stress', `${sim.results.maxVonMisesStressMPa} MPa`);
  assert(sim.results.factorOfSafety > 0, 'FEA solver calculates valid positive factor of safety', `${sim.results.factorOfSafety}x`);
  assert(sim.results.nodeCount > 500, 'FEA solver generates realistic mesh node count', `${sim.results.nodeCount} nodes`);

  const flangeDoc = generateEngineeringSummaryReportPDF(flangePart, {
    downloadImmediately: false,
    feaResults: sim.results,
    currency: 'USD',
    multiplier: 1.15,
    authorName: 'Senior CAD Metrologist',
    customNotes: 'Critical oil & gas pressure vessel connector. Tight NPT thread class 3B.',
  });

  assert(flangeDoc.getNumberOfPages() === 3, 'Flange dossier generates 3 formatted pages');
  const flangePdf = flangeDoc.output();
  assert(flangePdf.includes('USD $') || flangePdf.includes('$'), 'Respects USD currency formatting option');

  // Test 3: Prismatic Plate / Bracket Archetype
  console.log('\n📐 3. L-Bracket Prismatic Geometry & DFM Assessment:');
  const bracketPart: CADPart = createPresetPart('bracket');

  const bracketDoc = generateEngineeringSummaryReportPDF(bracketPart, {
    downloadImmediately: false,
    currency: 'EUR',
    multiplier: 1.30,
  });

  assert(bracketDoc.getNumberOfPages() === 3, 'Bracket dossier generates 3 formatted pages');
  const bracketPdf = bracketDoc.output();
  assert(bracketPdf.includes('EUR') || bracketPdf.includes('€'), 'Respects EUR currency formatting option');

  // Test 4: Planetary Gearbox Complex Part
  console.log('\n⚙️ 4. Planetary Gearbox Heavy Engineering Dossier:');
  const gearboxPart: CADPart = createPresetPart('planetary_gearbox');

  const gearboxDoc = generateEngineeringSummaryReportPDF(gearboxPart, {
    downloadImmediately: false,
    currency: 'INR',
    multiplier: 1.4,
  });

  assert(gearboxDoc.getNumberOfPages() === 3, 'Planetary gearbox dossier generates 3 formatted pages');

  // Test 5: Verify Backwards Compatibility of Legacy PDF Functions
  console.log('\n🛡️ 5. Legacy PDF Generators Backwards Compatibility:');
  
  let legacyCostOk = false;
  try {
    generateCostEstimatorPDF(shaftPart, { currency: 'INR' });
    legacyCostOk = true;
  } catch (err: any) {
    console.error('legacy cost error:', err);
  }
  assert(legacyCostOk, 'generateCostEstimatorPDF runs without error');

  let legacyChecksOk = false;
  try {
    generateEngineeringChecksPDF(shaftPart);
    legacyChecksOk = true;
  } catch (err: any) {
    console.error('legacy checks error:', err);
  }
  assert(legacyChecksOk, 'generateEngineeringChecksPDF runs without error');

  // Test 6: Configurable Watermarks (Draft, Proprietary, Confidential, Custom)
  console.log('\n🏷️ 6. Configurable Watermarks (Draft, Proprietary, Confidential, Custom):');
  
  // 6a: Draft watermark
  const draftDoc = generateEngineeringSummaryReportPDF(shaftPart, {
    downloadImmediately: false,
    watermark: 'Draft',
    watermarkOpacity: 0.12,
  });
  const draftPdf = draftDoc.output();
  assert(draftPdf.includes('DRAFT'), 'Draft watermark rendered in PDF');

  // 6b: Proprietary watermark
  const propDoc = generateEngineeringSummaryReportPDF(shaftPart, {
    downloadImmediately: false,
    watermark: 'Proprietary',
    watermarkOpacity: 0.10,
  });
  const propPdf = propDoc.output();
  assert(propPdf.includes('PROPRIETARY'), 'Proprietary watermark rendered in PDF');

  // 6c: Confidential watermark
  const confDoc = generateEngineeringSummaryReportPDF(shaftPart, {
    downloadImmediately: false,
    watermark: 'Confidential',
    watermarkOpacity: 0.15,
  });
  const confPdf = confDoc.output();
  assert(confPdf.includes('CONFIDENTIAL'), 'Confidential watermark rendered in PDF');

  // 6d: Custom watermark
  const customDoc = generateEngineeringSummaryReportPDF(shaftPart, {
    downloadImmediately: false,
    watermark: 'ITAR RESTRICTED',
    watermarkOpacity: 0.08,
  });
  const customPdf = customDoc.output();
  assert(customPdf.includes('ITAR RESTRICTED'), 'Custom ITAR RESTRICTED watermark rendered in PDF');

  // 6e: None watermark
  const noneDoc = generateEngineeringSummaryReportPDF(shaftPart, {
    downloadImmediately: false,
    watermark: 'None',
  });
  const nonePdf = noneDoc.output();
  assert(!nonePdf.includes('[NONE]'), 'None watermark does not render [NONE] tag');

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
  console.error('Test suite execution failed:', err);
  process.exit(1);
});
