// Generic on-brand fallback skeleton. Serves as the closest loading boundary
// for every public segment without its own loading.tsx (home, about, contact,
// exhibits, events, pages/[slug]) so navigation paints instantly on click.
export default function PublicLoading() {
  return (
    <div className="pt-24 pb-20" aria-busy="true" aria-label="Loading">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="motion-safe:animate-pulse">
          {/* Title */}
          <div className="h-10 w-64 rounded-lg bg-sage sm:h-12" />
          {/* Subtitle line */}
          <div className="mt-5 h-4 w-full max-w-xl rounded bg-sage/70" />
          <div className="mt-3 h-4 w-3/4 max-w-md rounded bg-sage/70" />

          {/* Content band */}
          <div className="mt-12 h-64 w-full rounded-2xl bg-gradient-to-br from-sage to-primary/10 sm:h-80" />

          <div className="mt-10 space-y-4">
            <div className="h-4 w-full rounded bg-sage/70" />
            <div className="h-4 w-11/12 rounded bg-sage/70" />
            <div className="h-4 w-4/5 rounded bg-sage/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
