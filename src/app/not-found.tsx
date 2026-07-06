import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <span className="text-3xl font-bold text-zinc-300">?</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Page not found</h1>
          <p className="text-sm text-zinc-500 mt-1">
            The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
