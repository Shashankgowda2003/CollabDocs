"use client";

import { useState, useMemo } from "react";
import { DatabaseViewSwitcher } from "./database-view-switcher";
import { DatabaseSchemaEditor } from "./database-schema-editor";
import { DatabaseTableView } from "./database-table-view";
import { DatabaseKanbanView } from "./database-kanban-view";
import { DatabaseCalendarView } from "./database-calendar-view";
import { DatabaseGalleryView } from "./database-gallery-view";
import { DatabaseTimelineView } from "./database-timeline-view";
import type { DatabaseData, ViewConfig } from "./database-types";
import { createEmptyDatabase } from "./database-types";

interface Props {
  content: string;
  onChange: (content: string) => void;
}

export function DatabaseBlock({ content, onChange }: Props) {
  const data: DatabaseData = useMemo(() => {
    if (!content) return createEmptyDatabase();
    try {
      return JSON.parse(content) as DatabaseData;
    } catch {
      return createEmptyDatabase();
    }
  }, [content]);

  const [activeViewId, setActiveViewId] = useState(data.views[0]?.id || "");
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);

  const activeView = data.views.find((v) => v.id === activeViewId) || data.views[0];

  function handleDataChange(newData: DatabaseData) {
    onChange(JSON.stringify(newData));
  }

  function handleViewChange(viewId: string) {
    setActiveViewId(viewId);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
      <div className="flex items-center justify-between mb-3">
        <DatabaseViewSwitcher
          views={data.views}
          activeViewId={activeView?.id || ""}
          onChange={handleViewChange}
        />
        <button
          onClick={() => setShowSchemaEditor(true)}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
        >
          Schema
        </button>
      </div>

      {activeView?.type === "table" && (
        <DatabaseTableView data={data} onChange={handleDataChange} />
      )}
      {activeView?.type === "board" && (
        <DatabaseKanbanView
          data={data}
          groupByColumnId={activeView.groupByColumnId}
          onChange={handleDataChange}
        />
      )}
      {activeView?.type === "calendar" && (
        <DatabaseCalendarView
          data={data}
          dateColumnId={activeView.dateColumnId}
          onChange={handleDataChange}
        />
      )}
      {activeView?.type === "gallery" && (
        <DatabaseGalleryView data={data} onChange={handleDataChange} />
      )}
      {activeView?.type === "timeline" && (
        <DatabaseTimelineView data={data} onChange={handleDataChange} />
      )}

      {showSchemaEditor && (
        <DatabaseSchemaEditor
          data={data}
          onChange={handleDataChange}
          onClose={() => setShowSchemaEditor(false)}
        />
      )}
    </div>
  );
}
