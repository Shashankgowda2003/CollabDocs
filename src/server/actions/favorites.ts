"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  const existing = await db.favorite.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId,
      },
    },
  });

  if (existing) {
    await db.favorite.delete({
      where: { id: existing.id },
    });
    revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
    return { favorited: false };
  }

  await db.favorite.create({
    data: {
      userId: session.user.id,
      documentId,
    },
  });

  revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
  return { favorited: true };
}

export async function getFavorites() {
  const session = await auth();
  if (!session?.user) return [];

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      document: {
        include: {
          workspace: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return favorites.map((f) => f.document);
}

export async function checkIsFavorite(documentId: string) {
  const session = await auth();
  if (!session?.user) return false;

  const existing = await db.favorite.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId,
      },
    },
  });

  return existing !== null;
}
