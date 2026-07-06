"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import type { DatabaseData } from "@/components/editor/blocks/database-types";

export async function validateDatabaseData(data: DatabaseData): Promise<{ valid: boolean; error?: string }> {
  if (!Array.isArray(data.schema)) return { valid: false, error: "Schema must be an array" };
  if (!Array.isArray(data.rows)) return { valid: false, error: "Rows must be an array" };
  if (!Array.isArray(data.views)) return { valid: false, error: "Views must be an array" };

  const colIds = new Set(data.schema.map((c) => c.id));
  for (const row of data.rows) {
    if (!row.id) return { valid: false, error: "Row missing id" };
    for (const key of Object.keys(row.cells)) {
      if (!colIds.has(key)) return { valid: false, error: `Unknown column ${key}` };
    }
  }

  return { valid: true };
}

export async function updateDatabaseBlock(blockId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const block = await db.block.findUnique({
    where: { id: blockId },
    select: { documentId: true },
  });
  if (!block) throw new Error("Block not found");

  const permitted = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: block.documentId,
    requiredRole: "Editor",
  });
  if (!permitted) throw new Error("Insufficient permissions");

  let data: DatabaseData;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON");
  }

  const validation = await validateDatabaseData(data);
  if (!validation.valid) throw new Error(validation.error);

  await db.block.update({
    where: { id: blockId },
    data: { content },
  });
}
