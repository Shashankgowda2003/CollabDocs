"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import { sendInviteEmail } from "@/lib/mail";
import crypto from "crypto";

export async function createShareLink(
  documentId: string,
  role: string,
  password?: string,
  expiresInDays?: number,
  workspaceMemberOnly?: boolean
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const link = await db.shareLink.create({
    data: {
      documentId,
      role,
      password: password || null,
      expiresAt,
      workspaceMemberOnly: workspaceMemberOnly || false,
      createdBy: session.user.id,
    },
  });

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { workspaceId: true },
  });

  revalidatePath(`/${doc?.workspaceId}/d/${documentId}`);
  return link;
}

export async function revokeShareLink(linkId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const link = await db.shareLink.findUnique({
    where: { id: linkId },
    select: { documentId: true, createdBy: true },
  });
  if (!link) throw new Error("Link not found");

  if (link.createdBy !== session.user.id) {
    const permitted = await checkPermission({
      userId: session.user.id,
      resourceType: "Document",
      resourceId: link.documentId,
      requiredRole: "Admin",
    });
    if (!permitted) throw new Error("Insufficient permissions");
  }

  await db.shareLink.update({
    where: { id: linkId },
    data: { isRevoked: true },
  });

  const doc = await db.document.findUnique({
    where: { id: link.documentId },
    select: { workspaceId: true },
  });

  revalidatePath(`/${doc?.workspaceId}/d/${link.documentId}`);
}

export async function inviteUser(documentId: string, email: string, role: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: documentId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { workspaceId: true, title: true },
  });
  if (!doc) throw new Error("Document not found");

  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    await db.permission.create({
      data: {
        userId: existingUser.id,
        resourceType: "Document",
        resourceId: documentId,
        role,
      },
    });

    await createNotification({
      userId: existingUser.id,
      type: "share",
      title: `${session.user.name || "Someone"} shared a document`,
      body: `You now have ${role} access to "${doc.title}"`,
      workspaceId: doc.workspaceId,
      documentId,
    });

    revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
    return { success: true, invited: "existing" };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.pendingInvitation.create({
    data: {
      email,
      documentId,
      workspaceId: doc.workspaceId,
      role,
      token,
      invitedBy: session.user.id,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/register?invite=${token}`;

  let emailSent = false;
  try {
    await sendInviteEmail(email, doc.title, role, inviteLink);
    emailSent = true;
  } catch (emailError) {
    console.warn("[Mail] Failed to send invite email:", emailError);
  }

  revalidatePath(`/${doc.workspaceId}/d/${documentId}`);
  return {
    success: true,
    invited: "new",
    emailSent,
    inviteLink: emailSent ? undefined : inviteLink,
  };
}
