"use client";

import { motion } from "framer-motion";

const BLOCKS = [
  { id: "paragraph", label: "Text", icon: "¶" },
  { id: "heading", label: "Heading 1", icon: "H1" },
  { id: "code", label: "Code", icon: "<>" },
  { id: "quote", label: "Quote", icon: "\u201C" },
  { id: "callout", label: "Callout", icon: "!" },
  { id: "table", label: "Table", icon: "\u2630" },
  { id: "checklist", label: "Checklist", icon: "\u2611" },
  { id: "equation", label: "Equation", icon: "\u0192" },
  { id: "database", label: "Database", icon: "\u25A6" },
];

const VISUAL = [
  { id: "diagram", label: "Diagram", icon: "\u2B21" },
  { id: "whiteboard", label: "Whiteboard", icon: "\u270E" },
  { id: "progress", label: "Progress", icon: "\u25D0" },
  { id: "button", label: "Button", icon: "\u25B6" },
  { id: "chart", label: "Chart", icon: "\u25E0" },
  { id: "toc", label: "TOC", icon: "\u2261" },
  { id: "form", label: "Form", icon: "\u25A1" },
  { id: "breadcrumb", label: "Breadcrumb", icon: "\u203A" },
  { id: "synced", label: "Synced", icon: "\u21C4" },
];

const MEDIA = [
  { id: "image", label: "Image", icon: "\uD83D\uDDBC" },
  { id: "embed", label: "File", icon: "\uD83D\uDCC4" },
];

interface Props { onSelect: (type: string) => void; onClose: () => void; }

export function SlashMenu({ onSelect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="absolute left-8 top-0 z-[61] w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1.5"
      >
        <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Blocks
        </p>
        {BLOCKS.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd.id)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <span className="flex h-7 w-7 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-xs font-mono text-zinc-500 dark:text-zinc-400">
              {cmd.icon}
            </span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cmd.label}</span>
          </button>
        ))}

        <div className="border-t border-zinc-100 dark:border-zinc-700 my-1 mx-2" />

        <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Visual
        </p>
        {VISUAL.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd.id)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <span className="flex h-7 w-7 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-xs font-mono text-zinc-500 dark:text-zinc-400">
              {cmd.icon}
            </span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cmd.label}</span>
          </button>
        ))}

        <div className="border-t border-zinc-100 dark:border-zinc-700 my-1 mx-2" />

        <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Media
        </p>
        {MEDIA.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd.id)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <span className="flex h-7 w-7 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-sm">
              {cmd.icon}
            </span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cmd.label}</span>
          </button>
        ))}
      </motion.div>
    </>
  );
}
