"use client";

import { useState } from "react";
import type { Column, ColumnType, DatabaseData } from "./database-types";
import { COLUMN_TYPE_LABELS, createColumn } from "./database-types";

interface Props {
  data: DatabaseData;
  onChange: (data: DatabaseData) => void;
  onClose: () => void;
}

export function DatabaseSchemaEditor({ data, onChange, onClose }: Props) {
  const [localSchema, setLocalSchema] = useState<Column[]>(data.schema);

  function updateColumn(id: string, updates: Partial<Column>) {
    setLocalSchema((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  function removeColumn(id: string) {
    setLocalSchema((prev) => prev.filter((c) => c.id !== id));
  }

  function addColumn(type: ColumnType) {
    setLocalSchema((prev) => [...prev, createColumn(type)]);
  }

  function handleSave() {
    onChange({ ...data, schema: localSchema });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Database Schema</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">×</button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
          {localSchema.map((col, idx) => (
            <div key={col.id} className="flex items-center gap-2 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <span className="text-xs text-zinc-400 w-5">{idx + 1}</span>
              <input
                className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none"
                value={col.name}
                onChange={(e) => updateColumn(col.id, { name: e.target.value })}
              />
              <select
                className="text-xs bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1 outline-none"
                value={col.type}
                onChange={(e) => updateColumn(col.id, { type: e.target.value as ColumnType })}
              >
                {Object.entries(COLUMN_TYPE_LABELS).map(([type, label]) => (
                  <option key={type} value={type}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => removeColumn(col.id)}
                className="text-zinc-400 hover:text-red-400 px-2"
              >×</button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(COLUMN_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => addColumn(type as ColumnType)}
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              + {label}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
          <button onClick={handleSave} className="rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900">Save Schema</button>
        </div>
      </div>
    </div>
  );
}
