"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameWorkspace, deleteWorkspace } from "@/server/actions/workspace";

interface Props {
  workspaceId: string;
  name: string;
  role: string;
}

export function WorkspaceSettingsClient({ workspaceId, name, role }: Props) {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState(name);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = role === "Owner";
  const isAdmin = role === "Owner" || role === "Admin";

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!workspaceName.trim()) return;
    setLoading(true);
    try {
      await renameWorkspace(workspaceId, workspaceName);
      setMessage("Workspace name updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename workspace");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteWorkspace(workspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Workspace Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your workspace name and preferences.</p>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-3 text-sm text-green-700 dark:text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">General</h2>
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1.5">Workspace name</label>
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={!isAdmin || loading}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!isAdmin || loading || workspaceName === name}
              className="rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : "Save name"}
            </button>
            {workspaceName !== name && (
              <button
                type="button"
                onClick={() => setWorkspaceName(name)}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-6">
        <h2 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">Danger zone</h2>
        <p className="text-xs text-red-700/70 dark:text-red-400/70 mb-4">
          Deleting a workspace will permanently remove all its folders, documents, and data. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={!isOwner}
            className="rounded-xl border border-red-300 dark:border-red-500/30 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            {isOwner ? "Delete workspace" : "Only owners can delete"}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting..." : "Confirm delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
