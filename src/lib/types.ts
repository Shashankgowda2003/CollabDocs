export type Role = "Owner" | "Admin" | "Editor" | "Commenter" | "Viewer";

export type ResourceType = "Workspace" | "Folder" | "Document";

export type CommentStatus = "Open" | "Resolved" | "Reopened";

export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "table"
  | "code"
  | "checklist"
  | "quote"
  | "equation"
  | "callout"
  | "embed"
  | "ai"
  | "database";

export type NotificationType =
  | "mention"
  | "comment"
  | "reply"
  | "share"
  | "permission_change"
  | "document_restore"
  | "ai_complete"
  | "workspace_invite";

export type OperationType =
  | "insert_text"
  | "delete_text"
  | "create_block"
  | "delete_block"
  | "move_block"
  | "update_block"
  | "format"
  | "comment";

export type ShareRole = "Viewer" | "Commenter" | "Editor";

export const ROLE_HIERARCHY: Record<Role, number> = {
  Owner: 5,
  Admin: 4,
  Editor: 3,
  Commenter: 2,
  Viewer: 1,
};

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
