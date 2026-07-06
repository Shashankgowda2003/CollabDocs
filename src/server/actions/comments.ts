"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export async function createThread(
  documentId: string,
  blockId: string | null,
  textRangeAnchor: string | null,
  content: string
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

  const thread = await db.commentThread.create({
    data: {
      documentId,
      blockId,
      textRangeAnchor,
      authorId: session.user.id,
      status: "Open",
      replies: {
        create: {
          authorId: session.user.id,
          content,
        },
      },
    },
    include: { replies: true, author: { select: { id: true, name: true, image: true } } },
  });

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { workspaceId: true, title: true },
  });

  const mentionedEmails = extractMentions(content);
  for (const email of mentionedEmails) {
    const user = await db.user.findUnique({ where: { email } });
    if (user && user.id !== session.user.id) {
      await createNotification({
        userId: user.id,
        type: "mention",
        title: `${session.user.name || "Someone"} mentioned you`,
        body: `in "${doc?.title || "a document"}": ${content.slice(0, 100)}`,
        workspaceId: doc?.workspaceId,
        documentId,
      });
    }
  }

  revalidatePath(`/${doc?.workspaceId}/d/${documentId}`);
  return thread;
}

function extractMentions(content: string): string[] {
  const matches = content.match(/@([\w.+-]+@[\w-]+\.[\w.-]+)/g);
  return (matches || []).map((m) => m.slice(1));
}

export async function addReply(threadId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const thread = await db.commentThread.findUnique({
    where: { id: threadId },
    select: { documentId: true },
  });
  if (!thread) throw new Error("Thread not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: thread.documentId,
    requiredRole: "Commenter",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  await db.commentReply.create({
    data: { threadId, authorId: session.user.id, content },
  });

  const doc = await db.document.findUnique({
    where: { id: thread.documentId },
    select: { workspaceId: true, title: true },
  });

  const threadData = await db.commentThread.findUnique({
    where: { id: threadId },
    select: { authorId: true },
  });

  if (threadData && threadData.authorId !== session.user.id) {
    await createNotification({
      userId: threadData.authorId,
      type: "reply",
      title: `${session.user.name || "Someone"} replied`,
      body: `in "${doc?.title || "a document"}": ${content.slice(0, 100)}`,
      workspaceId: doc?.workspaceId,
      documentId: thread.documentId,
    });
  }

  revalidatePath(`/${doc?.workspaceId}/d/${thread.documentId}`);
}

export async function resolveThread(threadId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const thread = await db.commentThread.findUnique({
    where: { id: threadId },
    select: { documentId: true, status: true },
  });
  if (!thread) throw new Error("Thread not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: thread.documentId,
    requiredRole: "Commenter",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  const newStatus = thread.status === "Open" ? "Resolved" : "Open";

  await db.commentThread.update({
    where: { id: threadId },
    data: { status: newStatus },
  });

  const doc = await db.document.findUnique({
    where: { id: thread.documentId },
    select: { workspaceId: true },
  });

  revalidatePath(`/${doc?.workspaceId}/d/${thread.documentId}`);
}

export async function deleteThread(threadId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const thread = await db.commentThread.findUnique({
    where: { id: threadId },
    select: { documentId: true, authorId: true },
  });
  if (!thread) throw new Error("Thread not found");

  if (thread.authorId !== session.user.id) {
    const permitted = await checkPermission({
      userId: session.user.id,
      resourceType: "Document",
      resourceId: thread.documentId,
      requiredRole: "Admin",
    });
    if (!permitted) throw new Error("Only the author or admins can delete threads");
  }

  await db.commentThread.delete({ where: { id: threadId } });

  const doc = await db.document.findUnique({
    where: { id: thread.documentId },
    select: { workspaceId: true },
  });

  revalidatePath(`/${doc?.workspaceId}/d/${thread.documentId}`);
}
