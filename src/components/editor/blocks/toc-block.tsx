"use client";

interface TocBlockProps {
  blocks: { id: string; type: string; content: string }[];
  onScrollToBlock: (blockId: string) => void;
}

export function TocBlock({ blocks, onScrollToBlock }: TocBlockProps) {
  const headings = blocks.filter((b) => b.type === "heading" && b.content.trim());

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Table of Contents</h3>
      {headings.length === 0 ? (
        <p className="text-xs text-zinc-500">No headings found. Add heading blocks to populate the table of contents.</p>
      ) : (
        <ul className="space-y-1">
          {headings.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => onScrollToBlock(h.id)}
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left w-full truncate"
              >
                {h.content}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
