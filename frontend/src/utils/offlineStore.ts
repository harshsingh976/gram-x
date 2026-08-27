/**
 * GRAM-X Genuine IndexedDB Offline Store & Synchronization Manager
 * Module: offlineStore.ts
 */

const DB_NAME = 'gramx_offline_store';
const DB_VERSION = 1;

export interface OfflineAction {
  id: string; // unique client UUID
  action_type: 'SUBMIT_GRIEVANCE' | 'UPDATE_TASK_STATUS' | 'UPLOAD_EVIDENCE';
  payload: Record<string, any>;
  created_at: string;
  status: 'draft' | 'pending_sync' | 'syncing' | 'synced' | 'failed';
  retry_count: number;
  error_message?: string;
}

class OfflineStoreManager {
  private db: IDBDatabase | null = null;
  private isSyncing = false;

  public async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('actions')) {
          const store = db.createObjectStore('actions', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        console.log('[OfflineStore] IndexedDB initialized.');
        resolve();
      };

      request.onerror = (err) => {
        console.error('[OfflineStore] Failed to open IndexedDB:', err);
        reject(err);
      };
    });
  }

  public async saveAction(action: Omit<OfflineAction, 'id' | 'created_at' | 'status' | 'retry_count'>): Promise<OfflineAction> {
    if (!this.db) await this.init();

    const fullAction: OfflineAction = {
      ...action,
      id: 'act_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      created_at: new Date().toISOString(),
      status: 'pending_sync',
      retry_count: 0
    };

    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not ready');
      const tx = this.db.transaction('actions', 'readwrite');
      const store = tx.objectStore('actions');
      const req = store.add(fullAction);
      req.onsuccess = () => resolve(fullAction);
      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction('actions', 'readonly');
      const store = tx.objectStore('actions');
      const req = store.getAll();
      req.onsuccess = () => {
        const all: OfflineAction[] = req.result || [];
        resolve(all.filter(a => a.status === 'pending_sync' || a.status === 'failed'));
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async markActionSynced(id: string): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction('actions', 'readwrite');
    const store = tx.objectStore('actions');
    store.delete(id);
  }

  public async syncWithServer(apiBase: string, token: string): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !navigator.onLine) return { synced: 0, failed: 0 };

    const pending = await this.getPendingActions();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const payload = {
        device_id: 'BROWSER_' + (localStorage.getItem('username') || 'ANON'),
        actions: pending.map(p => ({
          client_id: p.id,
          action_type: p.action_type,
          payload: p.payload,
          client_timestamp: p.created_at
        }))
      };

      const res = await fetch(`${apiBase}/offline/sync-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        for (const item of data.results || []) {
          if (item.sync_status === 'SYNCED') {
            await this.markActionSynced(item.client_id);
            synced++;
          } else {
            failed++;
          }
        }
      }
    } catch (e) {
      console.warn('[OfflineStore] Sync network failure:', e);
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }
}

export const offlineStore = new OfflineStoreManager();
