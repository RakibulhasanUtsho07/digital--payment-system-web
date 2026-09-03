export default function KYCLoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-[210px] animate-pulse rounded-[30px] border border-slate-200 bg-white">
        <div className="h-full rounded-[30px] bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[150px] animate-pulse rounded-[22px] border border-slate-200 bg-white"
          >
            <div className="h-full rounded-[22px] bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)]">
        <div className="h-[360px] animate-pulse rounded-[26px] border border-slate-200 bg-white" />
        <div className="h-[360px] animate-pulse rounded-[26px] border border-slate-200 bg-slate-200" />
      </div>

      <div className="h-[120px] animate-pulse rounded-[26px] border border-slate-200 bg-white" />

      <div className="h-[520px] animate-pulse rounded-[26px] border border-slate-200 bg-white" />
    </div>
  );
}
