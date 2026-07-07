"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function moveDocument(documentId: string, targetFolderId: string | null) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { id: true, workspaceId: true, folderId: true },
  });
  if (!doc) throw new Error("Document not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  if (targetFolderId) {
    const folder = await db.folder.findUnique({
      where: { id: targetFolderId },
      select: { workspaceId: true },
    });
    if (!folder || folder.workspaceId !== doc.workspaceId) {
      throw new Error("Target folder not found");
    }
  }

  if (doc.folderId === targetFolderId) return;

  await db.document.update({
    where: { id: documentId },
    data: { folderId: targetFolderId },
  });

  revalidatePath(`/${doc.workspaceId}`);
  if (doc.folderId) {
    revalidatePath(`/${doc.workspaceId}/f/${doc.folderId}`);
  }
  if (targetFolderId) {
    revalidatePath(`/${doc.workspaceId}/f/${targetFolderId}`);
  }
}

export async function createDocument(workspaceId: string, _folderId: string | null, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Workspace",
    resourceId: workspaceId,
    requiredRole: "Editor",
  });

  if (!permitted) throw new Error("Insufficient permissions");

  const title = (formData.get("title") as string) || "Untitled";

  const doc = await db.document.create({
    data: {
      title,
      workspaceId,
      folderId: null,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/${workspaceId}`);
  redirect(`/${workspaceId}/d/${doc.id}`);
}

export async function renameDocument(documentId: string, titleOrFormData: string | FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });

  if (!permitted) throw new Error("Insufficient permissions");

  const title =
    typeof titleOrFormData === "string"
      ? titleOrFormData
      : (titleOrFormData.get("title") as string);

  if (!title?.trim()) return;

  await db.document.update({
    where: { id: documentId },
    data: { title },
  });

  revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
}

export async function deleteDocument(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });

  if (!permitted) throw new Error("Insufficient permissions");

  const workspaceId = doc.workspaceId;
  await db.document.delete({ where: { id: documentId } });

  revalidatePath(`/${workspaceId}`);
  redirect(`/${workspaceId}`);
}
