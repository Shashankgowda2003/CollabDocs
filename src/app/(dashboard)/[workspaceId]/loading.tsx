export default function WorkspaceLoading() {
  return (
    <div className="max-w-4xl mx-auto p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-4 w-24 bg-zinc-100 rounded mb-2" />
          <div className="h-7 w-48 bg-zinc-200 rounded mb-1" />
          <div className="h-3 w-16 bg-zinc-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-44 bg-zinc-100 rounded-lg" />
          <div className="h-9 w-28 bg-zinc-100 rounded-lg" />
        </div>
      </div>

      <div className="h-4 w-16 bg-zinc-100 rounded mb-3" />
      <div className="grid gap-2 sm:grid-cols-2 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg border border-zinc-200 bg-zinc-50" />
        ))}
      </div>

      <div className="h-4 w-20 bg-zinc-100 rounded mb-3" />
      <div className="grid gap-2 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg border border-zinc-200 bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}
