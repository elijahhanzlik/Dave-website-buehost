import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { blocksToPreview, formatDate } from "@/lib/formatters";
import EditorJsRenderer from "@/components/admin/blog-renderer/EditorJsRenderer";
import type { Metadata } from "next";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_blocks: unknown;
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
    content: `For years I climbed trees professionally — diagnosing disease, pruning limbs, assessing risk. But somewhere along the way, the clinical eye became an artistic one.

## The View From Above

There's something profound about seeing the world from a tree's perspective. The ground below becomes abstract — patches of color and texture.

## Where Science Meets Art

Understanding how a tree grows gives you an appreciation for its form that goes beyond aesthetics.`,
    content_blocks: null,
    cover_image: null,
    status: "published",
    published_at: "2026-03-15T00:00:00Z",
    created_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "2",
    title: "Boulder in Bloom",
    slug: "boulder-in-bloom",
    content: `Spring in Boulder is an event. The Flatirons provide a dramatic backdrop as wildflowers carpet the meadows.

## Chasing the Bloom

The front range creates a fascinating gradient. Down in Boulder proper, the ornamental cherries bloom in early April.`,
    content_blocks: null,
    cover_image: null,
    status: "published",
    published_at: "2026-02-28T00:00:00Z",
    created_at: "2026-02-28T00:00:00Z",
  },
  {
    id: "3",
    title: "The Art of Seeing Slowly",
    slug: "the-art-of-seeing-slowly",
    content: `In a world of fast scrolling and instant images, I've found that my best work comes from slowing down.

## The Patience Principle

Photography rewards patience in a way few other art forms do.

## Lessons From the Trees

Trees have taught me more about art than any classroom or workshop.`,
    content_blocks: null,
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
    if (!supabase) return PLACEHOLDER_POSTS.find((p) => p.slug === slug) ?? null;
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
    description: post
      ? blocksToPreview(post.content_blocks, post.content) || undefined
      : undefined,
  };
}

function renderMarkdownContent(content: string) {
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
        <h2 key={key++} className="mt-10 mb-4 font-display text-2xl font-semibold text-primary-dark">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushParagraph();
      elements.push(
        <h2 key={key++} className="mt-10 mb-4 font-display text-3xl font-bold text-primary-dark">
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

  const blocks = Array.isArray(post.content_blocks) ? post.content_blocks : null;
  const hasBlocks = blocks !== null && blocks.length > 0;

  return (
    <div className="pt-24 pb-20">
      <article className="mx-auto max-w-6xl px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to Blog
        </Link>

        {post.cover_image && (
          <div className="mt-8 overflow-hidden rounded-2xl">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

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

        <div className="mt-10 border-t border-sage pt-10 prose-custom max-w-none">
          {hasBlocks ? (
            <EditorJsRenderer blocks={blocks} />
          ) : post.content ? (
            renderMarkdownContent(post.content)
          ) : (
            <p className="text-text-muted">No content available.</p>
          )}
        </div>

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
