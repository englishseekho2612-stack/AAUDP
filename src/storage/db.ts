/**
 * Structured Local Database Engine
 * 
 * Uses IndexedDB for high-capacity, reliable structured project storage,
 * with automatic fallback to localStorage if IndexedDB is unavailable in
 * any sandbox or restricted browser iframe.
 */

import { TeachingProject } from '../types/project';

const DB_NAME = 'ai_teaching_studio_db';
const STORE_NAME = 'projects';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'ai_teaching_studio_projects_cache';

class LocalProjectDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDBAvailable = true;

  constructor() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isIndexedDBAvailable = false;
    }
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('updatedTimestamp', 'updatedTimestamp', { unique: false });
            store.createIndex('lastOpenedTimestamp', 'lastOpenedTimestamp', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => {
          console.warn('IndexedDB open error, falling back to localStorage:', e);
          this.isIndexedDBAvailable = false;
          reject(request.error);
        };
      } catch (err) {
        console.warn('IndexedDB initialization failed, falling back:', err);
        this.isIndexedDBAvailable = false;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  // --- LocalStorage Fallback Helpers ---
  private getFromLocalStorage(): TeachingProject[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(projects: TeachingProject[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  // --- Database Operations ---

  async getAllProjects(): Promise<TeachingProject[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result as TeachingProject[]) || [];
          // Sort by updated timestamp descending
          list.sort((a, b) => b.updatedTimestamp - a.updatedTimestamp);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      const list = this.getFromLocalStorage();
      list.sort((a, b) => b.updatedTimestamp - a.updatedTimestamp);
      return list;
    }
  }

  async getProjectById(id: string): Promise<TeachingProject | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => resolve((req.result as TeachingProject) || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getFromLocalStorage();
      return list.find((p) => p.id === id) || null;
    }
  }

  async saveProject(project: TeachingProject): Promise<void> {
    const updated = {
      ...project,
      updatedTimestamp: Date.now(),
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.put(updated);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      const list = this.getFromLocalStorage();
      const idx = list.findIndex((p) => p.id === updated.id);
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      this.saveToLocalStorage(list);
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getFromLocalStorage().filter((p) => p.id !== id);
      this.saveToLocalStorage(list);
    }
    return true;
  }

  async getStorageStats(): Promise<{ projectCount: number; estimatedSizeBytes: number }> {
    const projects = await this.getAllProjects();
    const jsonStr = JSON.stringify(projects);
    const estimatedSizeBytes = new Blob([jsonStr]).size;
    return {
      projectCount: projects.length,
      estimatedSizeBytes,
    };
  }
}

export const projectDatabase = new LocalProjectDatabase();
