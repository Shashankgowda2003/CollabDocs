"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createSnapshot(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { workspaceId: true },
  });
  if (!doc) throw new Error("Document not found");

  const blocks = await db.block.findMany({
    where: { documentId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      type: true,
      content: true,
      parentBlockId: true,
      position: true,
      collapsed: true,
    },
  });

  const operationCount = await db.operation.count({ where: { documentId } });

  await db.snapshot.create({
    data: {
      documentId,
      data: JSON.stringify({ blocks }),
      operationCount,
    },
  });

  return { blockCount: blocks.length, operationCount };
}

export async function maybeCreateSnapshot(documentId: string) {
  const lastSnapshot = await db.snapshot.findFirst({
    where: { documentId },
    orderBy: { createdAt: "desc" },
  });

  const totalOps = await db.operation.count({ where: { documentId } });
  const opsSinceLast = lastSnapshot
    ? totalOps - lastSnapshot.operationCount
    : totalOps;

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentSnapshot = lastSnapshot && lastSnapshot.createdAt > fifteenMinutesAgo;

  if (opsSinceLast >= 500 || (!recentSnapshot && opsSinceLast > 0)) {
    return createSnapshot(documentId);
  }

  return { skipped: true, opsSinceLast };
}
