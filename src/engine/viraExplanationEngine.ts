import { CADPart } from '../types/cad';
import { analyzePartDFM, DFMIssue } from './dfmEngine';
import { runEngineeringValidation } from './engineeringValidator';

export interface PlainLanguageDFMFix {
  id: string;
  title: string;
  plainExplanation: string;
  whyItMatters: string;
  suggestedFixLabel: string;
  paramFix: Record<string, any>;
  severity: 'error' | 'warning' | 'info';
}

export interface ViraExplanationResult {
  hasIssues: boolean;
  overallHealth: 'optimal' | 'warnings' | 'critical';
  summary: string;
  fixes: PlainLanguageDFMFix[];
  markdownText: string;
}

/**
 * Explains active geometric validation and DFM issues in friendly, plain English.
 */
export function explainPartIssuesInPlainLanguage(part: CADPart): ViraExplanationResult {
  const dfmAnalysis = analyzePartDFM(part);
  const validationChecks = runEngineeringValidation(part);

  const errorChecks = validationChecks.filter((c) => c.severity === 'error');
  const warningChecks = validationChecks.filter((c) => c.severity === 'warning');

  const fixes: PlainLanguageDFMFix[] = [];

  // 1. Process DFM issues
  for (const issue of dfmAnalysis.issues) {
    let plainExplanation = '';
    let whyItMatters = '';

    if (issue.id === 'dfm_thin_wall') {
      plainExplanation = `The wall thickness is currently ${issue.currentValue} mm, which is too thin for standard manufacturing.`;
      whyItMatters = `During CNC milling or turning, thin walls vibrate violently (called tool chatter), resulting in rough wavy surfaces, dimensional drift, or even metal tearing.`;
    } else if (issue.id === 'dfm_deep_cavity' || issue.id.includes('cavity') || issue.id.includes('depth')) {
      plainExplanation = `The feature depth-to-width ratio is too steep (${issue.currentValue}:1).`;
      whyItMatters = `Long slender cutting tools flex when reaching into deep narrow pockets, causing high tool breakage rates and poor surface finish.`;
    } else if (issue.id === 'dfm_tight_radius' || issue.id.includes('fillet')) {
      plainExplanation = `The internal corner fillet radius (${issue.currentValue} mm) is sharper than standard end-mill tooling.`;
      whyItMatters = `Sharp inside corners concentrate mechanical stress (tripling stress locally) and require tiny, fragile micro-endmills that dramatically increase machining time and cost.`;
    } else {
      plainExplanation = issue.description;
      whyItMatters = `Standard machine shop guidelines (${issue.standard}) recommend ${issue.recommendedValue} to avoid fabrication defects.`;
    }

    fixes.push({
      id: issue.id,
      title: issue.title,
      plainExplanation,
      whyItMatters,
      suggestedFixLabel: `Fix ${issue.title}: Set to ${issue.recommendedValue}`,
      paramFix: issue.suggestedParamFix,
      severity: issue.severity === 'error' ? 'error' : 'warning',
    });
  }

  // 2. Process Validation Checks
  for (const check of [...errorChecks, ...warningChecks]) {
    // Avoid duplicates if already handled by DFM
    if (fixes.some((f) => f.title.toLowerCase() === check.title.toLowerCase())) continue;

    let whyItMatters = 'Violating this geometric constraint may cause physical assembly failure or make the part impossible to machine.';
    if (check.title.toLowerCase().includes('bore')) {
      whyItMatters = 'The internal hole cannot physically fit or leaves zero structural material inside the outer shell.';
    } else if (check.title.toLowerCase().includes('fillet')) {
      whyItMatters = 'Sharp internal intersections concentrate mechanical stress, leading to premature fatigue cracking.';
    } else if (check.title.toLowerCase().includes('keyway')) {
      whyItMatters = 'Improper keyway dimensions will shear the drive key or cause severe shaft runout under torque.';
    }

    const paramFix: Record<string, any> = {};
    if (check.paramKey && check.autoFixValue !== undefined) {
      paramFix[check.paramKey] = check.autoFixValue;
    }

    fixes.push({
      id: check.id,
      title: check.title,
      plainExplanation: check.message,
      whyItMatters,
      suggestedFixLabel: check.suggestedFix || `Fix ${check.title}`,
      paramFix,
      severity: check.severity === 'error' ? 'error' : 'warning',
    });
  }

  if (fixes.length === 0) {
    return {
      hasIssues: false,
      overallHealth: 'optimal',
      summary: `All geometric and manufacturing constraints are satisfied for ${part.name}.`,
      fixes: [],
      markdownText: `### ✅ Clean Engineering Bill of Health for ${part.name}
**VIRA Analysis Result**:
- **DFM Readiness**: **${dfmAnalysis.dfmScore}/100** (Optimal)
- **Machinability Rating**: **${dfmAnalysis.machinabilityIndex}%**
- **Recommended Method**: **${dfmAnalysis.recommendedProcess}**

I reviewed your active 3D model against standard ASME/ISO manufacturing rules:
1. **Wall Thicknesses**: All walls exceed the minimum 2.0 mm threshold for structural rigidity.
2. **Tool Access & Radii**: Internal radii allow standard CNC tooling without excessive tool wear.
3. **Aspect Ratios**: Deep cavities and slender features remain safely within stable cutting limits.

Your model is ready for 3D simulation, drawing generation, or export.`,
    };
  }

  const hasErrors = fixes.some((f) => f.severity === 'error');
  const health = hasErrors ? 'critical' : 'warnings';

  let markdownText = `### ⚠️ Plain-Language DFM & Validation Report: ${part.name}\n\n`;
  markdownText += `I reviewed your model and found **${fixes.length} manufacturing / geometric ${fixes.length === 1 ? 'item' : 'items'}** that need attention before this part can be machined reliably:\n\n`;

  fixes.forEach((f, idx) => {
    const icon = f.severity === 'error' ? '🔴' : '🟡';
    markdownText += `#### ${icon} ${idx + 1}. ${f.title}\n`;
    markdownText += `- **What's happening**: ${f.plainExplanation}\n`;
    markdownText += `- **Why it matters**: ${f.whyItMatters}\n`;
    markdownText += `- **Recommended Fix**: ${f.suggestedFixLabel}\n\n`;
  });

  markdownText += `You can click the **Apply Fix** button on any of these issues to update your 3D model immediately!`;

  return {
    hasIssues: true,
    overallHealth: health,
    summary: `${fixes.length} issues detected (${errorChecks.length} critical, ${warningChecks.length} warnings)`,
    fixes,
    markdownText,
  };
}
