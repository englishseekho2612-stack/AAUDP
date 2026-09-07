/**
 * Large Media & Binary Storage Abstraction
 * 
 * Requirement #10: Clean separation between:
 * 1. Structured project data (Stored in IndexedDB/Storage)
 * 2. Large files/media (PDF, Images, Audio, Video, Recordings, Slide Assets)
 * 
 * In web and mobile, large media files should NOT bloat the structured
 * metadata documents. This service provides the contract and local blob
 * storage engine (using dedicated IndexedDB ObjectStore for binary blobs).
 */

export interface StoredBlobInfo {
  blobId: string;
  projectId: string;
  sourceId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
}

export interface IBlobStorageService {
  saveBlob(projectId: string, fileName: string, mimeType: string, data: Blob | ArrayBuffer): Promise<StoredBlobInfo>;
  getBlob(blobId: string): Promise<Blob | null>;
  deleteBlob(blobId: string): Promise<boolean>;
  deleteBlobsForProject(projectId: string): Promise<number>;
  getTotalStorageUsageBytes(): Promise<number>;
}

const BLOB_DB_NAME = 'ai_teaching_studio_blobs';
const BLOB_STORE_NAME = 'media_blobs';
const BLOB_DB_VERSION = 1;

class LocalBlobStorageService implements IBlobStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in current environment'));
      }

      const request = indexedDB.open(BLOB_DB_NAME, BLOB_DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(BLOB_STORE_NAME)) {
          const store = db.createObjectStore(BLOB_STORE_NAME, { keyPath: 'blobId' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async saveBlob(
    projectId: string,
    fileName: string,
    mimeType: string,
    data: Blob | ArrayBuffer
  ): Promise<StoredBlobInfo> {
    const db = await this.getDB();
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const blobId = `blob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const info: StoredBlobInfo = {
      blobId,
      projectId,
      fileName,
      mimeType,
      sizeBytes: blob.size,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BLOB_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BLOB_STORE_NAME);
      const record = { ...info, data: blob };
      
      const req = store.put(record);
      req.onsuccess = () => resolve(info);
      req.onerror = () => reject(req.error);
    });
  }

  async getBlob(blobId: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([BLOB_STORE_NAME], 'readonly');
        const store = transaction.objectStore(BLOB_STORE_NAME);
        const req = store.get(blobId);

        req.onsuccess = () => {
          if (req.result && req.result.data) {
            resolve(req.result.data);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async deleteBlob(blobId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([BLOB_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(BLOB_STORE_NAME);
        const req = store.delete(blobId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return false;
    }
  }

  async deleteBlobsForProject(projectId: string): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([BLOB_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(BLOB_STORE_NAME);
        const index = store.index('projectId');
        const req = index.getAllKeys(projectId);

        req.onsuccess = () => {
          const keys = req.result;
          let count = 0;
          for (const key of keys) {
            store.delete(key);
            count++;
          }
          resolve(count);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return 0;
    }
  }

  async getTotalStorageUsageBytes(): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([BLOB_STORE_NAME], 'readonly');
        const store = transaction.objectStore(BLOB_STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          let total = 0;
          for (const item of req.result) {
            if (item.sizeBytes) {
              total += item.sizeBytes;
            }
          }
          resolve(total);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return 0;
    }
  }
}

export const blobStorage: IBlobStorageService = new LocalBlobStorageService();
