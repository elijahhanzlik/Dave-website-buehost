import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { Metadata } from "next";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  cover_image: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

const PLACEHOLDER_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Finding Beauty in the Canopy",
    slug: "finding-beauty-in-the-canopy",
    content: `For years I climbed trees professionally — diagnosing disease, pruning limbs, assessing risk. But somewhere along the way, the clinical eye became an artistic one. I started noticing how light played through leaves at different times of day, how the architecture of branches created natural frames, and how the view from 60 feet up offered a perspective most people never experience.

This shift didn't happen overnight. It was gradual, like the growth of the trees themselves. One day I brought a camera up into the canopy, and everything changed.

## The View From Above

There's something profound about seeing the world from a tree's perspective. The ground below becomes abstract — patches of color and texture. The sky above becomes intimate, filtered through thousands of leaves that each catch the light differently.

As an arborist, I was trained to read trees — their health, their structure, their history. Now I read them for their beauty. The two aren't as different as you might think.

## Where Science Meets Art

Understanding how a tree grows gives you an appreciation for its form that goes beyond aesthetics. When you know that a particular branch angle indicates a strong attachment, or that the spiral grain in bark follows a mathematical pattern, you start to see trees as living sculptures shaped by physics, biology, and time.

This knowledge doesn't diminish the beauty — it amplifies it. Every photograph I take is informed by years of understanding how these organisms work, grow, and respond to their environment.`,
    cover_image: null,
    status: "published",
    published_at: "2026-03-15T00:00:00Z",
    created_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "2",
    title: "Boulder in Bloom",
    slug: "boulder-in-bloom",
    content: `Spring in Boulder is an event. The Flatirons provide a dramatic backdrop as wildflowers carpet the meadows and fruit trees explode into blossom along the creek paths. For a photographer with a background in arboriculture, it's paradise.

This spring I've been documenting the progression of bloom across different elevations — from the warm valleys near town to the last patches of snow in the high country. The timing is everything, and some years you have just days to catch a particular species at peak bloom.

## Chasing the Bloom

The front range creates a fascinating gradient. Down in Boulder proper, the ornamental cherries and crabapples bloom in early April. Drive twenty minutes into the foothills and you'll find wild plums just starting to open. Another thousand feet of elevation and the aspens are still leafless, waiting for warmer days.

## The Arborist's Advantage

My training as an arborist gives me a unique advantage when photographing trees in bloom. I can identify species at a glance, predict when they'll flower based on growing degree days, and find specimens that others might overlook.

I know which old cottonwoods along Boulder Creek will release their cotton first, which slope catches the most morning sun, and where the last wild crabapple grove hides in the foothills.`,
    cover_image: null,
    status: "published",
    published_at: "2026-02-28T00:00:00Z",
    created_at: "2026-02-28T00:00:00Z",
  },
  {
    id: "3",
    title: "The Art of Seeing Slowly",
    slug: "the-art-of-seeing-slowly",
    content: `In a world of fast scrolling and instant images, I've found that my best work comes from slowing down. Way down. Sometimes I'll spend an hour with a single tree, watching how the light changes, how the wind reveals different angles, how the shadows tell their own story.

This practice of patient observation is something I carried over from my arborist days. When you're diagnosing a tree, you can't rush. You have to look at the whole picture — roots, trunk, canopy, and everything in between.

## The Patience Principle

Photography rewards patience in a way few other art forms do. The difference between a good photograph and a great one is often just a matter of waiting — for the right light, the right moment, the right alignment of elements.

Trees are the perfect subject for this kind of work. They don't move (much), but they're constantly changing. The play of light across bark, the movement of leaves in the wind, the slow arc of shadows throughout the day — all of these create an infinite variety of images from a single subject.

## Lessons From the Trees

Trees have taught me more about art than any classroom or workshop. They've taught me about composition through their branching patterns, about color through their seasonal changes, and about patience through their imperceptible growth.

Most importantly, they've taught me that beauty is everywhere, if you're willing to slow down enough to see it.`,
    cover_image: null,
    status: "published",
    published_at: "2026-01-20T00:00:00Z",
    created_at: "2026-01-20T00:00:00Z",
  },
];

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (data) return data;
  } catch {
    // Supabase not configured
  }
  return PLACEHOLDER_POSTS.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post
      ? `${post.title} — David Schaldach`
      : "Blog — David Schaldach",
    description: post?.content?.slice(0, 160) ?? undefined,
  };
}

function renderContent(content: string) {
  // Simple markdown-like rendering for paragraphs and headings
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let key = 0;

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ");
      if (text.trim()) {
        elements.push(
          <p key={key++} className="mb-6 text-lg leading-relaxed text-text-secondary">
            {text}
          </p>
        );
      }
      currentParagraph = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      elements.push(
        <h2
          key={key++}
          className="mt-10 mb-4 font-display text-2xl font-semibold text-primary-dark"
        >
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushParagraph();
      elements.push(
        <h2
          key={key++}
          className="mt-10 mb-4 font-display text-3xl font-bold text-primary-dark"
        >
          {trimmed.slice(2)}
        </h2>
      );
    } else if (trimmed === "") {
      flushParagraph();
    } else {
      currentParagraph.push(trimmed);
    }
  }

  flushParagraph();
  return elements;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary-dark">
            Post Not Found
          </h1>
          <p className="mt-4 text-text-secondary">
            The blog post you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-2 text-gold-dark hover:text-gold"
          >
            <ArrowLeft size={16} />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <article className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to Blog
        </Link>

        {/* Cover image */}
        {post.cover_image && (
          <div className="mt-8 overflow-hidden rounded-2xl">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mt-8">
          {post.published_at && (
            <p className="text-sm font-medium uppercase tracking-[0.1em] text-text-muted">
              {formatDate(post.published_at)}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold text-primary-dark sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
        </header>

        {/* Content */}
        <div className="mt-10 border-t border-sage pt-10">
          {post.content ? (
            renderContent(post.content)
          ) : (
            <p className="text-text-muted">No content available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-sage pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold-dark transition-colors hover:text-gold"
          >
            <ArrowLeft size={16} />
            Back to all posts
          </Link>
        </div>
      </article>
    </div>
  );
}
