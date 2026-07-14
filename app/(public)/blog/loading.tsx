// Blog list skeleton — mirrors the 3-column card grid of blog/page.tsx.
export default function BlogLoading() {
  return (
    <div className="pt-24 pb-20" aria-busy="true" aria-label="Loading blog">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="motion-safe:animate-pulse">
          {/* Heading + intro */}
          <div className="h-10 w-40 rounded-lg bg-sage sm:h-12" />
          <div className="mt-5 h-4 w-full max-w-2xl rounded bg-sage/70" />

          {/* Card grid */}
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl bg-white shadow-sm"
              >
                <div className="aspect-[16/10] w-full bg-gradient-to-br from-primary/10 to-sage" />
                <div className="p-6">
                  <div className="h-3 w-24 rounded bg-sage/70" />
                  <div className="mt-3 h-6 w-3/4 rounded bg-sage" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded bg-sage/60" />
                    <div className="h-3 w-11/12 rounded bg-sage/60" />
                    <div className="h-3 w-2/3 rounded bg-sage/60" />
                  </div>
                  <div className="mt-4 h-3 w-20 rounded bg-gold/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
