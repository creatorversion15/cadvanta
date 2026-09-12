import { CADPart } from '../types/cad';

export type PermissionLevel = 'view' | 'comment' | 'edit';

export interface VersionSnapshot {
  id: string;
  versionTag: string;
  timestamp: string;
  author: string;
  commitMessage: string;
  part: CADPart;
  changeSummary: string[];
}

export interface CADAnnotation {
  id: string;
  author: string;
  timestamp: string;
  position: [number, number, number]; // 3D coordinate point
  text: string;
  featureName?: string;
  resolved: boolean;
  replies?: {
    id: string;
    author: string;
    text: string;
    timestamp: string;
  }[];
}

const STORAGE_VERSIONS_KEY = 'cadvanta_version_history';
const STORAGE_COMMENTS_KEY = 'cadvanta_annotations';

// 1. Version History Management
export function getSavedVersions(): VersionSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_VERSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading version history:', err);
  }
  return [];
}

export function saveVersionSnapshot(
  part: CADPart,
  commitMessage: string,
  author: string = 'Viraj Bansod'
): VersionSnapshot {
  const versions = getSavedVersions();
  const nextNum = versions.length + 1;
  const versionTag = `v1.${nextNum}`;

  const changeSummary: string[] = [
    `Updated parameters for ${part.name} (${part.part_type})`,
    `Material set to ${part.material?.name || 'Default Alloy'}`,
    `Features active: ${part.features?.length || 0} operations`,
  ];

  const newSnapshot: VersionSnapshot = {
    id: `ver_${Date.now()}`,
    versionTag,
    timestamp: new Date().toLocaleString(),
    author,
    commitMessage: commitMessage || `Parametric update to ${part.name}`,
    part: JSON.parse(JSON.stringify(part)),
    changeSummary,
  };

  const updated = [newSnapshot, ...versions];
  localStorage.setItem(STORAGE_VERSIONS_KEY, JSON.stringify(updated));
  return newSnapshot;
}

// 2. Robust Shareable Link Generation & View-Only Parsing
function toSafeBase64(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch (err) {
    console.error('Error encoding to base64:', err);
    return btoa(str);
  }
}

