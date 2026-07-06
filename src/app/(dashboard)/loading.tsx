export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-6 w-40 bg-zinc-200 rounded mb-2" />
          <div className="h-4 w-48 bg-zinc-100 rounded" />
        </div>
        <div className="h-8 w-20 bg-zinc-100 rounded-full" />
      </div>

      <div className="h-5 w-32 bg-zinc-100 rounded mb-4" />

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-200 p-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-zinc-200" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-zinc-200 rounded mb-1" />
                <div className="h-3 w-20 bg-zinc-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
