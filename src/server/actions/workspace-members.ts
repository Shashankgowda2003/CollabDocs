"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hasMinRole, type Role } from "@/lib/types";

export async function acceptWorkspaceInvite(invitationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const invite = await db.pendingInvitation.findUnique({ where: { id: invitationId } });
  if (!invite) throw new Error("Invitation not found");
  if (invite.used) throw new Error("Invitation already used");
  if (new Date() > invite.expiresAt) throw new Error("Invitation expired");

  const existing = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: session.user.id } },
  });
  if (existing) throw new Error("You are already a member");

  await db.$transaction([
    db.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: session.user.id, role: invite.role as Role },
    }),
    db.pendingInvitation.update({
      where: { id: invitationId },
      data: { used: true },
    }),
  ]);

  revalidatePath("/dashboard");
}

export async function inviteMember(workspaceId: string, email: string, role: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!member || !hasMinRole(member.role as Role, "Admin")) {
    throw new Error("Only admins can invite members");
  }

  const targetUser = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (targetUser) {
    const existing = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
    });
    if (existing) throw new Error("User is already a member");

    await db.workspaceMember.create({
      data: { workspaceId, userId: targetUser.id, role: role as Role },
    });
  } else {
    const firstDoc = await db.document.findFirst({ where: { workspaceId }, select: { id: true } });
    if (!firstDoc) throw new Error("Create a document first before inviting");

    const token = crypto.randomUUID();
    await db.pendingInvitation.create({
      data: {
        email: email.toLowerCase().trim(),
        documentId: firstDoc.id,
        workspaceId,
        role,
        invitedBy: session.user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  revalidatePath(`/${workspaceId}/members`);
}

export async function removeMember(workspaceId: string, memberId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const caller = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!caller || !hasMinRole(caller.role as Role, "Admin")) {
    throw new Error("Only admins can remove members");
  }

  const target = await db.workspaceMember.findUnique({ where: { id: memberId } });
  if (!target || target.workspaceId !== workspaceId) throw new Error("Member not found");
  if (target.role === "Owner") throw new Error("Cannot remove the owner");

  await db.workspaceMember.delete({ where: { id: memberId } });
  revalidatePath(`/${workspaceId}/members`);
}

export async function changeMemberRole(workspaceId: string, memberId: string, newRole: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const caller = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!caller || !hasMinRole(caller.role as Role, "Admin")) {
    throw new Error("Only admins can change roles");
  }

  const target = await db.workspaceMember.findUnique({ where: { id: memberId } });
  if (!target || target.workspaceId !== workspaceId) throw new Error("Member not found");
  if (target.role === "Owner") throw new Error("Cannot change owner's role");

  await db.workspaceMember.update({
    where: { id: memberId },
    data: { role: newRole as Role },
  });
  revalidatePath(`/${workspaceId}/members`);
}
