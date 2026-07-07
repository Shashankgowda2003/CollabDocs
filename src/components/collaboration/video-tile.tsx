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
  onExpand?: () => void;
}

export function VideoTile({
  name,
  color,
  stream,
  audioEnabled,
  videoEnabled,
  screenEnabled,
  isLocal,
  onExpand,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.load();
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch((err) => {
          console.warn("Video play failed:", err);
        });
      }
    }
  }, [stream]);

  const hasVideo = stream && videoEnabled;

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 aspect-video group">
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full ${hasVideo ? "object-cover" : "hidden"}`}
        />
      )}

      {!hasVideo && (
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

      {onExpand && (
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="absolute top-2 right-2 rounded-lg bg-white/20 hover:bg-white/30 px-2 py-1 text-[10px] font-medium text-white transition-all opacity-0 group-hover:opacity-100"
          title="View fullscreen"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 8.25M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15.75M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 8.25M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15.75" />
          </svg>
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center gap-2">
        <span className="text-xs font-medium text-white truncate flex-1">
          {name} {isLocal && "(You)"}
        </span>
        <div className="flex items-center gap-1.5">
          {!audioEnabled && (
            <svg className="h-3.5 w-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
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
