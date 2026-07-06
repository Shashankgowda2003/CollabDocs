"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";

export async function getVersionHistory(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const ops = await db.operation.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  const snapshots = await db.snapshot.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return { operations: ops, snapshots };
}

export async function restoreSnapshot(snapshotId: string, documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  const snapshot = await db.snapshot.findUnique({ where: { id: snapshotId } });
  if (!snapshot) throw new Error("Snapshot not found");

  const data = JSON.parse(snapshot.data);
  const blocks: Array<{
    id: string; type: string; content: string;
    parentBlockId: string | null; position: number;
  }> = data.blocks || [];

  await db.block.deleteMany({ where: { documentId } });

  for (const block of blocks) {
    await db.block.create({
      data: {
        id: block.id,
        documentId,
        type: block.type,
        content: block.content,
        parentBlockId: block.parentBlockId,
        position: block.position,
      },
    });
  }

  await db.operation.create({
    data: {
      documentId,
      userId: session.user.id,
      type: "document_restore",
      payload: JSON.stringify({ snapshotId, restoredAt: new Date().toISOString() }),
    },
  });

  return { success: true };
}
