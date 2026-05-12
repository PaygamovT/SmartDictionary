export const DB_NAME = 'InteractiveDictionaryDB';
export const STORE_NAME = 'history';
export const DB_VERSION = 1;

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function isDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isDBSupported()) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[DB] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log(`[DB] Created IndexedDB object store: ${STORE_NAME}`);
      }
    };
  });
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  console.log(`[DB] Saving history item with ID: ${item.id}`);
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('[DB] Failed to save history item:', request.error);
      reject(request.error);
    };
  });
}

export async function getHistoryItems(): Promise<Omit<HistoryItem, 'data'>[]> {
  console.log('[DB] Fetching history items list...');
  if (!isDBSupported()) return [];
  
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Map to omit the heavy 'data' payload for the list view
      const items = request.result.map(item => ({
        id: item.id,
        title: item.title,
        timestamp: item.timestamp,
      }));
      // Sort by newest first
      items.sort((a, b) => b.timestamp - a.timestamp);
      resolve(items);
    };
    request.onerror = () => {
      console.error('[DB] Failed to fetch history items:', request.error);
      reject(request.error);
    };
  });
}

export async function getHistoryItem(id: string): Promise<HistoryItem | null> {
  console.log(`[DB] Fetching history item with ID: ${id}`);
  if (!isDBSupported()) return null;

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => {
      console.error('[DB] Failed to fetch history item:', request.error);
      reject(request.error);
    };
  });
}

export async function renameHistoryItem(id: string, newTitle: string): Promise<void> {
  console.log(`[DB] Renaming history item ${id} to "${newTitle}"`);
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (!item) { reject(new Error('Item not found')); return; }
      item.title = newTitle;
      const putReq = store.put(item);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteHistoryItem(id: string): Promise<void> {
  console.log(`[DB] Deleting history item with ID: ${id}`);
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('[DB] Failed to delete history item:', request.error);
      reject(request.error);
    };
  });
}
