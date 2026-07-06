"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { getVersionHistory } from "@/server/actions/version";

interface Op {
  id: string;
  type: string;
  payload: string;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null };
}

interface Props {
  documentId: string;
  onClose: () => void;
}

export function VersionDiffPanel({ documentId, onClose }: Props) {
  const [ops, setOps] = useState<Op[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftIdx, setLeftIdx] = useState<number | null>(null);
  const [rightIdx, setRightIdx] = useState<number | null>(null);

  useEffect(() => {
    getVersionHistory(documentId).then((d) => {
      setOps(d.operations);
      setLoading(false);
    });
  }, [documentId]);

  const sorted = [...ops].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function getText(op: Op): string {
    try {
      const p = JSON.parse(op.payload);
      return p.content ?? p.text ?? p.data ?? JSON.stringify(p).slice(0, 200);
    } catch {
      return op.payload.slice(0, 200);
    }
  }

  function getDiffLines(left: string, right: string) {
    const leftLines = left.split("\n");
    const rightLines = right.split("\n");
    const max = Math.max(leftLines.length, rightLines.length);
    const result: { type: "same" | "added" | "removed"; text: string }[] = [];

    for (let i = 0; i < max; i++) {
      const l = leftLines[i] ?? "";
      const r = rightLines[i] ?? "";
      if (l === r) {
        result.push({ type: "same", text: l });
      } else {
        if (l) result.push({ type: "removed", text: l });
        if (r) result.push({ type: "added", text: r });
      }
    }
    return result;
  }

  const diffLines =
    leftIdx !== null && rightIdx !== null
      ? getDiffLines(getText(sorted[leftIdx]!), getText(sorted[rightIdx]!))
      : [];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-y-0 right-0 z-50 w-[600px] max-w-[90vw] border-l border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Version Diff</h2>
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
      ) : (
        <>
          <div className="border-b border-zinc-800 p-3 flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 block mb-1">Left (older)</label>
              <select
                value={leftIdx ?? ""}
                onChange={(e) => setLeftIdx(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none"
              >
                <option value="">Select version...</option>
                {sorted.map((op, i) => (
                  <option key={op.id} value={i}>
                    {new Date(op.createdAt).toLocaleString()} — {op.user.name || "Anonymous"}: {op.type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 block mb-1">Right (newer)</label>
              <select
                value={rightIdx ?? ""}
                onChange={(e) => setRightIdx(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none"
              >
                <option value="">Select version...</option>
                {sorted.map((op, i) => (
                  <option key={op.id} value={i}>
                    {new Date(op.createdAt).toLocaleString()} — {op.user.name || "Anonymous"}: {op.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-xs">
            {leftIdx !== null && rightIdx !== null ? (
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
                Select two versions above to compare
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
