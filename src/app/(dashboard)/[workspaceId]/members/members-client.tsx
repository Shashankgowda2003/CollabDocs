"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteMember } from "@/server/actions/workspace-members";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface Props {
  workspaceId: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  currentUserId: string;
}

export function MembersClient({ workspaceId, members, pendingInvites, currentUserId }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    if (!email.trim()) return;
    setInviting(true);
    setError(null);
    try {
      await inviteMember(workspaceId, email.trim(), role);
      setEmail("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to invite");
    }
    setInviting(false);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6">
      <p className="text-xs font-semibold text-zinc-400 mb-3">Invite a member</p>
      <div className="flex items-center gap-2">
        <input
          type="email"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
          placeholder="colleague@example.com"
        />
        <select
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-300 outline-none"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="Admin">Admin</option>
          <option value="Editor">Editor</option>
          <option value="Commenter">Commenter</option>
          <option value="Viewer">Viewer</option>
        </select>
        <button
          onClick={handleInvite}
          disabled={inviting || !email.trim()}
          className="rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-all"
        >
          {inviting ? "Inviting..." : "Invite"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
