export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-w-0 page-enter">
      {/* Topbar */}
      <div className="h-[52px] border-b border-border px-6 flex items-center justify-between"
        style={{ background: "#070b0fee" }}>
        <Skeleton className="h-3 w-40" />
        <div className="flex gap-3">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <Skeleton className="h-6 w-32 mb-1" />
        <Skeleton className="h-3 w-56 mb-6" />

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4" style={{ background: "#0b1117" }}>
              <Skeleton className="h-8 w-8 rounded-lg mb-3" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-2 w-24" />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5" style={{ background: "#0b1117" }}>
              <div className="flex justify-between mb-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5" style={{ background: "#0b1117" }}>
              <Skeleton className="h-3 w-32 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="rounded-lg p-3" style={{ background: "#ffffff05" }}>
                    <Skeleton className="h-2 w-16 mb-2" />
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-2 w-10" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-w-0 page-enter">
      <div className="h-[52px] border-b border-border px-6 flex items-center gap-3"
        style={{ background: "#070b0fee" }}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-1" />
        <Skeleton className="h-3 w-60 mb-6" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4" style={{ background: "#0b1117" }}>
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-2 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: "#0b1117" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3 w-48 mb-2" />
                <Skeleton className="h-2 w-32" />
              </div>
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
