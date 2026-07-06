import { db } from "@/lib/db";
import { type Role, type ResourceType, hasMinRole } from "@/lib/types";
import { cache } from "react";

interface PermissionCheck {
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  requiredRole: Role;
}

export async function resolvePermission(
  userId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<Role | null> {
  const explicit = await db.permission.findUnique({
    where: {
      userId_resourceType_resourceId: {
        userId,
        resourceType,
        resourceId,
      },
    },
  });

  if (explicit) return explicit.role as Role;

  if (resourceType === "Document") {
    const doc = await db.document.findUnique({
      where: { id: resourceId },
      select: { folderId: true, workspaceId: true },
    });
    if (!doc) return null;

    if (doc.folderId) {
      const folderRole = await resolvePermission(userId, "Folder", doc.folderId);
      if (folderRole) return folderRole;
    }

    return resolvePermission(userId, "Workspace", doc.workspaceId);
  }

  if (resourceType === "Folder") {
    const folder = await db.folder.findUnique({
      where: { id: resourceId },
      select: { parentFolderId: true, workspaceId: true },
    });
    if (!folder) return null;

    if (folder.parentFolderId) {
      const parentRole = await resolvePermission(userId, "Folder", folder.parentFolderId);
      if (parentRole) return parentRole;
    }

    return resolvePermission(userId, "Workspace", folder.workspaceId);
  }

  const member = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: resourceId,
        userId,
      },
    },
  });

  return (member?.role as Role) ?? null;
}

export async function checkPermission({
  userId,
  resourceType,
  resourceId,
  requiredRole,
}: PermissionCheck): Promise<boolean> {
  const role = await resolvePermission(userId, resourceType, resourceId);
  if (!role) return false;
  return hasMinRole(role, requiredRole);
}

export async function getUserWorkspaces(userId: string) {
  return db.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          folders: { where: { parentFolderId: null }, orderBy: { name: "asc" } },
          documents: { where: { folderId: null }, orderBy: { updatedAt: "desc" } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

export const cachedGetUserWorkspaces = cache(getUserWorkspaces);
