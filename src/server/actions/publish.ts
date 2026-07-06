"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function togglePublish(documentId: string) {
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

  const isPublished = !doc.isPublished;
  const publishedSlug = isPublished
    ? `${doc.id}-${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
    : null;

  await db.document.update({
    where: { id: documentId },
    data: { isPublished, publishedSlug },
  });

  await db.activityEntry.create({
    data: {
      workspaceId: doc.workspaceId,
      userId: session.user.id,
      action: isPublished ? "published" : "published",
      resource: "Document",
      resourceId: documentId,
      title: doc.title,
    },
  });

  revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
  return { isPublished, publishedSlug };
}

export async function getPublicDocument(slug: string) {
  const doc = await db.document.findFirst({
    where: { publishedSlug: slug, isPublished: true, deletedAt: null },
    include: {
      blocks: { orderBy: { position: "asc" } },
      workspace: { select: { name: true } },
    },
  });
  return doc;
}
