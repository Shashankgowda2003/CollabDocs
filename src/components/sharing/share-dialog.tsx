"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createShareLink, revokeShareLink, inviteUser } from "@/server/actions/sharing";

interface ShareLink { id: string; role: string; password: string | null; expiresAt: Date | null; workspaceMemberOnly: boolean; isRevoked: boolean; createdAt: Date; }
interface Props { documentId: string; workspaceId: string; links: ShareLink[]; onClose: () => void; }

export function ShareDialog({ documentId, links, onClose }: Props) {
  const [tab, setTab] = useState<"link" | "invite">("link");
  const [role, setRole] = useState("Viewer");
  const [password, setPassword] = useState("");
  const [expires, setExpires] = useState("never");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [message, setMessage] = useState("");
  const activeLinks = links.filter((l) => !l.isRevoked);

  async function handleCreateLink() {
    await createShareLink(documentId, role, password || undefined, expires === "never" ? undefined : Number(expires));
    setPassword(""); setMessage("Link created!");
  }
  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    try {
      const result = await inviteUser(documentId, inviteEmail, inviteRole) as Record<string, unknown>;
      if (result && result.error) {
        setMessage(String(result.error));
      } else if (result?.inviteLink) {
        setInviteEmail("");
        navigator.clipboard.writeText(String(result.inviteLink));
        setMessage("Invitation saved! Resend email is limited to your own address.\nLink copied to clipboard — share it manually.");
      } else {
        setInviteEmail("");
        setMessage(result?.invited === "new"
          ? "Invitation email sent!"
          : "Access granted!");
      }
    }
    catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }
  function copyLink(id: string) { navigator.clipboard.writeText(`${window.location.origin}/s/${id}`).then(() => setMessage("Link copied!")); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Share Document</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex border-b border-zinc-800">
          {(["link", "invite"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-xs font-medium transition-all ${tab === t ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}>
              {t === "link" ? "Share Link" : "Invite"}
            </button>
          ))}
        </div>
        <div className="p-4">
          {message && <div className="mb-3 rounded-xl bg-green-500/10 border border-green-500/20 p-2.5 text-xs text-green-400">{message}</div>}
          {tab === "link" ? (
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-zinc-400">Access Level</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white"><option value="Viewer">Viewer</option><option value="Commenter">Commenter</option><option value="Editor">Editor</option></select></div>
              <div><label className="text-xs font-medium text-zinc-400">Password</label><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Optional" className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" /></div>
              <div><label className="text-xs font-medium text-zinc-400">Expires</label>
                <select value={expires} onChange={(e) => setExpires(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white"><option value="never">Never</option><option value="1">1 day</option><option value="7">7 days</option><option value="30">30 days</option></select></div>
              <button onClick={handleCreateLink} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20">Create Link</button>
              {activeLinks.length > 0 && (
                <div className="space-y-2"><p className="text-xs font-medium text-zinc-500">Active Links</p>
                  {activeLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-2.5">
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-medium text-white">{link.role}</span>{link.password && <span className="text-[10px] text-zinc-500">🔒</span>}{link.expiresAt && <span className="text-[10px] text-zinc-500">Exp {new Date(link.expiresAt).toLocaleDateString()}</span>}</div></div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyLink(link.id)} className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                        <button onClick={() => revokeShareLink(link.id)} className="rounded-lg p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-zinc-400">Email</label><input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" /></div>
              <div><label className="text-xs font-medium text-zinc-400">Access Level</label><select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white"><option value="Viewer">Viewer</option><option value="Commenter">Commenter</option><option value="Editor">Editor</option></select></div>
              <button onClick={handleInvite} disabled={!inviteEmail.trim()} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 shadow-lg shadow-purple-500/20">Send Invitation</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
