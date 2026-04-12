import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — David Schaldach",
  description:
    "Learn about David Schaldach — former certified arborist turned creative and photographer, based in Boulder, CO.",
};

async function getAboutContent() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Try pages table first
    const { data: page } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", "about")
      .single();

    if (page) return { source: "page" as const, data: page };

    // Try site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "about_bio")
      .single();

    if (settings) return { source: "setting" as const, data: settings };
  } catch {
    // Supabase not configured
  }
  return null;
}

export default async function AboutPage() {
  const content = await getAboutContent();
  const bio = content?.source === "setting" ? content.data.value : null;

  return (
    <div className="pt-24 pb-20">
      {/* Hero banner */}
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-b-3xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="h-64 w-full bg-gradient-to-br from-primary via-primary-light to-primary-dark sm:h-80 md:h-96">
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(196,162,101,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,240,232,0.1),transparent_50%)]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              About David
            </h1>
          </div>
        </div>
      </div>

      {/* Bio content */}
      <div className="mx-auto mt-16 max-w-3xl px-6 lg:px-8">
        <div className="space-y-6 text-lg leading-relaxed text-text-secondary">
          {bio ? (
            <p>{bio}</p>
          ) : (
            <>
              <p>
                David Schaldach is a creative and photographer based in Boulder,
                Colorado. Before picking up a camera, he spent years as a
                certified arborist — climbing into canopies, diagnosing root
                systems, and learning to see the world from the perspective of
                the trees themselves.
              </p>
              <p>
                That intimate relationship with nature didn&apos;t end when he
                traded his climbing harness for a camera. It became the
                foundation. Every image David creates is informed by years of
                studying organic patterns, light filtering through leaves, the
                architecture of branches, and the quiet drama of growth and
                decay.
              </p>

              <blockquote className="border-l-4 border-gold pl-6 font-display text-xl italic text-primary">
                &ldquo;He was a certified arborist, now he&apos;s branching
                out.&rdquo;
              </blockquote>

              <p>
                Based at the foot of the Flatirons, David draws inspiration from
                Colorado&apos;s dramatic landscapes — from alpine meadows to
                ancient forests. His work celebrates the organic beauty that most
                people walk past without noticing: the fractal patterns in bark,
                the way morning light catches dew on a spider web, the
                heart-shaped silhouette a tree canopy makes against the sky.
              </p>
              <p>
                When he&apos;s not behind the lens, you&apos;ll find David on
                the trails around Boulder, probably looking up at the trees.
              </p>
            </>
          )}
        </div>

        {/* Info cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              label: "Based in",
              value: "Boulder, CO",
            },
            {
              label: "Background",
              value: "Certified Arborist",
            },
            {
              label: "Focus",
              value: "Nature & Landscape",
            },
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
