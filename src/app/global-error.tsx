"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center p-8">
          <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Something went wrong</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {error.message || "An unexpected error occurred."}
            </p>
          </div>
          <button
            onClick={reset}
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
