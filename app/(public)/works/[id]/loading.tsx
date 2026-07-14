// Artwork detail skeleton — mirrors works/[id]/page.tsx layout.
export default function ArtworkDetailLoading() {
  return (
    <div className="pt-24 pb-20" aria-busy="true" aria-label="Loading artwork">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="motion-safe:animate-pulse">
          {/* Back link */}
          <div className="h-4 w-32 rounded bg-sage/70" />

          {/* Image viewer */}
          <div className="mt-8 aspect-[16/10] w-full rounded-2xl bg-gradient-to-br from-sage to-primary/10" />

          {/* Info */}
          <div className="mt-8">
            <div className="h-3 w-24 rounded bg-gold/30" />
            <div className="mt-3 h-9 w-2/3 rounded-lg bg-sage sm:h-10" />
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full max-w-2xl rounded bg-sage/70" />
              <div className="h-4 w-11/12 max-w-2xl rounded bg-sage/70" />
              <div className="h-4 w-4/5 max-w-xl rounded bg-sage/70" />
            </div>
          </div>

          {/* Prev / next */}
          <div className="mt-12 flex items-center justify-between border-t border-sage pt-8">
            <div className="h-10 w-40 rounded bg-sage/70" />
            <div className="h-10 w-40 rounded bg-sage/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
