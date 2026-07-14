// Blog post skeleton — mirrors the article layout of blog/[slug]/page.tsx.
export default function BlogPostLoading() {
  return (
    <div className="pt-24 pb-20" aria-busy="true" aria-label="Loading post">
      <article className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="motion-safe:animate-pulse">
          {/* Back link */}
          <div className="h-4 w-28 rounded bg-sage/70" />

          {/* Header */}
          <div className="mt-8">
            <div className="h-3 w-28 rounded bg-sage/70" />
            <div className="mt-3 h-10 w-3/4 rounded-lg bg-sage sm:h-12" />
            <div className="mt-3 h-10 w-1/2 rounded-lg bg-sage sm:h-12" />
          </div>

          {/* Body */}
          <div className="mt-10 border-t border-sage pt-10 space-y-4">
            {["w-full", "w-11/12", "w-full", "w-5/6", "w-full", "w-2/3"].map(
              (w, i) => (
                <div key={i} className={`h-4 ${w} rounded bg-sage/70`} />
              ),
            )}
            <div className="mt-8 h-6 w-1/3 rounded bg-sage" />
            {["w-full", "w-10/12", "w-full", "w-3/4"].map((w, i) => (
              <div key={`b-${i}`} className={`h-4 ${w} rounded bg-sage/70`} />
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
