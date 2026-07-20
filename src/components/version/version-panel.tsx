"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getVersionHistory, restoreSnapshot } from "@/server/actions/version";
import { VersionDiffPanel } from "./version-diff-panel";

interface Op { id: string; type: string; payload: string; createdAt: Date; user: { id: string; name: string | null; image: string | null }; }
interface Snap { id: string; operationCount: number; createdAt: Date; }
interface Props { documentId: string; onClose: () => void; }

const opLabels: Record<string, string> = { insert_text: "Text added", delete_text: "Text removed", create_block: "Block added", delete_block: "Block removed", move_block: "Block moved", update_block: "Block updated", format: "Formatting changed", comment: "Comment added", document_restore: "Version restored" };

export function VersionPanel({ documentId, onClose }: Props) {
  const [ops, setOps] = useState<Op[]>([]); const [snapshots, setSnapshots] = useState<Snap[]>([]); const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const router = useRouter();

  useEffect(() => { getVersionHistory(documentId).then((d) => { setOps(d.operations); setSnapshots(d.snapshots); setLoading(false); }); }, [documentId]);
  const handleRestore = useCallback(async (id: string) => { setRestoring(id); await restoreSnapshot(id, documentId); setRestoring(null); onClose(); router.refresh(); }, [documentId, onClose, router]);

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-y-0 right-0 z-50 w-80 border-l border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Version History</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDiff(true)} className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[10px] font-medium text-blue-400 hover:text-blue-300 hover:bg-zinc-800">
            Diff
          </button>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? <div className="p-8 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" /></div> : (
          <div className="divide-y divide-zinc-800">
            {snapshots.map((snap) => (
              <div key={snap.id} className="p-4 hover:bg-zinc-900/50">
                <div className="flex items-center justify-between"><div><p className="text-xs font-medium text-white">Snapshot</p><p className="text-[10px] text-zinc-500 mt-0.5">{snap.operationCount} ops &middot; {new Date(snap.createdAt).toLocaleString()}</p></div>
                  <button onClick={() => handleRestore(snap.id)} disabled={restoring === snap.id} className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[10px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50">{restoring === snap.id ? "..." : "Restore"}</button>
                </div>
              </div>
            ))}
            {ops.slice(0, 50).map((op) => (
              <div key={op.id} className="px-4 py-3 hover:bg-zinc-900/50">
                <div className="flex items-center gap-2"><div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-medium text-zinc-400">{op.user.name?.[0] || "?"}</div>
                  <span className="text-xs text-zinc-400"><span className="font-medium text-zinc-300">{op.user.name || "Anonymous"}</span> {opLabels[op.type] || op.type}</span></div>
                <p className="text-[10px] text-zinc-600 mt-0.5 ml-7">{new Date(op.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {showDiff && <VersionDiffPanel documentId={documentId} onClose={() => setShowDiff(false)} />}
    </motion.div>
  );
}
