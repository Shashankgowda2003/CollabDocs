"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceCallProvider, useWorkspaceCall } from "@/lib/workspace-call";
import { CallButton } from "@/components/collaboration/call-button";
import { CallPanel } from "@/components/collaboration/call-panel";

function CallUI() {
  const { callManager, callStatus, hasActiveCallers, callerNames } = useWorkspaceCall();
  const [error, setError] = useState<string | null>(null);

  if (!callManager) return null;

  async function handleJoinCall() {
    setError(null);
    try {
      await callManager!.joinCall();
    } catch {
      setError("Failed to access camera/microphone. Check browser permissions.");
    }
  }

  async function handleStartCall() {
    setError(null);
    try {
      await callManager!.startCall();
      if (callManager!.getState().error) {
        setError(callManager!.getState().error);
      }
    } catch {
      setError("Failed to access camera/microphone. Check browser permissions.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-500 flex items-center gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">&times;</button>
        </div>
      )}
      <CallButton
        callActive={callStatus === "in-call"}
        hasActiveCallers={hasActiveCallers}
        callerNames={callerNames}
        onStartCall={handleStartCall}
        onStartAudioOnly={() => callManager.startAudioOnly()}
        onJoinCall={handleJoinCall}
        onLeaveCall={() => callManager.leaveCall()}
      />
      <CallPanel
        callManager={callManager}
        localUserName=""
        localUserColor="#8b5cf6"
        onClose={() => callManager.leaveCall()}
      />
    </div>
  );
}

interface Props {
  userName: string;
}

export function WorkspaceCallWrapper({ userName }: Props) {
  const pathname = usePathname();

  const workspaceId = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 1 && !["dashboard", "login", "register"].includes(segments[0]!)) {
      return segments[0]!;
    }
    return null;
  }, [pathname]);

  if (!workspaceId) return null;

  return (
    <WorkspaceCallProvider workspaceId={workspaceId} userName={userName}>
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <CallUI />
      </div>
    </WorkspaceCallProvider>
  );
}
