"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function moveToTrash(resourceType: "Document" | "Folder", resourceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType,
    resourceId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  if (resourceType === "Document") {
    await db.document.update({ where: { id: resourceId }, data: { deletedAt: new Date() } });
    const doc = await db.document.findUnique({ where: { id: resourceId }, select: { workspaceId: true } });
    revalidatePath(`/${doc?.workspaceId}`);
  } else {
    await db.folder.update({ where: { id: resourceId }, data: { deletedAt: new Date() } });
    const folder = await db.folder.findUnique({ where: { id: resourceId }, select: { workspaceId: true } });
    revalidatePath(`/${folder?.workspaceId}`);
  }
}

export async function restoreFromTrash(resourceType: "Document" | "Folder", resourceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (resourceType === "Document") {
    const doc = await db.document.findUnique({ where: { id: resourceId } });
    if (!doc?.deletedAt) throw new Error("Not in trash");
    await db.document.update({ where: { id: resourceId }, data: { deletedAt: null } });
    revalidatePath(`/${doc.workspaceId}`);
  } else {
    const folder = await db.folder.findUnique({ where: { id: resourceId } });
    if (!folder?.deletedAt) throw new Error("Not in trash");
    await db.folder.update({ where: { id: resourceId }, data: { deletedAt: null } });
    revalidatePath(`/${folder.workspaceId}`);
  }
}

export async function permanentDelete(resourceType: "Document" | "Folder", resourceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (resourceType === "Document") {
    const doc = await db.document.findUnique({ where: { id: resourceId } });
    if (!doc) throw new Error("Document not found");
    await db.document.delete({ where: { id: resourceId } });
    if (doc.workspaceId) revalidatePath(`/${doc.workspaceId}`);
  } else {
    const folder = await db.folder.findUnique({ where: { id: resourceId } });
    if (!folder) throw new Error("Folder not found");
    await db.folder.delete({ where: { id: resourceId } });
    if (folder?.workspaceId) revalidatePath(`/${folder.workspaceId}`);
  }
}

export async function getTrash(workspaceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const docs = await db.document.findMany({
    where: { workspaceId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });

  const folders = await db.folder.findMany({
    where: { workspaceId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });

  return { documents: docs, folders };
}
