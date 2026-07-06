"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createFromTemplate(templateId: string, workspaceId: string, title?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const template = await db.template.findUnique({ where: { id: templateId } });
  if (!template) throw new Error("Template not found");

  const blocks = JSON.parse(template.blocksJson) as Array<{
    type: string; content: string; position: number;
  }>;

  const doc = await db.document.create({
    data: {
      title: title || template.title,
      workspaceId,
      authorId: session.user.id,
      blocks: { create: blocks.map((b) => ({ type: b.type, content: b.content, position: b.position })) },
    },
  });

  revalidatePath(`/${workspaceId}`);
  return doc.id;
}

export async function saveAsTemplate(documentId: string, title: string, description?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { blocks: { orderBy: { position: "asc" } } },
  });
  if (!doc) throw new Error("Document not found");

  const blocksJson = JSON.stringify(
    doc.blocks.map((b) => ({ type: b.type, content: b.content, position: b.position }))
  );

  await db.template.create({
    data: {
      title,
      description: description || "",
      workspaceId: doc.workspaceId,
      authorId: session.user.id,
      blocksJson,
    },
  });

  revalidatePath(`/${doc.workspaceId}`);
}

export async function getTemplates(workspaceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.template.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } },
  });
}

export async function deleteTemplate(templateId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const template = await db.template.findUnique({ where: { id: templateId } });
  if (!template) throw new Error("Template not found");

  await db.template.delete({ where: { id: templateId } });
  revalidatePath(`/${template.workspaceId}`);
}
