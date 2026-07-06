"use client";

import type { Column, Row, DatabaseData } from "./database-types";
import { getCellValue, setCellValue, createRow } from "./database-types";

interface Props {
  data: DatabaseData;
  onChange: (data: DatabaseData) => void;
}

export function DatabaseTableView({ data, onChange }: Props) {
  const { schema, rows } = data;

  function updateCell(rowId: string, columnId: string, value: unknown) {
    onChange({
      ...data,
      rows: rows.map((r) => (r.id === rowId ? setCellValue(r, columnId, value) : r)),
    });
  }

  function addRow() {
    onChange({ ...data, rows: [...rows, createRow(schema)] });
  }

  function removeRow(rowId: string) {
    onChange({ ...data, rows: rows.filter((r) => r.id !== rowId) });
  }

  function renderCellInput(row: Row, col: Column) {
    const value = getCellValue(row, col.id, "");

    if (col.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => updateCell(row.id, col.id, e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600"
        />
      );
    }

    if (col.type === "select" && col.options) {
      return (
        <select
          value={String(value)}
          onChange={(e) => updateCell(row.id, col.id, e.target.value)}
          className="w-full bg-transparent text-xs outline-none"
        >
          {col.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (col.type === "multi_select" && col.options) {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1">
          {col.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
                updateCell(row.id, col.id, next);
              }}
              className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                selected.includes(opt)
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (col.type === "date") {
      return (
        <input
          type="date"
          value={String(value)}
          onChange={(e) => updateCell(row.id, col.id, e.target.value)}
          className="w-full bg-transparent text-xs outline-none"
        />
      );
    }

    if (col.type === "number") {
      return (
        <input
          type="number"
          value={String(value)}
          onChange={(e) => updateCell(row.id, col.id, e.target.value)}
          className="w-full bg-transparent text-xs outline-none"
        />
      );
    }

    if (col.type === "math") {
      const expr = String(value || "");
      try {
        const func = new Function(
          ...schema.map((c) => c.id),
          `"use strict"; return (${expr || 0});`
        );
        const args = schema.map((c) =>
          c.id === col.id ? 0 : Number(getCellValue(row, c.id, 0)) || 0
        );
        const result = func(...args);
        return (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={expr}
              onChange={(e) => updateCell(row.id, col.id, e.target.value)}
              className="w-20 bg-transparent text-xs outline-none font-mono text-blue-600 dark:text-blue-400"
              placeholder="=A+B"
            />
            <span className="text-[10px] text-zinc-400 tabular-nums font-mono">
              = {typeof result === "number" ? result.toFixed(2) : String(result)}
            </span>
          </div>
        );
      } catch {
        return (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={expr}
              onChange={(e) => updateCell(row.id, col.id, e.target.value)}
              className="w-20 bg-transparent text-xs outline-none font-mono"
              placeholder="=A+B"
            />
            <span className="text-[10px] text-red-400">Error</span>
          </div>
        );
      }
    }

    return (
      <input
        type="text"
        value={String(value)}
        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
        className="w-full bg-transparent text-xs outline-none"
        placeholder="Empty"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-900/50">
            {schema.map((col) => (
              <th key={col.id} className="border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {col.name}
              </th>
            ))}
            <th className="border border-zinc-200 dark:border-zinc-700 px-2 py-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
              {schema.map((col) => (
                <td key={col.id} className="border border-zinc-100 dark:border-zinc-800 px-3 py-1.5">
                  {renderCellInput(row, col)}
                </td>
              ))}
              <td className="border border-zinc-100 dark:border-zinc-800 px-1 py-1">
                <button onClick={() => removeRow(row.id)} className="text-zinc-400 hover:text-red-400 text-xs px-2">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="text-center py-6 text-xs text-zinc-400">No rows yet. Click below to add one.</div>
      )}
      <button
        onClick={addRow}
        className="mt-2 w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 transition-all"
      >
        + Add row
      </button>
    </div>
  );
}
