import { CADPart, BOMItem } from './cad';

export type LifecycleState = 'draft' | 'in_review' | 'released' | 'obsolete';

export interface DocumentMetadata {
  schemaVersion: '2.0.0';
  documentId: string;
  name: string;
  revision: string; // e.g. "Rev A", "Rev B.1"
  lifecycleState: LifecycleState;
  author: string;
  approver?: string;
  approvalSignature?: string;
  approvalTimestamp?: string;
  createdAt: string;
  lastModifiedAt: string;
  unitSystem: 'mm' | 'inch';
}

export interface CadvantaDocumentV2 {
  header: DocumentMetadata;
  sceneGraph: {
    rootPart: CADPart;
    assemblyMates?: any[];
    configurations?: any[];
  };
  simulationStudies?: {
    lastStudyType: string;
    factorOfSafety: number;
    peakStressMPa: number;
  };
  billOfMaterials?: BOMItem[];
  binaryGeometryBlobs?: {
    format: 'gltf_embedded' | 'brep_mesh';
    base64Buffer?: string;
  };
}
