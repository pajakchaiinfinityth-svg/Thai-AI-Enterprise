export interface CachedBriefingItem {
  id: string;
  count: number;
  content: string;
  timestamp: number;
  location?: { lat: number; lng: number };
}

export interface CachedTranslationItem {
  id: string;
  source: string;
  target: string;
  direction: 'EN_TH' | 'TH_EN';
  feedback: 'good' | 'bad' | null;
  timestamp: number;
  synced?: boolean;
}

const DB_NAME = 'gem_y_offline_db';
const DB_VERSION = 1;
const STORE_BRIEFINGS = 'briefings';
const STORE_TRANSLATIONS = 'translations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_BRIEFINGS)) {
        const briefingStore = db.createObjectStore(STORE_BRIEFINGS, { keyPath: 'id' });
        briefingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_TRANSLATIONS)) {
        const translationStore = db.createObjectStore(STORE_TRANSLATIONS, { keyPath: 'id' });
        translationStore.createIndex('timestamp', 'timestamp', { unique: false });
        translationStore.createIndex('direction', 'direction', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==================== BRIEFINGS ====================

export async function saveBriefingToIDB(
  content: string,
  count: number,
  location?: { lat: number; lng: number }
): Promise<CachedBriefingItem | null> {
  try {
    const db = await openDB();
    const item: CachedBriefingItem = {
      id: `briefing_${Date.now()}`,
      count,
      content,
      timestamp: Date.now(),
      location,
    };

    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BRIEFINGS, 'readwrite');
      const store = tx.objectStore(STORE_BRIEFINGS);
      store.put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveBriefing error:', err);
    return null;
  }
}

export async function getAllBriefingsFromIDB(): Promise<CachedBriefingItem[]> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BRIEFINGS, 'readonly');
      const store = tx.objectStore(STORE_BRIEFINGS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as CachedBriefingItem[]) || [];
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB getAllBriefings error:', err);
    return [];
  }
}

export async function getLatestBriefingFromIDB(): Promise<CachedBriefingItem | null> {
  const all = await getAllBriefingsFromIDB();
  return all.length > 0 ? all[0] : null;
}

export async function deleteBriefingFromIDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BRIEFINGS, 'readwrite');
      tx.objectStore(STORE_BRIEFINGS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB deleteBriefing error:', err);
  }
}

// ==================== TRANSLATION LEARNING LOG ====================

export async function saveTranslationToIDB(
  item: CachedTranslationItem
): Promise<CachedTranslationItem | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSLATIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSLATIONS);
      store.put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveTranslation error:', err);
    return null;
  }
}

export async function bulkSyncTranslationsToIDB(
  items: CachedTranslationItem[]
): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSLATIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSLATIONS);
      for (const item of items) {
        store.put({ ...item, synced: true });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB bulkSyncTranslations error:', err);
  }
}

export async function getAllTranslationsFromIDB(): Promise<CachedTranslationItem[]> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSLATIONS, 'readonly');
      const store = tx.objectStore(STORE_TRANSLATIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as CachedTranslationItem[]) || [];
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB getAllTranslations error:', err);
    return [];
  }
}

export async function findCachedTranslationInIDB(
  direction: 'EN_TH' | 'TH_EN',
  sourceText: string
): Promise<string | null> {
  try {
    const normalized = sourceText.trim().toLowerCase();
    if (!normalized) return null;
    const all = await getAllTranslationsFromIDB();
    const match = all.find(
      (item) =>
        item.direction === direction && item.source.trim().toLowerCase() === normalized
    );
    return match ? match.target : null;
  } catch {
    return null;
  }
}

export async function deleteTranslationFromIDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSLATIONS, 'readwrite');
      tx.objectStore(STORE_TRANSLATIONS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB deleteTranslation error:', err);
  }
}
