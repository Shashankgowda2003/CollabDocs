"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function duplicateDocument(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { blocks: true, documentTags: true },
  });
  if (!doc) throw new Error("Document not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  const newDoc = await db.document.create({
    data: {
      title: `${doc.title} (Copy)`,
      workspaceId: doc.workspaceId,
      folderId: doc.folderId,
      authorId: session.user.id,
      blocks: {
        create: doc.blocks.map((b) => ({
          type: b.type,
          content: b.content,
          parentBlockId: null,
          position: b.position,
        })),
      },
    },
  });

  if (doc.documentTags.length > 0) {
    await db.documentTag.createMany({
      data: doc.documentTags.map((dt) => ({
        documentId: newDoc.id,
        tagId: dt.tagId,
      })),
    });
  }

  revalidatePath(`/${doc.workspaceId}`);
  return newDoc.id;
}

export async function duplicateFolder(folderId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const folder = await db.folder.findUnique({
    where: { id: folderId },
    include: { childFolders: true, documents: true },
  });
  if (!folder) throw new Error("Folder not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Folder",
    resourceId: folderId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  const newFolder = await db.folder.create({
    data: {
      name: `${folder.name} (Copy)`,
      workspaceId: folder.workspaceId,
      parentFolderId: folder.parentFolderId,
    },
  });

  for (const doc of folder.documents) {
    const newDoc = await db.document.create({
      data: {
        title: doc.title,
        workspaceId: doc.workspaceId,
        folderId: newFolder.id,
        authorId: session.user.id,
      },
    });

    const blocks = await db.block.findMany({
      where: { documentId: doc.id },
    });

    if (blocks.length > 0) {
      await db.block.createMany({
        data: blocks.map((b) => ({
          documentId: newDoc.id,
          type: b.type,
          content: b.content,
          parentBlockId: null,
          position: b.position,
        })),
      });
    }
  }

  revalidatePath(`/${folder.workspaceId}`);
  return newFolder.id;
}
