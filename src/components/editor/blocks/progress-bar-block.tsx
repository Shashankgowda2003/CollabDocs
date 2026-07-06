"use client";

interface ProgressBarBlockProps {
  content: string;
  onChange: (content: string) => void;
}

export function ProgressBarBlock({ content, onChange }: ProgressBarBlockProps) {
  let value = 0;
  let total = 100;
  let label = "";
  let color = "#22c55e";
  try {
    const p = JSON.parse(content);
    value = p.value ?? 0;
    total = p.total ?? 100;
    label = p.label ?? "";
    color = p.color ?? "#22c55e";
  } catch {
    value = Number(content) || 0;
  }

  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4">
      <div className="flex items-center gap-3 mb-2">
        <input
          className="flex-1 bg-transparent outline-none text-sm font-medium text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
          value={label}
          onChange={(e) => onChange(JSON.stringify({ value, total, label: e.target.value, color }))}
          placeholder="Progress label"
        />
        <span className="text-xs font-mono text-zinc-400 tabular-nums">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 outline-none"
          value={value}
          onChange={(e) => onChange(JSON.stringify({ value: Number(e.target.value), total, label, color }))}
          placeholder="Value"
        />
        <span className="text-xs text-zinc-400">/</span>
        <input
          type="number"
          className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 outline-none"
          value={total}
          onChange={(e) => onChange(JSON.stringify({ value, total: Number(e.target.value), label, color }))}
          placeholder="Total"
        />
        <input
          type="color"
          className="ml-auto h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
          value={color}
          onChange={(e) => onChange(JSON.stringify({ value, total, label, color: e.target.value }))}
          title="Bar color"
        />
      </div>
    </div>
  );
}
