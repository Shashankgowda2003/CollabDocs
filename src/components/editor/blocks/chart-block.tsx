"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DatabaseData } from "./database-types";

interface ChartBlockConfig {
  sourceBlockId?: string;
  chartType?: "bar" | "line" | "pie";
  xColumnId?: string;
  yColumnId?: string;
  aggregate?: "sum" | "count" | "average";
}

interface Props {
  content: string;
  blockId: string;
  allBlocks?: { id: string; type: string; content: string }[];
  onChange: (content: string) => void;
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function ChartBlock({ content, blockId, allBlocks, onChange }: Props) {
  const config: ChartBlockConfig = useMemo(() => {
    if (!content) return {};
    try {
      return JSON.parse(content) as ChartBlockConfig;
    } catch {
      return {};
    }
  }, [content]);

  const databaseBlocks = useMemo(() => {
    return (allBlocks || []).filter((b) => b.id !== blockId && b.type === "database");
  }, [allBlocks, blockId]);

  const sourceBlock = useMemo(() => {
    if (!config.sourceBlockId) return null;
    return databaseBlocks.find((b) => b.id === config.sourceBlockId) || null;
  }, [databaseBlocks, config.sourceBlockId]);

  const dbData: DatabaseData | null = useMemo(() => {
    if (!sourceBlock) return null;
    try {
      return JSON.parse(sourceBlock.content) as DatabaseData;
    } catch {
      return null;
    }
  }, [sourceBlock]);

  const chartData = useMemo(() => {
    if (!dbData || !config.xColumnId || !config.yColumnId) return [];

    const xCol = dbData.schema.find((c) => c.id === config.xColumnId);
    const yCol = dbData.schema.find((c) => c.id === config.yColumnId);
    if (!xCol || !yCol) return [];

    const grouped = new Map<string, number[]>();
    for (const row of dbData.rows) {
      const xVal = String(row.cells[xCol.id] ?? "");
      const yVal = Number(row.cells[yCol.id] ?? 0);
      if (!grouped.has(xVal)) grouped.set(xVal, []);
      grouped.get(xVal)!.push(yVal);
    }

    const aggregate = config.aggregate || "sum";
    return Array.from(grouped.entries()).map(([name, values]) => {
      let value = 0;
      if (aggregate === "sum") value = values.reduce((a, b) => a + b, 0);
      if (aggregate === "count") value = values.length;
      if (aggregate === "average") value = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return { name, value: Number(value.toFixed(2)) };
    });
  }, [dbData, config.xColumnId, config.yColumnId, config.aggregate]);

  function updateConfig(patch: Partial<ChartBlockConfig>) {
    onChange(JSON.stringify({ ...config, ...patch }));
  }

  if (!config.sourceBlockId) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
        <p className="text-sm text-zinc-500 mb-4">Select a database to visualize</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {databaseBlocks.map((db) => (
            <button
              key={db.id}
              onClick={() => updateConfig({ sourceBlockId: db.id, chartType: "bar" })}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all text-left"
            >
              <span className="flex h-8 w-8 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-xs">⚫</span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Database block</span>
            </button>
          ))}
        </div>
        {databaseBlocks.length === 0 && (
          <p className="text-xs text-zinc-400 mt-4">Add a database block first to create a chart.</p>
        )}
      </div>
    );
  }

  if (!dbData || chartData.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
        <ChartConfigPanel config={config} dbData={dbData} onChange={updateConfig} sourceBlock={sourceBlock} />
        <p className="text-sm text-zinc-500 mt-4">No data to display. Add rows to the database or select valid columns.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <ChartConfigPanel config={config} dbData={dbData} onChange={updateConfig} sourceBlock={sourceBlock} />
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          {config.chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
              <YAxis stroke="#a1a1aa" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: 8, color: "#fff" }} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          ) : config.chartType === "pie" ? (
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: 8, color: "#fff" }} />
              <Legend />
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
              <YAxis stroke="#a1a1aa" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: 8, color: "#fff" }} />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartConfigPanel({
  config,
  dbData,
  onChange,
  sourceBlock,
}: {
  config: ChartBlockConfig;
  dbData: DatabaseData | null;
  onChange: (patch: Partial<ChartBlockConfig>) => void;
  sourceBlock?: { id: string; type: string; content: string } | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Source: {sourceBlock ? "Database block" : "None"}</span>
          <button onClick={() => setExpanded((e) => !e)} className="text-xs text-blue-500 hover:text-blue-400">
            {expanded ? "Close" : "Configure"}
          </button>
        </div>
      </div>
      {expanded && dbData && (
        <div className="mt-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Chart type</label>
            <select
              value={config.chartType || "bar"}
              onChange={(e) => onChange({ chartType: e.target.value as "bar" | "line" | "pie" })}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">X axis / label</label>
            <select
              value={config.xColumnId || ""}
              onChange={(e) => onChange({ xColumnId: e.target.value })}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="">Select column</option>
              {dbData.schema.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Y axis / value</label>
            <select
              value={config.yColumnId || ""}
              onChange={(e) => onChange({ yColumnId: e.target.value })}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="">Select column</option>
              {dbData.schema.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Aggregate</label>
            <select
              value={config.aggregate || "sum"}
              onChange={(e) => onChange({ aggregate: e.target.value as "sum" | "count" | "average" })}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="sum">Sum</option>
              <option value="count">Count</option>
              <option value="average">Average</option>
            </select>
          </div>
        </div>
      )}
      {expanded && !dbData && (
        <p className="text-xs text-zinc-400 mt-3">Selected source database block has no data.</p>
      )}
    </div>
  );
}
