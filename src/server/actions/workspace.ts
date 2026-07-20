"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function renameWorkspace(workspaceId: string, newName: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!newName?.trim()) throw new Error("Name is required");

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });

  if (!member || !["Owner", "Admin"].includes(member.role)) {
    throw new Error("Only owners and admins can rename workspaces");
  }

  await db.workspace.update({
    where: { id: workspaceId },
    data: { name: newName.trim() },
  });

  revalidatePath(`/dashboard`);
  revalidatePath(`/${workspaceId}`);
  revalidatePath(`/${workspaceId}/settings`);
  return { success: true };
}

export async function createWorkspace(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Name is required");

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);

  const workspace = await db.workspace.create({
    data: {
      name: name.trim(),
      slug,
      members: {
        create: {
          userId: session.user.id,
          role: "Owner",
        },
      },
    },
  });

  revalidatePath("/dashboard");
  redirect(`/${workspace.id}`);
}

export async function deleteWorkspace(workspaceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });

  if (!member || member.role !== "Owner") throw new Error("Only owners can delete workspaces");

  await db.workspace.delete({ where: { id: workspaceId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
