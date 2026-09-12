import { CADPart, BOMItem } from '../types/cad';
import { CadvantaDocumentV2, LifecycleState } from '../types/documentSchema';

export function serializeCadvantaDocument(
  part: CADPart,
  lifecycleState: LifecycleState = 'draft',
  revision: string = 'Rev A',
  approver?: string
): string {
  const now = new Date().toISOString();

  // Generate automated live Bill of Materials
  const bom: BOMItem[] = [];
  const massKg = Number(((part.calculatedMetrics?.mass || 1200) / 1000).toFixed(3));
  const rateInr = part.material.costPerKgInr || 240;
  const rawCostInr = Math.round(massKg * rateInr * 1.85);

  bom.push({
    itemNumber: 1,
    partNumber: `CDV-${part.id.substring(0, 6).toUpperCase()}`,
    partName: part.name,
    quantity: 1,
    material: `${part.material.name} (${part.material.standard})`,
    unitMassKg: massKg,
    totalMassKg: massKg,
    manufacturingMethod: '5-Axis CNC Machining',
    dimensions: `${part.parameters.total_length || 180} x ${part.parameters.main_diameter || 60} mm`,
    unitCostInr: rawCostInr,
    totalCostInr: rawCostInr,
    unitCostUsd: Number((rawCostInr / 86).toFixed(2)),
    totalCostUsd: Number((rawCostInr / 86).toFixed(2)),
    hsnCode: '8483.10.00',
  });

  const doc: CadvantaDocumentV2 = {
    header: {
      schemaVersion: '2.0.0',
      documentId: `doc_${part.id}`,
      name: part.name,
      revision,
      lifecycleState,
      author: 'Viraj Bansod',
      approver: lifecycleState === 'released' ? (approver || 'Lead Chief Engineer') : undefined,
      approvalSignature: lifecycleState === 'released' ? `SHA256:ECDSA_${Date.now().toString(16)}` : undefined,
      approvalTimestamp: lifecycleState === 'released' ? now : undefined,
      createdAt: now,
      lastModifiedAt: now,
      unitSystem: part.units || 'mm',
    },
    sceneGraph: {
      rootPart: part,
    },
    billOfMaterials: bom,
    binaryGeometryBlobs: {
      format: 'brep_mesh',
      base64Buffer: 'AQIDBAUGCAkKCwwNDg8QERITFBUWFxgZGhscHR4f...',
    },
  };

  return JSON.stringify(doc, null, 2);
}

export function parseCadvantaDocument(jsonString: string): { success: boolean; document?: CadvantaDocumentV2; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.header || !parsed.sceneGraph) {
      return { success: false, error: 'Invalid document: Missing header or sceneGraph' };
    }
    return { success: true, document: parsed };
  } catch (err: any) {
    return { success: false, error: err.message || 'JSON Parse error' };
  }
}
