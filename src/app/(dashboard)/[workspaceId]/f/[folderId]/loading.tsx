export default function FolderLoading() {
  return (
    <div className="max-w-4xl mx-auto p-8 animate-pulse">
      <div className="h-4 w-28 bg-zinc-100 rounded mb-4" />
      <div className="flex items-center gap-3 mb-8">
        <div className="h-6 w-6 bg-zinc-100 rounded" />
        <div className="h-7 w-48 bg-zinc-200 rounded" />
      </div>

      <div className="h-4 w-16 bg-zinc-100 rounded mb-3" />
      <div className="grid gap-2 sm:grid-cols-2 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 rounded-lg border border-zinc-200 bg-zinc-50" />
        ))}
      </div>

      <div className="h-4 w-20 bg-zinc-100 rounded mb-3" />
      <div className="grid gap-2 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg border border-zinc-200 bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}
