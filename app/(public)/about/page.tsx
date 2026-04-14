import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — David Schaldach",
  description:
    "Learn about David Schaldach — former certified arborist turned ceramicist and painter, based in Boulder, CO.",
};

interface AboutSettings {
  photo: string | null;
  bio: string | null;
  tagline: string | null;
  location: string;
  background: string;
  focus: string;
  banner: string | null;
}

async function getAboutSettings(): Promise<AboutSettings> {
  const defaults: AboutSettings = {
    photo: null,
    bio: null,
    tagline: null,
    location: "Boulder, CO",
    background: "Certified Arborist",
    focus: "Ceramics & Painting",
    banner: null,
  };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return defaults;

    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "about_photo",
        "about_bio",
        "about_tagline",
        "about_location",
        "about_background",
        "about_focus",
        "about_banner",
      ]);

    if (data && data.length > 0) {
      const get = (key: string) => data.find((s) => s.key === key)?.value || null;
      return {
        photo: get("about_photo"),
        bio: get("about_bio"),
        tagline: get("about_tagline"),
        location: get("about_location") || defaults.location,
        background: get("about_background") || defaults.background,
        focus: get("about_focus") || defaults.focus,
        banner: get("about_banner"),
      };
    }
  } catch {
    // Supabase not configured
  }
  return defaults;
}

export default async function AboutPage() {
  const about = await getAboutSettings();

  return (
    <div className="pt-24 pb-20">
      {/* Hero banner */}
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-b-3xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="h-64 w-full sm:h-80 md:h-96">
            {about.banner ? (
              <img
                src={about.banner}
                alt="About banner"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary via-primary-light to-primary-dark">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(196,162,101,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,240,232,0.1),transparent_50%)]" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              About David
            </h1>
          </div>
        </div>
      </div>

      {/* Bio content */}
      <div className="mx-auto mt-16 max-w-4xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Profile photo */}
          {about.photo && (
            <div className="shrink-0">
              <img
                src={about.photo}
                alt="David Schaldach"
                className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl shadow-lg"
              />
            </div>
          )}

          {/* Text */}
          <div className="space-y-6 text-lg leading-relaxed text-text-secondary">
            {about.tagline && (
              <p className="font-display text-xl italic text-primary">
                {about.tagline}
              </p>
            )}

            {about.bio ? (
              about.bio.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))
            ) : (
              <>
                <p>
                  David Schaldach is a ceramicist and painter based in Boulder,
                  Colorado. Before picking up a brush, he spent years as a
                  certified arborist — climbing into canopies, diagnosing root
                  systems, and learning to see the world from the perspective of
                  the trees themselves.
                </p>
                <p>
                  That intimate relationship with nature didn&apos;t end when he
                  traded his climbing harness for a studio. It became the
                  foundation. Every piece David creates is informed by years of
                  studying organic patterns, light filtering through leaves, the
                  architecture of branches, and the quiet drama of growth and
                  decay.
                </p>
                <p>
                  Based at the foot of the Flatirons, David draws inspiration from
                  Colorado&apos;s dramatic landscapes — from alpine meadows to
                  ancient forests. His work celebrates the organic beauty that most
                  people walk past without noticing.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { label: "Based in", value: about.location },
            { label: "Background", value: about.background },
            { label: "Focus", value: about.focus },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-sage p-6 text-center"
            >
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
                {item.label}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-primary-dark">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
