export default function DocumentLoading() {
  return (
    <div className="max-w-4xl mx-auto p-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-4 w-6 bg-zinc-100 rounded" />
          <div className="h-7 w-64 bg-zinc-200 rounded" />
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-8 bg-zinc-100 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded-lg border border-zinc-200 bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}
