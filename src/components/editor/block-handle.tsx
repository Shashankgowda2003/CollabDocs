"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Block { id: string; type: string; content: string; }
interface Props { block: Block; onChangeType: (t: string) => void; onDelete: () => void; onAddAfter: () => void; onDuplicate: () => void; onUpload: () => void; hasAbove: boolean; }

export function BlockHandle({ block, onChangeType, onDelete, onAddAfter, onDuplicate, onUpload }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const items = [
    { type: "paragraph", label: "Text", icon: "¶" },
    { type: "heading", label: "Heading", icon: "H1" },
    { type: "code", label: "Code", icon: "<>" },
    { type: "quote", label: "Quote", icon: "\u201C" },
    { type: "callout", label: "Callout", icon: "!" },
    { type: "table", label: "Table", icon: "\u2630" },
    { type: "checklist", label: "Checklist", icon: "\u2611" },
    { type: "equation", label: "Equation", icon: "\u0192" },
    { type: "diagram", label: "Diagram", icon: "\u2B21" },
    { type: "database", label: "Database", icon: "\u25A6" },
    { type: "progress", label: "Progress", icon: "\u25D0" },
    { type: "button", label: "Button", icon: "\u25B6" },
    { type: "toc", label: "TOC", icon: "\u2261" },
    { type: "form", label: "Form", icon: "\u25A1" },
    { type: "whiteboard", label: "Whiteboard", icon: "\u270E" },
    { type: "breadcrumb", label: "Breadcrumb", icon: "\u203A" },
    { type: "synced", label: "Synced", icon: "\u21C4" },
  ];

  return (
    <div className="absolute -left-10 top-1 z-20" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="h-6 w-6 flex items-center justify-center rounded text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
        title="Block menu"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="2.5" cy="2.5" r="1.25" /><circle cx="7.5" cy="2.5" r="1.25" />
          <circle cx="2.5" cy="8" r="1.25" /><circle cx="7.5" cy="8" r="1.25" />
          <circle cx="2.5" cy="13.5" r="1.25" /><circle cx="7.5" cy="13.5" r="1.25" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -2 }}
            className="absolute left-6 -top-1 w-52 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1 z-30"
          >
            <p className="px-2.5 py-1 text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Turn into</p>
            {items.map((item) => (
              <button
                key={item.type}
                onClick={(e) => { e.stopPropagation(); onChangeType(item.type); setOpen(false); }}
                className={`flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                  block.type === item.type
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <span className="w-6 text-center font-mono text-[10px] font-semibold">{item.icon}</span>
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {block.type === item.type && (
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                )}
              </button>
            ))}

            <div className="border-t border-zinc-100 dark:border-zinc-700 my-0.5 mx-1" />

            <button onClick={(e) => { e.stopPropagation(); onDuplicate(); setOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
              Duplicate
            </button>

            <button onClick={(e) => { e.stopPropagation(); onUpload(); setOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              Upload
            </button>

            <button onClick={(e) => { e.stopPropagation(); onAddAfter(); setOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add below
            </button>

            <div className="border-t border-zinc-100 dark:border-zinc-700 my-0.5 mx-1" />

            <button onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BlockAddButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute -left-10 bottom-0 z-10 h-5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="h-5 w-5 flex items-center justify-center rounded text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
      </button>
    </div>
  );
}
