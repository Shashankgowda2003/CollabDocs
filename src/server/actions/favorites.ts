"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  const existing = await db.document.findFirst({
    where: {
      id: documentId,
      authorId: session.user.id,
    },
  });

  if (!existing) {
    return { favorited: false };
  }

  revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
  return { favorited: true };
}

export async function getFavorites() {
  const session = await auth();
  if (!session?.user) return [];

  const memberships = await db.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const docs = await db.document.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { workspace: { select: { id: true, name: true } } },
  });

  return docs;
}
