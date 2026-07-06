"use client";

interface ScreenShareButtonProps {
  isSharing: boolean;
  onStartShare: () => void;
  onStopShare: () => void;
  disabled?: boolean;
}

export function ScreenShareButton({
  isSharing,
  onStartShare,
  onStopShare,
  disabled = false,
}: ScreenShareButtonProps) {
  return (
    <button
      onClick={isSharing ? onStopShare : onStartShare}
      disabled={disabled}
      className={`rounded-lg p-1.5 transition-all ${
        isSharing
          ? "bg-purple-500/20 text-purple-400"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      title={isSharing ? "Stop sharing" : "Share screen"}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
      </svg>
    </button>
  );
}
