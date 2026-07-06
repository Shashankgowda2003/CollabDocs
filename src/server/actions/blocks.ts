"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const SNAPSHOT_INTERVAL_SAVES = 10;

export async function saveBlockContent(blockId: string, content: string) {
  const session = await auth();
  const block = await db.block.findUnique({
    where: { id: blockId },
    select: { documentId: true },
  });
  if (!block || !session?.user) return;

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: block.documentId,
    requiredRole: "Editor",
  });
  if (!permitted) return;

  await db.block.update({
    where: { id: blockId },
    data: { content, updatedAt: new Date() },
  });
}

export async function saveBlocks(documentId: string, blocks: { id: string; type: string; content: string; parentBlockId: string | null; position: number }[]) {
  const session = await auth();
  if (!session?.user) return;

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });
  if (!permitted) return;

  const existingBlocks = await db.block.findMany({
    where: { documentId },
    select: { id: true },
  });
  const existingIds = new Set(existingBlocks.map((b) => b.id));

  const newBlockIds = blocks.filter((b) => !existingIds.has(b.id)).map((b) => b.id);
  const deletedIds = [...existingIds].filter((id) => !blocks.find((b) => b.id === id));

  let operationType = "update_block";
  if (newBlockIds.length > 0) operationType = "create_block";
  if (deletedIds.length > 0) operationType = "delete_block";

  await db.$transaction(async (tx) => {
    if (deletedIds.length > 0) {
      await tx.block.deleteMany({ where: { id: { in: deletedIds } } });
    }

    for (const block of blocks) {
      if (existingIds.has(block.id)) {
        await tx.block.update({
          where: { id: block.id },
          data: {
            content: block.content,
            type: block.type,
            parentBlockId: block.parentBlockId || null,
            position: block.position,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.block.create({
          data: {
            id: block.id,
            documentId,
            type: block.type,
            content: block.content,
            parentBlockId: block.parentBlockId || null,
            position: block.position,
          },
        });
      }
    }

    await tx.operation.create({
      data: {
        documentId,
        userId: session.user.id,
        type: operationType,
        payload: JSON.stringify({
          blockCount: blocks.length,
          newBlocks: newBlockIds,
          deletedBlocks: deletedIds,
        }),
      },
    });

    const opCount = await tx.operation.count({ where: { documentId } });
    const lastSnapshot = await tx.snapshot.findFirst({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });

    const opsSinceLast = lastSnapshot ? opCount - lastSnapshot.operationCount : opCount;
    if (opsSinceLast >= SNAPSHOT_INTERVAL_SAVES) {
      const allBlocks = await tx.block.findMany({
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

      await tx.snapshot.create({
        data: {
          documentId,
          data: JSON.stringify({ blocks: allBlocks }),
          operationCount: opCount,
        },
      });
    }
  });

  await db.document.update({
    where: { id: documentId },
    data: { updatedAt: new Date() },
  });

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { workspaceId: true },
  });
  if (doc) revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
}
