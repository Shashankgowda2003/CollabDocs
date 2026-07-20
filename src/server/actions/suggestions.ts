"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createSuggestion(
  documentId: string,
  blockId: string | null,
  type: "add" | "remove" | "change",
  oldContent: string,
  newContent: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Commenter",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  const doc = await db.document.findUnique({ where: { id: documentId }, select: { workspaceId: true } });
  if (!doc) throw new Error("Document not found");

  // Upsert: if a pending suggestion already exists for this user+block, update it instead of creating a duplicate
  const existing = await db.suggestion.findFirst({
    where: { documentId, blockId, userId: session.user.id, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  let suggestionId: string;
  if (existing) {
    await db.suggestion.update({
      where: { id: existing.id },
      data: { newContent, type, oldContent },
    });
    suggestionId = existing.id;
  } else {
    const created = await db.suggestion.create({
      data: { documentId, blockId, userId: session.user.id, type, oldContent, newContent },
    });
    suggestionId = created.id;
  }

  revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
  return { id: suggestionId };
}

export async function getSuggestions(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.suggestion.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
}

export async function resolveSuggestion(suggestionId: string, status: "accepted" | "rejected") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const suggestion = await db.suggestion.findUnique({
    where: { id: suggestionId },
    include: { document: { select: { workspaceId: true } } },
  });
  if (!suggestion) throw new Error("Suggestion not found");

  await db.suggestion.update({ where: { id: suggestionId }, data: { status } });

  if (status === "accepted" && suggestion.blockId) {
    const existingBlock = await db.block.findUnique({ where: { id: suggestion.blockId } });
    if (existingBlock) {
      await db.block.update({
        where: { id: suggestion.blockId },
        data: { content: suggestion.newContent },
      });
    } else {
      await db.block.create({
        data: {
          id: suggestion.blockId,
          documentId: suggestion.documentId,
          type: "paragraph",
          content: suggestion.newContent,
          position: 0,
        },
      });
    }
  }

  revalidatePath(`/${suggestion.document.workspaceId}/d/${suggestion.documentId}`);
}