function fromSafeBase64(b64: string): string {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(b64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (err) {
    console.error('Error decoding from base64:', err);
    return atob(b64);
  }
}

const STORAGE_SHARED_MODELS_KEY = 'cadvanta_shared_models_cache';

export interface SharedProjectPayload {
  id: string;
  name: string;
  part_type: any;
  parameters: Record<string, any>;
  material?: any;
  features?: any[];
  units?: 'mm' | 'inch';
  perm: PermissionLevel;
  author: string;
  ts: number;
}

export function generateShareableLink(
  part: CADPart,
  permission: PermissionLevel = 'view',
  author: string = 'Viraj Bansod'
): {
  shareUrl: string;
  token: string;
  shortId: string;
} {
  const shortId = `share_${part.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}_${Date.now().toString(36)}`;
  
  const payload: SharedProjectPayload = {
    id: part.id,
    name: part.name,
    part_type: part.part_type,
    parameters: part.parameters || {},
    material: part.material,
    features: part.features || [],
    units: part.units || 'mm',
    perm: permission,
    author: author || 'Viraj Bansod',
    ts: Date.now(),
  };

  const json = JSON.stringify(payload);
  const token = toSafeBase64(json);

  // Cache locally as well for fast instant lookup
  try {
    const existingCache = JSON.parse(localStorage.getItem(STORAGE_SHARED_MODELS_KEY) || '{}');
    existingCache[shortId] = payload;
    existingCache[part.id] = payload;
    localStorage.setItem(STORAGE_SHARED_MODELS_KEY, JSON.stringify(existingCache));
  } catch {
    // ignore
  }

  const baseUrl = window.location.origin + window.location.pathname;
  // Support both hash and query param: query param ?share=... is clean and easily shared, hash #share=... is supported
  const shareUrl = `${baseUrl}?share=${encodeURIComponent(token)}&mode=${permission}`;
  return { shareUrl, token, shortId };
}

export function parseShareableLink(): {
  part: CADPart;
  permission: PermissionLevel;
  author: string;
  timestamp: number;
} | null {
  try {
    if (typeof window === 'undefined') return null;

    let token: string | null = null;
    let modeParam: string | null = null;

    // 1. Check URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('share')) {
      token = urlParams.get('share');
      modeParam = urlParams.get('mode') || urlParams.get('perm');
    }

    // 2. Check URL hash (e.g., #share=...)
    if (!token && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      if (hashParams.has('share')) {
        token = hashParams.get('share');
        modeParam = hashParams.get('mode') || hashParams.get('perm');
      }
    }

    if (!token) return null;

    // Check if token is a cached shortId
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_SHARED_MODELS_KEY) || '{}');
      if (cached[token]) {
        const payload: SharedProjectPayload = cached[token];
        const part: CADPart = {
          id: payload.id || `shared_${Date.now()}`,
          name: payload.name || 'Shared CAD Project',
          part_type: payload.part_type || 'shaft',
          parameters: payload.parameters || {},
          material: payload.material || {
            id: 'en8_steel',
            name: 'EN8 Carbon Steel',
            density: 7.85,
            youngsModulus: 205,
            yieldStrength: 465,
            tensileStrength: 650,
            costPerKgInr: 240,
            machinabilityRating: 75,
            thermalConductivity: 48,
            category: 'Steel',
            color: '#5A6577',
            metalness: 0.85,
            roughness: 0.35,
          },
          features: payload.features || [],
          units: payload.units || 'mm',
          metadata: { shared: true, viewOnly: payload.perm === 'view' },
        };
        return {
          part,
          permission: (modeParam as PermissionLevel) || payload.perm || 'view',
          author: payload.author || 'Viraj Bansod',
          timestamp: payload.ts || Date.now(),
        };
      }
    } catch {
      // continue to base64 decoding
    }

    // Decode full base64 token
    const decodedJson = fromSafeBase64(token);
    const parsed = JSON.parse(decodedJson);

    if (!parsed || (!parsed.parameters && !parsed.name)) {
      return null;
    }

    const perm: PermissionLevel = (modeParam as PermissionLevel) || parsed.perm || 'view';

    const part: CADPart = {
      id: parsed.id || `shared_${Date.now()}`,
      name: parsed.name || 'Shared Project',
      part_type: parsed.part_type || 'shaft',
      parameters: parsed.parameters || {},
      material: parsed.material || {
        id: 'en8_steel',
        name: 'EN8 Carbon Steel',
        density: 7.85,
        youngsModulus: 205,
        yieldStrength: 465,
        tensileStrength: 650,
        costPerKgInr: 240,
        machinabilityRating: 75,
        thermalConductivity: 48,
        category: 'Steel',
        color: '#5A6577',
        metalness: 0.85,
        roughness: 0.35,
      },
      features: parsed.features || [],
      units: parsed.units || 'mm',
      metadata: { shared: true, viewOnly: perm === 'view' },
    };

    return {
      part,
      permission: perm,
      author: parsed.author || 'Viraj Bansod',
      timestamp: parsed.ts || Date.now(),
    };
  } catch (err) {
    console.error('Failed to parse shareable link from URL:', err);
    return null;
  }
}

export function clearShareableUrl(): void {
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}


// 3. 3D Annotation & Review Comments
export function getStoredAnnotations(): CADAnnotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading annotations:', err);
  }

  // Default initial review annotation
  return [
    {
      id: 'ann_1',
      author: 'Lead Tooling Engineer',
      timestamp: 'Today at 10:45 AM',
      position: [0, 0, 50],
      text: 'Verify internal bore tolerance is H7 for bearing press-fit per ISO 286.',
      featureName: 'Center Bore',
      resolved: false,
      replies: [
        {
          id: 'rep_1',
          author: 'Viraj Bansod',
          text: 'Confirmed H7 (+0.025 / 0 mm). Dimension verified.',
          timestamp: 'Today at 11:02 AM',
        },
      ],
    },
  ];
}

export function saveAnnotation(annotation: CADAnnotation): CADAnnotation[] {
  const current = getStoredAnnotations();
  const updated = [annotation, ...current];
  localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(updated));
  return updated;
}

export function toggleResolveAnnotation(id: string): CADAnnotation[] {
  const current = getStoredAnnotations();
  const updated = current.map((a) => (a.id === id ? { ...a, resolved: !a.resolved } : a));
  localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(updated));
  return updated;
}
