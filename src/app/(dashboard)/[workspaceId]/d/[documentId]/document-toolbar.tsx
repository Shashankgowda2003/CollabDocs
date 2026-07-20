"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { renameDocument } from "@/server/actions/document";
import { moveToTrash } from "@/server/actions/trash";
import { ShareDialog } from "@/components/sharing/share-dialog";
import { VersionPanel } from "@/components/version/version-panel";
import { CommentPanel } from "@/components/comments/comment-panel";
import { AiPanel } from "@/components/ai/ai-panel";
import { ApiKeySettings } from "@/components/ai/api-key-settings";
import { SuggestionPanel } from "@/components/suggestions/suggestion-panel";
import { DocumentGraph } from "@/components/graph/document-graph";
import { ReactFlowProvider } from "@xyflow/react";
import { exportDocument } from "@/server/actions/export";
import { togglePublish } from "@/server/actions/publish";
import { toggleFavorite, checkIsFavorite } from "@/server/actions/favorites";
import type { Role } from "@/lib/types";

interface ShareLink { id: string; role: string; password: string | null; expiresAt: Date | null; workspaceMemberOnly: boolean; isRevoked: boolean; createdAt: Date; }
interface Thread { id: string; blockId: string | null; textRangeAnchor: string | null; author: { id: string; name: string | null; image: string | null }; status: string; createdAt: Date; replies: { id: string; author: { id: string; name: string | null; image: string | null }; content: string; createdAt: Date }[]; }
interface Props { documentId: string; workspaceId: string; role: Role; threadCount: number; links: ShareLink[]; threads: Thread[]; editorMode: "editing" | "suggesting"; onEditorModeChange: (mode: "editing" | "suggesting") => void; pendingSuggestionCount: number; }

export function DocumentToolbar({ documentId, workspaceId, role, threadCount, links, threads, editorMode, onEditorModeChange, pendingSuggestionCount }: Props) {
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    checkIsFavorite(documentId).then(setIsFavorited);
  }, [documentId]);

  async function handleToggleFavorite() {
    const result = await toggleFavorite(documentId);
    setIsFavorited(result.favorited);
    router.refresh();
  }

  async function handleRename() { if (!newTitle.trim()) return; await renameDocument(documentId, newTitle); setShowRename(false); router.refresh(); }
  async function handleDelete() { if (!confirm("Move this document to trash?")) return; await moveToTrash("Document", documentId); router.push(`/${workspaceId}`); }

  async function handleExport(format: "markdown" | "html") {
    setShowExport(false);
    const result = await exportDocument(documentId, format);
    const blob = new Blob([result.content], { type: result.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = result.filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function handlePublish() {
    const result = await togglePublish(documentId);
    if (result.publishedSlug) {
      navigator.clipboard.writeText(`${window.location.origin}/p/${result.publishedSlug}`);
      alert("Published! Link copied to clipboard.");
    }
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEditorModeChange(editorMode === "editing" ? "suggesting" : "editing")}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
            editorMode === "suggesting"
              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
              : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20"
          }`}
          title={editorMode === "editing" ? "Switch to suggesting mode" : "Switch to editing mode"}
        >
          {editorMode === "editing" ? (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
              Editing
            </>
          ) : (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
              Suggesting
            </>
          )}
        </button>
        <button onClick={() => setShowSuggestions(true)} className="relative rounded-xl p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all" title="Review suggestions">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
          {pendingSuggestionCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">{pendingSuggestionCount}</span>
          )}
        </button>
        <button onClick={() => setShowRename(!showRename)} className="rounded-xl p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all" title="Rename">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
        </button>
        <button onClick={() => setShowVersion(true)} className="rounded-xl p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all" title="History">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
        <button onClick={() => setShowAi(true)} className="rounded-xl p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all" title="AI">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
        </button>
        <div className="relative">
          <button onClick={() => setShowExport(!showExport)} className="rounded-xl p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all" title="Export">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-40 p-1.5" onClick={() => setShowExport(false)}>
              <button onClick={() => handleExport("markdown")} className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Markdown</button>
              <button onClick={() => handleExport("html")} className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">HTML</button>
            </div>
          )}
        </div>
        <button onClick={handlePublish} className="rounded-xl border border-green-300 dark:border-green-700 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all" title="Publish to web">Publish</button>
        <button onClick={handleToggleFavorite} className={`rounded-xl p-2 transition-all ${isFavorited ? "text-yellow-500" : "text-zinc-500 hover:text-yellow-500"} hover:bg-yellow-50 dark:hover:bg-yellow-500/10`} title="Favorite">
          <svg className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </button>
        <button onClick={() => setShowGraph(true)} className="rounded-xl p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all" title="Graph view">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>
        </button>
        <button onClick={() => setShowApiKeys(true)} className="rounded-xl p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all" title="AI Settings">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowShare(true)} className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20">
          Share
        </motion.button>
      </div>

      {showRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowRename(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Rename Document</h3>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }} placeholder="New title..." className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" autoFocus />
            <div className="flex items-center gap-2 mt-3">
              <button onClick={handleRename} className="rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100">Save</button>
              <button onClick={() => setShowRename(false)} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={handleDelete} className="ml-auto rounded-xl border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showShare && <ShareDialog documentId={documentId} workspaceId={workspaceId} links={links} onClose={() => setShowShare(false)} />}
      {showVersion && <VersionPanel documentId={documentId} onClose={() => setShowVersion(false)} />}
      {showAi && <AiPanel documentId={documentId} workspaceId={workspaceId} documentContent="" onClose={() => setShowAi(false)} onInsert={() => setShowAi(false)} />}
      {showApiKeys && <ApiKeySettings onClose={() => setShowApiKeys(false)} />}
      {showSuggestions && <SuggestionPanel documentId={documentId} onClose={() => setShowSuggestions(false)} />}
      {showGraph && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowGraph(false)}>
          <div className="w-[90vw] h-[80vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Document Graph</h2>
              <button onClick={() => setShowGraph(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="h-[calc(80vh-60px)]">
              <ReactFlowProvider>
                <DocumentGraph workspaceId={workspaceId} currentDocumentId={documentId} />
              </ReactFlowProvider>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
