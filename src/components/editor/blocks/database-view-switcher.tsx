"use client";

import type { ViewConfig, ViewType } from "./database-types";

interface Props {
  views: ViewConfig[];
  activeViewId: string;
  onChange: (viewId: string) => void;
}

const VIEW_ICONS: Record<ViewType, string> = {
  table: "\u25A6",
  board: "\u25A3",
  calendar: "\u25A2",
};

export function DatabaseViewSwitcher({ views, activeViewId, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 w-fit">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onChange(view.id)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            activeViewId === view.id
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <span>{VIEW_ICONS[view.type]}</span>
          {view.name}
        </button>
      ))}
    </div>
  );
}
