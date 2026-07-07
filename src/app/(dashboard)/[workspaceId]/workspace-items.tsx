"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createDocument, renameDocument, moveDocument } from "@/server/actions/document";
import { createFolder, renameFolder } from "@/server/actions/folder";
import { duplicateDocument, duplicateFolder } from "@/server/actions/duplicate";
import { moveToTrash } from "@/server/actions/trash";
import { motion, AnimatePresence } from "framer-motion";

function formatDate(date: Date): string {
  const d = new Date(date);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

interface Folder { id: string; name: string; }
interface Doc { id: string; title: string; updatedAt: Date; }

interface Props { workspaceId: string; folders: Folder[]; documents: Doc[]; canEdit: boolean; }

export function WorkspaceItems({ workspaceId, folders, documents, canEdit }: Props) {
  const router = useRouter();
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData("text/plain", docId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedDocId(docId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedDocId(null);
    setDragOverFolderId(null);
    setDragOverRoot(false);
  }, []);

  const handleFolderDrop = useCallback(async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData("text/plain");
    if (!docId) return;
    setDragOverFolderId(null);
    try {
      await moveDocument(docId, folderId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to move document");
    }
    handleDragEnd();
  }, [router, handleDragEnd]);

  const handleRootDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData("text/plain");
    if (!docId) return;
    setDragOverRoot(false);
    try {
      await moveDocument(docId, null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to move document");
    }
    handleDragEnd();
  }, [router, handleDragEnd]);

  async function handleRenameFolder(id: string) {
    if (!folderName.trim()) return;
    const formData = new FormData(); formData.set("name", folderName);
    await renameFolder(id, formData);
    setEditingFolder(null); router.refresh();
  }

  async function handleRenameDoc(id: string) {
    if (!docTitle.trim()) return;
    await renameDocument(id, docTitle);
    setEditingDoc(null); router.refresh();
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm("Move this folder to trash?")) return;
    try {
      await moveToTrash("Folder", id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete folder");
    }
  }
  async function handleDeleteDoc(id: string) {
    if (!confirm("Move this document to trash?")) return;
    try {
      await moveToTrash("Document", id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete document");
    }
  }

  return (
    <div className="space-y-8">
      {canEdit && (
        <div className="flex items-center gap-2.5">
          <form action={createDocument.bind(null, workspaceId, null)} className="flex items-center gap-2.5">
              <input name="title" type="text" placeholder="Document name" className="h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all" />
              <button className="h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20">New Doc</button>
            </form>
            <form action={createFolder.bind(null, workspaceId, null)}>
              <button className="h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 px-5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">New Folder</button>
          </form>
        </div>
      )}

      {folders.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Folders</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {folders.map((folder) => (
                <motion.div key={folder.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDragEnter={(e) => { e.preventDefault(); setDragOverFolderId(folder.id); }}
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={(e) => { e.preventDefault(); handleFolderDrop(e, folder.id); }}
                  className={`group flex items-center gap-3 rounded-xl border transition-all ${
                    dragOverFolderId === folder.id
                      ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400/30"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
                  }`}>
                  {editingFolder === folder.id ? (
                    <div className="flex-1 flex items-center gap-2 p-3">
                      <svg className="h-5 w-5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                      <input value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(folder.id); if (e.key === "Escape") setEditingFolder(null); }} autoFocus className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-white" />
                      <button onClick={() => handleRenameFolder(folder.id)} className="text-xs text-blue-400 hover:text-blue-300">Save</button>
                      <button onClick={() => setEditingFolder(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <Link href={`/${workspaceId}/f/${folder.id}`} className="flex-1 flex items-center gap-3 p-4 min-w-0">
                        <svg className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                        <span className="font-medium text-zinc-900 dark:text-white text-sm truncate">{folder.name}</span>
                      </Link>
                      {canEdit && (
                        <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={async () => { await duplicateFolder(folder.id); router.refresh(); }} className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" title="Duplicate"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg></button>
                          <button onClick={() => { setEditingFolder(folder.id); setFolderName(folder.name); }} className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" title="Rename"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg></button>
                          <button onClick={() => handleDeleteFolder(folder.id)} className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10" title="Delete"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      <section
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
        onDragEnter={(e) => { e.preventDefault(); setDragOverRoot(true); }}
        onDragLeave={(e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) setDragOverRoot(false); }}
        onDrop={handleRootDrop}
      >
          <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Documents</h2>
        {documents.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-12 text-center transition-all ${
            dragOverRoot
              ? "border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
              : "border-zinc-300 dark:border-zinc-800"
          }`}><p className="text-sm text-zinc-500">{dragOverRoot ? "Drop document here" : "No documents at workspace root. Create one above."}</p></div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {documents.map((doc) => (
                <div key={doc.id}
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, doc.id)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all ${
                    draggedDocId === doc.id ? "opacity-50" : ""
                  } ${canEdit ? "cursor-grab active:cursor-grabbing" : ""}`}>
                  {editingDoc === doc.id ? (
                    <div className="flex-1 flex items-center gap-2 p-3">
                      <svg className="h-5 w-5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRenameDoc(doc.id); if (e.key === "Escape") setEditingDoc(null); }} autoFocus className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-white" />
                      <button onClick={() => handleRenameDoc(doc.id)} className="text-xs text-blue-400 hover:text-blue-300">Save</button>
                      <button onClick={() => setEditingDoc(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <Link href={`/${workspaceId}/d/${doc.id}`} className="flex-1 flex items-center gap-3 p-4 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 flex items-center justify-center text-sm shrink-0">
                          <DocumentIcon docId={doc.id} />
                        </div>
                        <div className="min-w-0">                        <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">{doc.title}</p><p className="text-xs text-zinc-500 mt-0.5">{formatDate(doc.updatedAt)}</p></div>
                      </Link>
                      {canEdit && (
                        <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={async () => { await duplicateDocument(doc.id); router.refresh(); }} className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" title="Duplicate"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg></button>
                          <button onClick={() => { setEditingDoc(doc.id); setDocTitle(doc.title); }} className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" title="Rename"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg></button>
                          <button onClick={() => handleDeleteDoc(doc.id)} className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10" title="Delete"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

function DocumentIcon({ docId }: { docId: string }) {
  const [emoji, setEmoji] = useState("📄");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`doc-icon-${docId}`);
    if (saved) setEmoji(saved);
  }, [docId]);

  function setIcon(e: React.MouseEvent, icon: string) {
    e.preventDefault();
    e.stopPropagation();
    setEmoji(icon);
    localStorage.setItem(`doc-icon-${docId}`, icon);
    setEditing(false);
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(!editing); }}
        className="text-sm hover:scale-110 transition-transform"
      >
        {emoji}
      </button>
      {editing && (
        <div
          className="absolute left-0 top-full mt-1 w-40 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 p-2 grid grid-cols-6 gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {["📄", "📝", "📋", "💡", "🎯", "🔥", "⭐", "🚀", "💬", "📊", "📅", "✅"].map((icon) => (
            <button
              key={icon}
              onClick={(e) => setIcon(e, icon)}
              className="h-7 w-7 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
