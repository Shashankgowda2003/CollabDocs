"use client";

import { useMemo } from "react";
import type { DatabaseData } from "./database-types";
import { getCellValue } from "./database-types";

interface Props {
  data: DatabaseData;
  onChange: (data: DatabaseData) => void;
}

export function DatabaseTimelineView({ data, onChange }: Props) {
  const { schema, rows } = data;
  const dateCol = schema.find((c) => c.type === "date" || c.name.toLowerCase().includes("date"));
  const titleCol = schema[0];

  const items = useMemo(() => {
    return rows
      .map((row) => {
        const dateVal = dateCol ? String(getCellValue(row, dateCol.id, "")) : "";
        const date = dateVal ? new Date(dateVal) : null;
        return {
          row,
          date,
          title: titleCol ? String(getCellValue(row, titleCol.id, "Untitled")) : "Untitled",
        };
      })
      .filter((item) => item.date && !isNaN(item.date.getTime()))
      .sort((a, b) => (a.date!.getTime() - b.date!.getTime()));
  }, [rows, dateCol, titleCol]);

  if (items.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-xs text-zinc-400">No dated items to show on timeline. Add a date column with values.</p>
      </div>
    );
  }

  const minDate = items[0]!.date!;
  const maxDate = items[items.length - 1]!.date!;
  const range = maxDate.getTime() - minDate.getTime() || 1;

  return (
    <div className="p-4">
      <div className="relative pl-8 border-l-2 border-zinc-200 dark:border-zinc-700">
        {items.map((item, i) => {
          const left = ((item.date!.getTime() - minDate.getTime()) / range) * 100;
          const isSameAsPrev =
            i > 0 && items[i - 1]!.date!.toDateString() === item.date!.toDateString();

          return (
            <div key={item.row.id} className="relative mb-6 last:mb-0">
              <div
                className="absolute -left-[34px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-950 bg-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/20"
              />
              {!isSameAsPrev && (
                <span className="text-[10px] font-medium text-zinc-500 mb-1 block">
                  {item.date!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              <div
                className="ml-0 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 hover:shadow-sm transition-shadow"
              >
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.title}</p>
              </div>
              <div className="mt-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${Math.max(2, left)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
