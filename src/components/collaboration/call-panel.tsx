"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoTile } from "./video-tile";
import { ScreenShareButton } from "./screen-share-button";
import type { CallManager } from "@/lib/webrtc/call-manager";

interface CallPanelProps {
  callManager: CallManager;
  localUserName: string;
  localUserColor: string;
  onClose: () => void;
}

export function CallPanel({
  callManager,
  localUserName,
  localUserColor,
  onClose,
}: CallPanelProps) {
  const [, forceUpdate] = useState(0);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    return callManager.subscribe(() => forceUpdate((n) => n + 1));
  }, [callManager]);

  const state = callManager.getState();
  const participants = Array.from(state.participants.values());

  if (state.status !== "in-call") return null;

  if (minimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl px-4 py-2.5 flex items-center gap-3"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-300">Call · {participants.length + 1}</span>
        </div>
        <button
          onClick={() => setMinimized(false)}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Expand
        </button>
        <button
          onClick={onClose}
          className="text-xs text-red-400 hover:text-red-300 font-medium"
        >
          Leave
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-200">
              Call · {participants.length + 1}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              title="Minimize"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
              title="Leave call"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
          <VideoTile
            name={localUserName}
            color={localUserColor}
            stream={
              state.screenStream ?? state.localStream
            }
            audioEnabled={state.audioEnabled}
            videoEnabled={state.videoEnabled || state.screenEnabled}
            screenEnabled={state.screenEnabled}
            isLocal
          />

          {participants.map((p) => (
            <VideoTile
              key={p.clientId}
              name={p.name}
              color={p.color}
              stream={p.stream}
              audioEnabled={p.audioEnabled}
              videoEnabled={p.videoEnabled}
              screenEnabled={p.screenEnabled}
              isLocal={false}
            />
          ))}

          {participants.length === 0 && (
            <div className="text-center py-6">
              <svg className="h-8 w-8 mx-auto text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <p className="text-xs text-zinc-500">Waiting for others to join...</p>
            </div>
          )}

          {state.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
              {state.error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={() => callManager.toggleAudio()}
            className={`rounded-full p-2.5 transition-all ${
              state.audioEnabled
                ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            }`}
            title={state.audioEnabled ? "Mute" : "Unmute"}
          >
            {state.audioEnabled ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>

          <button
            onClick={() => callManager.toggleVideo()}
            className={`rounded-full p-2.5 transition-all ${
              state.videoEnabled
                ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            }`}
            title={state.videoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {state.videoEnabled ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>

          <ScreenShareButton
            isSharing={state.screenEnabled}
            onStartShare={() => callManager.startScreenShare()}
            onStopShare={() => callManager.stopScreenShare()}
          />

          <button
            onClick={onClose}
            className="rounded-full p-2.5 bg-red-500 text-white hover:bg-red-600 transition-all ml-2"
            title="Leave call"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
