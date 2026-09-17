export default function KYCLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-12 text-foreground">
      <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="h-[210px] animate-pulse rounded-[30px] border border-border bg-card">
          <div className="h-full rounded-[30px] bg-gradient-to-r from-muted via-muted/60 to-muted" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[150px] animate-pulse rounded-[22px] border border-border bg-card"
            >
              <div className="h-full rounded-[22px] bg-gradient-to-r from-muted via-muted/60 to-muted" />
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)]">
          <div className="h-[360px] animate-pulse rounded-[26px] border border-border bg-card" />

          <div className="h-[360px] animate-pulse rounded-[26px] border border-border bg-indigo-500/5" />
        </div>

        <div className="h-[120px] animate-pulse rounded-[26px] border border-border bg-card" />

        <div className="h-[520px] animate-pulse rounded-[26px] border border-border bg-card" />
      </div>
    </main>
  );
}