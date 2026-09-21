// Gallery skeleton — mirrors the column layout of components/WorksGallery.tsx
// (2 flex columns below md, 3 from md up, pieces dealt round-robin).
export default function WorksLoading() {
  // Varied heights so the masonry reads as intentional, not uniform boxes.
  const columns = [
    ["h-72", "h-64", "h-60"],
    ["h-56", "h-52", "h-80"],
    ["h-80", "h-72", "h-56"],
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
            <div className="flex gap-4">
              {columns.map((heights, c) => (
                <div
                  key={c}
                  className={`min-w-0 flex-1 flex-col gap-4 ${c === 2 ? "hidden md:flex" : "flex"}`}
                >
                  {heights.map((h, i) => (
                    <div
                      key={i}
                      className={`w-full ${h} rounded-xl bg-gradient-to-br from-sage to-primary/10`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
