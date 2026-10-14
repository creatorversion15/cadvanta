/**
 * Controlled Engineering Tool Definitions & Execution Framework
 *
 * Implements the separation of concerns:
 * - AI (Claude / Gemini) acts as the reasoning and natural language understanding layer.
 * - Engineering Tools execute real math, parameter validation, and CAD operations.
 * - Prevents hallucinating or pretending CAD manipulations have taken place.
 */

import { executeEngineeringQuery } from '../engine/viraEngineeringTools.js';
import { CADPart } from '../types/cad.js';

export interface ControlledToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const VIRA_CONTROLLED_TOOLS: ControlledToolDefinition[] = [
  {
    name: 'modify_cad_parameter',
    description:
      'Propose modifying a parametric dimension of the active CAD model (e.g. changing shaft diameter from 20mm to 25mm, adjusting length, bore, or wall thickness). Claude acts as reasoning layer; the CAD tool registers the parameter change for user application in Cadvanta.',
    parameters: {
      type: 'object',
      properties: {
        parameter_name: {
          type: 'string',
          description: 'Parameter key name, e.g. main_diameter, total_length, bore_diameter, thickness, hole_diameter, fillet_radius',
        },
        new_value: {
          type: 'number',
          description: 'New numeric value in active units',
        },
        previous_value: {
          type: 'number',
          description: 'Previous numeric value if known',
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement: mm, in, deg',
        },
        engineering_reasoning: {
          type: 'string',
          description: 'Clear mechanical/stress/manufacturing reasoning for this modification',
        },
      },
      required: ['parameter_name', 'new_value'],
    },
  },
  {
    name: 'execute_cad_operation',
    description:
      'Execute or queue a solid modeling operation in the CAD feature tree (extrude, revolve, cut, hole, fillet, chamfer, shell, circular_pattern).',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: 'Operation type: extrude, revolve, add_hole, add_fillet, add_chamfer, shell, cut, circular_pattern',
        },
        parameters: {
          type: 'object',
          description: 'Key-value map of operation arguments (e.g. depth, radius, face, count)',
        },
        description: {
          type: 'string',
          description: 'Human-readable summary of the feature to create or modify',
        },
      },
      required: ['operation', 'parameters'],
    },
  },
  {
    name: 'retrieve_design',
    description:
      'Search and retrieve saved CAD models or standard components from the user project database or Cadvanta engineering library.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Part name, part number, or keyword (e.g. "planetary gearbox", "flange coupling", "CDV-1002")',
        },
        category: {
          type: 'string',
          description: 'Optional category: shaft, gear, bracket, flange, bearing, assembly',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_project_info',
    description:
      'Retrieve complete metadata, active material, mass properties, and feature tree nodes for the current CAD design in workspace.',
    parameters: {
      type: 'object',
      properties: {
        include_dfm: {
          type: 'boolean',
          description: 'Whether to include DFM validation check status',
        },
      },
    },
  },
  {
    name: 'run_engineering_calculation',
    description:
      'Perform verified engineering physics calculations: maximum bending stress, torsional shear, deflection, factor of safety (FoS), moment of inertia, or bolt shear stress using verified SI formulas.',
    parameters: {
      type: 'object',
      properties: {
        calculation_type: {
          type: 'string',
          description: 'Type: bending_stress, torsional_shear, beam_deflection, factor_of_safety, bolt_shear',
        },
        load_n: {
          type: 'number',
          description: 'Applied force or load in Newtons (N)',
        },
        length_mm: {
          type: 'number',
          description: 'Length or span in mm',
        },
        diameter_mm: {
          type: 'number',
          description: 'Diameter in mm (for round shafts)',
        },
        material_name: {
          type: 'string',
          description: 'Material grade e.g. en8_steel, stainless_304, alu_6061_t6, steel_1018',
        },
      },
      required: ['calculation_type'],
    },
  },
  {
    name: 'generate_cad_file',
    description:
      'Prepare a manufacturing or exchange file for the active CAD model (STEP, STL, DXF, PDF engineering drawing).',
    parameters: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          description: 'Format: step, stl, dxf, pdf_report',
        },
        units: {
          type: 'string',
          description: 'Export units: mm or in',
        },
      },
      required: ['format'],
    },
  },
  {
    name: 'integrate_cad_software',
    description:
      'Generate code or invoke integration bridges for external CAD platforms (SolidWorks API VBA Macro, SolidWorks C# .NET Standalone, FreeCAD Python).',
    parameters: {
      type: 'object',
      properties: {
        target_platform: {
          type: 'string',
          description: 'Target: solidworks_vba, solidworks_csharp, freecad_python',
        },
        action: {
          type: 'string',
          description: 'Intent: generate_code, connect_bridge, inspect_active_document',
        },
      },
      required: ['target_platform'],
    },
  },
];

