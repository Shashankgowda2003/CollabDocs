"use client";

import { useRef, useEffect } from "react";

interface VideoTileProps {
  name: string;
  color: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenEnabled: boolean;
  isLocal: boolean;
}

export function VideoTile({
  name,
  color,
  stream,
  audioEnabled,
  videoEnabled,
  screenEnabled,
  isLocal,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 aspect-video">
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {name[0]?.toUpperCase() ?? "?"}
          </div>
        </div>
      )}

      {screenEnabled && (
        <div className="absolute top-2 left-2 rounded-lg bg-purple-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
          Sharing Screen
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center gap-2">
        <span className="text-xs font-medium text-white truncate flex-1">
          {name} {isLocal && "(You)"}
        </span>
        <div className="flex items-center gap-1.5">
          {!audioEnabled && (
            <svg className="h-3.5 w-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
          {audioEnabled && (
            <svg className="h-3.5 w-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
