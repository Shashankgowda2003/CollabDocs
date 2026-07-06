"use client";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { v4 as uuidv4 } from "uuid";

export type AwarenessUser = {
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: { from: number; to: number };
  currentBlock?: string;
};

const COLORS = [
  "#f97316", "#0ea5e9", "#8b5cf6", "#ec4899", "#22c55e",
  "#eab308", "#ef4444", "#06b6d4", "#a855f7", "#14b8a6",
];

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]!;
}

const ydocRegistry = new Map<string, Y.Doc>();

export function registerYDoc(documentId: string, ydoc: Y.Doc) {
  ydocRegistry.set(documentId, ydoc);
}

export function getYDoc(documentId: string): Y.Doc | undefined {
  return ydocRegistry.get(documentId);
}

export function unregisterYDoc(documentId: string) {
  ydocRegistry.delete(documentId);
}

export interface CollaborationState {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  awareness: typeof WebsocketProvider.prototype.awareness;
  user: AwarenessUser;
}

export function createCollaboration(
  documentId: string,
  userName: string,
  initialContent: string = ""
): CollaborationState {
  const ydoc = new Y.Doc();
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234";
  const provider = new WebsocketProvider(wsUrl, documentId, ydoc, {
    connect: true,
  });

  const userColor = randomColor();
  const user: AwarenessUser = {
    name: userName,
    color: userColor,
  };

  provider.awareness.setLocalState(user);

  const yContent = ydoc.getText("content");
  if (yContent.length === 0 && initialContent) {
    yContent.insert(0, initialContent);
  }

  const yBlocks = ydoc.getMap("blocks");

  return { ydoc, provider, awareness: provider.awareness, user };
}

export function setCursorPosition(
  awareness: typeof WebsocketProvider.prototype.awareness,
  blockId: string | null,
  x?: number,
  y?: number
) {
  const state = awareness.getLocalState() as AwarenessUser | null;
  if (state) {
    awareness.setLocalState({
      ...state,
      cursor: x !== undefined && y !== undefined ? { x, y } : undefined,
      currentBlock: blockId ?? undefined,
    });
  }
}

export function getConnectedUsers(
  awareness: typeof WebsocketProvider.prototype.awareness
): Map<number, AwarenessUser> {
  const users = new Map<number, AwarenessUser>();
  awareness.getStates().forEach((state, clientId) => {
    if (state && (state as AwarenessUser).name) {
      users.set(clientId, state as AwarenessUser);
    }
  });
  return users;
}

export interface YjsReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
}

export interface YjsComment {
  id: string;
  blockId: string | null;
  textRangeAnchor: string | null;
  authorId: string;
  authorName: string;
  status: string;
  createdAt: number;
  replies: YjsReply[];
}

export function getCommentsArray(ydoc: Y.Doc): Y.Array<Y.Map<string>> {
  return ydoc.getArray<Y.Map<string>>("comments");
}

export function addCommentThread(
  ydoc: Y.Doc,
  thread: YjsComment
) {
  const arr = getCommentsArray(ydoc);
  ydoc.transact(() => {
    const m = new Y.Map<string>();
    m.set("id", thread.id);
    m.set("blockId", thread.blockId ?? "");
    m.set("textRangeAnchor", thread.textRangeAnchor ?? "");
    m.set("authorId", thread.authorId);
    m.set("authorName", thread.authorName);
    m.set("status", thread.status);
    m.set("createdAt", String(thread.createdAt));
    m.set("repliesJson", JSON.stringify(thread.replies));
    arr.push([m]);
  });
}

export function addReplyToComment(
  ydoc: Y.Doc,
  threadId: string,
  reply: YjsReply
) {
  const arr = getCommentsArray(ydoc);
  ydoc.transact(() => {
    for (let i = 0; i < arr.length; i++) {
      const m = arr.get(i);
      if (m.get("id") === threadId) {
        const current = JSON.parse(m.get("repliesJson") || "[]") as YjsReply[];
        current.push(reply);
        m.set("repliesJson", JSON.stringify(current));
        break;
      }
    }
  });
}

export function updateCommentStatus(
  ydoc: Y.Doc,
  threadId: string,
  status: string
) {
  const arr = getCommentsArray(ydoc);
  ydoc.transact(() => {
    for (let i = 0; i < arr.length; i++) {
      const m = arr.get(i);
      if (m.get("id") === threadId) {
        m.set("status", status);
        break;
      }
    }
  });
}

export function removeCommentThread(ydoc: Y.Doc, threadId: string) {
  const arr = getCommentsArray(ydoc);
  ydoc.transact(() => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr.get(i).get("id") === threadId) {
        arr.delete(i);
        break;
      }
    }
  });
}

export function readCommentsFromYjs(ydoc: Y.Doc): YjsComment[] {
  const arr = getCommentsArray(ydoc);
  const comments: YjsComment[] = [];
  arr.forEach((m) => {
    let replies: YjsReply[] = [];
    try { replies = JSON.parse(m.get("repliesJson") || "[]"); } catch {}
    comments.push({
      id: m.get("id") || "",
      blockId: m.get("blockId") || null,
      textRangeAnchor: m.get("textRangeAnchor") || null,
      authorId: m.get("authorId") || "",
      authorName: m.get("authorName") || "",
      status: m.get("status") || "Open",
      createdAt: Number(m.get("createdAt")) || 0,
      replies,
    });
  });
  return comments.sort((a, b) => b.createdAt - a.createdAt);
}

export function initCommentsFromServer(ydoc: Y.Doc, serverComments: YjsComment[]) {
  const arr = getCommentsArray(ydoc);
  if (arr.length > 0) return;
  ydoc.transact(() => {
    serverComments.forEach((thread) => {
      const m = new Y.Map<string>();
      m.set("id", thread.id);
      m.set("blockId", thread.blockId ?? "");
      m.set("textRangeAnchor", thread.textRangeAnchor ?? "");
      m.set("authorId", thread.authorId);
      m.set("authorName", thread.authorName);
      m.set("status", thread.status);
      m.set("createdAt", String(thread.createdAt));
      m.set("repliesJson", JSON.stringify(thread.replies));
      arr.push([m]);
    });
  });
}
