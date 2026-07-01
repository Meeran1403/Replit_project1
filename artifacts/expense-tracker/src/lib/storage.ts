export type StorageType = "localStorage" | "filesystem";

export const supportsFileSystem = (): boolean =>
  typeof window !== "undefined" && "showSaveFilePicker" in window;

// ── IndexedDB helpers (for persisting the FileSystemFileHandle) ──────────────

function openHandlesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ledger-handles", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("handles");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getHandleFromDB(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openHandlesDB();
    return new Promise((resolve) => {
      const tx = db.transaction("handles", "readonly");
      const req = tx.objectStore("handles").get("dataFile");
      req.onsuccess = () => resolve((req.result as FileSystemFileHandle) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveHandleToDB(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openHandlesDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("handles", "readwrite");
      tx.objectStore("handles").put(handle, "dataFile");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

// ── Filesystem read / write ──────────────────────────────────────────────────

export async function readFromFile(handle: FileSystemFileHandle): Promise<string | null> {
  try {
    const file = await handle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

export async function writeToFile(handle: FileSystemFileHandle, content: string): Promise<boolean> {
  try {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export async function checkPermission(
  handle: FileSystemFileHandle
): Promise<"granted" | "prompt" | "denied"> {
  try {
    return await handle.queryPermission({ mode: "readwrite" });
  } catch {
    return "denied";
  }
}

export async function requestPermission(
  handle: FileSystemFileHandle
): Promise<"granted" | "prompt" | "denied"> {
  try {
    return await handle.requestPermission({ mode: "readwrite" });
  } catch {
    return "denied";
  }
}

/** Open the file picker and return the chosen handle. Call only from a user gesture. */
export async function pickSaveFile(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: "ledger-data.json",
      types: [{ description: "Ledger Data", accept: { "application/json": [".json"] } }],
    });
    return handle as FileSystemFileHandle;
  } catch {
    return null;
  }
}