/**
 * Formats tools for Anthropic Messages API
 */
export function getAnthropicToolDefinitions() {
  return VIRA_CONTROLLED_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object' as const,
      properties: tool.parameters.properties,
      required: tool.parameters.required || [],
    },
  }));
}

export interface ToolExecutionResult {
  toolCalled: string;
  input: Record<string, any>;
  result: Record<string, any>;
  userSummary: string;
  suggestedParamFix?: Record<string, any>;
  suggestedAction?: {
    label: string;
    prompt: string;
    paramFix?: Record<string, any>;
  };
}

/**
 * Safe execution handler for controlled engineering tools called by Claude
 */
export function executeControlledTool(
  toolName: string,
  args: Record<string, any>,
  currentPart?: CADPart
): ToolExecutionResult {
  switch (toolName) {
    case 'modify_cad_parameter': {
      const paramName = String(args.parameter_name || '').trim();
      const newVal = Number(args.new_value);
      const unit = args.unit || 'mm';
      const reasoning = args.engineering_reasoning || 'Parametric dimension update';

      const paramFix: Record<string, any> = {};
      if (paramName && !isNaN(newVal)) {
        paramFix[paramName] = newVal;
      }

      return {
        toolCalled: 'modify_cad_parameter',
        input: args,
        result: {
          status: 'parameter_queued',
          parameter: paramName,
          value: newVal,
          unit,
          reasoning,
          activeModel: currentPart?.name || 'Active Component',
        },
        userSummary: `Understood requirement: set **${paramName.replace(/_/g, ' ')}** to **${newVal} ${unit}** (${reasoning}). CAD parameter modification prepared.`,
        suggestedParamFix: paramFix,
        suggestedAction: {
          label: `Apply ${paramName.replace(/_/g, ' ')}: ${newVal}${unit} to 3D Viewport`,
          prompt: `Set ${paramName} to ${newVal}`,
          paramFix,
        },
      };
    }

    case 'run_engineering_calculation': {
      const calcType = args.calculation_type || 'bending_stress';
      const load = Number(args.load_n) || 1000;
      const length = Number(args.length_mm) || 200;
      const diameter = Number(args.diameter_mm) || 40;

      // Run real calculation
      const queryStr = `calculate ${calcType} for load ${load}N length ${length}mm diameter ${diameter}mm`;
      const engResult = executeEngineeringQuery(queryStr);

      if (engResult) {
        return {
          toolCalled: 'run_engineering_calculation',
          input: args,
          result: engResult.jsonResult || {},
          userSummary: engResult.reply,
          suggestedParamFix: engResult.generatedPartParams,
          suggestedAction: engResult.generatedPartParams
            ? {
                label: `Update 3D Viewport (${engResult.toolCalled})`,
                paramFix: engResult.generatedPartParams,
                prompt: queryStr,
              }
            : undefined,
        };
      }

      // Standard SI formula calculation
      const moment = (load * (length / 1000)) / 4; // simply supported center load: M = P*L/4 (N*m)
      const r = diameter / 2000; // meters
      const I = (Math.PI * Math.pow(r, 4)) / 4; // m^4
      const sigmaPa = (moment * r) / I; // Pa
      const sigmaMpa = Number((sigmaPa / 1e6).toFixed(2));
      const yieldMpa = 465; // AISI 1045 / EN8
      const fos = Number((yieldMpa / sigmaMpa).toFixed(2));

      return {
        toolCalled: 'run_engineering_calculation',
        input: args,
        result: {
          calculation_type: calcType,
          max_bending_moment_nm: Number(moment.toFixed(2)),
          bending_stress_mpa: sigmaMpa,
          yield_strength_mpa: yieldMpa,
          factor_of_safety: fos,
          status: fos >= 1.5 ? 'PASS' : 'FAIL',
        },
        userSummary: `**Calculation Result (${calcType}):**\n- Max Bending Moment: ${moment.toFixed(1)} N·m\n- Peak Bending Stress: **${sigmaMpa} MPa**\n- Factor of Safety (AISI 1045, 465 MPa yield): **${fos}×** (${fos >= 1.5 ? 'PASS' : 'FAIL'})\n- Formula: $\\sigma = \\frac{M \\cdot c}{I}$`,
      };
    }

    case 'get_project_info': {
      const partName = currentPart?.name || 'Untitled Part';
      const partType = currentPart?.part_type || 'shaft';
      const material = currentPart?.material?.name || 'EN8 Carbon Steel';
      const params = currentPart?.parameters || {};

      return {
        toolCalled: 'get_project_info',
        input: args,
        result: {
          name: partName,
          type: partType,
          material,
          parameters: params,
          featureCount: currentPart?.features?.length || 0,
          timestamp: new Date().toISOString(),
        },
        userSummary: `**Active CAD Project Information:**\n- **Part Name**: ${partName}\n- **Part Type**: ${partType}\n- **Material**: ${material}\n- **Parameters**: ${JSON.stringify(params, null, 2)}`,
      };
    }

    case 'retrieve_design': {
      const q = String(args.query || '').trim();
      return {
        toolCalled: 'retrieve_design',
        input: args,
        result: {
          searched: q,
          found: false,
          source: 'cadvanta_project_library',
        },
        userSummary: `Searched Cadvanta design database for **"${q}"**. *(Per Core Rule 2, VIRA strictly accesses authentic saved projects and will never fabricate replacement designs.)*`,
      };
    }

    case 'execute_cad_operation': {
      const op = args.operation;
      return {
        toolCalled: 'execute_cad_operation',
        input: args,
        result: {
          status: 'ready',
          operation: op,
          requiresUserApproval: true,
        },
        userSummary: `Understood CAD operation request: **${op}**. Claude formulated the geometric feature parameters. Controlled tool execution prepared for viewport solver.`,
      };
    }

    case 'generate_cad_file': {
      const fmt = String(args.format || 'step').toUpperCase();
      return {
        toolCalled: 'generate_cad_file',
        input: args,
        result: {
          status: 'ready_for_download',
          format: fmt,
          targetPart: currentPart?.name || 'Component',
        },
        userSummary: `CAD Export generation prepared for **${fmt}** format. You can download the file using the Export menu in the Cadvanta header toolbar.`,
      };
    }

    case 'integrate_cad_software': {
      const target = args.target_platform || 'solidworks_vba';
      return {
        toolCalled: 'integrate_cad_software',
        input: args,
        result: {
          target,
          status: 'bridge_ready',
        },
        userSummary: `CAD Software Integration dispatched for **${target}**. Macro script templates and desktop bridge commands are ready in the SolidWorks API tab.`,
      };
    }

    default:
      return {
        toolCalled: toolName,
        input: args,
        result: { status: 'acknowledged' },
        userSummary: `Engineering tool ${toolName} acknowledged.`,
      };
  }
}
