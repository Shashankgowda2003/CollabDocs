"use client";

import { useState, useCallback } from "react";
import { addReply, resolveThread, deleteThread } from "@/server/actions/comments";

interface Reply {
  id: string;
  author: { id: string; name: string | null; image: string | null };
  content: string;
  createdAt: Date;
}

interface Thread {
  id: string;
  blockId: string | null;
  textRangeAnchor: string | null;
  author: { id: string; name: string | null; image: string | null };
  status: string;
  createdAt: Date;
  replies: Reply[];
}

interface Props {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string | null) => void;
}

export function CommentPanel({ threads, activeThreadId, onSelectThread }: Props) {
  const openThreads = threads.filter((t) => t.status === "Open");
  const resolvedThreads = threads.filter((t) => t.status === "Resolved");
  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="w-80 border-l border-zinc-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-900">Comments</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          {openThreads.length} open &middot; {resolvedThreads.length} resolved
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeThread ? (
          <ThreadDetail
            thread={activeThread}
            onBack={() => onSelectThread(null)}
          />
        ) : (
          <ThreadList
            threads={openThreads}
            resolvedThreads={resolvedThreads}
            onSelect={onSelectThread}
          />
        )}

        {threads.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-400">No comments yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              Select text in the document to start a discussion
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadList({
  threads,
  resolvedThreads,
  onSelect,
}: {
  threads: Thread[];
  resolvedThreads: Thread[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-zinc-100">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelect(thread.id)}
          className="w-full text-left p-4 hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-5 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-medium text-zinc-600">
              {thread.author.name?.[0] || "?"}
            </div>
            <span className="text-xs font-medium text-zinc-700">
              {thread.author.name || "Anonymous"}
            </span>
            <span className="text-[10px] text-zinc-400 ml-auto">
              {new Date(thread.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-zinc-600 line-clamp-2">
            {thread.replies[0]?.content || ""}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
          </p>
        </button>
      ))}

      {resolvedThreads.length > 0 && (
        <>
          <div className="px-4 py-2">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase">
              Resolved
            </p>
          </div>
          {resolvedThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelect(thread.id)}
              className="w-full text-left p-4 hover:bg-zinc-50 transition-colors opacity-60"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-5 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-medium text-zinc-600">
                  {thread.author.name?.[0] || "?"}
                </div>
                <span className="text-xs font-medium text-zinc-700">
                  {thread.author.name || "Anonymous"}
                </span>
              </div>
              <p className="text-sm text-zinc-500 line-clamp-2">
                {thread.replies[0]?.content || ""}
              </p>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function ThreadDetail({
  thread,
  onBack,
}: {
  thread: Thread;
  onBack: () => void;
}) {
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReply = useCallback(async () => {
    if (!reply.trim() || submitting) return;
    setSubmitting(true);
    await addReply(thread.id, reply);
    setReply("");
    setSubmitting(false);
  }, [reply, submitting, thread.id]);

  const handleResolve = useCallback(async () => {
    await resolveThread(thread.id);
  }, [thread.id]);

  const handleDelete = useCallback(async () => {
    if (confirm("Delete this thread?")) {
      await deleteThread(thread.id);
      onBack();
    }
  }, [thread.id, onBack]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-zinc-100">
        <button onClick={onBack} className="text-zinc-400 hover:text-zinc-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-medium text-zinc-700">Thread</span>
        <span
          className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
            thread.status === "Open"
              ? "bg-green-100 text-green-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {thread.status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.replies.map((r) => (
          <div key={r.id} className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-medium text-zinc-600 shrink-0 mt-0.5">
              {r.author.name?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-700">
                  {r.author.name || "Anonymous"}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {new Date(r.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-zinc-600 mt-0.5 whitespace-pre-wrap">
                {r.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {thread.status === "Open" && (
        <div className="p-4 border-t border-zinc-100">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
            className="w-full rounded-lg border border-zinc-200 p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              <button
                onClick={handleResolve}
                className="text-[10px] text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded hover:bg-zinc-100"
              >
                Resolve
              </button>
              <button
                onClick={handleDelete}
                className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                Delete
              </button>
            </div>
            <button
              onClick={handleReply}
              disabled={!reply.trim() || submitting}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              {submitting ? "Sending..." : "Reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
