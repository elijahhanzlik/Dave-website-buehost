import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "Exhibits — David Schaldach",
  description: "Documentation of David Schaldach's art exhibits.",
};

interface Exhibit {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

async function getExhibits(): Promise<Exhibit[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("exhibits")
      .select("id, title, slug, cover_image, status, published_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ExhibitsPage() {
  const exhibits = await getExhibits();

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="h-44 w-full bg-gradient-to-br from-primary via-primary-light to-primary-dark sm:h-52 md:h-64">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(196,162,101,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,240,232,0.1),transparent_50%)]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Exhibits
            </h1>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-lg text-text-secondary">
          A record of past and present shows.
        </p>

        {exhibits.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="rounded-2xl bg-sage p-12 max-w-lg w-full">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                  />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-semibold text-primary-dark sm:text-3xl">
                No Exhibits Yet
              </h2>
              <p className="mt-4 text-lg text-text-secondary">
                Check back soon for upcoming shows.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {exhibits.map((exhibit) => (
              <Link
                key={exhibit.id}
                href={`/exhibits/${exhibit.slug}`}
                className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="aspect-[16/10] w-full overflow-hidden">
                  {exhibit.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={exhibit.cover_image}
                      alt={exhibit.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-sage">
                      <svg
                        className="h-12 w-12 text-primary/15"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {exhibit.published_at && (
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
                      {formatDate(exhibit.published_at)}
                    </p>
                  )}
                  <h2 className="mt-2 font-display text-xl font-semibold text-primary-dark transition-colors group-hover:text-primary">
                    {exhibit.title}
                  </h2>
                  <span className="mt-4 inline-block text-sm font-medium text-gold-dark transition-colors group-hover:text-gold">
                    View exhibit &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
