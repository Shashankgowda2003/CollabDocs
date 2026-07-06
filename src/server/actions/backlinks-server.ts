import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { extractWikiLinks } from "@/lib/wiki-links";

export async function syncDocumentLinks(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { workspaceId: true },
  });
  if (!doc) throw new Error("Document not found");

  const blocks = await db.block.findMany({
    where: { documentId },
    select: { content: true },
  });

  const allContent = blocks.map((b) => b.content).join("\n");
  const titles = extractWikiLinks(allContent);

  const targetDocs = await db.document.findMany({
    where: {
      workspaceId: doc.workspaceId,
      title: { in: titles },
      deletedAt: null,
    },
    select: { id: true, title: true },
  });

  const targetIds = targetDocs.map((d) => d.id);

  await db.$transaction(async (tx) => {
    await tx.documentLink.deleteMany({ where: { sourceDocumentId: documentId } });

    for (const targetId of targetIds) {
      if (targetId === documentId) continue;
      await tx.documentLink.create({
        data: { sourceDocumentId: documentId, targetDocumentId: targetId },
      });
    }
  });

  return { linkedCount: targetIds.length };
}

export async function getBacklinks(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Viewer",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  return db.documentLink.findMany({
    where: { targetDocumentId: documentId },
    include: {
      sourceDocument: {
        select: { id: true, title: true, workspaceId: true },
      },
    },
  });
}

export async function getLinkedDocuments(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Viewer",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  return db.documentLink.findMany({
    where: { sourceDocumentId: documentId },
    include: {
      targetDocument: {
        select: { id: true, title: true, workspaceId: true },
      },
    },
  });
}

export async function getWorkspaceGraph(workspaceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!member) throw new Error("Not a workspace member");

  const [docs, links] = await Promise.all([
    db.document.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, title: true },
    }),
    db.documentLink.findMany({
      where: {
        sourceDocument: { workspaceId, deletedAt: null },
        targetDocument: { workspaceId, deletedAt: null },
      },
      select: { sourceDocumentId: true, targetDocumentId: true },
    }),
  ]);

  return { documents: docs, links };
}
