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

  await db.suggestion.create({
    data: {
      documentId,
      blockId,
      userId: session.user.id,
      type,
      oldContent,
      newContent,
    },
  });

  revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
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
    await db.block.update({
      where: { id: suggestion.blockId },
      data: { content: suggestion.newContent },
    });
  }

  revalidatePath(`/${suggestion.document.workspaceId}/d/${suggestion.documentId}`);
}
