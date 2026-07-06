"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type NotificationEvent =
  | "mention"
  | "comment"
  | "reply"
  | "share"
  | "permission_change"
  | "document_restore"
  | "ai_complete"
  | "workspace_invite";

export async function createNotification(params: {
  userId: string;
  type: NotificationEvent;
  title: string;
  body: string;
  workspaceId?: string;
  documentId?: string;
}) {
  await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      workspaceId: params.workspaceId || null,
      documentId: params.documentId || null,
    },
  });
}

export async function getNotifications() {
  const session = await auth();
  if (!session?.user) return [];

  return db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/dashboard");
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user) return 0;

  return db.notification.count({
    where: { userId: session.user.id, read: false },
  });
}

export async function updateNotificationPrefs(
  muteParams: {
    workspaceId?: string;
    folderId?: string;
    documentId?: string;
    threadId?: string;
  },
  muted: boolean
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await db.notificationPreference.findFirst({
    where: {
      userId: session.user.id,
      workspaceId: muteParams.workspaceId || null,
      folderId: muteParams.folderId || null,
      documentId: muteParams.documentId || null,
      threadId: muteParams.threadId || null,
    },
  });

  if (existing) {
    await db.notificationPreference.update({
      where: { id: existing.id },
      data: { muted },
    });
  } else {
    await db.notificationPreference.create({
      data: {
        userId: session.user.id,
        workspaceId: muteParams.workspaceId || null,
        folderId: muteParams.folderId || null,
        documentId: muteParams.documentId || null,
        threadId: muteParams.threadId || null,
        muted,
      },
    });
  }
}
