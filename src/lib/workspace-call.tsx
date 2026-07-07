"use client";

import { useEffect, useRef, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { AwarenessUser } from "@/lib/collaboration";
import { CallManager } from "@/lib/webrtc/call-manager";
import type { CallManagerState } from "@/lib/webrtc/types";

interface WorkspaceCallContextValue {
  callManager: CallManager | null;
  callStatus: "idle" | "in-call";
  hasActiveCallers: boolean;
  callerNames: string[];
}

const WorkspaceCallContext = createContext<WorkspaceCallContextValue>({
  callManager: null,
  callStatus: "idle",
  hasActiveCallers: false,
  callerNames: [],
});

export function useWorkspaceCall() {
  return useContext(WorkspaceCallContext);
}

const COLORS = [
  "#f97316", "#0ea5e9", "#8b5cf6", "#ec4899", "#22c55e",
  "#eab308", "#ef4444", "#06b6d4", "#a855f7", "#14b8a6",
];
function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]!;
}

interface Props {
  workspaceId: string;
  userName: string;
  children: ReactNode;
}

export function WorkspaceCallProvider({ workspaceId, userName, children }: Props) {
  const [callStatus, setCallStatus] = useState<"idle" | "in-call">("idle");
  const [hasActiveCallers, setHasActiveCallers] = useState(false);
  const [callerNames, setCallerNames] = useState<string[]>([]);
  const [callManager, setCallManager] = useState<CallManager | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<WebsocketProvider["awareness"] | null>(null);

  // Create workspace-level Yjs connection for call signaling
  useEffect(() => {
    const ydoc = new Y.Doc();
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234";
    const roomName = `workspace-call-${workspaceId}`;
    const provider = new WebsocketProvider(wsUrl, roomName, ydoc, { connect: true });
    const userColor = randomColor();

    provider.awareness.setLocalState({ name: userName, color: userColor });

    ydocRef.current = ydoc;
    providerRef.current = provider;
    awarenessRef.current = provider.awareness;

    const cm = new CallManager(roomName, userName, userColor, provider.awareness);
    setCallManager(cm);

    const unsub = cm.subscribe(() => setCallStatus(cm.getState().status));

    const checkCallers = () => {
      const names: string[] = [];
      provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId !== provider.awareness.clientID) {
          const user = state as AwarenessUser;
          if (user?.callStatus === "in-call") {
            names.push(user.name || "Someone");
          }
        }
      });
      setHasActiveCallers(names.length > 0);
      setCallerNames(names);
    };

    checkCallers();
    provider.awareness.on("change", checkCallers);

    return () => {
      unsub();
      cm.destroy();
      provider.awareness.off("change", checkCallers);
      setCallManager(null);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [workspaceId, userName]);

  return (
    <WorkspaceCallContext.Provider value={{ callManager, callStatus, hasActiveCallers, callerNames }}>
      {children}
    </WorkspaceCallContext.Provider>
  );
}
