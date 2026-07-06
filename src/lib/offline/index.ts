"use client";

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "collabdocs-offline";
const DB_VERSION = 1;

interface CachedDocument {
  id: string;
  title: string;
  workspaceId: string;
  content: string;
  blocks: string;
  updatedAt: number;
}

interface PendingOperation {
  id: string;
  documentId: string;
  type: string;
  payload: string;
  createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("documents")) {
          db.createObjectStore("documents", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("pendingOps")) {
          const store = db.createObjectStore("pendingOps", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("documentId", "documentId");
        }
        if (!db.objectStoreNames.contains("preferences")) {
          db.createObjectStore("preferences", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheDocument(doc: {
  id: string;
  title: string;
  workspaceId: string;
  blocks: unknown[];
  content?: string;
}) {
  const db = await getDb();
  await db.put("documents", {
    id: doc.id,
    title: doc.title,
    workspaceId: doc.workspaceId,
    content: doc.content || "",
    blocks: JSON.stringify(doc.blocks),
    updatedAt: Date.now(),
  } as CachedDocument);
}

export async function getCachedDocument(id: string) {
  const db = await getDb();
  return db.get("documents", id) as Promise<CachedDocument | undefined>;
}

export async function removeCachedDocument(id: string) {
  const db = await getDb();
  await db.delete("documents", id);
}

export async function addPendingOperation(op: {
  documentId: string;
  type: string;
  payload: unknown;
}) {
  const db = await getDb();
  await db.add("pendingOps", {
    documentId: op.documentId,
    type: op.type,
    payload: JSON.stringify(op.payload),
    createdAt: Date.now(),
  });
}

export async function getPendingOperations(
  documentId: string
): Promise<PendingOperation[]> {
  const db = await getDb();
  return db.getAllFromIndex("pendingOps", "documentId", documentId);
}

export async function clearPendingOperations(documentId: string) {
  const db = await getDb();
  const ops = await db.getAllFromIndex("pendingOps", "documentId", documentId);
  for (const op of ops) {
    if (op.id) await db.delete("pendingOps", op.id);
  }
}

export async function getAllPendingOperations(): Promise<PendingOperation[]> {
  const db = await getDb();
  return db.getAll("pendingOps");
}

export async function removePendingOperation(id: string | number) {
  const db = await getDb();
  await db.delete("pendingOps", id);
}

export async function savePreference(key: string, value: unknown) {
  const db = await getDb();
  await db.put("preferences", { key, value });
}

export async function getPreference<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  const entry = await db.get("preferences", key);
  return entry?.value as T | undefined;
}
