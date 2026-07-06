"use client";

import { useState } from "react";
import { TemplateDialog } from "@/components/templates/template-dialog";
import { ImportDialog } from "@/components/import-dialog";

interface Props { workspaceId: string; }

export function WorkspaceActions({ workspaceId }: Props) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowTemplates(true)} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Templates</button>
        <button onClick={() => setShowImport(true)} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Import</button>
      </div>
      {showTemplates && <TemplateDialog workspaceId={workspaceId} onClose={() => setShowTemplates(false)} />}
      {showImport && <ImportDialog workspaceId={workspaceId} onClose={() => setShowImport(false)} />}
    </>
  );
}
