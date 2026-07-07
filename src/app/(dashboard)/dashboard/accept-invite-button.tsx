"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptWorkspaceInvite } from "@/server/actions/workspace-members";

interface Props {
  invitationId: string;
  workspaceId: string;
}

export function AcceptInviteButton({ invitationId, workspaceId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    try {
      await acceptWorkspaceInvite(invitationId);
      router.push(`/${workspaceId}`);
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAccept}
        disabled={loading}
        className="rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-all"
      >
        {loading ? "..." : "Accept"}
      </button>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
      >
        Decline
      </button>
    </div>
  );
}
