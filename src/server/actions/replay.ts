"use server";

import { createSnapshot } from "@/server/actions/snapshots";
import { syncDocumentLinks } from "@/server/actions/backlinks-server";

export async function replayPendingOperation(type: string, documentId: string) {
  if (type === "snapshot") {
    await createSnapshot(documentId);
    return { ok: true };
  }
  if (type === "sync_links") {
    await syncDocumentLinks(documentId);
    return { ok: true };
  }
  return { ok: false, error: "Unknown operation type" };
}
