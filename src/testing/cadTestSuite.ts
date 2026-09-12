import { TestScenario } from '../types/cad';

export const TEST_SUITE: TestScenario[] = [
  {
    id: 'test_1_shaft',
    title: 'Test 1: Stepped Stainless Shaft (AISI 304)',
    description: 'Verifies natural language parameter extraction for multi-step diameter, keyway, fillets and AISI 304 material.',
    prompt:
      'Create a stepped stainless-steel shaft. Material: AISI 304. Total length: 200 mm. Main diameter: 60 mm. Step 1 diameter: 30 mm. Step 1 length: 50 mm. Add a 6 mm wide × 3 mm deep keyway. Add 2 mm fillets on appropriate shoulders.',
    expectedPartType: 'shaft',
    expectedFeatureCountMin: 4,
  },
  {
    id: 'test_2_gearbox',
    title: 'Test 2: Two-Stage Planetary Gearbox (16:1, 750W)',
    description: 'Generates multi-component planetary cascade with sun gears, planet clusters, 7075-T6 carrier, and external ring housing.',
    prompt:
      'Design a compact two-stage planetary gearbox for a 750 W motor running at 3000 RPM with approximately 16:1 reduction. Housing outer diameter around 120 mm. Input shaft 14 mm, output shaft 28 mm with keyway. Material: 7075-T6 Aluminium and hardened steel.',
    expectedPartType: 'planetary_gearbox',
    expectedFeatureCountMin: 4,
    isAssembly: true,
  },
  {
    id: 'test_3_coupling',
    title: 'Test 3: Rigid Flange Coupling (5 kW @ 1440 RPM)',
    description: 'Designs dual-flange coupling in EN8 carbon steel with torque calculations, M10 high-tensile clamp bolts, and keyways.',
    prompt:
      'Design a flange coupling for a 5 kW motor running at 1440 RPM. Shaft diameter is 35 mm. Use EN8 steel. Include keyways, bolts and two flanges.',
    expectedPartType: 'flange_coupling',
    expectedFeatureCountMin: 3,
    isAssembly: true,
  },
  {
    id: 'test_4_bracket',
    title: 'Test 4: Heavy-Duty Structural L-Bracket',
    description: 'Creates CNC milled 6061-T6 aluminum L-bracket with gusset reinforcement and 4x mounting holes.',
    prompt:
      'Create an L-bracket 80 mm wide, 100 mm high, 110 mm length, 8 mm thick with 10 mm holes and corner gusset in 6061-T6 aluminum.',
    expectedPartType: 'bracket',
    expectedFeatureCountMin: 2,
  },
];
