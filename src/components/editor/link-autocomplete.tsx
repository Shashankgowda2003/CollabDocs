"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Document {
  id: string;
  title: string;
}

interface Props {
  query: string;
  workspaceId: string;
  onSelect: (doc: Document) => void;
  onClose: () => void;
}

export function LinkAutocomplete({ query, workspaceId, onSelect, onClose }: Props) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchDocs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/documents?q=${encodeURIComponent(query)}`);
        if (!cancelled) {
          const data = await res.json();
          setDocs(data.documents || []);
        }
      } catch {
        if (!cancelled) setDocs([]);
      }
      if (!cancelled) setLoading(false);
    }
    fetchDocs();
    return () => { cancelled = true; };
  }, [query, workspaceId]);

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute left-8 top-8 z-[61] w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1.5"
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Link to page
          </p>
          {loading && (
            <div className="px-3 py-2 text-xs text-zinc-400">Loading...</div>
          )}
          {!loading && docs.length === 0 && (
            <div className="px-3 py-2 text-xs text-zinc-400">No pages found</div>
          )}
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onSelect(doc)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left"
            >
              <span className="flex h-7 w-7 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-xs font-mono text-zinc-500 dark:text-zinc-400">
                P
              </span>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{doc.title}</span>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
