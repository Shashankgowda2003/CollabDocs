"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSuggestions, resolveSuggestion } from "@/server/actions/suggestions";

interface Suggestion {
  id: string;
  documentId: string;
  blockId: string | null;
  type: string;
  oldContent: string;
  newContent: string;
  status: string;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null };
}

interface Props {
  documentId: string;
  onClose: () => void;
  onApplyChange?: (blockId: string | null, newContent: string) => void;
}

export function SuggestionPanel({ documentId, onClose, onApplyChange }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filter, setFilter] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSuggestions(documentId);
      setSuggestions(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [documentId]);

  async function handleResolve(id: string, status: "accepted" | "rejected") {
    await resolveSuggestion(id, status);

    if (status === "accepted" && onApplyChange) {
      const s = suggestions.find((x) => x.id === id);
      if (s) {
        onApplyChange(s.blockId, s.newContent);
      }
    }

    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }

  const filtered =
    filter === "all" ? suggestions : suggestions.filter((s) => s.status === filter);

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;
  const acceptedCount = suggestions.filter((s) => s.status === "accepted").length;
  const rejectedCount = suggestions.filter((s) => s.status === "rejected").length;

  function diffText(oldText: string, newText: string) {
    if (!oldText) {
      return <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded px-0.5">{newText}</span>;
    }
    if (!newText) {
      return <span className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded px-0.5 line-through">{oldText}</span>;
    }
    return (
      <span>
        <span className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded px-0.5 line-through">{oldText}</span>
        <span className="text-zinc-400 mx-1">{'\u2192'}</span>
        <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded px-0.5">{newText}</span>
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Suggestions</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {pendingCount} pending &middot; {acceptedCount} accepted &middot; {rejectedCount} rejected
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex gap-1 p-2 border-b border-zinc-100 dark:border-zinc-800">
          {(["pending", "accepted", "rejected", "all"] as const).map((f) => {
            const counts: Record<string, number> = { pending: pendingCount, accepted: acceptedCount, rejected: rejectedCount, all: suggestions.length };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize ${
                  filter === f
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {f} ({counts[f]})
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="p-8 text-center"><div className="h-5 w-5 mx-auto animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm text-zinc-400">No {filter} suggestions</p></div>
          ) : (
            filtered.map((s) => (
              <div key={s.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      {s.user.name?.[0] || "?"}
                    </div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{s.user.name || "Anonymous"}</span>
                    <span className="text-[10px] text-zinc-400 capitalize px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">{s.type}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{new Date(s.createdAt).toLocaleString()}</span>
                </div>

                <div className="text-sm mb-3">
                  {diffText(s.oldContent, s.newContent)}
                </div>

                {s.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolve(s.id, "accepted")}
                      className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleResolve(s.id, "rejected")}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {s.status === "accepted" && (
                  <span className="text-[10px] text-green-500 font-medium">Accepted</span>
                )}
                {s.status === "rejected" && (
                  <span className="text-[10px] text-zinc-400 font-medium">Rejected</span>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
