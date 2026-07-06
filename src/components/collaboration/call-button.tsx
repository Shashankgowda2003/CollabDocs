"use client";

interface CallButtonProps {
  callActive: boolean;
  hasActiveCallers: boolean;
  onStartCall: () => void;
  onStartAudioOnly: () => void;
  onJoinCall: () => void;
  onLeaveCall: () => void;
}

export function CallButton({
  callActive,
  hasActiveCallers,
  onStartCall,
  onStartAudioOnly,
  onJoinCall,
  onLeaveCall,
}: CallButtonProps) {
  if (callActive) {
    return (
      <button
        onClick={onLeaveCall}
        className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
        title="Leave call"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
        Leave
      </button>
    );
  }

  if (hasActiveCallers) {
    return (
      <button
        onClick={onJoinCall}
        className="rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20 transition-all flex items-center gap-1.5 animate-pulse"
        title="Join call"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
        Join Call
      </button>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={onStartCall}
        className="rounded-xl p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title="Start a call"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </button>
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-40 p-1.5">
        <button
          onClick={onStartCall}
          className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Video Call
        </button>
        <button
          onClick={onStartAudioOnly}
          className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          Voice Only
        </button>
      </div>
    </div>
  );
}
