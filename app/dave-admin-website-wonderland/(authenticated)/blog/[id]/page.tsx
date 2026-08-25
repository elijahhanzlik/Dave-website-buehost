"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BlogPostForm from "@/components/admin/BlogPostForm";
import type { BlogPostData } from "@/components/admin/BlogPostForm";
import {
  Button,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

export default function EditBlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blog/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Spinner label="Getting this post…" />;

  if (!post) {
    return (
      <EmptyState
        title="That post is not here"
        hint="It may have been deleted. Everything you have written is on the previous screen."
        action={
          <Button href={`${ADMIN_BASE}/blog`} size="lg">
            Back to my posts
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Editing a post"
        title={post.title || "Untitled post"}
        subtitle={
          post.status === "published"
            ? "This post is public. Saving replaces what people are reading right now."
            : "This post is a draft. Nobody can read it until you change that on the right."
        }
      />
      <BlogPostForm initialData={post} />
    </div>
  );
}
