// Gallery skeleton — mirrors the masonry columns layout of works/page.tsx.
export default function WorksLoading() {
  // Varied heights so the masonry reads as intentional, not uniform boxes.
  const heights = [
    "h-72",
    "h-56",
    "h-80",
    "h-64",
    "h-52",
    "h-72",
    "h-60",
    "h-80",
    "h-56",
  ];

  return (
    <div className="pt-24 pb-20" aria-busy="true" aria-label="Loading gallery">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="motion-safe:animate-pulse">
          {/* "Gallery" heading */}
          <div className="h-10 w-56 rounded-lg bg-sage sm:h-12" />

          {/* Category filter pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            {["w-14", "w-20", "w-24", "w-16"].map((w, i) => (
              <div key={i} className={`h-8 ${w} rounded-full bg-sage`} />
            ))}
          </div>

          {/* Masonry grid */}
          <div className="mt-12">
            <div className="columns-2 gap-4 md:columns-3">
              {heights.map((h, i) => (
                <div key={i} className="mb-4 w-full break-inside-avoid">
                  <div
                    className={`w-full ${h} rounded-xl bg-gradient-to-br from-sage to-primary/10`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
