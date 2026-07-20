"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getVersionHistory } from "@/server/actions/version";

interface Block {
  id: string;
  type: string;
  content: string;
  parentBlockId: string | null;
  position: number;
}

interface Snap {
  id: string;
  operationCount: number;
  createdAt: Date;
  data: string;
}

interface Props {
  documentId: string;
  onClose: () => void;
}

export function VersionDiffPanel({ documentId, onClose }: Props) {
  const [snapshots, setSnapshots] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<{ left: string; right: string }>({ left: "", right: "" });

  useEffect(() => {
    getVersionHistory(documentId).then((d) => {
      setSnapshots(d.snapshots);
      setLoading(false);
    });
  }, [documentId]);

  function getBlockText(blocks: Block[]): string {
    return blocks
      .map((b) => {
        try {
          const p = JSON.parse(b.content);
          if (typeof p === "string") return p;
          if (b.type === "checklist") return (p.items || []).map((it: { text: string }) => it.text).join("\n");
          if (b.type === "table") return (p.rows || []).flat().join(" | ");
          return JSON.stringify(p);
        } catch {
          return b.content;
        }
      })
      .filter(Boolean)
      .join("\n");
  }

  function computeDiff() {
    const leftSnap = snapshots.find((s) => s.id === leftId);
    const rightSnap = snapshots.find((s) => s.id === rightId);
    if (!leftSnap || !rightSnap) return;

    let lBlocks: Block[] = [];
    let rBlocks: Block[] = [];
    try { lBlocks = JSON.parse(leftSnap.data).blocks || []; } catch {}
    try { rBlocks = JSON.parse(rightSnap.data).blocks || []; } catch {}

    const lMap = new Map<string, Block>();
    const rMap = new Map<string, Block>();
    lBlocks.forEach((b) => lMap.set(b.id, b));
    rBlocks.forEach((b) => rMap.set(b.id, b));

    const allIds = new Set([...lMap.keys(), ...rMap.keys()]);
    const delLines: string[] = [];
    const addLines: string[] = [];

    allIds.forEach((id) => {
      const l = lMap.get(id);
      const r = rMap.get(id);
      if (!l && r) {
        addLines.push(`+ [${r.type}] ${r.content.length > 100 ? r.content.slice(0, 100) + "..." : r.content}`);
      } else if (l && !r) {
        delLines.push(`- [${l.type}] ${l.content.length > 100 ? l.content.slice(0, 100) + "..." : l.content}`);
      } else if (l && r && l.content !== r.content) {
        delLines.push(`- ${l.content.length > 100 ? l.content.slice(0, 100) + "..." : l.content}`);
        addLines.push(`+ ${r.content.length > 100 ? r.content.slice(0, 100) + "..." : r.content}`);
      }
    });

    setDiffResult({
      left: getBlockText(lBlocks),
      right: getBlockText(rBlocks),
    });
  }

  useEffect(() => {
    if (leftId && rightId) computeDiff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftId, rightId]);

  const sorted = [...snapshots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function lineDiff(left: string, right: string) {
    const l = left.split("\n");
    const r = right.split("\n");
    const max = Math.max(l.length, r.length);
    const result: { type: "same" | "added" | "removed"; text: string }[] = [];
    for (let i = 0; i < max; i++) {
      if (l[i] === r[i]) {
        if (l[i]) result.push({ type: "same", text: l[i]! });
      } else {
        if (l[i]) result.push({ type: "removed", text: l[i]! });
        if (r[i]) result.push({ type: "added", text: r[i]! });
      }
    }
    return result;
  }

  const diffLines = diffResult.left || diffResult.right ? lineDiff(diffResult.left, diffResult.right) : [];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-y-0 right-0 z-50 w-[600px] max-w-[90vw] border-l border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Snapshot Diff</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">No snapshots available yet. Snapshots are created every 10 auto-saves.</p>
        </div>
      ) : (
        <>
          <div className="border-b border-zinc-800 p-3 flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 block mb-1">Left (older)</label>
              <select
                value={leftId ?? ""}
                onChange={(e) => setLeftId(e.target.value || null)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none"
              >
                <option value="">Select snapshot...</option>
                {sorted.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {new Date(snap.createdAt).toLocaleString()} — {snap.operationCount} ops
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 block mb-1">Right (newer)</label>
              <select
                value={rightId ?? ""}
                onChange={(e) => setRightId(e.target.value || null)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none"
              >
                <option value="">Select snapshot...</option>
                {sorted.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {new Date(snap.createdAt).toLocaleString()} — {snap.operationCount} ops
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-xs">
            {leftId && rightId ? (
              <div className="divide-y divide-zinc-800/50">
                {diffLines.map((line, i) => (
                  <div
                    key={i}
                    className={`px-4 py-1.5 whitespace-pre-wrap ${
                      line.type === "added"
                        ? "bg-green-500/10 text-green-400 border-l-2 border-green-500"
                        : line.type === "removed"
                        ? "bg-red-500/10 text-red-400 border-l-2 border-red-500"
                        : "text-zinc-500"
                    }`}
                  >
                    <span className="select-none mr-3 text-zinc-600">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    {line.text}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Select two snapshots above to compare
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
