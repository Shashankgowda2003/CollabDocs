"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Command { id: string; label: string; shortcut: string; action: () => void; }
interface Props { workspaceId?: string; documentId?: string; onOpenGraph?: () => void; }

export function CommandPalette({ workspaceId, documentId, onOpenGraph }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const commands: Command[] = [
    { id: "dashboard", label: "Go to Dashboard", shortcut: "G D", action: () => router.push("/dashboard") },
    ...(workspaceId ? [{ id: "workspace", label: "Go to Workspace", shortcut: "G W", action: () => router.push(`/${workspaceId}`) }] : []),
    ...(onOpenGraph ? [{ id: "graph", label: "Open Document Graph", shortcut: "G G", action: () => { onOpenGraph(); setOpen(false); } }] : []),
    ...(documentId && workspaceId ? [{ id: "document", label: "Copy Document Link", shortcut: "G C", action: () => { navigator.clipboard.writeText(`${window.location.origin}/${workspaceId}/d/${documentId}`); setOpen(false); } }] : []),
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
            <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
              <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a command..." autoFocus
                className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500" />
              <kbd className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">esc</kbd>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-6 text-center"><p className="text-sm text-zinc-400 dark:text-zinc-500">No commands found</p></div>
              ) : (
                filtered.map((cmd) => (
                  <button key={cmd.id} onClick={() => { cmd.action(); setOpen(false); }}
                    className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                    <span className="text-zinc-800 dark:text-zinc-200">{cmd.label}</span>
                    <kbd className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{cmd.shortcut}</kbd>
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center gap-4 p-3 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600 flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">↑↓</kbd> Navigate</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600 flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">Enter</kbd> Select</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600 flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">Esc</kbd> Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
