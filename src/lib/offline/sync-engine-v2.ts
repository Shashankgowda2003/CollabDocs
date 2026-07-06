"use client";

import { getAllPendingOperations, addPendingOperation, removePendingOperation } from "./index";
import { replayPendingOperation } from "@/server/actions/replay";

export type SyncOperation =
  | { type: "snapshot"; documentId: string }
  | { type: "sync_links"; documentId: string };

export async function queueOperation(op: SyncOperation) {
  await addPendingOperation({
    documentId: op.type === "snapshot" || op.type === "sync_links" ? op.documentId : "global",
    type: op.type,
    payload: op,
  });
}

export async function syncPendingOperations(): Promise<{
  success: number;
  failed: number;
}> {
  const allOps = await getAllPendingOperations();
  let success = 0;
  let failed = 0;

  for (const op of allOps) {
    try {
      const payload = JSON.parse(op.payload) as SyncOperation;
      const result = await replayPendingOperation(payload.type, payload.documentId);
      if (result.ok) {
        await removePendingOperation(op.id);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { success, failed };
}

export async function getPendingCount(): Promise<number> {
  const ops = await getAllPendingOperations();
  return ops.length;
}
