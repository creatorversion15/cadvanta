import { CADPart } from '../types/cad';

const DB_NAME = 'cadvanta_offline_db';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory cache for ultra-fast instant project lookups (<1ms) across tabs
let memoryProjectCache: ProjectRecord[] | null = null;

export function invalidateProjectCache(): void {
  memoryProjectCache = null;
}

export async function savePartOffline(part: CADPart): Promise<void> {
  const record: ProjectRecord = {
    id: part.id,
    name: part.name,
    part,
    savedAt: Date.now(),
    synced: false,
    type: part.part_type,
    materialName: part.material?.name,
  };

  // Optimistically update memory cache immediately
  if (memoryProjectCache) {
    const existingIndex = memoryProjectCache.findIndex((p) => p.id === part.id);
    if (existingIndex >= 0) {
      memoryProjectCache[existingIndex] = record;
    } else {
      memoryProjectCache.unshift(record);
    }
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put(record);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Offline caching fallback to localStorage', err);
    try {
      localStorage.setItem(`cadvanta_part_${part.id}`, JSON.stringify(part));
    } catch (e) {
      // ignore
    }
  }
}

export interface ProjectRecord {
  id: string;
  name: string;
  part: CADPart;
  savedAt: number;
  synced?: boolean;
  type?: string;
  materialName?: string;
}

export async function getAllProjectsOffline(): Promise<ProjectRecord[]> {
  // If memory cache is available, return immediately for sub-millisecond tab switching
  if (memoryProjectCache !== null) {
    return [...memoryProjectCache];
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results: ProjectRecord[] = request.result || [];
        // Sort newest first
        results.sort((a, b) => b.savedAt - a.savedAt);
        memoryProjectCache = results;
        resolve([...results]);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    // Fallback to localStorage keys
    const items: ProjectRecord[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cadvanta_part_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const part = JSON.parse(raw);
              items.push({
                id: part.id,
                name: part.name,
                part,
                savedAt: Date.now(),
              });
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
    items.sort((a, b) => b.savedAt - a.savedAt);
    memoryProjectCache = items;
    return items;
  }
}

export async function deleteProjectOffline(partId: string): Promise<void> {
  // Optimistically remove from memory cache
  if (memoryProjectCache) {
    memoryProjectCache = memoryProjectCache.filter((p) => p.id !== partId);
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(partId);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    try {
      localStorage.removeItem(`cadvanta_part_${partId}`);
    } catch (e) {
      // ignore
    }
  }
}

export async function loadPartOffline(partId: string): Promise<CADPart | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(partId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.part) {
          resolve(request.result.part);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    const local = localStorage.getItem(`cadvanta_part_${partId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

