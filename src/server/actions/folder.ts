"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createFolder(workspaceId: string, _parentFolderId: string | null, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Workspace",
    resourceId: workspaceId,
    requiredRole: "Editor",
  });

  if (!permitted) throw new Error("Insufficient permissions");

  const name = (formData.get("name") as string) || "New Folder";

  await db.folder.create({
    data: {
      name,
      workspaceId,
      parentFolderId: null,
    },
  });

  revalidatePath(`/${workspaceId}`);
}

export async function renameFolder(folderId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const folder = await db.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw new Error("Folder not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Folder",
    resourceId: folderId,
    requiredRole: "Editor",
  });

  if (!permitted) throw new Error("Insufficient permissions");

  const name = formData.get("name") as string;
  if (!name?.trim()) return;

  await db.folder.update({ where: { id: folderId }, data: { name } });
  revalidatePath(`/${folder.workspaceId}/f/${folderId}`);
}

export async function deleteFolder(folderId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const folder = await db.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw new Error("Folder not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Folder",
    resourceId: folderId,
    requiredRole: "Editor",
  });

  if (!permitted) throw new Error("Insufficient permissions");

  const workspaceId = folder.workspaceId;
  await db.folder.delete({ where: { id: folderId } });

  revalidatePath(`/${workspaceId}`);
}
