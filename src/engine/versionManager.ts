import { CADPart, ModelVersionSnapshot } from '../types/cad';

const STORAGE_KEY = 'cadvanta_model_versions';

/**
 * Load all saved model versions from persistent storage.
 */
export function loadModelVersions(): ModelVersionSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load model versions:', err);
  }
  return [];
}

/**
 * Save model versions to persistent storage.
 */
export function persistModelVersions(versions: ModelVersionSnapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions.slice(0, 50)));
  } catch (err) {
    console.error('Failed to persist model versions:', err);
  }
}

/**
 * Compute parameter diff between two CADPart instances.
 */
export function computeParameterDiff(
  oldPart?: CADPart,
  newPart?: CADPart
): { param: string; from: any; to: any }[] {
  if (!oldPart || !newPart) return [];
  const diffs: { param: string; from: any; to: any }[] = [];
  const oldParams = oldPart.parameters || {};
  const newParams = newPart.parameters || {};

  const allKeys = new Set([...Object.keys(oldParams), ...Object.keys(newParams)]);
  for (const key of allKeys) {
    const oldVal = oldParams[key];
    const newVal = newParams[key];
    if (oldVal !== newVal && oldVal !== undefined && newVal !== undefined) {
      diffs.push({ param: key, from: oldVal, to: newVal });
    }
  }
  return diffs;
}

/**
 * Create and persist a new snapshot when a major edit occurs.
 */
export function recordModelSnapshot(
  currentPart: CADPart,
  actionType: ModelVersionSnapshot['actionType'],
  title: string,
  previousPart?: CADPart,
  description?: string
): { versions: ModelVersionSnapshot[]; newSnapshot: ModelVersionSnapshot } {
  const existing = loadModelVersions();
  const nextNumber = existing.length + 1;
  const versionTag = `v1.${nextNumber}`;
  const now = new Date();
  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const changedParameters = computeParameterDiff(previousPart, currentPart);

  const newSnapshot: ModelVersionSnapshot = {
    id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    versionNumber: nextNumber,
    versionTag,
    timestamp: Date.now(),
    formattedTime,
    actionType,
    title,
    description,
    part: JSON.parse(JSON.stringify(currentPart)),
    changedParameters: changedParameters.length > 0 ? changedParameters : undefined,
  };

  const updatedVersions = [newSnapshot, ...existing];
  persistModelVersions(updatedVersions);
  return { versions: updatedVersions, newSnapshot };
}

/**
 * Delete a specific version snapshot.
 */
export function deleteModelSnapshot(versionId: string): ModelVersionSnapshot[] {
  const existing = loadModelVersions();
  const filtered = existing.filter((v) => v.id !== versionId);
  persistModelVersions(filtered);
  return filtered;
}

/**
 * Initialize baseline version if list is empty.
 */
export function ensureInitialSnapshot(initialPart: CADPart): ModelVersionSnapshot[] {
  const existing = loadModelVersions();
  if (existing.length > 0) return existing;

  const now = new Date();
  const baseSnapshot: ModelVersionSnapshot = {
    id: `ver_init_${Date.now()}`,
    versionNumber: 1,
    versionTag: 'v1.0',
    timestamp: Date.now(),
    formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionType: 'preset_change',
    title: `Initial Baseline: ${initialPart.name}`,
    description: `Initial base geometry with ${initialPart.material?.name || 'Default Material'}`,
    part: JSON.parse(JSON.stringify(initialPart)),
  };

  const initialList = [baseSnapshot];
  persistModelVersions(initialList);
  return initialList;
}
