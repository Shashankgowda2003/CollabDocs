"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SHORTCUTS = [
  { key: "/", desc: "Open slash command menu" },
  { key: "Enter", desc: "Add new block below" },
  { key: "Backspace", desc: "Delete empty block" },
  { key: "⌘ / Ctrl + K", desc: "Open command palette" },
  { key: "Esc", desc: "Close menu / Deselect block" },
  { key: "# + Space", desc: "Convert to heading" },
  { key: "> + Space", desc: "Convert to quote" },
  { key: "```", desc: "Convert to code block" },
  { key: "Ctrl + V", desc: "Paste images/files" },
  { key: "Drag files", desc: "Upload images/files" },
  { key: "?", desc: "Show this dialog" },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && (e.target as HTMLElement)?.tagName !== "INPUT" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Keyboard Shortcuts</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-1">
              {SHORTCUTS.map((s) => (
                <div key={s.desc} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.desc}</span>
                  <kbd className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{s.key}</kbd>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400">
              Press <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">?</kbd> anytime to toggle this dialog
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
