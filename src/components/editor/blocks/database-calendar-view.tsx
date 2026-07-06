"use client";

import { useMemo } from "react";
import type { Column, Row, DatabaseData } from "./database-types";
import { getCellValue, setCellValue } from "./database-types";

interface Props {
  data: DatabaseData;
  dateColumnId?: string;
  onChange: (data: DatabaseData) => void;
}

export function DatabaseCalendarView({ data, dateColumnId, onChange }: Props) {
  const { schema, rows } = data;
  const dateCol = schema.find((c) => c.id === dateColumnId) || schema.find((c) => c.type === "date");

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const eventsByDay = useMemo(() => {
    const map: Record<number, Row[]> = {};
    if (!dateCol) return map;
    for (const row of rows) {
      const val = getCellValue(row, dateCol.id, "");
      if (!val) continue;
      const d = new Date(String(val));
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map[day] = map[day] || [];
        map[day].push(row);
      }
    }
    return map;
  }, [rows, dateCol, year, month]);

  function updateCell(rowId: string, columnId: string, value: unknown) {
    onChange({
      ...data,
      rows: rows.map((r) => (r.id === rowId ? setCellValue(r, columnId, value) : r)),
    });
  }

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const titleCol = schema.find((c) => c.name.toLowerCase().includes("name") || c.name.toLowerCase().includes("title")) || schema[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {today.toLocaleString("default", { month: "long", year: "numeric" })}
        </h4>
        {!dateCol && (
          <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Add a date column to use calendar view</span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-zinc-400 py-1">{d}</div>
        ))}
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[80px] rounded-lg border border-zinc-100 dark:border-zinc-800 p-1 ${
              day === today.getDate() ? "bg-blue-50/50 dark:bg-blue-500/5" : ""
            }`}
          >
            {day && (
              <>
                <div className="text-[10px] text-zinc-400 mb-1">{day}</div>
                <div className="space-y-1">
                  {(eventsByDay[day] || []).map((row) => (
                    <div
                      key={row.id}
                      className="text-[10px] truncate rounded bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1 py-0.5"
                    >
                      {String(getCellValue(row, titleCol?.id || "", "Untitled"))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
