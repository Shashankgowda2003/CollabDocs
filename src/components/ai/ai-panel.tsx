"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props { documentId: string; workspaceId: string; documentContent: string; onClose: () => void; onInsert: (text: string) => void; }

export function AiPanel({ workspaceId, documentContent, onClose, onInsert }: Props) {
  const [prompt, setPrompt] = useState(""); const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); const [action, setAction] = useState("generate");

  const actions = [
    { id: "generate", label: "Generate", desc: "Create from prompt" },
    { id: "summarize", label: "Summarize", desc: "Summarize document" },
    { id: "rewrite", label: "Rewrite", desc: "Rewrite selected text" },
    { id: "answer", label: "Ask", desc: "Ask about this doc" },
    { id: "action-items", label: "Action Items", desc: "Extract action items" },
  ];

  async function handleAction() {
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, content: action === "summarize" || action === "action-items" ? documentContent : prompt, question: action === "answer" ? prompt : undefined, instruction: action === "rewrite" ? prompt : undefined, workspaceId }) });
      const data = await res.json(); if (data.error) throw new Error(data.error); setResult(data.result);
    } catch (e) { setError(e instanceof Error ? e.message : "AI request failed"); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/20">AI</div>
            <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex gap-1 p-2 border-b border-zinc-800 overflow-x-auto">
          {actions.map((a) => (
            <button key={a.id} onClick={() => { setAction(a.id); setResult(""); setError(""); }} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${action === a.id ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title={a.desc}>{a.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {action !== "summarize" && action !== "action-items" && (
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={action === "generate" ? "Describe what you want to generate..." : action === "rewrite" ? "How should the text be rewritten?" : "What do you want to know?"} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50" rows={3} />
          )}
          <button onClick={handleAction} disabled={loading || (action !== "summarize" && action !== "action-items" && !prompt.trim())} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 shadow-lg shadow-purple-500/20">
            {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Working...</span> : `Run ${actions.find((a) => a.id === action)?.label}`}
          </button>
          {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}
          {result && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{result}</p>
              <button onClick={() => onInsert(result)} className="mt-3 rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">Insert into document</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
