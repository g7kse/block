/* =========================================================================
   db.js — thin promise wrapper around IndexedDB.
   Stores: blocks, sessions, settings
   Everything stays on-device; nothing is sent anywhere.
   ========================================================================= */
const DB_NAME = "rowing-planner-db";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("blocks")) {
        db.createObjectStore("blocks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("sessions")) {
        const s = db.createObjectStore("sessions", { keyPath: "id" });
        s.createIndex("byDate", "date", { unique: false });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

let _dbPromise = null;
function getDB() {
  if (!_dbPromise) _dbPromise = openDB();
  return _dbPromise;
}

function tx(storeName, mode) {
  return getDB().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const DB = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  async put(store, obj) {
    const s = await tx(store, "readwrite");
    return reqToPromise(s.put(obj));
  },
  async get(store, key) {
    const s = await tx(store, "readonly");
    return reqToPromise(s.get(key));
  },
  async delete(store, key) {
    const s = await tx(store, "readwrite");
    return reqToPromise(s.delete(key));
  },
  async all(store) {
    const s = await tx(store, "readonly");
    return reqToPromise(s.getAll());
  },
  async clear(store) {
    const s = await tx(store, "readwrite");
    return reqToPromise(s.clear());
  },

  // sessions in a date range, inclusive, YYYY-MM-DD strings
  async sessionsInRange(startISO, endISO) {
    const s = await tx("sessions", "readonly");
    const idx = s.index("byDate");
    const range = IDBKeyRange.bound(startISO, endISO);
    return reqToPromise(idx.getAll(range));
  },

  async setSetting(key, value) {
    return this.put("settings", { key, value });
  },
  async getSetting(key, fallback) {
    const rec = await this.get("settings", key);
    return rec ? rec.value : fallback;
  },

  // full-data export/import for backup and moving between Netlify <-> Snap
  async exportAll() {
    const [blocks, sessions, settingsArr] = await Promise.all([
      this.all("blocks"),
      this.all("sessions"),
      this.all("settings"),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      version: DB_VERSION,
      blocks,
      sessions,
      settings: settingsArr,
    };
  },
  async importAll(data, { replace = true } = {}) {
    if (replace) {
      await Promise.all([this.clear("blocks"), this.clear("sessions"), this.clear("settings")]);
    }
    const jobs = [];
    (data.blocks || []).forEach((b) => jobs.push(this.put("blocks", b)));
    (data.sessions || []).forEach((s) => jobs.push(this.put("sessions", s)));
    (data.settings || []).forEach((s) => jobs.push(this.put("settings", s)));
    await Promise.all(jobs);
  },
};
