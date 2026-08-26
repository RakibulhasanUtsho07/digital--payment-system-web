export default function KYCLoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-2xl bg-slate-200"
          />
        ))}
      </div>

      <div className="h-64 rounded-[26px] bg-slate-200" />

      <div className="h-[500px] rounded-[26px] bg-slate-200" />
    </div>
  );
}