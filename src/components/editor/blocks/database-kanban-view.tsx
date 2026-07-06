"use client";

import type { Column, Row, DatabaseData } from "./database-types";
import { getCellValue, setCellValue, createRow } from "./database-types";

interface Props {
  data: DatabaseData;
  groupByColumnId?: string;
  onChange: (data: DatabaseData) => void;
}

export function DatabaseKanbanView({ data, groupByColumnId, onChange }: Props) {
  const { schema, rows } = data;
  const groupCol = schema.find((c) => c.id === groupByColumnId) || schema.find((c) => c.type === "select");
  const groups = groupCol?.options || ["No status"];

  function updateCell(rowId: string, columnId: string, value: unknown) {
    onChange({
      ...data,
      rows: rows.map((r) => (r.id === rowId ? setCellValue(r, columnId, value) : r)),
    });
  }

  function addCard(groupValue: string) {
    const newRow = createRow(schema);
    if (groupCol) {
      newRow.cells[groupCol.id] = groupValue;
    }
    onChange({ ...data, rows: [...rows, newRow] });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {groups.map((group) => {
        const groupRows = groupCol
          ? rows.filter((r) => getCellValue(r, groupCol.id, "") === group)
          : rows;
        return (
          <div key={group} className="min-w-[200px] max-w-[260px] flex-shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{group}</span>
              <span className="text-[10px] text-zinc-400">{groupRows.length}</span>
            </div>
            <div className="space-y-2">
              {groupRows.map((row) => (
                <div key={row.id} className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 shadow-sm">
                  {schema.filter((c) => c.id !== groupCol?.id).map((col) => {
                    const value = getCellValue(row, col.id, "");
                    return (
                      <div key={col.id} className="mb-1.5 last:mb-0">
                        <div className="text-[10px] text-zinc-400 mb-0.5">{col.name}</div>
                        <div className="text-xs text-zinc-700 dark:text-zinc-300">
                          {renderCardValue(col, value, (v) => updateCell(row.id, col.id, v))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <button
              onClick={() => addCard(group)}
              className="mt-2 w-full py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-all"
            >
              + Add card
            </button>
          </div>
        );
      })}
    </div>
  );
}

function renderCardValue(col: Column, value: unknown, onChange: (v: unknown) => void) {
  if (col.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded"
      />
    );
  }
  if (col.type === "select" && col.options) {
    return (
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-xs outline-none"
      >
        {col.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return (
    <input
      type={col.type === "number" ? "number" : "text"}
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-xs outline-none"
      placeholder="Empty"
    />
  );
}
