export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Topbar */}
      <div className="h-[58px] border-b flex items-center justify-between px-6 flex-shrink-0 bg-white"
        style={{ borderColor: "#e2e8f4" }}>
        <div className="flex items-center gap-2">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-3 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-24 rounded-lg" />
          <div className="skeleton h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6" style={{ background: "#f8fafc" }}>
        <div className="skeleton h-6 w-40 rounded-lg mb-1.5" />
        <div className="skeleton h-3 w-56 rounded mb-6" />

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5" style={{ border: "1px solid #e2e8f4" }}>
              <div className="skeleton h-9 w-9 rounded-xl mb-3" />
              <div className="skeleton h-7 w-16 rounded mb-1.5" />
              <div className="skeleton h-2.5 w-28 rounded" />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5" style={{ border: "1px solid #e2e8f4" }}>
              <div className="skeleton h-3 w-32 rounded mb-4" />
              <div className="skeleton h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5" style={{ border: "1px solid #e2e8f4" }}>
              <div className="skeleton h-3 w-32 rounded mb-4" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-3 py-2.5" style={{ borderBottom: j < 2 ? "1px solid #f1f5f9" : "none" }}>
                  <div className="skeleton w-1 h-8 rounded flex-shrink-0" />
                  <div className="flex-1">
                    <div className="skeleton h-3 w-40 rounded mb-1.5" />
                    <div className="skeleton h-2 w-28 rounded" />
                  </div>
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-[58px] border-b bg-white flex items-center px-6" style={{ borderColor: "#e2e8f4" }}>
        <div className="skeleton h-3 w-48 rounded" />
      </div>
      <div className="flex-1 p-6" style={{ background: "#f8fafc" }}>
        <div className="skeleton h-6 w-48 rounded-lg mb-1.5" />
        <div className="skeleton h-3 w-64 rounded mb-6" />
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
