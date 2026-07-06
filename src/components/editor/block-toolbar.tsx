"use client";

import { motion } from "framer-motion";

const BLOCK_TYPES = [
  { type: "paragraph", label: "Text", icon: "¶" },
  { type: "heading", label: "Heading", icon: "H1" },
  { type: "code", label: "Code", icon: "<>" },
  { type: "quote", label: "Quote", icon: "\u201C" },
  { type: "callout", label: "Callout", icon: "\u2139" },
];

interface Block { id: string; type: string; content: string; }
interface Props { block: Block; onChangeType: (t: string) => void; onDelete: () => void; onAddAfter: () => void; onUpload: () => void; }

export function BlockToolbar({ block, onChangeType, onDelete, onAddAfter, onUpload }: Props) {
  return (
    <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="absolute -left-20 top-0.5 z-20">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-lg dark:shadow-xl dark:shadow-black/20">
        {BLOCK_TYPES.map((bt) => (
          <button key={bt.type} onClick={(e) => { e.stopPropagation(); onChangeType(bt.type); }}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all w-full ${
              block.type === bt.type
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-medium"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}>
            <span className="w-5 text-center font-mono text-[10px]">{bt.icon}</span><span>{bt.label}</span>
          </button>
        ))}
        <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
        <button onClick={(e) => { e.stopPropagation(); onUpload(); }} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full transition-all">
          <span className="w-5 text-center"><svg className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg></span><span>Upload</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAddAfter(); }} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full transition-all">
          <span className="w-5 text-center">+</span><span>Add below</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-all">
          <span className="w-5 text-center">
            <svg className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </span><span>Delete</span>
        </button>
      </div>
    </motion.div>
  );
}
