"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import {
  ActionButton,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Spinner,
  StatusPill,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

export default function BlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetch("/api/blog?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/blog/${id}`, { method: "DELETE" });
  };

  if (loading) return <Spinner label="Getting your posts…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Your writing"
        title="Blog"
        subtitle="Drafts stay private. Only published posts appear on your website."
        action={
          <ActionButton
            href={`${ADMIN_BASE}/blog/new`}
            label="Write a post"
            hint="Starts a blank draft."
            icon={<Plus size={20} />}
            align="end"
          />
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          title="Nothing written yet"
          hint="Start a draft whenever you like — it stays private until you choose to publish it."
          action={
            <Button href={`${ADMIN_BASE}/blog/new`} size="lg">
              <Plus size={20} /> Write a post
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[19px] font-bold leading-tight text-admin-ink">
                  {post.title}
                </h2>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <StatusPill status={post.status} />
                  <span className="text-[13.5px] text-admin-muted">
                    {post.published_at
                      ? formatDate(post.published_at)
                      : formatDate(post.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`${ADMIN_BASE}/blog/${post.id}`)}
                  className="flex-1 sm:flex-none"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setPendingDelete(post)}
                >
                  <Trash2 size={17} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete “${pendingDelete?.title ?? ""}”?`}
        body={
          pendingDelete?.status === "published"
            ? "This post is on your website right now. Deleting it takes it down for good and it cannot be undone."
            : "This draft has never been published. Deleting it cannot be undone."
        }
        confirmLabel="Yes, delete it"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
