"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getActivityFeed(workspaceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.activityEntry.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, name: true, image: true } } },
  });
}

export async function logActivity(
  workspaceId: string,
  action: string,
  resource: string,
  resourceId: string,
  title: string
) {
  const session = await auth();
  if (!session?.user) return;

  await db.activityEntry.create({
    data: {
      workspaceId,
      userId: session.user.id,
      action,
      resource,
      resourceId,
      title,
    },
  });
}
