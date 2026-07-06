"use client";

import { useRouter } from "next/navigation";
import { restoreFromTrash, permanentDelete } from "@/server/actions/trash";

interface Props { resourceType: "Document" | "Folder"; resourceId: string; workspaceId: string; }

export function TrashActions({ resourceType, resourceId }: Props) {
  const router = useRouter();

  async function handleRestore() { await restoreFromTrash(resourceType, resourceId); router.refresh(); }
  async function handleDelete() { if (confirm("Permanently delete? This cannot be undone.")) { await permanentDelete(resourceType, resourceId); router.refresh(); } }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleRestore} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">Restore</button>
      <button onClick={handleDelete} className="rounded-lg border border-red-200 dark:border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">Delete forever</button>
    </div>
  );
}
