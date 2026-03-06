// db.ts - Implementación con Backend API y Fallback a IndexedDB
const DB_NAME = 'GestorProDB';
const DB_VERSION = 3;
const STORES = ['products', 'customers', 'suppliers', 'sales', 'purchases', 'settings', 'sellers', 'payments', 'authenticators', 'expenses'];

export class DBService {
  private db: IDBDatabase | null = null;
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        STORES.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log("🗄️ IndexedDB inicializada correctamente");
        resolve();
      };

      request.onerror = () => {
        console.error("❌ Error al abrir IndexedDB");
        reject(request.error);
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error("Base de datos no inicializada");
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    // Intentar obtener del backend primero
    if (this.token) {
      try {
        const response = await fetch(`/api/${storeName}`, { headers: this.getHeaders() });
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            // Sincronizar localmente
            const store = await this.getStore(storeName, 'readwrite');
            store.clear();
            data.forEach((item: any) => store.put(item));
            return data;
          }
        }
      } catch (err) {
        console.warn(`Error al obtener ${storeName} del backend, usando local:`, err);
      }
    }

    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, item: T): Promise<void> {
    // Guardar localmente primero
    const store = await this.getStore(storeName, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Intentar guardar en el backend
    if (this.token) {
      try {
        const response = await fetch(`/api/${storeName}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(item)
        });
        
        if (response.status === 401 || response.status === 403) {
          throw new Error("SESSION_EXPIRED");
        }
      } catch (err: any) {
        if (err.message === "SESSION_EXPIRED") throw err;
        console.warn(`Error al guardar ${storeName} en el backend:`, err);
      }
    }
  }

  async delete(storeName: string, id: string): Promise<void> {
    // Eliminar localmente
    const store = await this.getStore(storeName, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Intentar eliminar en el backend
    if (this.token) {
      try {
        await fetch(`/api/${storeName}/${id}`, {
          method: 'DELETE',
          headers: this.getHeaders()
        });
      } catch (err) {
        console.warn(`Error al eliminar ${storeName} en el backend:`, err);
      }
    }
  }

  async clearAllData(): Promise<void> {
    console.log("🧹 Iniciando limpieza total de datos...");
    await this.init();
    if (!this.db) {
      console.error("❌ No se pudo limpiar: IndexedDB no inicializada");
      return;
    }
    
    // 1. Limpiar Backend primero si hay token
    if (this.token) {
      try {
        console.log("📡 Reseteando backend...");
        const response = await fetch('/api/system/reset', { 
          method: 'POST', 
          headers: this.getHeaders() 
        });
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await response.json();
            console.warn("⚠️ El backend devolvió error al resetear:", errorData.message);
          } else {
            const text = await response.text();
            console.warn("⚠️ El backend devolvió una respuesta no JSON:", text);
          }
        } else {
          console.log("✅ Backend reseteado correctamente");
        }
      } catch (err) {
        console.error("❌ Error de red al resetear backend:", err);
      }
    }

    // 2. Limpiar IndexedDB
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(STORES, 'readwrite');
        STORES.forEach(storeName => {
          transaction.objectStore(storeName).clear();
        });

        transaction.oncomplete = () => {
          console.log("✅ IndexedDB limpiada correctamente");
          resolve();
        };
        transaction.onerror = () => {
          console.error("❌ Error en transacción de IndexedDB:", transaction.error);
          reject(transaction.error);
        };
      } catch (err) {
        console.error("❌ Error al crear transacción de limpieza:", err);
        reject(err);
      }
    });
  }

  async exportBackup(): Promise<string> {
    const backup: Record<string, any[]> = {};
    for (const storeName of STORES) {
      backup[storeName] = await this.getAll(storeName);
    }
    return JSON.stringify(backup);
  }

  async importBackup(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    await this.init();
    
    for (const storeName of STORES) {
      if (Array.isArray(data[storeName])) {
        const store = await this.getStore(storeName, 'readwrite');
        store.clear();
        for (const item of data[storeName]) {
          store.put(item);
          if (this.token) {
            fetch(`/api/${storeName}`, {
              method: 'POST',
              headers: this.getHeaders(),
              body: JSON.stringify(item)
            }).catch(console.error);
          }
        }
      }
    }
  }
}

export const dbService = new DBService();
